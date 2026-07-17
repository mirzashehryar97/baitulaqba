import {
  createPaginatedResult,
  normalizePaginationOptions,
  type PaginationOptions,
} from '@/lib/pagination';
import { createSupabaseAdminClient, isMissingDatabaseFunctionError } from '@/lib/supabase/server';
import { TEAM_MEMBER_ROLE_DESCRIPTIONS, TEAM_MEMBER_ROLE_LABELS } from '@/lib/teamMemberRoles';

import {
  TEAM_MEMBER_ROLES,
  type TeamMember,
  type TeamMemberInput,
  type TeamMemberRole,
  type TeamMemberRow,
  type TeamMemberUpdate,
} from '@/types/accounts';

export { TEAM_MEMBER_ROLE_DESCRIPTIONS, TEAM_MEMBER_ROLE_LABELS };

export function normalizeTeamMemberEmail(email: string) {
  return email.trim().toLowerCase();
}

export function mapTeamMemberRow(row: TeamMemberRow): TeamMember {
  return {
    id: row.id,
    authUserId: row.auth_user_id,
    fullName: row.full_name,
    email: row.email,
    phone: row.phone,
    role: row.role,
    active: row.active,
    notes: row.notes,
    createdByTeamMemberId: row.created_by_team_member_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function validateTeamMemberInput(input: Partial<TeamMemberInput> | null | undefined) {
  const errors: Partial<Record<keyof TeamMemberInput, string>> = {};
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const fullName = input?.fullName?.trim() ?? '';
  const email = input?.email?.trim() ?? '';

  if (!fullName) {
    errors.fullName = 'Full name is required.';
  }

  if (!email) {
    errors.email = 'Email address is required.';
  } else if (!emailPattern.test(email)) {
    errors.email = 'Enter a valid email address.';
  }

  if (!input?.role || !TEAM_MEMBER_ROLES.includes(input.role)) {
    errors.role = 'Choose a valid team role.';
  }

  if (typeof input?.active !== 'boolean') {
    errors.active = 'Choose whether this member is active.';
  }

  return errors;
}

export type TeamMemberListOptions = {
  role?: TeamMemberRole;
  search?: string;
  status?: 'active' | 'pending' | 'inactive';
};

export type TeamMemberListSummary = {
  admins: number;
  inactive: number;
  pendingFirstLogin: number;
  total: number;
};

export async function listTeamMembers(
  options: TeamMemberListOptions = {},
  paginationOptions: PaginationOptions = {},
) {
  const supabase = createSupabaseAdminClient();
  const pagination = normalizePaginationOptions(paginationOptions);

  let query = supabase
    .from('team_members')
    .select('*', pagination.knownTotal === undefined ? { count: 'exact' } : undefined)
    .order('active', { ascending: false })
    .order('full_name', { ascending: true });

  if (options.role) query = query.eq('role', options.role);
  if (options.status === 'active') {
    query = query.eq('active', true).not('auth_user_id', 'is', null);
  } else if (options.status === 'pending') {
    query = query.eq('active', true).is('auth_user_id', null);
  } else if (options.status === 'inactive') {
    query = query.eq('active', false);
  }
  if (options.search?.trim()) {
    const search = options.search.trim().replaceAll(',', ' ');
    query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%`);
  }

  const { count, data, error } = await query
    .range(pagination.offset, pagination.offset + pagination.limit - 1)
    .returns<TeamMemberRow[]>();

  if (error) {
    throw new Error(error.message);
  }

  return createPaginatedResult(
    data.map(mapTeamMemberRow),
    pagination.knownTotal ?? count ?? 0,
    pagination,
  );
}

export async function getTeamMemberListSummary(): Promise<TeamMemberListSummary> {
  const supabase = createSupabaseAdminClient();
  const functionName = 'admin_team_member_list_summary';
  const { data: summary, error: summaryError } = await supabase.rpc(functionName);

  if (!summaryError && summary) {
    return summary as unknown as TeamMemberListSummary;
  }

  if (!isMissingDatabaseFunctionError(summaryError, functionName)) {
    throw new Error(summaryError?.message ?? 'Team member summary query returned no data.');
  }

  // Backward-compatible fallback while an environment is waiting for the database migration.
  const [totalResult, adminsResult, pendingFirstLoginResult, inactiveResult] = await Promise.all([
    supabase.from('team_members').select('id', { count: 'exact', head: true }),
    supabase
      .from('team_members')
      .select('id', { count: 'exact', head: true })
      .eq('active', true)
      .in('role', ['super_admin', 'admin']),
    supabase
      .from('team_members')
      .select('id', { count: 'exact', head: true })
      .eq('active', true)
      .is('auth_user_id', null),
    supabase.from('team_members').select('id', { count: 'exact', head: true }).eq('active', false),
  ]);

  for (const result of [totalResult, adminsResult, pendingFirstLoginResult, inactiveResult]) {
    if (result.error) {
      throw new Error(result.error.message);
    }
  }

  return {
    admins: adminsResult.count ?? 0,
    inactive: inactiveResult.count ?? 0,
    pendingFirstLogin: pendingFirstLoginResult.count ?? 0,
    total: totalResult.count ?? 0,
  };
}

export async function getTeamMemberById(id: string) {
  const supabase = createSupabaseAdminClient();

  const { data, error } = await supabase
    .from('team_members')
    .select('*')
    .eq('id', id)
    .maybeSingle<TeamMemberRow>();

  if (error) {
    throw new Error(error.message);
  }

  return data ? mapTeamMemberRow(data) : null;
}

export async function createTeamMember(input: TeamMemberInput, createdByTeamMemberId: string) {
  const supabase = createSupabaseAdminClient();

  const { data, error } = await supabase
    .from('team_members')
    .insert({
      active: input.active,
      created_by_team_member_id: createdByTeamMemberId,
      email: normalizeTeamMemberEmail(input.email),
      full_name: input.fullName.trim(),
      notes: input.notes?.trim() || null,
      phone: input.phone?.trim() || null,
      role: input.role,
    })
    .select('*')
    .single<TeamMemberRow>();

  if (error) {
    throw new Error(error.message);
  }

  return mapTeamMemberRow(data);
}

export async function updateTeamMember(id: string, input: TeamMemberUpdate) {
  const supabase = createSupabaseAdminClient();
  const patch: Partial<TeamMemberRow> = {};

  if (input.fullName !== undefined) {
    patch.full_name = input.fullName.trim();
  }

  if (input.email !== undefined) {
    patch.email = normalizeTeamMemberEmail(input.email);
  }

  if (input.phone !== undefined) {
    patch.phone = input.phone?.trim() || null;
  }

  if (input.role !== undefined) {
    patch.role = input.role;
  }

  if (input.active !== undefined) {
    patch.active = input.active;
  }

  if (input.notes !== undefined) {
    patch.notes = input.notes?.trim() || null;
  }

  const { data, error } = await supabase
    .from('team_members')
    .update(patch)
    .eq('id', id)
    .select('*')
    .single<TeamMemberRow>();

  if (error) {
    throw new Error(error.message);
  }

  return mapTeamMemberRow(data);
}

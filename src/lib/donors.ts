import {
  createPaginatedResult,
  normalizePaginationOptions,
  type PaginationOptions,
} from '@/lib/pagination';
import { mapSponsorshipRequestRow } from '@/lib/sponsorshipRequests';
import { createSupabaseAdminClient, isMissingDatabaseFunctionError } from '@/lib/supabase/server';

import type {
  Donor,
  DonorInput,
  DonorPreferredContactMethod,
  DonorRow,
  DonorSource,
  DonorUpdate,
  TeamMemberRole,
} from '@/types/accounts';
import type {
  ContactLog,
  ContactLogInput,
  ContactLogRow,
  SponsorshipRequest,
  SponsorshipRequestRow,
  TeamMemberSummary,
} from '@/types/sponsorship';

export const DONOR_PREFERRED_CONTACT_METHODS: DonorPreferredContactMethod[] = [
  'whatsapp',
  'phone',
  'email',
];

export const DONOR_SOURCES: DonorSource[] = [
  'converted_request',
  'admin_created',
  'whatsapp',
  'phone',
  'email',
  'referral',
  'other',
];

const DONOR_SELECT = `
  *,
  created_by_team_member:team_members!donors_created_by_team_member_id_fkey(
    id,
    full_name,
    email,
    role
  )
`;

const DONOR_CONTACT_LOG_SELECT = `
  *,
  team_member:team_members!contact_logs_team_member_id_fkey(
    id,
    full_name,
    email,
    role
  )
`;

const DONOR_SPONSORSHIP_REQUEST_SELECT = `
  *,
  assigned_team_member:team_members!sponsorship_requests_assigned_team_member_id_fkey(
    id,
    full_name,
    email,
    role
  ),
  converted_donor:donors!sponsorship_requests_converted_donor_id_fkey(
    id,
    full_name,
    email
  ),
  created_by_team_member:team_members!sponsorship_requests_created_by_team_member_id_fkey(
    id,
    full_name,
    email,
    role
  )
`;

export type DonorListOptions = {
  loginStatus?: 'linked' | 'pending';
  preferredContactMethod?: DonorPreferredContactMethod;
  scopedToTeamMemberId?: string;
  search?: string;
  source?: DonorSource;
  status?: 'active' | 'inactive';
};

export type DonorListSummary = {
  active: number;
  inactive: number;
  pendingFirstLogin: number;
  total: number;
};

function normalizeOptionalEmail(value: string | null | undefined) {
  return value?.trim().toLowerCase() || null;
}

function normalizeOptionalText(value: string | null | undefined) {
  return value?.trim() || null;
}

function normalizeOptionalIso(value: string | null | undefined) {
  if (!value) {
    return null;
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function mapTeamMemberSummary(
  row:
    | {
        email: string;
        full_name: string;
        id: string;
        role: TeamMemberRole;
      }
    | null
    | undefined,
): TeamMemberSummary | null {
  if (!row) {
    return null;
  }

  return {
    email: row.email,
    fullName: row.full_name,
    id: row.id,
    role: row.role,
  };
}

export function mapDonorRow(row: DonorRow): Donor {
  return {
    active: row.active,
    address: row.address,
    authUserId: row.auth_user_id,
    cityCountry: row.city_country,
    createdAt: row.created_at,
    createdByTeamMember: mapTeamMemberSummary(row.created_by_team_member),
    createdByTeamMemberId: row.created_by_team_member_id,
    donorSource: row.donor_source ?? 'admin_created',
    email: row.email,
    fullName: row.full_name,
    id: row.id,
    notes: row.notes,
    phone: row.phone,
    preferredContactMethod: row.preferred_contact_method ?? 'whatsapp',
    updatedAt: row.updated_at,
  };
}

export function mapDonorContactLogRow(row: ContactLogRow): ContactLog {
  return {
    contactMethod: row.contact_method,
    createdAt: row.created_at,
    direction: row.direction,
    donorId: row.donor_id,
    id: row.id,
    nextFollowUpAt: row.next_follow_up_at,
    outcome: row.outcome,
    sponsorshipRequestId: row.sponsorship_request_id,
    summary: row.summary,
    teamMember: mapTeamMemberSummary(row.team_member),
    teamMemberId: row.team_member_id,
    updatedAt: row.updated_at,
  };
}

export function validateDonorInput(
  input: Partial<DonorInput> | null | undefined,
  options: { allowPartial?: boolean } = {},
) {
  const errors: Partial<Record<keyof DonorInput, string>> = {};
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const required = !options.allowPartial;

  if ((required || input?.fullName !== undefined) && !input?.fullName?.trim()) {
    errors.fullName = 'Full name is required.';
  }

  // Email is optional for donors (admins can create donor profiles without one;
  // those donors just can't sign in to the portal). Only validate format when a
  // value is actually provided.
  if (input?.email?.trim() && !emailPattern.test(input.email.trim())) {
    errors.email = 'Enter a valid email address.';
  }

  if ((required || input?.phone !== undefined) && !input?.phone?.trim()) {
    errors.phone = 'Phone number is required.';
  }

  if ((required || input?.address !== undefined) && !input?.address?.trim()) {
    errors.address = 'Address is required.';
  }

  if (
    (required || input?.preferredContactMethod !== undefined) &&
    (!input?.preferredContactMethod ||
      !DONOR_PREFERRED_CONTACT_METHODS.includes(input.preferredContactMethod))
  ) {
    errors.preferredContactMethod = 'Choose a valid preferred contact method.';
  }

  if (
    (required || input?.donorSource !== undefined) &&
    (!input?.donorSource || !DONOR_SOURCES.includes(input.donorSource))
  ) {
    errors.donorSource = 'Choose a valid donor source.';
  }

  if ((required || input?.active !== undefined) && typeof input?.active !== 'boolean') {
    errors.active = 'Choose whether this donor is active.';
  }

  if (input?.notes && input.notes.trim().length > 1200) {
    errors.notes = 'Notes must be 1,200 characters or less.';
  }

  return errors;
}

export function validateDonorContactLogInput(input: Partial<ContactLogInput> | null | undefined) {
  const errors: Partial<Record<keyof ContactLogInput, string>> = {};

  if (
    !input?.contactMethod ||
    !['whatsapp', 'phone', 'email', 'sms', 'in_person', 'other'].includes(input.contactMethod)
  ) {
    errors.contactMethod = 'Choose a valid contact method.';
  }

  if (!input?.direction || !['outbound', 'inbound', 'internal_note'].includes(input.direction)) {
    errors.direction = 'Choose a valid direction.';
  }

  if (
    !input?.outcome ||
    ![
      'logged',
      'reached',
      'no_response',
      'follow_up_needed',
      'not_interested',
      'converted',
    ].includes(input.outcome)
  ) {
    errors.outcome = 'Choose a valid outcome.';
  }

  if (!input?.summary?.trim()) {
    errors.summary = 'Summary is required.';
  } else if (input.summary.trim().length > 1200) {
    errors.summary = 'Summary must be 1,200 characters or less.';
  }

  if (input?.nextFollowUpAt && !normalizeOptionalIso(input.nextFollowUpAt)) {
    errors.nextFollowUpAt = 'Choose a valid follow-up date.';
  }

  return errors;
}

export async function listDonors(
  options: DonorListOptions = {},
  paginationOptions: PaginationOptions = {},
) {
  const supabase = createSupabaseAdminClient();
  const pagination = normalizePaginationOptions(paginationOptions);
  const scopedDonorIds = options.scopedToTeamMemberId
    ? await listScopedDonorIdsForTeamMember(options.scopedToTeamMemberId)
    : null;

  if (scopedDonorIds && scopedDonorIds.length === 0) {
    return createPaginatedResult([], 0, pagination);
  }

  let query = supabase
    .from('donors')
    .select(DONOR_SELECT, pagination.knownTotal === undefined ? { count: 'exact' } : undefined)
    .order('active', { ascending: false })
    .order('created_at', { ascending: false });

  if (scopedDonorIds) {
    query = query.in('id', scopedDonorIds);
  }

  if (options.status === 'active') {
    query = query.eq('active', true);
  } else if (options.status === 'inactive') {
    query = query.eq('active', false);
  }

  if (options.source) {
    query = query.eq('donor_source', options.source);
  }

  if (options.preferredContactMethod) {
    query = query.eq('preferred_contact_method', options.preferredContactMethod);
  }

  if (options.loginStatus === 'linked') {
    query = query.not('auth_user_id', 'is', null);
  } else if (options.loginStatus === 'pending') {
    query = query.is('auth_user_id', null);
  }

  if (options.search?.trim()) {
    const search = options.search.trim().replaceAll(',', ' ');
    query = query.or(
      `full_name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%,city_country.ilike.%${search}%`,
    );
  }

  const { count, data, error } = await query
    .range(pagination.offset, pagination.offset + pagination.limit - 1)
    .returns<DonorRow[]>();

  if (error) {
    throw new Error(error.message);
  }

  return createPaginatedResult(
    data.map(mapDonorRow),
    pagination.knownTotal ?? count ?? 0,
    pagination,
  );
}

export async function getDonorListSummary(
  options: Pick<DonorListOptions, 'scopedToTeamMemberId'> = {},
): Promise<DonorListSummary> {
  const supabase = createSupabaseAdminClient();
  const functionName = 'admin_donor_list_summary';
  const { data: summary, error: summaryError } = await supabase.rpc(functionName, {
    p_scoped_to_team_member_id: options.scopedToTeamMemberId ?? null,
  });

  if (!summaryError && summary) {
    return summary as unknown as DonorListSummary;
  }

  if (!isMissingDatabaseFunctionError(summaryError, functionName)) {
    throw new Error(summaryError?.message ?? 'Donor summary query returned no data.');
  }

  // Backward-compatible fallback while an environment is waiting for the database migration.
  const scopedDonorIds = options.scopedToTeamMemberId
    ? await listScopedDonorIdsForTeamMember(options.scopedToTeamMemberId)
    : null;

  if (scopedDonorIds && scopedDonorIds.length === 0) {
    return { active: 0, inactive: 0, pendingFirstLogin: 0, total: 0 };
  }

  let activeQuery = supabase
    .from('donors')
    .select('id', { count: 'exact', head: true })
    .eq('active', true);
  let pendingFirstLoginQuery = supabase
    .from('donors')
    .select('id', { count: 'exact', head: true })
    .eq('active', true)
    .is('auth_user_id', null);
  let inactiveQuery = supabase
    .from('donors')
    .select('id', { count: 'exact', head: true })
    .eq('active', false);

  if (scopedDonorIds) {
    activeQuery = activeQuery.in('id', scopedDonorIds);
    pendingFirstLoginQuery = pendingFirstLoginQuery.in('id', scopedDonorIds);
    inactiveQuery = inactiveQuery.in('id', scopedDonorIds);
  }

  const [activeResult, pendingFirstLoginResult, inactiveResult] = await Promise.all([
    activeQuery,
    pendingFirstLoginQuery,
    inactiveQuery,
  ]);

  for (const result of [activeResult, pendingFirstLoginResult, inactiveResult]) {
    if (result.error) {
      throw new Error(result.error.message);
    }
  }

  const active = activeResult.count ?? 0;
  const inactive = inactiveResult.count ?? 0;

  return {
    active,
    inactive,
    pendingFirstLogin: pendingFirstLoginResult.count ?? 0,
    total: active + inactive,
  };
}

export async function getDonorById(id: string, options: { scopedToTeamMemberId?: string } = {}) {
  if (
    options.scopedToTeamMemberId &&
    !(await teamMemberCanAccessDonor(id, options.scopedToTeamMemberId))
  ) {
    return null;
  }

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from('donors')
    .select(DONOR_SELECT)
    .eq('id', id)
    .maybeSingle<DonorRow>();

  if (error) {
    throw new Error(error.message);
  }

  return data ? mapDonorRow(data) : null;
}

export async function createDonor(input: DonorInput, createdByTeamMemberId: string) {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from('donors')
    .insert({
      active: input.active,
      address: input.address.trim(),
      city_country: normalizeOptionalText(input.cityCountry),
      created_by_team_member_id: createdByTeamMemberId,
      donor_source: input.donorSource,
      email: normalizeOptionalEmail(input.email),
      full_name: input.fullName.trim(),
      notes: normalizeOptionalText(input.notes),
      phone: input.phone.trim(),
      preferred_contact_method: input.preferredContactMethod,
    })
    .select(DONOR_SELECT)
    .single<DonorRow>();

  if (error) {
    throw new Error(error.message);
  }

  return mapDonorRow(data);
}

export async function updateDonor(id: string, update: DonorUpdate) {
  const supabase = createSupabaseAdminClient();
  const patch: Partial<DonorRow> = {};

  if (update.fullName !== undefined) {
    patch.full_name = update.fullName.trim();
  }

  if (update.email !== undefined) {
    patch.email = normalizeOptionalEmail(update.email);
  }

  if (update.phone !== undefined) {
    patch.phone = update.phone.trim();
  }

  if (update.address !== undefined) {
    patch.address = update.address.trim();
  }

  if (update.cityCountry !== undefined) {
    patch.city_country = normalizeOptionalText(update.cityCountry);
  }

  if (update.preferredContactMethod !== undefined) {
    patch.preferred_contact_method = update.preferredContactMethod;
  }

  if (update.donorSource !== undefined) {
    patch.donor_source = update.donorSource;
  }

  if (update.active !== undefined) {
    patch.active = update.active;
  }

  if (update.notes !== undefined) {
    patch.notes = normalizeOptionalText(update.notes);
  }

  const { data, error } = await supabase
    .from('donors')
    .update(patch)
    .eq('id', id)
    .select(DONOR_SELECT)
    .single<DonorRow>();

  if (error) {
    throw new Error(error.message);
  }

  return mapDonorRow(data);
}

export async function listDonorContactLogs(donorId: string) {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from('contact_logs')
    .select(DONOR_CONTACT_LOG_SELECT)
    .eq('donor_id', donorId)
    .order('created_at', { ascending: false })
    .returns<ContactLogRow[]>();

  if (error) {
    throw new Error(error.message);
  }

  return data.map(mapDonorContactLogRow);
}

export async function createDonorContactLog(
  donorId: string,
  input: ContactLogInput,
  teamMemberId: string,
) {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from('contact_logs')
    .insert({
      contact_method: input.contactMethod,
      direction: input.direction,
      donor_id: donorId,
      next_follow_up_at: normalizeOptionalIso(input.nextFollowUpAt),
      outcome: input.outcome,
      sponsorship_request_id: null,
      summary: input.summary.trim(),
      team_member_id: teamMemberId,
    })
    .select(DONOR_CONTACT_LOG_SELECT)
    .single<ContactLogRow>();

  if (error) {
    throw new Error(error.message);
  }

  return mapDonorContactLogRow(data);
}

export async function listConvertedRequestsForDonor(
  donorId: string,
  options: { scopedToTeamMemberId?: string } = {},
): Promise<SponsorshipRequest[]> {
  const supabase = createSupabaseAdminClient();
  let query = supabase
    .from('sponsorship_requests')
    .select(DONOR_SPONSORSHIP_REQUEST_SELECT)
    .eq('converted_donor_id', donorId)
    .order('converted_at', { ascending: false });

  if (options.scopedToTeamMemberId) {
    query = query.eq('assigned_team_member_id', options.scopedToTeamMemberId);
  }

  const { data, error } = await query.returns<SponsorshipRequestRow[]>();

  if (error) {
    throw new Error(error.message);
  }

  return data.map(mapSponsorshipRequestRow);
}

async function listScopedDonorIdsForTeamMember(teamMemberId: string) {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from('sponsorship_requests')
    .select('converted_donor_id')
    .eq('assigned_team_member_id', teamMemberId)
    .not('converted_donor_id', 'is', null)
    .returns<Array<{ converted_donor_id: string | null }>>();

  if (error) {
    throw new Error(error.message);
  }

  return Array.from(
    new Set(data.map((row) => row.converted_donor_id).filter((id): id is string => Boolean(id))),
  );
}

async function teamMemberCanAccessDonor(donorId: string, teamMemberId: string) {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from('sponsorship_requests')
    .select('id')
    .eq('converted_donor_id', donorId)
    .eq('assigned_team_member_id', teamMemberId)
    .limit(1)
    .maybeSingle<{ id: string }>();

  if (error) {
    throw new Error(error.message);
  }

  return Boolean(data);
}

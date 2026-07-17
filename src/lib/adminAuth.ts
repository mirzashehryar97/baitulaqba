import type { User } from '@supabase/supabase-js';

import { resolveEffectivePermissionsForMember } from '@/lib/permissions';
import { createSupabaseAdminClient, createSupabaseServerClient } from '@/lib/supabase/server';

import type { Donor, DonorRow, TeamMember, TeamMemberRole, TeamMemberRow } from '@/types/accounts';

export class UnauthorizedError extends Error {
  constructor(message = 'Unauthorized.') {
    super(message);
    this.name = 'UnauthorizedError';
  }
}

export class ForbiddenError extends Error {
  constructor(message = 'Forbidden.') {
    super(message);
    this.name = 'ForbiddenError';
  }
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function mapTeamMemberRow(row: TeamMemberRow): TeamMember {
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

function mapDonorRow(row: DonorRow): Donor {
  return {
    active: row.active,
    address: row.address,
    authUserId: row.auth_user_id,
    cityCountry: row.city_country,
    createdAt: row.created_at,
    createdByTeamMember: null,
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

export async function getCurrentAuthUser() {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) {
    return null;
  }

  return data.user;
}

async function findTeamMemberForUser(user: User) {
  if (!user.email) return null;

  const supabase = createSupabaseAdminClient();
  const normalizedEmail = normalizeEmail(user.email);

  const { data: authMatch, error: authMatchError } = await supabase
    .from('team_members')
    .select('*')
    .eq('auth_user_id', user.id)
    .maybeSingle<TeamMemberRow>();

  if (authMatchError) {
    throw new Error(authMatchError.message);
  }

  const row =
    authMatch ??
    (
      await supabase
        .from('team_members')
        .select('*')
        .eq('email', normalizedEmail)
        .maybeSingle<TeamMemberRow>()
    ).data;

  if (!row || !row.active) {
    return null;
  }

  if (row.auth_user_id && row.auth_user_id !== user.id) {
    return null;
  }

  if (!row.auth_user_id) {
    const { data, error } = await supabase
      .from('team_members')
      .update({ auth_user_id: user.id })
      .eq('id', row.id)
      .select('*')
      .single<TeamMemberRow>();

    if (error) {
      throw new Error(error.message);
    }

    return data;
  }

  return row;
}

async function findDonorForUser(user: User) {
  if (!user.email) return null;

  const supabase = createSupabaseAdminClient();
  const normalizedEmail = normalizeEmail(user.email);

  const { data: authMatch, error: authMatchError } = await supabase
    .from('donors')
    .select('*')
    .eq('auth_user_id', user.id)
    .maybeSingle<DonorRow>();

  if (authMatchError) {
    throw new Error(authMatchError.message);
  }

  const row =
    authMatch ??
    (await supabase.from('donors').select('*').eq('email', normalizedEmail).maybeSingle<DonorRow>())
      .data;

  if (!row || !row.active) {
    return null;
  }

  if (row.auth_user_id && row.auth_user_id !== user.id) {
    return null;
  }

  if (!row.auth_user_id) {
    const { data, error } = await supabase
      .from('donors')
      .update({ auth_user_id: user.id })
      .eq('id', row.id)
      .select('*')
      .single<DonorRow>();

    if (error) {
      throw new Error(error.message);
    }

    return data;
  }

  return row;
}

export async function getCurrentTeamMember() {
  const user = await getCurrentAuthUser();
  if (!user) return null;

  return getTeamMemberForAuthUser(user);
}

export async function getTeamMemberForAuthUser(user: User) {
  const row = await findTeamMemberForUser(user);
  if (!row) {
    return null;
  }

  const member = mapTeamMemberRow(row);
  member.permissions = await resolveEffectivePermissionsForMember(member);
  return member;
}

export async function getCurrentDonor() {
  const user = await getCurrentAuthUser();
  if (!user) return null;

  return getDonorForAuthUser(user);
}

export async function getDonorForAuthUser(user: User) {
  const row = await findDonorForUser(user);
  return row ? mapDonorRow(row) : null;
}

export async function isAdminAuthenticated() {
  return Boolean(await getCurrentTeamMember());
}

export async function requireTeamMember(allowedRoles?: TeamMemberRole[]) {
  const teamMember = await getCurrentTeamMember();

  if (!teamMember) {
    throw new UnauthorizedError();
  }

  if (allowedRoles && !allowedRoles.includes(teamMember.role)) {
    throw new ForbiddenError();
  }

  return teamMember;
}

export async function requireDonor() {
  const donor = await getCurrentDonor();

  if (!donor) {
    throw new UnauthorizedError();
  }

  return donor;
}

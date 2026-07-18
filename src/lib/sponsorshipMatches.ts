import { APP_CURRENCIES, APP_CURRENCY } from '@/lib/currency';
import { currentMonthValue } from '@/lib/months';
import { recordOrphanStatusChange } from '@/lib/orphans';
import {
  createPaginatedResult,
  normalizePaginationOptions,
  type PaginationOptions,
  paginateArray,
} from '@/lib/pagination';
import { createSupabaseAdminClient, isMissingDatabaseFunctionError } from '@/lib/supabase/server';

import type { TeamMemberRole } from '@/types/accounts';
import type {
  MatchableDonor,
  MatchableOrphan,
  MatchDonorSummary,
  SponsorshipMatch,
  SponsorshipMatchInput,
  SponsorshipMatchRow,
  SponsorshipMatchStatus,
  SponsorshipMatchStatusInput,
  SponsorshipMatchUpdate,
} from '@/types/matches';
import type { OrphanProfileStatus, OrphanVerificationStatus } from '@/types/orphans';

export const SPONSORSHIP_MATCH_STATUSES: SponsorshipMatchStatus[] = [
  'active',
  'paused',
  'ended',
  'voided',
];

export const SPONSORSHIP_MATCH_CURRENCIES = APP_CURRENCIES;

const MATCH_SELECT = `
  *,
  donor:donors!sponsorship_matches_donor_id_fkey(
    id,
    auth_user_id,
    full_name,
    email,
    phone,
    preferred_contact_method,
    active
  ),
  orphan:orphan_profiles!sponsorship_matches_orphan_id_fkey(
    id,
    orphan_code,
    full_name,
    city_area,
    profile_image_url,
    profile_status,
    verification_status
  ),
  created_by_team_member:team_members!sponsorship_matches_created_by_team_member_id_fkey(
    id,
    full_name,
    email,
    role
  ),
  updated_by_team_member:team_members!sponsorship_matches_updated_by_team_member_id_fkey(
    id,
    full_name,
    email,
    role
  )
`;

type MatchableDonorRow = {
  active: boolean;
  auth_user_id: string | null;
  email: string | null;
  full_name: string;
  id: string;
  phone: string | null;
  preferred_contact_method: MatchDonorSummary['preferredContactMethod'];
};

type MatchableOrphanRow = {
  age_estimate: number | null;
  approved_at: string | null;
  city_area: string | null;
  full_name: string;
  id: string;
  orphan_code: string;
  profile_image_url: string;
  profile_status: OrphanProfileStatus;
  verification_status: OrphanVerificationStatus;
};

type MatchCountRow = {
  donor_id: string;
};

type ExistingMatchRow = {
  id: string;
  status: SponsorshipMatchStatus;
};

type DonorEligibilityRow = {
  active: boolean;
  email: string | null;
  full_name: string;
  id: string;
};

type OrphanEligibilityRow = {
  full_name: string;
  id: string;
  orphan_code: string;
  profile_status: OrphanProfileStatus;
  verification_status: OrphanVerificationStatus;
};

export type SponsorshipMatchListOptions = {
  createdBy?: string;
  donorId?: string;
  orphanId?: string;
  search?: string;
  startedFrom?: string;
  startedTo?: string;
  status?: SponsorshipMatchStatus;
};

export type SponsorshipMatchListSummary = {
  active: number;
  availableOrphans: number;
  newThisMonth: number;
  paused: number;
};

export type MatchableListOptions = {
  search?: string;
};

function normalizeOptionalText(value: string | null | undefined) {
  return value?.trim() || null;
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
) {
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

export function mapSponsorshipMatchRow(row: SponsorshipMatchRow): SponsorshipMatch {
  return {
    certificateSeq: row.certificate_seq === null ? null : Number(row.certificate_seq),
    createdAt: row.created_at,
    createdByTeamMember: mapTeamMemberSummary(row.created_by_team_member),
    createdByTeamMemberId: row.created_by_team_member_id,
    currency: APP_CURRENCY,
    donor: row.donor
      ? {
          active: row.donor.active,
          authUserId: row.donor.auth_user_id,
          email: row.donor.email,
          fullName: row.donor.full_name,
          id: row.donor.id,
          phone: row.donor.phone,
          preferredContactMethod: row.donor.preferred_contact_method,
        }
      : null,
    donorId: row.donor_id,
    endedAt: row.ended_at,
    id: row.id,
    monthlyAmount: Number(row.monthly_amount),
    notes: row.notes,
    orphan: row.orphan
      ? {
          cityArea: row.orphan.city_area,
          fullName: row.orphan.full_name,
          id: row.orphan.id,
          orphanCode: row.orphan.orphan_code,
          profileImageUrl: row.orphan.profile_image_url,
          profileStatus: row.orphan.profile_status,
          verificationStatus: row.orphan.verification_status,
        }
      : null,
    orphanId: row.orphan_id,
    startedAt: row.started_at,
    status: row.status,
    statusReason: row.status_reason,
    updatedAt: row.updated_at,
    updatedByTeamMember: mapTeamMemberSummary(row.updated_by_team_member),
    updatedByTeamMemberId: row.updated_by_team_member_id,
  };
}

export function validateSponsorshipMatchInput(input: Partial<SponsorshipMatchInput> | null) {
  const errors: Partial<Record<keyof SponsorshipMatchInput, string>> = {};

  if (!input?.donorId) {
    errors.donorId = 'Choose a donor.';
  }

  if (!input?.orphanId) {
    errors.orphanId = 'Choose an orphan profile.';
  }

  if (
    input?.monthlyAmount === undefined ||
    !Number.isFinite(input.monthlyAmount) ||
    input.monthlyAmount <= 0
  ) {
    errors.monthlyAmount = 'Enter a positive monthly amount.';
  }

  if (!input?.currency || input.currency.trim().toUpperCase() !== APP_CURRENCY) {
    errors.currency = 'Currency must be PKR.';
  }

  if (!input?.startedAt || Number.isNaN(new Date(input.startedAt).getTime())) {
    errors.startedAt = 'Choose a valid start date.';
  }

  if (input?.notes && input.notes.trim().length > 1200) {
    errors.notes = 'Notes must be 1,200 characters or less.';
  }

  return errors;
}

export function validateSponsorshipMatchUpdate(input: Partial<SponsorshipMatchUpdate> | null) {
  const errors: Partial<Record<keyof SponsorshipMatchUpdate, string>> = {};

  if (
    input?.monthlyAmount !== undefined &&
    (!Number.isFinite(input.monthlyAmount) || input.monthlyAmount <= 0)
  ) {
    errors.monthlyAmount = 'Enter a positive monthly amount.';
  }

  if (input?.currency !== undefined && input.currency.trim().toUpperCase() !== APP_CURRENCY) {
    errors.currency = 'Currency must be PKR.';
  }

  if (input?.startedAt && Number.isNaN(new Date(input.startedAt).getTime())) {
    errors.startedAt = 'Choose a valid start date.';
  }

  if (input?.endedAt && Number.isNaN(new Date(input.endedAt).getTime())) {
    errors.endedAt = 'Choose a valid end date.';
  }

  if (input?.notes && input.notes.trim().length > 1200) {
    errors.notes = 'Notes must be 1,200 characters or less.';
  }

  return errors;
}

export function validateSponsorshipMatchStatusInput(
  input: Partial<SponsorshipMatchStatusInput> | null,
  options: { requireEndedAt?: boolean } = {},
) {
  const errors: Partial<Record<keyof SponsorshipMatchStatusInput, string>> = {};

  if (!input?.reason?.trim()) {
    errors.reason = 'Reason is required.';
  } else if (input.reason.trim().length > 600) {
    errors.reason = 'Reason must be 600 characters or less.';
  }

  if (options.requireEndedAt && !input?.endedAt) {
    errors.endedAt = 'End date is required.';
  } else if (input?.endedAt && Number.isNaN(new Date(input.endedAt).getTime())) {
    errors.endedAt = 'Choose a valid end date.';
  }

  return errors;
}

export async function listSponsorshipMatches(options: SponsorshipMatchListOptions = {}) {
  const supabase = createSupabaseAdminClient();
  let query = supabase
    .from('sponsorship_matches')
    .select(MATCH_SELECT)
    .order('created_at', { ascending: false });

  if (options.status) {
    query = query.eq('status', options.status);
  }

  if (options.donorId) {
    query = query.eq('donor_id', options.donorId);
  }

  if (options.orphanId) {
    query = query.eq('orphan_id', options.orphanId);
  }

  if (options.createdBy) {
    query = query.eq('created_by_team_member_id', options.createdBy);
  }

  if (options.startedFrom) {
    query = query.gte('started_at', options.startedFrom);
  }

  if (options.startedTo) {
    query = query.lte('started_at', options.startedTo);
  }

  const { data, error } = await query.returns<SponsorshipMatchRow[]>();

  if (error) {
    throw new Error(error.message);
  }

  const matches = data.map(mapSponsorshipMatchRow);
  const search = options.search?.trim().toLowerCase();

  if (!search) {
    return matches;
  }

  return matches.filter((match) =>
    [
      match.donor?.fullName,
      match.donor?.email,
      match.donor?.phone,
      match.orphan?.fullName,
      match.orphan?.orphanCode,
      match.status,
    ]
      .join(' ')
      .toLowerCase()
      .includes(search),
  );
}

export async function listSponsorshipMatchesPage(
  options: SponsorshipMatchListOptions = {},
  paginationOptions: PaginationOptions = {},
) {
  const pagination = normalizePaginationOptions(paginationOptions);
  const supabase = createSupabaseAdminClient();
  const functionName = 'admin_sponsorship_match_page_ids';
  const { data: pageRows, error: pageError } = await supabase.rpc(functionName, {
    p_created_by: options.createdBy ?? null,
    p_donor_id: options.donorId ?? null,
    p_known_total: pagination.knownTotal ?? null,
    p_limit: pagination.limit,
    p_offset: pagination.offset,
    p_orphan_id: options.orphanId ?? null,
    p_search: options.search?.trim() || null,
    p_started_from: options.startedFrom ?? null,
    p_started_to: options.startedTo ?? null,
    p_status: options.status ?? null,
  });

  if (pageError) {
    if (isMissingDatabaseFunctionError(pageError, functionName)) {
      // Backward-compatible fallback while an environment is waiting for the database migration.
      return paginateArray(await listSponsorshipMatches(options), pagination);
    }

    throw new Error(pageError.message);
  }

  const rows = (pageRows ?? []) as Array<{ match_id: string; total_count: number | string }>;
  const total = Number(rows[0]?.total_count ?? pagination.knownTotal ?? 0);

  if (rows.length === 0) {
    return createPaginatedResult([], total, pagination);
  }

  const ids = rows.map((row) => row.match_id);
  const { data, error } = await supabase
    .from('sponsorship_matches')
    .select(MATCH_SELECT)
    .in('id', ids)
    .returns<SponsorshipMatchRow[]>();

  if (error) {
    throw new Error(error.message);
  }

  const byId = new Map(data.map((row) => [row.id, mapSponsorshipMatchRow(row)]));
  const matches = ids.flatMap((id) => {
    const match = byId.get(id);
    return match ? [match] : [];
  });

  return createPaginatedResult(matches, total, pagination);
}

export async function getSponsorshipMatchListSummary(): Promise<SponsorshipMatchListSummary> {
  const supabase = createSupabaseAdminClient();
  const functionName = 'admin_sponsorship_match_list_summary';
  const { data: summary, error: summaryError } = await supabase.rpc(functionName);

  if (!summaryError && summary) {
    return summary as unknown as SponsorshipMatchListSummary;
  }

  if (!isMissingDatabaseFunctionError(summaryError, functionName)) {
    throw new Error(summaryError?.message ?? 'Sponsorship match summary query returned no data.');
  }

  // Backward-compatible fallback while an environment is waiting for the database migration.
  const month = currentMonthValue();
  const [year, monthNumber] = month.split('-').map(Number);
  const nextMonthDate = new Date(Date.UTC(year, monthNumber, 1));
  const nextMonth = `${nextMonthDate.getUTCFullYear()}-${String(
    nextMonthDate.getUTCMonth() + 1,
  ).padStart(2, '0')}`;
  const [activeResult, pausedResult, newThisMonthResult, availableOrphansResult] =
    await Promise.all([
      supabase
        .from('sponsorship_matches')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'active'),
      supabase
        .from('sponsorship_matches')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'paused'),
      supabase
        .from('sponsorship_matches')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', `${month}-01T00:00:00+05:00`)
        .lt('created_at', `${nextMonth}-01T00:00:00+05:00`),
      supabase
        .from('orphan_profiles')
        .select('id', { count: 'exact', head: true })
        .eq('profile_status', 'approved')
        .eq('verification_status', 'field_verified'),
    ]);

  for (const result of [activeResult, pausedResult, newThisMonthResult, availableOrphansResult]) {
    if (result.error) {
      throw new Error(result.error.message);
    }
  }

  return {
    active: activeResult.count ?? 0,
    availableOrphans: availableOrphansResult.count ?? 0,
    newThisMonth: newThisMonthResult.count ?? 0,
    paused: pausedResult.count ?? 0,
  };
}

export async function getSponsorshipMatchById(id: string) {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from('sponsorship_matches')
    .select(MATCH_SELECT)
    .eq('id', id)
    .maybeSingle<SponsorshipMatchRow>();

  if (error) {
    throw new Error(error.message);
  }

  return data ? mapSponsorshipMatchRow(data) : null;
}

export async function listMatchesForDonor(donorId: string) {
  return listSponsorshipMatches({ donorId });
}

export async function listMatchesForOrphan(orphanId: string) {
  return listSponsorshipMatches({ orphanId });
}

export async function listMatchableDonors(options: MatchableListOptions = {}) {
  const supabase = createSupabaseAdminClient();
  let query = supabase
    .from('donors')
    .select('id, auth_user_id, full_name, email, phone, preferred_contact_method, active')
    .eq('active', true)
    .order('full_name', { ascending: true });

  if (options.search?.trim()) {
    const search = options.search.trim().replaceAll(',', ' ');
    query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%`);
  }

  const { data, error } = await query.returns<MatchableDonorRow[]>();

  if (error) {
    throw new Error(error.message);
  }

  if (data.length === 0) {
    return [];
  }

  const counts = await listActiveMatchCountsForDonors(data.map((row) => row.id));

  return data.map<MatchableDonor>((row) => {
    const activeMatchCount = counts.get(row.id) ?? 0;

    return {
      active: row.active,
      activeMatchCount,
      authUserId: row.auth_user_id,
      donorState:
        activeMatchCount > 0
          ? 'already_sponsoring'
          : row.auth_user_id
            ? 'ready'
            : 'pending_first_login',
      email: row.email,
      fullName: row.full_name,
      id: row.id,
      phone: row.phone,
      preferredContactMethod: row.preferred_contact_method,
    };
  });
}

export async function listMatchableOrphans(options: MatchableListOptions = {}) {
  const supabase = createSupabaseAdminClient();
  let query = supabase
    .from('orphan_profiles')
    .select(
      'id, orphan_code, full_name, profile_image_url, profile_status, verification_status, age_estimate, city_area, approved_at',
    )
    .eq('profile_status', 'approved')
    .eq('verification_status', 'field_verified')
    .order('approved_at', { ascending: false });

  if (options.search?.trim()) {
    const search = options.search.trim().replaceAll(',', ' ');
    query = query.or(
      `orphan_code.ilike.%${search}%,full_name.ilike.%${search}%,city_area.ilike.%${search}%`,
    );
  }

  const { data, error } = await query.returns<MatchableOrphanRow[]>();

  if (error) {
    throw new Error(error.message);
  }

  if (data.length === 0) {
    return [];
  }

  const unavailableIds = await listOrphanIdsWithActiveMatches(data.map((row) => row.id));

  return data
    .filter((row) => !unavailableIds.has(row.id))
    .map<MatchableOrphan>((row) => ({
      ageEstimate: row.age_estimate,
      approvedAt: row.approved_at,
      cityArea: row.city_area,
      fullName: row.full_name,
      id: row.id,
      orphanCode: row.orphan_code,
      profileImageUrl: row.profile_image_url,
      profileStatus: row.profile_status,
      verificationStatus: row.verification_status,
    }));
}

export async function createSponsorshipMatch(
  input: SponsorshipMatchInput,
  createdByTeamMemberId: string,
) {
  const supabase = createSupabaseAdminClient();
  const previousOrphanStatus = await getOrphanProfileStatus(input.orphanId);
  const { data, error } = await supabase.rpc('create_sponsorship_match', {
    p_created_by_team_member_id: createdByTeamMemberId,
    p_currency: APP_CURRENCY,
    p_donor_id: input.donorId,
    p_monthly_amount: input.monthlyAmount,
    p_notes: normalizeOptionalText(input.notes),
    p_orphan_id: input.orphanId,
    p_started_at: input.startedAt,
  });

  if (error) {
    throw new Error(error.message);
  }

  const matchId = readRpcUuid(data);
  const match = await getSponsorshipMatchById(matchId);

  if (!match) {
    throw new Error('Sponsorship match not found after creation.');
  }

  const newOrphanStatus = await getOrphanProfileStatus(input.orphanId);

  if (previousOrphanStatus !== newOrphanStatus && newOrphanStatus) {
    await recordOrphanStatusChange({
      changedByTeamMemberId: createdByTeamMemberId,
      newStatus: newOrphanStatus,
      orphanId: input.orphanId,
      previousStatus: previousOrphanStatus,
      reason: 'Sponsorship match created.',
    });
  }

  return match;
}

export async function updateSponsorshipMatch(
  id: string,
  update: SponsorshipMatchUpdate,
  updatedByTeamMemberId: string,
) {
  const patch: Partial<SponsorshipMatchRow> = {
    updated_by_team_member_id: updatedByTeamMemberId,
  };

  if (update.monthlyAmount !== undefined) {
    patch.monthly_amount = update.monthlyAmount;
  }

  if (update.currency !== undefined) {
    patch.currency = APP_CURRENCY;
  }

  if (update.startedAt !== undefined) {
    patch.started_at = update.startedAt;
  }

  if (update.endedAt !== undefined) {
    patch.ended_at = update.endedAt;
  }

  if (update.notes !== undefined) {
    patch.notes = normalizeOptionalText(update.notes);
  }

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from('sponsorship_matches')
    .update(patch)
    .eq('id', id)
    .select(MATCH_SELECT)
    .single<SponsorshipMatchRow>();

  if (error) {
    throw new Error(error.message);
  }

  return mapSponsorshipMatchRow(data);
}

export async function pauseSponsorshipMatch(
  id: string,
  reason: string,
  updatedByTeamMemberId: string,
) {
  return updateMatchStatus(id, 'paused', {
    reason,
    updatedByTeamMemberId,
  });
}

export async function resumeSponsorshipMatch(id: string, updatedByTeamMemberId: string) {
  return updateMatchStatus(id, 'active', {
    reason: 'Sponsorship resumed.',
    updatedByTeamMemberId,
  });
}

export async function endSponsorshipMatch(
  id: string,
  input: SponsorshipMatchStatusInput,
  updatedByTeamMemberId: string,
) {
  return updateMatchStatus(id, 'ended', {
    endedAt: input.endedAt,
    reason: input.reason,
    updatedByTeamMemberId,
  });
}

export async function voidSponsorshipMatch(
  id: string,
  reason: string,
  updatedByTeamMemberId: string,
) {
  return updateMatchStatus(id, 'voided', {
    endedAt: new Date().toISOString().slice(0, 10),
    reason,
    updatedByTeamMemberId,
  });
}

export async function assertDonorCanBeMatched(
  donorId: string,
  _options: { existingMatchId?: string } = {},
) {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from('donors')
    .select('id, full_name, email, active')
    .eq('id', donorId)
    .maybeSingle<DonorEligibilityRow>();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    throw new Error('Donor not found.');
  }

  if (!data.active) {
    throw new Error('Inactive donors cannot receive new matches.');
  }
}

export async function assertOrphanCanBeMatched(
  orphanId: string,
  options: { existingMatchId?: string } = {},
) {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from('orphan_profiles')
    .select('id, orphan_code, full_name, profile_status, verification_status')
    .eq('id', orphanId)
    .maybeSingle<OrphanEligibilityRow>();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    throw new Error('Orphan profile not found.');
  }

  if (data.verification_status !== 'field_verified') {
    throw new Error('Only field verified orphan profiles can be matched.');
  }

  const activeMatch = await getActiveMatchForOrphan(orphanId, options.existingMatchId);

  if (data.profile_status === 'matched' && activeMatch) {
    throw new Error('This orphan already has an active sponsor.');
  }

  if (
    data.profile_status !== 'approved' &&
    !(data.profile_status === 'matched' && options.existingMatchId)
  ) {
    throw new Error('Only approved orphan profiles can be matched.');
  }
}

async function updateMatchStatus(
  id: string,
  status: SponsorshipMatchStatus,
  options: { endedAt?: string | null; reason: string; updatedByTeamMemberId: string },
) {
  const existingMatch = await getSponsorshipMatchById(id);
  const previousOrphanStatus = existingMatch
    ? await getOrphanProfileStatus(existingMatch.orphanId)
    : null;
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase.rpc('set_sponsorship_match_status', {
    p_ended_at: status === 'ended' || status === 'voided' ? options.endedAt : null,
    p_match_id: id,
    p_reason: options.reason.trim(),
    p_status: status,
    p_updated_by_team_member_id: options.updatedByTeamMemberId,
  });

  if (error) {
    throw new Error(error.message);
  }

  const matchId = readRpcUuid(data);
  const match = await getSponsorshipMatchById(matchId);

  if (match) {
    const newOrphanStatus = await getOrphanProfileStatus(match.orphanId);

    if (previousOrphanStatus !== newOrphanStatus && newOrphanStatus) {
      await recordOrphanStatusChange({
        changedByTeamMemberId: options.updatedByTeamMemberId,
        newStatus: newOrphanStatus,
        orphanId: match.orphanId,
        previousStatus: previousOrphanStatus,
        reason: options.reason,
      });
    }
  }

  return match;
}

async function getOrphanProfileStatus(orphanId: string) {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from('orphan_profiles')
    .select('profile_status')
    .eq('id', orphanId)
    .maybeSingle<{ profile_status: OrphanProfileStatus }>();

  if (error) {
    throw new Error(error.message);
  }

  return data?.profile_status ?? null;
}

async function listActiveMatchCountsForDonors(donorIds: string[]) {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from('sponsorship_matches')
    .select('donor_id')
    .in('donor_id', donorIds)
    .eq('status', 'active')
    .returns<MatchCountRow[]>();

  if (error) {
    throw new Error(error.message);
  }

  const counts = new Map<string, number>();
  for (const row of data) {
    counts.set(row.donor_id, (counts.get(row.donor_id) ?? 0) + 1);
  }

  return counts;
}

async function listOrphanIdsWithActiveMatches(orphanIds: string[]) {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from('sponsorship_matches')
    .select('orphan_id')
    .in('orphan_id', orphanIds)
    .eq('status', 'active')
    .returns<Array<{ orphan_id: string }>>();

  if (error) {
    throw new Error(error.message);
  }

  return new Set(data.map((row) => row.orphan_id));
}

async function getActiveMatchForOrphan(orphanId: string, ignoredMatchId?: string) {
  const supabase = createSupabaseAdminClient();
  let query = supabase
    .from('sponsorship_matches')
    .select('id, status')
    .eq('orphan_id', orphanId)
    .eq('status', 'active')
    .limit(1);

  if (ignoredMatchId) {
    query = query.neq('id', ignoredMatchId);
  }

  const { data, error } = await query.maybeSingle<ExistingMatchRow>();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

function readRpcUuid(data: unknown) {
  if (typeof data === 'string') {
    return data;
  }

  if (Array.isArray(data) && typeof data[0] === 'string') {
    return data[0];
  }

  if (Array.isArray(data) && data[0] && typeof data[0] === 'object' && 'id' in data[0]) {
    return String(data[0].id);
  }

  if (data && typeof data === 'object' && 'id' in data) {
    return String(data.id);
  }

  throw new Error('Sponsorship match operation did not return an id.');
}

import {
  createPaginatedResult,
  normalizePaginationOptions,
  type PaginationOptions,
} from '@/lib/pagination';
import {
  getEffectiveSponsorshipRequestStatus,
  SPONSORSHIP_REQUEST_STATUSES,
} from '@/lib/sponsorshipStatus';
import { createSupabaseAdminClient, isMissingDatabaseFunctionError } from '@/lib/supabase/server';
import { mapTeamMemberRow } from '@/lib/teamMembers';

import type { Donor, DonorRow, TeamMemberRole, TeamMemberRow } from '@/types/accounts';
import type {
  ContactLog,
  ContactLogDirection,
  ContactLogInput,
  ContactLogMethod,
  ContactLogOutcome,
  ContactLogRow,
  PreferredContactMethod,
  RequestSource,
  SponsorshipRequest,
  SponsorshipRequestCreateInput,
  SponsorshipRequestInput,
  SponsorshipRequestRow,
  SponsorshipRequestStatus,
  SponsorshipRequestUpdate,
  TeamMemberSummary,
} from '@/types/sponsorship';

export {
  isAllowedSponsorshipRequestStatusTransition,
  isPostConversionSponsorshipRequestStatus,
  SPONSORSHIP_REQUEST_STATUSES,
} from '@/lib/sponsorshipStatus';

export const PREFERRED_CONTACT_METHODS: PreferredContactMethod[] = ['whatsapp', 'phone', 'email'];

export const REQUEST_SOURCES: RequestSource[] = [
  'public_form',
  'admin_created',
  'whatsapp',
  'phone',
  'email',
  'referral',
  'walk_in',
  'other',
];

export const CONTACT_LOG_METHODS: ContactLogMethod[] = [
  'whatsapp',
  'phone',
  'email',
  'sms',
  'in_person',
  'other',
];

export const CONTACT_LOG_DIRECTIONS: ContactLogDirection[] = [
  'outbound',
  'inbound',
  'internal_note',
];

export const CONTACT_LOG_OUTCOMES: ContactLogOutcome[] = [
  'logged',
  'reached',
  'no_response',
  'follow_up_needed',
  'not_interested',
  'converted',
];

const SPONSORSHIP_REQUEST_SELECT = `
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

const CONTACT_LOG_SELECT = `
  *,
  team_member:team_members!contact_logs_team_member_id_fkey(
    id,
    full_name,
    email,
    role
  )
`;

const assignableRoles: TeamMemberRole[] = [
  'super_admin',
  'admin',
  'sponsorship_manager',
  'support_coordinator',
];

export type SponsorshipRequestListOptions = {
  assignedTeamMemberId?: string;
  city?: string;
  converted?: boolean;
  followUpDue?: boolean;
  method?: PreferredContactMethod;
  search?: string;
  status?: SponsorshipRequestStatus;
};

export type SponsorshipRequestListSummary = {
  assignedToMe: number;
  convertedDonors: number;
  followUpsDue: number;
  newRequests: number;
  statusCounts: Record<SponsorshipRequestStatus, number>;
  total: number;
};

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
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

function mapDonorRow(row: DonorRow): Donor {
  return {
    active: row.active,
    address: row.address,
    authUserId: row.auth_user_id,
    cityCountry: row.city_country,
    createdAt: row.created_at,
    createdByTeamMember: row.created_by_team_member
      ? {
          email: row.created_by_team_member.email,
          fullName: row.created_by_team_member.full_name,
          id: row.created_by_team_member.id,
          role: row.created_by_team_member.role,
        }
      : null,
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

export function mapSponsorshipRequestRow(row: SponsorshipRequestRow): SponsorshipRequest {
  return {
    adminNotes: row.admin_notes,
    assignedTeamMember: mapTeamMemberSummary(row.assigned_team_member),
    assignedTeamMemberId: row.assigned_team_member_id,
    assignedTo: row.assigned_to,
    cityCountry: row.city_country ?? '',
    closedAt: row.closed_at ?? null,
    confirmedMinimumAmount: row.confirmed_minimum_amount,
    contactedAt: row.contacted_at ?? null,
    convertedAt: row.converted_at,
    convertedByTeamMemberId: row.converted_by_team_member_id,
    convertedDonor: row.converted_donor
      ? {
          email: row.converted_donor.email,
          fullName: row.converted_donor.full_name,
          id: row.converted_donor.id,
        }
      : null,
    convertedDonorId: row.converted_donor_id,
    createdAt: row.created_at,
    createdByTeamMember: mapTeamMemberSummary(row.created_by_team_member),
    createdByTeamMemberId: row.created_by_team_member_id,
    email: row.email,
    fullName: row.full_name,
    id: row.id,
    lastContactedAt: row.last_contacted_at,
    message: row.message ?? '',
    nextFollowUpAt: row.next_follow_up_at,
    phone: row.phone,
    preferredContactMethod: row.preferred_contact_method,
    profilesPreparedAt: row.profiles_prepared_at ?? null,
    profilesSharedAt: row.profiles_shared_at ?? null,
    requestSource: row.request_source,
    status: getEffectiveSponsorshipRequestStatus(row.status, row.converted_donor_id),
    updatedAt: row.updated_at,
  };
}

export function mapContactLogRow(row: ContactLogRow): ContactLog {
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

export function validateSponsorshipRequestInput(
  input: Partial<SponsorshipRequestInput> | null | undefined,
) {
  const errors: Partial<Record<keyof SponsorshipRequestInput, string>> = {};
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const fullName = input?.fullName?.trim() ?? '';
  const email = input?.email?.trim() ?? '';
  const phone = input?.phone?.trim() ?? '';

  if (!fullName) {
    errors.fullName = 'Full name is required.';
  }

  if (!email) {
    errors.email = 'Email address is required.';
  } else if (!emailPattern.test(email)) {
    errors.email = 'Enter a valid email address.';
  }

  if (!phone) {
    errors.phone = 'Phone or WhatsApp number is required.';
  }

  if (
    !input?.preferredContactMethod ||
    !PREFERRED_CONTACT_METHODS.includes(input.preferredContactMethod)
  ) {
    errors.preferredContactMethod = 'Choose a valid contact method.';
  }

  if (!input?.confirmedMinimumAmount) {
    errors.confirmedMinimumAmount = 'The Rs. 36,000/- monthly minimum must be confirmed.';
  }

  return errors;
}

export function validateSponsorshipRequestCreateInput(
  input: Partial<SponsorshipRequestCreateInput> | null | undefined,
) {
  const errors: Partial<Record<keyof SponsorshipRequestCreateInput, string>> = {
    ...validateSponsorshipRequestInput(input),
  };

  if (input?.status && !SPONSORSHIP_REQUEST_STATUSES.includes(input.status)) {
    errors.status = 'Choose a valid status.' as never;
  }

  if (input?.status && input.status !== 'new') {
    errors.status = 'New requests must start at New request.' as never;
  }

  if (input?.requestSource && !REQUEST_SOURCES.includes(input.requestSource)) {
    errors.requestSource = 'Choose a valid request source.' as never;
  }

  if (input?.nextFollowUpAt && !normalizeOptionalIso(input.nextFollowUpAt)) {
    errors.nextFollowUpAt = 'Choose a valid follow-up date.' as never;
  }

  return errors as Partial<Record<keyof SponsorshipRequestCreateInput, string>>;
}

export function validateContactLogInput(input: Partial<ContactLogInput> | null | undefined) {
  const errors: Partial<Record<keyof ContactLogInput, string>> = {};

  if (!input?.contactMethod || !CONTACT_LOG_METHODS.includes(input.contactMethod)) {
    errors.contactMethod = 'Choose a valid contact method.';
  }

  if (!input?.direction || !CONTACT_LOG_DIRECTIONS.includes(input.direction)) {
    errors.direction = 'Choose a valid direction.';
  }

  if (!input?.outcome || !CONTACT_LOG_OUTCOMES.includes(input.outcome)) {
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

export async function createSponsorshipRequest(
  input: SponsorshipRequestCreateInput,
  createdByTeamMemberId?: string,
) {
  const supabase = createSupabaseAdminClient();

  const { data, error } = await supabase
    .from('sponsorship_requests')
    .insert({
      admin_notes: normalizeOptionalText(input.adminNotes),
      assigned_team_member_id: input.assignedTeamMemberId || null,
      city_country: normalizeOptionalText(input.cityCountry),
      confirmed_minimum_amount: input.confirmedMinimumAmount,
      created_by_team_member_id: createdByTeamMemberId ?? null,
      email: normalizeEmail(input.email),
      full_name: input.fullName.trim(),
      message: normalizeOptionalText(input.message),
      next_follow_up_at: normalizeOptionalIso(input.nextFollowUpAt),
      phone: input.phone.trim(),
      preferred_contact_method: input.preferredContactMethod,
      request_source:
        input.requestSource ?? (createdByTeamMemberId ? 'admin_created' : 'public_form'),
      status: input.status ?? 'new',
    })
    .select(SPONSORSHIP_REQUEST_SELECT)
    .single<SponsorshipRequestRow>();

  if (error) {
    throw new Error(error.message);
  }

  return mapSponsorshipRequestRow(data);
}

export async function listSponsorshipRequests(
  options: SponsorshipRequestListOptions = {},
  paginationOptions: PaginationOptions = {},
) {
  const supabase = createSupabaseAdminClient();
  const pagination = normalizePaginationOptions(paginationOptions);
  let query = supabase
    .from('sponsorship_requests')
    .select(
      SPONSORSHIP_REQUEST_SELECT,
      pagination.knownTotal === undefined ? { count: 'exact' } : undefined,
    )
    .order('created_at', { ascending: false });

  if (options.status) {
    query = query.eq('status', options.status);
  }

  if (options.assignedTeamMemberId === 'unassigned') {
    query = query.is('assigned_team_member_id', null);
  } else if (options.assignedTeamMemberId) {
    query = query.eq('assigned_team_member_id', options.assignedTeamMemberId);
  }

  if (options.method) {
    query = query.eq('preferred_contact_method', options.method);
  }

  if (options.city) {
    query = query.eq('city_country', options.city);
  }

  if (options.converted === true) {
    query = query.not('converted_donor_id', 'is', null);
  } else if (options.converted === false) {
    query = query.is('converted_donor_id', null);
  }

  if (options.followUpDue) {
    query = query
      .not('next_follow_up_at', 'is', null)
      .lte('next_follow_up_at', new Date().toISOString());
  }

  if (options.search?.trim()) {
    const search = options.search.trim().replaceAll(',', ' ');
    query = query.or(
      `full_name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%,city_country.ilike.%${search}%`,
    );
  }

  const { count, data, error } = await query
    .range(pagination.offset, pagination.offset + pagination.limit - 1)
    .returns<SponsorshipRequestRow[]>();

  if (error) {
    throw new Error(error.message);
  }

  return createPaginatedResult(
    data.map(mapSponsorshipRequestRow),
    pagination.knownTotal ?? count ?? 0,
    pagination,
  );
}

export async function getSponsorshipRequestListSummary(options: {
  currentTeamMemberId: string;
  scopedToTeamMemberId?: string;
}): Promise<SponsorshipRequestListSummary> {
  const supabase = createSupabaseAdminClient();
  const functionName = 'admin_sponsorship_request_list_summary';
  const { data: summary, error: summaryError } = await supabase.rpc(functionName, {
    p_current_team_member_id: options.currentTeamMemberId,
    p_scoped_to_team_member_id: options.scopedToTeamMemberId ?? null,
  });

  if (!summaryError && summary) {
    return summary as unknown as SponsorshipRequestListSummary;
  }

  if (!isMissingDatabaseFunctionError(summaryError, functionName)) {
    throw new Error(summaryError?.message ?? 'Sponsorship request summary query returned no data.');
  }

  // Backward-compatible fallback while an environment is waiting for the database migration.
  const statusQueries = SPONSORSHIP_REQUEST_STATUSES.map((status) => {
    let query = supabase
      .from('sponsorship_requests')
      .select('id', { count: 'exact', head: true })
      .eq('status', status);

    if (options.scopedToTeamMemberId) {
      query = query.eq('assigned_team_member_id', options.scopedToTeamMemberId);
    }

    return query;
  });
  const assignedToMeQuery = supabase
    .from('sponsorship_requests')
    .select('id', { count: 'exact', head: true })
    .eq('assigned_team_member_id', options.currentTeamMemberId);
  let followUpsDueQuery = supabase
    .from('sponsorship_requests')
    .select('id', { count: 'exact', head: true })
    .not('next_follow_up_at', 'is', null)
    .lte('next_follow_up_at', new Date().toISOString());
  let convertedDonorsQuery = supabase
    .from('sponsorship_requests')
    .select('id', { count: 'exact', head: true })
    .not('converted_donor_id', 'is', null);

  if (options.scopedToTeamMemberId) {
    followUpsDueQuery = followUpsDueQuery.eq(
      'assigned_team_member_id',
      options.scopedToTeamMemberId,
    );
    convertedDonorsQuery = convertedDonorsQuery.eq(
      'assigned_team_member_id',
      options.scopedToTeamMemberId,
    );
  }

  const [statusResults, assignedToMeResult, followUpsDueResult, convertedDonorsResult] =
    await Promise.all([
      Promise.all(statusQueries),
      assignedToMeQuery,
      followUpsDueQuery,
      convertedDonorsQuery,
    ]);

  for (const result of [
    ...statusResults,
    assignedToMeResult,
    followUpsDueResult,
    convertedDonorsResult,
  ]) {
    if (result.error) {
      throw new Error(result.error.message);
    }
  }

  const statusCounts = Object.fromEntries(
    SPONSORSHIP_REQUEST_STATUSES.map((status, index) => [status, statusResults[index]?.count ?? 0]),
  ) as Record<SponsorshipRequestStatus, number>;

  return {
    assignedToMe: assignedToMeResult.count ?? 0,
    convertedDonors: convertedDonorsResult.count ?? 0,
    followUpsDue: followUpsDueResult.count ?? 0,
    newRequests: statusCounts.new,
    statusCounts,
    total: Object.values(statusCounts).reduce((total, count) => total + count, 0),
  };
}

export async function getSponsorshipRequestById(id: string) {
  const supabase = createSupabaseAdminClient();

  const { data, error } = await supabase
    .from('sponsorship_requests')
    .select(SPONSORSHIP_REQUEST_SELECT)
    .eq('id', id)
    .maybeSingle<SponsorshipRequestRow>();

  if (error) {
    throw new Error(error.message);
  }

  return data ? mapSponsorshipRequestRow(data) : null;
}

export async function updateSponsorshipRequest(
  id: string,
  update: SponsorshipRequestUpdate,
  currentRequest?: SponsorshipRequest,
) {
  const supabase = createSupabaseAdminClient();
  const patch: Partial<SponsorshipRequestRow> = {};

  if (update.status) {
    patch.status = update.status;

    const timestamp = new Date().toISOString();

    if (update.status === 'contacted' && !currentRequest?.contactedAt) {
      patch.contacted_at = timestamp;
    }

    if (update.status === 'profiles_prepared' && !currentRequest?.profilesPreparedAt) {
      patch.profiles_prepared_at = timestamp;
    }

    if (update.status === 'profiles_shared' && !currentRequest?.profilesSharedAt) {
      patch.profiles_shared_at = timestamp;
    }

    if (update.status === 'closed' && !currentRequest?.closedAt) {
      patch.closed_at = timestamp;
    }
  }

  if (update.assignedTo !== undefined) {
    patch.assigned_to = normalizeOptionalText(update.assignedTo);
  }

  if (update.assignedTeamMemberId !== undefined) {
    patch.assigned_team_member_id = update.assignedTeamMemberId || null;
  }

  if (update.adminNotes !== undefined) {
    patch.admin_notes = normalizeOptionalText(update.adminNotes);
  }

  if (update.nextFollowUpAt !== undefined) {
    patch.next_follow_up_at = normalizeOptionalIso(update.nextFollowUpAt);
  }

  const { data, error } = await supabase
    .from('sponsorship_requests')
    .update(patch)
    .eq('id', id)
    .select(SPONSORSHIP_REQUEST_SELECT)
    .single<SponsorshipRequestRow>();

  if (error) {
    throw new Error(error.message);
  }

  return mapSponsorshipRequestRow(data);
}

export async function listAssignableTeamMembers() {
  const supabase = createSupabaseAdminClient();

  const { data, error } = await supabase
    .from('team_members')
    .select('*')
    .eq('active', true)
    .in('role', assignableRoles)
    .order('full_name', { ascending: true })
    .returns<TeamMemberRow[]>();

  if (error) {
    throw new Error(error.message);
  }

  return data.map((row) => {
    const member = mapTeamMemberRow(row);
    return {
      email: member.email,
      fullName: member.fullName,
      id: member.id,
      role: member.role,
    };
  });
}

export async function listContactLogsForRequest(sponsorshipRequestId: string) {
  const supabase = createSupabaseAdminClient();

  const { data, error } = await supabase
    .from('contact_logs')
    .select(CONTACT_LOG_SELECT)
    .eq('sponsorship_request_id', sponsorshipRequestId)
    .order('created_at', { ascending: false })
    .returns<ContactLogRow[]>();

  if (error) {
    throw new Error(error.message);
  }

  return data.map(mapContactLogRow);
}

export async function createContactLog(
  sponsorshipRequestId: string,
  input: ContactLogInput,
  teamMemberId: string,
) {
  const supabase = createSupabaseAdminClient();
  const nextFollowUpAt = normalizeOptionalIso(input.nextFollowUpAt);

  const { data, error } = await supabase
    .from('contact_logs')
    .insert({
      contact_method: input.contactMethod,
      direction: input.direction,
      outcome: input.outcome,
      next_follow_up_at: nextFollowUpAt,
      sponsorship_request_id: sponsorshipRequestId,
      summary: input.summary.trim(),
      team_member_id: teamMemberId,
    })
    .select(CONTACT_LOG_SELECT)
    .single<ContactLogRow>();

  if (error) {
    throw new Error(error.message);
  }

  const requestPatch: Partial<SponsorshipRequestRow> = {
    last_contacted_at: new Date().toISOString(),
  };

  if (nextFollowUpAt !== null) {
    requestPatch.next_follow_up_at = nextFollowUpAt;
  }

  const currentRequest = await getSponsorshipRequestById(sponsorshipRequestId);

  if (
    currentRequest &&
    !currentRequest.convertedDonorId &&
    currentRequest.status === 'new' &&
    ['reached', 'follow_up_needed'].includes(input.outcome)
  ) {
    requestPatch.status = 'contacted';

    if (!currentRequest.contactedAt) {
      requestPatch.contacted_at = requestPatch.last_contacted_at;
    }
  }

  const { error: updateError } = await supabase
    .from('sponsorship_requests')
    .update(requestPatch)
    .eq('id', sponsorshipRequestId);

  if (updateError) {
    throw new Error(updateError.message);
  }

  return mapContactLogRow(data);
}

export async function convertSponsorshipRequestToDonor(
  sponsorshipRequestId: string,
  teamMemberId: string,
) {
  const supabase = createSupabaseAdminClient();
  const request = await getSponsorshipRequestById(sponsorshipRequestId);

  if (!request) {
    throw new Error('Sponsorship request not found.');
  }

  if (request.convertedDonorId) {
    const existingLinkedDonor = await getDonorById(request.convertedDonorId);

    if (!existingLinkedDonor) {
      throw new Error('Linked donor could not be found.');
    }

    return {
      donor: existingLinkedDonor,
      request,
    };
  }

  if (request.status !== 'profiles_shared') {
    throw new Error('Profiles must be shared before converting this request to a donor.');
  }

  const existingDonor = await getDonorByEmail(request.email);

  if (existingDonor && !existingDonor.active) {
    throw new Error('A donor with this email exists but is inactive.');
  }

  const donor =
    existingDonor ??
    (await createDonorFromRequest({
      cityCountry: request.cityCountry ?? null,
      createdByTeamMemberId: teamMemberId,
      email: request.email,
      fullName: request.fullName,
      notes: `Converted from sponsorship request ${request.id}.`,
      phone: request.phone,
      preferredContactMethod: request.preferredContactMethod,
    }));

  const convertedAt = new Date().toISOString();
  const { data, error } = await supabase
    .from('sponsorship_requests')
    .update({
      converted_at: convertedAt,
      converted_by_team_member_id: teamMemberId,
      converted_donor_id: donor.id,
      profiles_shared_at: request.profilesSharedAt ?? convertedAt,
      status: 'converted_to_donor',
    })
    .eq('id', sponsorshipRequestId)
    .select(SPONSORSHIP_REQUEST_SELECT)
    .single<SponsorshipRequestRow>();

  if (error) {
    throw new Error(error.message);
  }

  await createContactLog(
    sponsorshipRequestId,
    {
      contactMethod: request.preferredContactMethod,
      direction: 'internal_note',
      outcome: 'converted',
      summary: `Request converted to donor profile for ${donor.fullName}.`,
    },
    teamMemberId,
  );

  return {
    donor,
    request: mapSponsorshipRequestRow(data),
  };
}

async function getDonorById(id: string) {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from('donors')
    .select('*')
    .eq('id', id)
    .maybeSingle<DonorRow>();

  if (error) {
    throw new Error(error.message);
  }

  return data ? mapDonorRow(data) : null;
}

async function getDonorByEmail(email: string) {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from('donors')
    .select('*')
    .eq('email', normalizeEmail(email))
    .maybeSingle<DonorRow>();

  if (error) {
    throw new Error(error.message);
  }

  return data ? mapDonorRow(data) : null;
}

async function createDonorFromRequest({
  cityCountry,
  createdByTeamMemberId,
  email,
  fullName,
  notes,
  phone,
  preferredContactMethod,
}: {
  cityCountry: string | null;
  createdByTeamMemberId: string;
  email: string;
  fullName: string;
  notes: string;
  phone: string | null;
  preferredContactMethod: PreferredContactMethod;
}) {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from('donors')
    .insert({
      active: true,
      city_country: normalizeOptionalText(cityCountry),
      created_by_team_member_id: createdByTeamMemberId,
      donor_source: 'converted_request',
      email: normalizeEmail(email),
      full_name: fullName.trim(),
      notes,
      phone: normalizeOptionalText(phone),
      preferred_contact_method: preferredContactMethod,
    })
    .select('*')
    .single<DonorRow>();

  if (error) {
    throw new Error(error.message);
  }

  return mapDonorRow(data);
}

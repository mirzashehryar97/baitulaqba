import { randomUUID } from 'node:crypto';

import { getCurrentTeamMember } from '@/lib/adminAuth';
import { APP_CURRENCIES, APP_CURRENCY } from '@/lib/currency';
import { updateDonor, validateDonorInput } from '@/lib/donors';
import type { PaginationOptions } from '@/lib/pagination';
import { createPaginatedResult, normalizePaginationOptions } from '@/lib/pagination';
import { createSupabaseAdminClient } from '@/lib/supabase/server';

import type { Donor } from '@/types/accounts';
import type { SponsorshipMatchStatus } from '@/types/matches';
import type {
  AvailableOrphanFilterOptions,
  AvailableOrphanSummary,
  ContributionSeriesPoint,
  ContributionSummary,
  DonationReceiptRow,
  DonorMonthlyPaymentStatus,
  DonorPortalProfile,
  DonorPortalReceipt,
  DonorPortalReceiptStatus,
  DonorPortalSession,
  DonorPortalSponsorship,
  OrganizationBankAccount,
  OrganizationBankAccountRow,
  PortalDashboard,
  ReceiptUploadInput,
} from '@/types/portal';

const RECEIPT_STATUSES: DonorPortalReceiptStatus[] = [
  'submitted',
  'ready_for_review',
  'reviewed',
  'verified',
  'rejected',
  'money_delivered',
];

const RECEIPT_CURRENCIES = APP_CURRENCIES;
const MAX_RECEIPT_FILE_SIZE = 8 * 1024 * 1024;
const ALLOWED_RECEIPT_FILE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

const RECEIPT_SELECT = `
  *,
  bank_account:organization_bank_accounts!donation_receipts_organization_bank_account_id_fkey(*),
  match:sponsorship_matches!donation_receipts_sponsorship_match_id_fkey(
    orphan:orphan_profiles!sponsorship_matches_orphan_id_fkey(
      id,
      orphan_code,
      full_name
    )
  )
`;

type PortalMatchRow = {
  currency: string;
  donor_id: string;
  ended_at: string | null;
  id: string;
  monthly_amount: number | string;
  started_at: string;
  status: SponsorshipMatchStatus;
  orphan: {
    age_estimate: number | null;
    background_summary: string | null;
    city_area: string | null;
    education_status: string | null;
    full_name: string;
    id: string;
    orphan_code: string;
    profile_image_url: string;
  } | null;
};

type AvailableOrphanRow = {
  age_estimate: number | null;
  approved_at: string | null;
  background_summary: string | null;
  city_area: string | null;
  education_status: string | null;
  full_name: string;
  id: string;
  orphan_code: string;
  profile_image_url: string;
};

type AvailableOrphanFilterRow = {
  city_area: string | null;
  education_status: string | null;
};

type AvailableOrphanListOptions = {
  age?: '8-10' | '11-plus' | 'under-8';
  education?: string;
  location?: string;
  search?: string;
};

export class PortalValidationError extends Error {
  errors: Record<string, string>;

  constructor(errors: Record<string, string>, message = 'Validation failed.') {
    super(message);
    this.name = 'PortalValidationError';
    this.errors = errors;
  }
}

export class PortalConflictError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PortalConflictError';
  }
}

function normalizeOptionalText(value: FormDataEntryValue | string | null | undefined) {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function monthStart(value: string) {
  const match = /^(\d{4})-(\d{2})(?:-\d{2})?$/.exec(value);

  if (!match) {
    return null;
  }

  return `${match[1]}-${match[2]}-01`;
}

export function getCurrentDonationMonth() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
}

function isLateForMonth(month: string, now = new Date()) {
  const [year, monthNumber] = month.split('-').map(Number);
  const deadline = new Date(year, monthNumber - 1, 10, 23, 59, 59, 999);
  return now > deadline;
}

function isCurrentMonthUploadWindow(month: string, now = new Date()) {
  const [year, monthNumber] = month.split('-').map(Number);
  return now.getFullYear() === year && now.getMonth() === monthNumber - 1 && now.getDate() <= 10;
}

function mapBankAccountRow(row: OrganizationBankAccountRow): OrganizationBankAccount {
  return {
    accountLabel: row.account_label,
    accountNumber: row.account_number,
    accountTitle: row.account_title,
    active: row.active,
    bankName: row.bank_name,
    country: row.country,
    createdAt: row.created_at,
    currency: APP_CURRENCY,
    iban: row.iban,
    id: row.id,
    instructions: row.instructions,
    sortOrder: row.sort_order,
    updatedAt: row.updated_at,
  };
}

function mapReceiptRow(row: DonationReceiptRow): DonorPortalReceipt {
  return {
    amount: Number(row.amount),
    bankAccount: row.bank_account ? mapBankAccountRow(row.bank_account) : null,
    createdAt: row.created_at,
    currency: APP_CURRENCY,
    donationMonth: row.donation_month,
    donorId: row.donor_id,
    donorNote: row.donor_note,
    id: row.id,
    matchId: row.sponsorship_match_id,
    moneyDeliveredAt: row.money_delivered_at,
    orphanCode: row.match?.orphan?.orphan_code ?? null,
    orphanName: row.match?.orphan?.full_name ?? null,
    receiptFileName: row.receipt_file_name,
    receiptFileSize: row.receipt_file_size,
    receiptFileType: row.receipt_file_type,
    receiptFileUrl: row.receipt_file_url,
    rejectionReason: row.rejection_reason,
    reviewedAt: row.reviewed_at,
    status: row.status,
    submittedAt: row.submitted_at,
    submittedLate: row.submitted_late,
    transferDate: row.transfer_date,
    transferReference: row.transfer_reference,
    updatedAt: row.updated_at,
    verifiedAt: row.verified_at,
  };
}

function mapPortalProfile(donor: Donor, canSwitchToAdmin: boolean): DonorPortalProfile {
  return {
    authUserId: donor.authUserId,
    canSwitchToAdmin,
    cityCountry: donor.cityCountry,
    // A portal donor authenticated via their Google email, so this is present in practice.
    email: donor.email ?? '',
    fullName: donor.fullName,
    id: donor.id,
    phone: donor.phone,
    preferredContactMethod: donor.preferredContactMethod,
    switchToAdminHref: canSwitchToAdmin ? '/admin' : null,
  };
}

function deriveMonthlyStatus(
  receipt: DonorPortalReceipt | null,
  month: string,
): DonorMonthlyPaymentStatus {
  if (receipt) {
    return receipt.status;
  }

  if (isCurrentMonthUploadWindow(month)) {
    return 'due_soon';
  }

  if (isLateForMonth(month)) {
    return 'overdue';
  }

  return 'pending';
}

export async function getDonorPortalSession(donor: Donor): Promise<DonorPortalSession> {
  const teamMember = await getCurrentTeamMember();

  return {
    donor: mapPortalProfile(donor, Boolean(teamMember)),
    teamMember,
  };
}

export async function listActiveOrganizationBankAccounts() {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from('organization_bank_accounts')
    .select('*')
    .eq('active', true)
    .order('sort_order', { ascending: true })
    .order('account_label', { ascending: true })
    .returns<OrganizationBankAccountRow[]>();

  if (error) {
    throw new Error(error.message);
  }

  return data.map(mapBankAccountRow);
}

export async function listPortalReceipts(
  donorId: string,
  options: {
    matchId?: string;
    monthFrom?: string;
    monthTo?: string;
    status?: DonorPortalReceiptStatus;
  } = {},
) {
  const supabase = createSupabaseAdminClient();
  let query = supabase
    .from('donation_receipts')
    .select(RECEIPT_SELECT)
    .eq('donor_id', donorId)
    .order('donation_month', { ascending: false })
    .order('submitted_at', { ascending: false });

  if (options.matchId) {
    query = query.eq('sponsorship_match_id', options.matchId);
  }

  if (options.status && RECEIPT_STATUSES.includes(options.status)) {
    query = query.eq('status', options.status);
  }

  if (options.monthFrom) {
    query = query.gte('donation_month', options.monthFrom);
  }

  if (options.monthTo) {
    query = query.lte('donation_month', options.monthTo);
  }

  const { data, error } = await query.returns<DonationReceiptRow[]>();

  if (error) {
    throw new Error(error.message);
  }

  return data.map(mapReceiptRow);
}

export async function getPortalReceiptFileSignedUrl(donorId: string, receiptId: string) {
  const supabase = createSupabaseAdminClient();
  const { data: receipt, error: receiptError } = await supabase
    .from('donation_receipts')
    .select('receipt_file_url')
    .eq('id', receiptId)
    .eq('donor_id', donorId)
    .maybeSingle<{ receipt_file_url: string }>();

  if (receiptError) {
    throw new Error(receiptError.message);
  }

  if (!receipt) {
    return null;
  }

  const { data, error } = await supabase.storage
    .from('donation-receipts')
    .createSignedUrl(receipt.receipt_file_url, 60);

  if (error) {
    throw new Error(error.message);
  }

  return data.signedUrl;
}

async function listPortalMatches(donorId: string, options: { includeHistory?: boolean } = {}) {
  const supabase = createSupabaseAdminClient();
  let query = supabase
    .from('sponsorship_matches')
    .select(
      `
        id,
        donor_id,
        monthly_amount,
        currency,
        started_at,
        ended_at,
        status,
        orphan:orphan_profiles!sponsorship_matches_orphan_id_fkey(
          id,
          orphan_code,
          full_name,
          profile_image_url,
          age_estimate,
          city_area,
          education_status,
          background_summary
        )
      `,
    )
    .eq('donor_id', donorId)
    .order('started_at', { ascending: false });

  if (!options.includeHistory) {
    query = query.in('status', ['active', 'paused']);
  }

  const { data, error } = await query.returns<PortalMatchRow[]>();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function listPortalSponsorshipsForDonor(
  donorId: string,
  options: { includeHistory?: boolean } = {},
) {
  const [matches, receipts] = await Promise.all([
    listPortalMatches(donorId, options),
    listPortalReceipts(donorId),
  ]);
  const currentMonth = getCurrentDonationMonth();

  return matches
    .filter((match) => match.orphan)
    .map<DonorPortalSponsorship>((match) => {
      const matchReceipts = receipts.filter((receipt) => receipt.matchId === match.id);
      const currentMonthReceipt =
        matchReceipts.find(
          (receipt) => receipt.donationMonth === currentMonth && receipt.status !== 'rejected',
        ) ?? null;
      const lastReceipt = matchReceipts[0] ?? null;

      return {
        currency: APP_CURRENCY,
        currentMonth,
        currentMonthReceipt,
        currentMonthStatus: deriveMonthlyStatus(currentMonthReceipt, currentMonth),
        endedAt: match.ended_at,
        lastReceiptStatus: lastReceipt?.status ?? null,
        matchId: match.id,
        matchStatus: match.status,
        monthlyAmount: Number(match.monthly_amount),
        orphan: {
          ageEstimate: match.orphan?.age_estimate ?? null,
          backgroundSummary: match.orphan?.background_summary ?? null,
          cityArea: match.orphan?.city_area ?? null,
          educationStatus: match.orphan?.education_status ?? null,
          fullName: match.orphan?.full_name ?? 'Orphan profile',
          id: match.orphan?.id ?? '',
          orphanCode: match.orphan?.orphan_code ?? '',
          profileImageUrl: match.orphan?.profile_image_url ?? '',
        },
        startedAt: match.started_at,
        totalDeliveredContributed: matchReceipts
          .filter((receipt) => receipt.status === 'money_delivered')
          .reduce((total, receipt) => total + receipt.amount, 0),
        totalVerifiedContributed: matchReceipts
          .filter(
            (receipt) => receipt.status === 'verified' || receipt.status === 'money_delivered',
          )
          .reduce((total, receipt) => total + receipt.amount, 0),
      };
    });
}

export async function getPortalSponsorshipByMatchId(donorId: string, matchId: string) {
  const sponsorships = await listPortalSponsorshipsForDonor(donorId, { includeHistory: true });
  return sponsorships.find((sponsorship) => sponsorship.matchId === matchId) ?? null;
}

export async function getContributionSummaryForDonor(
  donorId: string,
): Promise<ContributionSummary> {
  const [sponsorships, receipts] = await Promise.all([
    listPortalSponsorshipsForDonor(donorId, { includeHistory: true }),
    listPortalReceipts(donorId),
  ]);
  const now = new Date();
  const year = now.getFullYear();
  const months = Array.from(
    { length: 12 },
    (_, index) => `${year}-${String(index + 1).padStart(2, '0')}-01`,
  );
  const activeExpected = sponsorships
    .filter((sponsorship) => sponsorship.matchStatus === 'active')
    .reduce((total, sponsorship) => total + sponsorship.monthlyAmount, 0);

  const monthlySeries: ContributionSeriesPoint[] = months.map((month) => {
    const monthReceipts = receipts.filter((receipt) => receipt.donationMonth === month);

    return {
      delivered: monthReceipts
        .filter((receipt) => receipt.status === 'money_delivered')
        .reduce((total, receipt) => total + receipt.amount, 0),
      expected: activeExpected,
      month,
      submitted: monthReceipts
        .filter((receipt) => receipt.status !== 'rejected')
        .reduce((total, receipt) => total + receipt.amount, 0),
      verified: monthReceipts
        .filter((receipt) => receipt.status === 'verified' || receipt.status === 'money_delivered')
        .reduce((total, receipt) => total + receipt.amount, 0),
    };
  });

  return {
    lifetimeDelivered: receipts
      .filter((receipt) => receipt.status === 'money_delivered')
      .reduce((total, receipt) => total + receipt.amount, 0),
    lifetimeSubmitted: receipts
      .filter((receipt) => receipt.status !== 'rejected')
      .reduce((total, receipt) => total + receipt.amount, 0),
    lifetimeVerified: receipts
      .filter((receipt) => receipt.status === 'verified' || receipt.status === 'money_delivered')
      .reduce((total, receipt) => total + receipt.amount, 0),
    monthlySeries,
    perSponsorshipTotals: sponsorships.map((sponsorship) => ({
      delivered: sponsorship.totalDeliveredContributed,
      matchId: sponsorship.matchId,
      orphanCode: sponsorship.orphan.orphanCode,
      orphanName: sponsorship.orphan.fullName,
      verified: sponsorship.totalVerifiedContributed,
    })),
    thisYearDelivered: monthlySeries.reduce((total, point) => total + point.delivered, 0),
    thisYearVerified: monthlySeries.reduce((total, point) => total + point.verified, 0),
  };
}

export async function getPortalDashboard(donorId: string): Promise<PortalDashboard> {
  const [sponsorships, contributionSummary, receipts] = await Promise.all([
    listPortalSponsorshipsForDonor(donorId),
    getContributionSummaryForDonor(donorId),
    listPortalReceipts(donorId),
  ]);

  return {
    contributionSummary,
    recentReceipts: receipts.slice(0, 5),
    sponsorships,
  };
}

export async function createPortalReceiptUpload(donorId: string, input: ReceiptUploadInput) {
  const errors: Record<string, string> = {};
  const donationMonth = monthStart(input.donationMonth);
  const currency = APP_CURRENCY;

  if (!input.sponsorshipMatchId) errors.sponsorshipMatchId = 'Choose a sponsorship.';
  if (!donationMonth) errors.donationMonth = 'Choose a valid donation month.';
  if (!Number.isFinite(input.amount) || input.amount <= 0) errors.amount = 'Enter a valid amount.';
  if (!RECEIPT_CURRENCIES.includes(currency as never)) errors.currency = 'Choose a valid currency.';
  if (!input.organizationBankAccountId) {
    errors.organizationBankAccountId = 'Choose the bank account used for transfer.';
  }
  if (!input.file || input.file.size <= 0) errors.file = 'Upload a receipt image.';
  if (input.file && input.file.size > MAX_RECEIPT_FILE_SIZE) {
    errors.file = 'Receipt file must be 8MB or smaller.';
  }
  if (input.file && !ALLOWED_RECEIPT_FILE_TYPES.has(input.file.type)) {
    errors.file = 'Upload a JPG, PNG, or WebP receipt image.';
  }

  if (Object.keys(errors).length > 0 || !donationMonth) {
    throw new PortalValidationError(errors);
  }

  const supabase = createSupabaseAdminClient();
  const { data: match, error: matchError } = await supabase
    .from('sponsorship_matches')
    .select('id, donor_id, monthly_amount, status')
    .eq('id', input.sponsorshipMatchId)
    .eq('donor_id', donorId)
    .maybeSingle<{
      donor_id: string;
      id: string;
      monthly_amount: number | string;
      status: SponsorshipMatchStatus;
    }>();

  if (matchError) throw new Error(matchError.message);
  if (!match) throw new PortalValidationError({ sponsorshipMatchId: 'Sponsorship not found.' });
  if (match.status !== 'active') {
    throw new PortalValidationError({
      sponsorshipMatchId: 'Receipts can only be uploaded for active sponsorships.',
    });
  }
  if (input.amount < Number(match.monthly_amount)) {
    throw new PortalValidationError({
      amount: 'Receipt amount must be at least the expected monthly sponsorship amount.',
    });
  }

  const { data: bankAccount, error: bankError } = await supabase
    .from('organization_bank_accounts')
    .select('id, active, currency')
    .eq('id', input.organizationBankAccountId)
    .eq('active', true)
    .maybeSingle<{ active: boolean; currency: string; id: string }>();

  if (bankError) throw new Error(bankError.message);
  if (!bankAccount) {
    throw new PortalValidationError({
      organizationBankAccountId: 'Choose an active organization bank account.',
    });
  }

  const { data: duplicate, error: duplicateError } = await supabase
    .from('donation_receipts')
    .select('id')
    .eq('sponsorship_match_id', input.sponsorshipMatchId)
    .eq('donation_month', donationMonth)
    .neq('status', 'rejected')
    .limit(1)
    .maybeSingle<{ id: string }>();

  if (duplicateError) throw new Error(duplicateError.message);
  if (duplicate) {
    throw new PortalConflictError('A receipt for this sponsorship and month is already submitted.');
  }

  const receiptId = randomUUID();
  const extension = input.file.name.split('.').pop()?.toLowerCase() ?? 'upload';
  const filePath = `donors/${donorId}/matches/${input.sponsorshipMatchId}/${donationMonth.slice(0, 7)}/${receiptId}.${extension}`;
  const bytes = Buffer.from(await input.file.arrayBuffer());
  const { error: uploadError } = await supabase.storage
    .from('donation-receipts')
    .upload(filePath, bytes, {
      contentType: input.file.type || 'application/octet-stream',
      upsert: false,
    });

  if (uploadError) {
    throw new Error(uploadError.message);
  }

  const { data, error } = await supabase
    .from('donation_receipts')
    .insert({
      amount: input.amount,
      currency,
      donation_month: donationMonth,
      donor_id: donorId,
      donor_note: normalizeOptionalText(input.donorNote),
      id: receiptId,
      organization_bank_account_id: input.organizationBankAccountId,
      receipt_file_name: input.file.name,
      receipt_file_size: input.file.size,
      receipt_file_type: input.file.type,
      receipt_file_url: filePath,
      sponsorship_match_id: input.sponsorshipMatchId,
      status: 'ready_for_review',
      submitted_late: isLateForMonth(donationMonth),
    })
    .select(RECEIPT_SELECT)
    .single<DonationReceiptRow>();

  if (error) {
    throw new Error(error.message);
  }

  return mapReceiptRow(data);
}

function mapAvailableOrphanRow(row: AvailableOrphanRow): AvailableOrphanSummary {
  return {
    ageEstimate: row.age_estimate,
    approvedAt: row.approved_at,
    backgroundSummary: row.background_summary,
    cityArea: row.city_area,
    educationStatus: row.education_status,
    fullName: row.full_name,
    id: row.id,
    orphanCode: row.orphan_code,
    profileImageUrl: row.profile_image_url,
    suggestedAmount: null,
  };
}

async function listCurrentMatchedOrphanIds(supabase: ReturnType<typeof createSupabaseAdminClient>) {
  const { data, error } = await supabase
    .from('sponsorship_matches')
    .select('orphan_id')
    .in('status', ['active', 'paused'])
    .returns<Array<{ orphan_id: string }>>();

  if (error) {
    throw new Error(error.message);
  }

  return data.map((row) => row.orphan_id);
}

export async function listAvailableOrphansForPortal(
  options: AvailableOrphanListOptions = {},
  paginationOptions: PaginationOptions = {},
) {
  const supabase = createSupabaseAdminClient();
  const pagination = normalizePaginationOptions(paginationOptions);
  const matchedIds = await listCurrentMatchedOrphanIds(supabase);
  let query = supabase
    .from('orphan_profiles')
    .select(
      'id, orphan_code, full_name, profile_image_url, age_estimate, city_area, education_status, background_summary, approved_at',
      pagination.knownTotal === undefined ? { count: 'exact' } : undefined,
    )
    .eq('profile_status', 'approved')
    .eq('verification_status', 'field_verified')
    .order('approved_at', { ascending: false });

  if (matchedIds.length > 0) {
    query = query.not('id', 'in', `(${matchedIds.join(',')})`);
  }

  if (options.search?.trim()) {
    const search = options.search.trim().replaceAll(',', ' ');
    query = query.or(
      `orphan_code.ilike.%${search}%,full_name.ilike.%${search}%,city_area.ilike.%${search}%,education_status.ilike.%${search}%`,
    );
  }

  if (options.age === 'under-8') {
    query = query.lt('age_estimate', 8);
  } else if (options.age === '8-10') {
    query = query.gte('age_estimate', 8).lte('age_estimate', 10);
  } else if (options.age === '11-plus') {
    query = query.gte('age_estimate', 11);
  }

  if (options.location?.trim()) {
    query = query.eq('city_area', options.location.trim());
  }

  if (options.education?.trim()) {
    query = query.eq('education_status', options.education.trim());
  }

  const { count, data, error } = await query
    .range(pagination.offset, pagination.offset + pagination.limit - 1)
    .returns<AvailableOrphanRow[]>();

  if (error) {
    throw new Error(error.message);
  }

  return createPaginatedResult(
    data.map(mapAvailableOrphanRow),
    pagination.knownTotal ?? count ?? 0,
    pagination,
  );
}

export async function listAvailableOrphanFilterOptionsForPortal(): Promise<AvailableOrphanFilterOptions> {
  const supabase = createSupabaseAdminClient();
  const matchedIds = await listCurrentMatchedOrphanIds(supabase);
  let query = supabase
    .from('orphan_profiles')
    .select('city_area, education_status')
    .eq('profile_status', 'approved')
    .eq('verification_status', 'field_verified');

  if (matchedIds.length > 0) {
    query = query.not('id', 'in', `(${matchedIds.join(',')})`);
  }

  const { data, error } = await query.returns<AvailableOrphanFilterRow[]>();

  if (error) {
    throw new Error(error.message);
  }

  return {
    education: Array.from(
      new Set(
        data.map((row) => row.education_status).filter((value): value is string => Boolean(value)),
      ),
    ).sort((first, second) => first.localeCompare(second)),
    locations: Array.from(
      new Set(data.map((row) => row.city_area).filter((value): value is string => Boolean(value))),
    ).sort((first, second) => first.localeCompare(second)),
  };
}

async function getAvailableOrphanForPortalById(id: string) {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from('orphan_profiles')
    .select(
      'id, orphan_code, full_name, profile_image_url, age_estimate, city_area, education_status, background_summary, approved_at',
    )
    .eq('id', id)
    .eq('profile_status', 'approved')
    .eq('verification_status', 'field_verified')
    .maybeSingle<AvailableOrphanRow>();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    return null;
  }

  const { data: currentMatch, error: matchError } = await supabase
    .from('sponsorship_matches')
    .select('id')
    .eq('orphan_id', id)
    .in('status', ['active', 'paused'])
    .limit(1)
    .maybeSingle<{ id: string }>();

  if (matchError) {
    throw new Error(matchError.message);
  }

  return currentMatch ? null : mapAvailableOrphanRow(data);
}

export async function createAvailableOrphanInterest(donor: Donor, orphanId: string) {
  const orphan = await getAvailableOrphanForPortalById(orphanId);

  if (!orphan) {
    throw new PortalValidationError({ orphanId: 'This orphan is not available for interest.' });
  }

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from('sponsorship_requests')
    .insert({
      city_country: donor.cityCountry,
      confirmed_minimum_amount: true,
      email: donor.email,
      full_name: donor.fullName,
      message: `Existing donor expressed interest in ${orphan.orphanCode} (${orphan.fullName}).`,
      phone: donor.phone ?? '',
      preferred_contact_method: donor.preferredContactMethod,
      request_source: 'referral',
      status: 'new',
    })
    .select('id')
    .single<{ id: string }>();

  if (error) {
    throw new Error(error.message);
  }

  return { id: data.id };
}

export async function updateDonorPortalProfile(
  donor: Donor,
  input: {
    cityCountry?: string;
    fullName?: string;
    phone?: string;
    preferredContactMethod?: Donor['preferredContactMethod'];
  },
) {
  const errors = validateDonorInput(
    {
      active: donor.active,
      donorSource: donor.donorSource,
      email: donor.email ?? '',
      fullName: input.fullName ?? donor.fullName,
      phone: input.phone ?? donor.phone ?? '',
      preferredContactMethod: input.preferredContactMethod ?? donor.preferredContactMethod,
    },
    { allowPartial: false },
  );

  if (Object.keys(errors).length > 0) {
    throw new PortalValidationError(errors as Record<string, string>);
  }

  return updateDonor(donor.id, {
    cityCountry: input.cityCountry,
    fullName: input.fullName,
    phone: input.phone,
    preferredContactMethod: input.preferredContactMethod,
  });
}

export function parseReceiptStatus(value: string | null) {
  return value && RECEIPT_STATUSES.includes(value as DonorPortalReceiptStatus)
    ? (value as DonorPortalReceiptStatus)
    : undefined;
}

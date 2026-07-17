import { randomUUID } from 'node:crypto';

import { ForbiddenError } from '@/lib/adminAuth';
import {
  canBulkMarkReceiptsDelivered,
  canCreateFinanceReceipts,
  canMarkReceiptReviewed,
  canMarkReceiptsDelivered,
  canRejectReceipts,
  canVerifyReceipts,
  canViewFinanceReceiptFiles,
  canViewFinanceReceipts,
  canViewFinanceSummary,
} from '@/lib/adminPermissions';
import { APP_CURRENCIES, APP_CURRENCY } from '@/lib/currency';
import {
  normalizePaginationOptions,
  type PaginationOptions,
  paginateArray,
} from '@/lib/pagination';
import { createSupabaseAdminClient, isMissingDatabaseFunctionError } from '@/lib/supabase/server';

import type { TeamMember } from '@/types/accounts';
import type {
  AdminBulkDeliveryInput,
  AdminBulkDeliveryResult,
  AdminFinanceSummary,
  AdminManualReceiptInput,
  AdminManualReceiptMatch,
  AdminManualReceiptOptions,
  AdminOverdueSponsorship,
  AdminReceipt,
  AdminReceiptDecisionInput,
  AdminReceiptQueueFilters,
  AdminReceiptQueueStatus,
  AdminReceiptRow,
  DonorPaymentHistoryEntry,
  DonorPaymentHistoryStatus,
  DonorPaymentOverview,
} from '@/types/finance';
import type { SponsorshipMatch, SponsorshipMatchStatus } from '@/types/matches';
import type { DonorPortalReceiptStatus, OrganizationBankAccountRow } from '@/types/portal';

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
const MANUAL_RECEIPT_FILE_TYPE = 'application/x-admin-manual-entry';
const FINANCE_TIME_ZONE = 'Asia/Karachi';

const RECEIPT_SELECT = `
  *,
  bank_account:organization_bank_accounts!donation_receipts_organization_bank_account_id_fkey(*),
  donor:donors!donation_receipts_donor_id_fkey(
    id,
    full_name,
    email,
    phone,
    preferred_contact_method
  ),
  match:sponsorship_matches!donation_receipts_sponsorship_match_id_fkey(
    id,
    monthly_amount,
    currency,
    status,
    orphan:orphan_profiles!sponsorship_matches_orphan_id_fkey(
      id,
      orphan_code,
      full_name
    )
  )
`;

const MANUAL_RECEIPT_MATCH_SELECT = `
  id,
  donor_id,
  monthly_amount,
  currency,
  status,
  started_at,
  ended_at,
  donor:donors!sponsorship_matches_donor_id_fkey(
    id,
    full_name,
    email,
    phone
  ),
  orphan:orphan_profiles!sponsorship_matches_orphan_id_fkey(
    id,
    orphan_code,
    full_name
  )
`;

type AdminManualReceiptMatchRow = {
  currency: string;
  donor_id: string;
  ended_at: string | null;
  id: string;
  monthly_amount: number | string;
  started_at: string;
  status: SponsorshipMatchStatus;
  donor?: {
    email: string;
    full_name: string;
    id: string;
    phone: string | null;
  } | null;
  orphan?: {
    full_name: string;
    id: string;
    orphan_code: string;
  } | null;
};

type DonorPaymentReceiptRow = {
  amount: number | string;
  donation_month: string;
  id: string;
  money_delivered_at: string | null;
  sponsorship_match_id: string;
  status: DonorPortalReceiptStatus;
  submitted_at: string;
  transfer_date: string | null;
  verified_at: string | null;
};

export class FinanceValidationError extends Error {
  errors: Record<string, string>;

  constructor(errors: Record<string, string>, message = 'Validation failed.') {
    super(message);
    this.name = 'FinanceValidationError';
    this.errors = errors;
  }
}

export class FinanceConflictError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'FinanceConflictError';
  }
}

function normalizeText(value: unknown) {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function normalizeReceiptCurrency() {
  return APP_CURRENCY;
}

function monthStart(value: string | null | undefined) {
  if (!value) return null;
  const match = /^(\d{4})-(\d{2})(?:-\d{2})?$/.exec(value);

  if (!match) {
    return null;
  }

  const monthNumber = Number(match[2]);
  if (monthNumber < 1 || monthNumber > 12) {
    return null;
  }

  return `${match[1]}-${match[2]}-01`;
}

function financeDateParts(now = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    day: '2-digit',
    month: '2-digit',
    timeZone: FINANCE_TIME_ZONE,
    year: 'numeric',
  }).formatToParts(now);
  const value = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? '';

  return {
    day: value('day'),
    month: value('month'),
    year: value('year'),
  };
}

function currentMonthStart(now = new Date()) {
  const { month, year } = financeDateParts(now);
  return `${year}-${month}-01`;
}

function isLateForMonth(month: string, now = new Date()) {
  const selectedMonth = monthStart(month);
  if (!selectedMonth) return false;

  const { day, month: currentMonth, year } = financeDateParts(now);
  const selectedMonthKey = selectedMonth.slice(0, 7);
  const currentMonthKey = `${year}-${currentMonth}`;

  if (selectedMonthKey < currentMonthKey) return true;
  if (selectedMonthKey > currentMonthKey) return false;
  return Number(day) > 10;
}

function nextMonthStart(month: string) {
  const [year, monthNumber] = month.split('-').map(Number);
  const date = new Date(Date.UTC(year, monthNumber, 1));
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}-01`;
}

function previousMonthStart(month: string) {
  const [year, monthNumber] = month.split('-').map(Number);
  const date = new Date(Date.UTC(year, monthNumber - 2, 1));
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}-01`;
}

function matchCoversDonationMonth(match: SponsorshipMatch, month: string) {
  const startedMonth = monthStart(match.startedAt);
  const endedMonth = monthStart(match.endedAt);

  if (month === currentMonthStart() && match.status === 'paused') {
    return false;
  }

  return (
    match.status !== 'voided' &&
    Boolean(startedMonth) &&
    startedMonth! <= month &&
    (!endedMonth || endedMonth >= month)
  );
}

function paymentHistoryStatus({
  expectedAmount,
  hasRejectedReceipt,
  month,
  paidAmount,
  submittedAmount,
}: {
  expectedAmount: number;
  hasRejectedReceipt: boolean;
  month: string;
  paidAmount: number;
  submittedAmount: number;
}): DonorPaymentHistoryStatus {
  if (expectedAmount > 0 && paidAmount >= expectedAmount) return 'paid';
  if (paidAmount > 0) return 'partial';
  if (submittedAmount > 0) return 'in_review';
  if (hasRejectedReceipt) return 'rejected';

  const currentMonth = currentMonthStart();
  if (month < currentMonth || (month === currentMonth && isLateForMonth(month))) {
    return 'overdue';
  }

  return 'pending';
}

export async function getDonorPaymentOverview(
  donorId: string,
  matches: SponsorshipMatch[],
): Promise<DonorPaymentOverview> {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from('donation_receipts')
    .select(
      'id, sponsorship_match_id, donation_month, amount, status, transfer_date, submitted_at, verified_at, money_delivered_at',
    )
    .eq('donor_id', donorId)
    .order('donation_month', { ascending: false })
    .order('submitted_at', { ascending: false })
    .returns<DonorPaymentReceiptRow[]>();

  if (error) throw new Error(error.message);

  const currentMonth = currentMonthStart();
  const firstMatchMonth = matches
    .filter((match) => match.status !== 'voided')
    .map((match) => monthStart(match.startedAt))
    .filter((month): month is string => Boolean(month))
    .sort()[0];
  const firstReceiptMonth = data
    .map((receipt) => monthStart(receipt.donation_month))
    .filter((month): month is string => Boolean(month))
    .sort()[0];
  const firstMonth = [firstMatchMonth, firstReceiptMonth]
    .filter((month): month is string => Boolean(month))
    .sort()[0];

  if (!firstMonth) {
    return { currentMonth, history: [], paymentStreak: 0 };
  }

  const history: DonorPaymentHistoryEntry[] = [];
  let month = currentMonth;

  while (month >= firstMonth) {
    const monthMatches = matches.filter((match) => matchCoversDonationMonth(match, month));
    const monthReceipts = data.filter((receipt) => monthStart(receipt.donation_month) === month);
    const reviewableReceipts = monthReceipts.filter((receipt) => receipt.status !== 'rejected');
    const paidReceipts = reviewableReceipts.filter(
      (receipt) => receipt.status === 'verified' || receipt.status === 'money_delivered',
    );
    const expectedAmount = monthMatches.reduce((total, match) => total + match.monthlyAmount, 0);
    const paidAmount = paidReceipts.reduce((total, receipt) => total + Number(receipt.amount), 0);
    const submittedAmount = reviewableReceipts.reduce(
      (total, receipt) => total + Number(receipt.amount),
      0,
    );
    const paymentDate =
      paidReceipts
        .map(
          (receipt) =>
            receipt.transfer_date ??
            receipt.money_delivered_at ??
            receipt.verified_at ??
            receipt.submitted_at,
        )
        .filter(Boolean)
        .sort()
        .at(-1) ?? null;

    if (expectedAmount > 0 || monthReceipts.length > 0) {
      history.push({
        expectedAmount,
        month,
        paidAmount,
        paymentDate,
        receiptIds: monthReceipts.map((receipt) => receipt.id),
        status: paymentHistoryStatus({
          expectedAmount,
          hasRejectedReceipt: monthReceipts.some((receipt) => receipt.status === 'rejected'),
          month,
          paidAmount,
          submittedAmount,
        }),
        submittedAmount,
      });
    }

    month = previousMonthStart(month);
  }

  let paymentStreak = 0;
  for (const entry of history) {
    if (entry.status !== 'paid') break;
    paymentStreak += 1;
  }

  return { currentMonth, history, paymentStreak };
}

function matchExpectedForMonth(
  match: { ended_at: string | null; started_at: string; status: SponsorshipMatchStatus },
  month: string,
) {
  return (
    match.status !== 'voided' &&
    match.started_at < nextMonthStart(month) &&
    (!match.ended_at || match.ended_at >= month)
  );
}

function isValidDateInput(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;

  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().startsWith(value);
}

function isExternalReceiptUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

function receiptFileExtension(fileName: string) {
  const extension = fileName.split('.').pop()?.toLowerCase() ?? 'upload';
  return /^[a-z0-9]+$/.test(extension) ? extension : 'upload';
}

function mapBankAccountRow(row: OrganizationBankAccountRow) {
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

function mapManualReceiptMatch(row: AdminManualReceiptMatchRow): AdminManualReceiptMatch | null {
  if (!row.donor || !row.orphan) {
    return null;
  }

  return {
    currency: APP_CURRENCY,
    donor: {
      email: row.donor.email,
      fullName: row.donor.full_name,
      id: row.donor.id,
      phone: row.donor.phone,
    },
    endedAt: row.ended_at,
    expectedAmount: Number(row.monthly_amount),
    matchId: row.id,
    orphan: {
      fullName: row.orphan.full_name,
      id: row.orphan.id,
      orphanCode: row.orphan.orphan_code,
    },
    startedAt: row.started_at,
    status: row.status,
  };
}

function mapReceipt(row: AdminReceiptRow): AdminReceipt {
  const amount = Number(row.amount);
  const expectedAmount = Number(row.match?.monthly_amount ?? 0);

  return {
    amount,
    amountVariance: amount - expectedAmount,
    bankAccount: row.bank_account
      ? {
          accountLabel: row.bank_account.account_label,
          accountTitle: row.bank_account.account_title,
          bankName: row.bank_account.bank_name,
          id: row.bank_account.id,
        }
      : null,
    createdAt: row.created_at,
    currency: APP_CURRENCY,
    deliveryReference: row.delivery_reference,
    donationMonth: row.donation_month,
    donor: row.donor
      ? {
          email: row.donor.email,
          fullName: row.donor.full_name,
          id: row.donor.id,
          phone: row.donor.phone,
          preferredContactMethod: row.donor.preferred_contact_method,
        }
      : null,
    donorId: row.donor_id,
    donorNote: row.donor_note,
    expectedAmount,
    financeNotes: row.finance_notes,
    id: row.id,
    matchId: row.sponsorship_match_id,
    matchStatus: row.match?.status ?? null,
    moneyDeliveredAt: row.money_delivered_at,
    orphan: row.match?.orphan
      ? {
          fullName: row.match.orphan.full_name,
          id: row.match.orphan.id,
          orphanCode: row.match.orphan.orphan_code,
        }
      : null,
    receiptFileName: row.receipt_file_name,
    receiptFileSize: row.receipt_file_size,
    receiptFileType: row.receipt_file_type,
    rejectionReason: row.rejection_reason,
    reviewedAt: row.reviewed_at,
    status: row.status,
    statusChangedAt: row.status_changed_at,
    submittedAt: row.submitted_at,
    submittedLate: row.submitted_late,
    transferDate: row.transfer_date,
    transferReference: row.transfer_reference,
    updatedAt: row.updated_at,
    verifiedAt: row.verified_at,
  };
}

function parseStatus(value?: string | null): AdminReceiptQueueStatus | undefined {
  if (!value || value === 'all') return undefined;
  if (value === 'needs_review') return value;
  return RECEIPT_STATUSES.includes(value as DonorPortalReceiptStatus)
    ? (value as DonorPortalReceiptStatus)
    : undefined;
}

export function parseReceiptFilters(url: URL): AdminReceiptQueueFilters {
  const submittedLate = url.searchParams.get('submittedLate');
  const underpaidOnly = url.searchParams.get('underpaidOnly');

  return {
    bankAccountId: url.searchParams.get('bankAccountId') || undefined,
    donorId: url.searchParams.get('donorId') || undefined,
    matchId: url.searchParams.get('matchId') || undefined,
    monthFrom: url.searchParams.get('monthFrom') || undefined,
    monthTo: url.searchParams.get('monthTo') || undefined,
    orphanId: url.searchParams.get('orphanId') || undefined,
    search: url.searchParams.get('q') || undefined,
    status: parseStatus(url.searchParams.get('status')),
    submittedLate: submittedLate ? submittedLate === 'true' : undefined,
    underpaidOnly: underpaidOnly ? underpaidOnly === 'true' : undefined,
  };
}

async function queryReceiptRows(filters: AdminReceiptQueueFilters = {}) {
  const supabase = createSupabaseAdminClient();
  let query = supabase
    .from('donation_receipts')
    .select(RECEIPT_SELECT)
    .order('submitted_at', { ascending: true });

  if (filters.status === 'needs_review') {
    query = query.in('status', ['submitted', 'ready_for_review']);
  } else if (filters.status && filters.status !== 'all') {
    query = query.eq('status', filters.status);
  }

  if (filters.bankAccountId)
    query = query.eq('organization_bank_account_id', filters.bankAccountId);
  if (filters.donorId) query = query.eq('donor_id', filters.donorId);
  if (filters.matchId) query = query.eq('sponsorship_match_id', filters.matchId);
  if (filters.monthFrom) query = query.gte('donation_month', filters.monthFrom);
  if (filters.monthTo) query = query.lte('donation_month', filters.monthTo);
  if (filters.submittedLate !== undefined)
    query = query.eq('submitted_late', filters.submittedLate);

  const { data, error } = await query.returns<AdminReceiptRow[]>();

  if (error) throw new Error(error.message);

  let receipts = data.map(mapReceipt);

  if (filters.orphanId) {
    receipts = receipts.filter((receipt) => receipt.orphan?.id === filters.orphanId);
  }

  if (filters.underpaidOnly) {
    receipts = receipts.filter((receipt) => receipt.amountVariance < 0);
  }

  if (filters.search?.trim()) {
    const search = filters.search.trim().toLowerCase();
    receipts = receipts.filter((receipt) =>
      [
        receipt.donor?.fullName,
        receipt.donor?.email,
        receipt.donor?.phone,
        receipt.orphan?.orphanCode,
        receipt.orphan?.fullName,
        receipt.transferReference,
        receipt.status,
      ]
        .join(' ')
        .toLowerCase()
        .includes(search),
    );
  }

  return receipts;
}

export async function listAdminReceipts(
  actor: TeamMember,
  filters: AdminReceiptQueueFilters = {},
  paginationOptions: PaginationOptions = {},
) {
  if (!canViewFinanceReceipts(actor)) {
    throw new ForbiddenError('You do not have permission to view receipts.');
  }

  return paginateArray(
    await queryReceiptRows(filters),
    normalizePaginationOptions(paginationOptions),
  );
}

export async function listAdminReceiptsForMatches(actor: TeamMember, matchIds: string[]) {
  if (!canViewFinanceReceipts(actor)) {
    throw new ForbiddenError('You do not have permission to view receipts.');
  }

  if (matchIds.length === 0) {
    return [];
  }

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from('donation_receipts')
    .select(RECEIPT_SELECT)
    .in('sponsorship_match_id', matchIds)
    .order('donation_month', { ascending: false })
    .order('submitted_at', { ascending: false })
    .returns<AdminReceiptRow[]>();

  if (error) throw new Error(error.message);
  return data.map(mapReceipt);
}

export async function getAdminReceiptDetail(actor: TeamMember, receiptId: string) {
  if (!canViewFinanceReceipts(actor)) {
    throw new ForbiddenError('You do not have permission to view receipts.');
  }

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from('donation_receipts')
    .select(RECEIPT_SELECT)
    .eq('id', receiptId)
    .maybeSingle<AdminReceiptRow>();

  if (error) throw new Error(error.message);
  return data ? mapReceipt(data) : null;
}

export async function listAdminManualReceiptOptions(
  actor: TeamMember,
): Promise<AdminManualReceiptOptions> {
  if (!canCreateFinanceReceipts(actor)) {
    throw new ForbiddenError('You do not have permission to create receipts.');
  }

  const supabase = createSupabaseAdminClient();
  const [bankAccountsResult, matchesResult] = await Promise.all([
    supabase
      .from('organization_bank_accounts')
      .select('*')
      .eq('active', true)
      .order('sort_order', { ascending: true })
      .order('account_label', { ascending: true })
      .returns<OrganizationBankAccountRow[]>(),
    supabase
      .from('sponsorship_matches')
      .select(MANUAL_RECEIPT_MATCH_SELECT)
      .neq('status', 'voided')
      .order('started_at', { ascending: false })
      .returns<AdminManualReceiptMatchRow[]>(),
  ]);

  if (bankAccountsResult.error) throw new Error(bankAccountsResult.error.message);
  if (matchesResult.error) throw new Error(matchesResult.error.message);

  return {
    bankAccounts: bankAccountsResult.data.map(mapBankAccountRow),
    currentMonth: currentMonthStart(),
    matches: matchesResult.data
      .map(mapManualReceiptMatch)
      .filter((match): match is AdminManualReceiptMatch => Boolean(match)),
  };
}

export async function createAdminManualReceipt(actor: TeamMember, input: AdminManualReceiptInput) {
  if (!canCreateFinanceReceipts(actor)) {
    throw new ForbiddenError('You do not have permission to create receipts.');
  }

  const errors: Record<string, string> = {};
  const donationMonth = monthStart(input.donationMonth);
  const currency = normalizeReceiptCurrency();
  const bankAccountId = normalizeText(input.organizationBankAccountId);
  const financeNotes = normalizeText(input.financeNotes);
  const transferDate = normalizeText(input.transferDate);
  const transferReference = normalizeText(input.transferReference);

  if (!input.sponsorshipMatchId) {
    errors.sponsorshipMatchId = 'Choose a matched donor and orphan.';
  }
  if (!donationMonth) {
    errors.donationMonth = 'Choose a valid donation month.';
  }
  if (!Number.isFinite(input.amount) || input.amount <= 0) {
    errors.amount = 'Enter a valid amount.';
  }
  if (!RECEIPT_CURRENCIES.includes(currency as never)) {
    errors.currency = 'Choose a valid currency.';
  }
  if (!input.file || input.file.size <= 0) {
    errors.file = 'Upload a receipt image.';
  }
  if (input.file && input.file.size > MAX_RECEIPT_FILE_SIZE) {
    errors.file = 'Receipt file must be 8MB or smaller.';
  }
  if (input.file && !ALLOWED_RECEIPT_FILE_TYPES.has(input.file.type)) {
    errors.file = 'Upload a JPG, PNG, or WebP receipt image.';
  }
  if (transferDate && !isValidDateInput(transferDate)) {
    errors.transferDate = 'Choose a valid transfer date.';
  }
  if (financeNotes && financeNotes.length > 1200) {
    errors.financeNotes = 'Notes must be 1,200 characters or less.';
  }
  if (transferReference && transferReference.length > 160) {
    errors.transferReference = 'Transfer reference must be 160 characters or less.';
  }

  if (Object.keys(errors).length > 0 || !donationMonth) {
    throw new FinanceValidationError(errors);
  }

  const supabase = createSupabaseAdminClient();
  const { data: match, error: matchError } = await supabase
    .from('sponsorship_matches')
    .select(MANUAL_RECEIPT_MATCH_SELECT)
    .eq('id', input.sponsorshipMatchId)
    .maybeSingle<AdminManualReceiptMatchRow>();

  if (matchError) throw new Error(matchError.message);
  if (!match || !match.donor || !match.orphan || match.status === 'voided') {
    throw new FinanceValidationError({
      sponsorshipMatchId: 'Choose a valid matched donor and orphan.',
    });
  }

  const matchStartedMonth = monthStart(match.started_at);
  const matchEndedMonth = monthStart(match.ended_at);

  if (matchStartedMonth && donationMonth < matchStartedMonth) {
    throw new FinanceValidationError({
      donationMonth: 'Donation month must be on or after the match start month.',
    });
  }

  if (matchEndedMonth && donationMonth > matchEndedMonth) {
    throw new FinanceValidationError({
      donationMonth: 'Donation month must be within the matched sponsorship period.',
    });
  }

  if (bankAccountId) {
    const { data: bankAccount, error: bankError } = await supabase
      .from('organization_bank_accounts')
      .select('id')
      .eq('id', bankAccountId)
      .eq('active', true)
      .maybeSingle<{ id: string }>();

    if (bankError) throw new Error(bankError.message);
    if (!bankAccount) {
      throw new FinanceValidationError({
        organizationBankAccountId: 'Choose an active organization bank account.',
      });
    }
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
    throw new FinanceConflictError('A receipt for this sponsorship and month already exists.');
  }

  const receiptId = randomUUID();
  const filePath = `admins/${actor.id}/donors/${match.donor_id}/matches/${match.id}/${donationMonth.slice(
    0,
    7,
  )}/${receiptId}.${receiptFileExtension(input.file.name)}`;
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

  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from('donation_receipts')
    .insert({
      amount: input.amount,
      currency,
      donation_month: donationMonth,
      donor_id: match.donor_id,
      finance_notes: financeNotes,
      id: receiptId,
      organization_bank_account_id: bankAccountId,
      receipt_file_name: input.file.name,
      receipt_file_size: input.file.size,
      receipt_file_type: input.file.type,
      receipt_file_url: filePath,
      sponsorship_match_id: match.id,
      status: 'ready_for_review',
      status_changed_at: now,
      submitted_at: now,
      submitted_late: isLateForMonth(donationMonth),
      transfer_date: transferDate,
      transfer_reference: transferReference,
    })
    .select(RECEIPT_SELECT)
    .single<AdminReceiptRow>();

  if (error) {
    await supabase.storage.from('donation-receipts').remove([filePath]);

    const message = error.message.toLowerCase();

    if (message.includes('duplicate') || message.includes('donation_receipts_one_reviewable')) {
      throw new FinanceConflictError('A receipt for this sponsorship and month already exists.');
    }

    throw new Error(error.message);
  }

  return mapReceipt(data);
}

async function getReceiptRow(receiptId: string) {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from('donation_receipts')
    .select(RECEIPT_SELECT)
    .eq('id', receiptId)
    .maybeSingle<AdminReceiptRow>();

  if (error) throw new Error(error.message);
  return data;
}

async function updateReceiptStatus(
  actor: TeamMember,
  receiptId: string,
  nextStatus: DonorPortalReceiptStatus,
  input: AdminReceiptDecisionInput,
) {
  const row = await getReceiptRow(receiptId);

  if (!row) {
    return null;
  }

  const receipt = mapReceipt(row);
  const financeNotes = normalizeText(input.financeNotes);
  const now = new Date().toISOString();

  if (nextStatus === 'reviewed') {
    if (!canMarkReceiptReviewed(actor)) throw new ForbiddenError();
    if (!['submitted', 'ready_for_review'].includes(receipt.status)) {
      throw new FinanceConflictError('Only submitted receipts can be marked reviewed.');
    }
  }

  if (nextStatus === 'verified') {
    if (!canVerifyReceipts(actor)) throw new ForbiddenError();
    if (!['ready_for_review', 'reviewed'].includes(receipt.status)) {
      throw new FinanceConflictError('Only reviewed or ready receipts can be verified.');
    }
    if (receipt.amount < receipt.expectedAmount) {
      throw new FinanceValidationError({
        amount: 'Receipt amount is less than the expected monthly sponsorship amount.',
      });
    }
  }

  if (nextStatus === 'rejected') {
    if (!canRejectReceipts(actor)) throw new ForbiddenError();
    if (!['ready_for_review', 'reviewed'].includes(receipt.status)) {
      throw new FinanceConflictError('Only reviewed or ready receipts can be rejected.');
    }
    if (!normalizeText(input.rejectionReason)) {
      throw new FinanceValidationError({
        rejectionReason: 'Add a donor-visible rejection reason.',
      });
    }
  }

  if (nextStatus === 'money_delivered') {
    if (!canMarkReceiptsDelivered(actor)) throw new ForbiddenError();
    if (receipt.status !== 'verified') {
      throw new FinanceConflictError('Only verified receipts can be marked delivered.');
    }
  }

  const patch: Record<string, string | null> = {
    finance_notes: financeNotes ?? receipt.financeNotes,
    status: nextStatus,
    status_changed_at: now,
  };

  if (nextStatus === 'reviewed') {
    patch.reviewed_at = now;
    patch.reviewed_by_team_member_id = actor.id;
  }

  if (nextStatus === 'verified') {
    patch.verified_at = now;
    patch.verified_by_team_member_id = actor.id;
  }

  if (nextStatus === 'rejected') {
    patch.rejection_reason = normalizeText(input.rejectionReason);
  }

  if (nextStatus === 'money_delivered') {
    patch.money_delivered_at = now;
    patch.money_delivered_by_team_member_id = actor.id;
    patch.delivery_reference = normalizeText(input.deliveryReference);
  }

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from('donation_receipts')
    .update(patch)
    .eq('id', receiptId)
    .select(RECEIPT_SELECT)
    .single<AdminReceiptRow>();

  if (error) throw new Error(error.message);
  return mapReceipt(data);
}

export function markReceiptReviewed(
  actor: TeamMember,
  receiptId: string,
  input: AdminReceiptDecisionInput,
) {
  return updateReceiptStatus(actor, receiptId, 'reviewed', input);
}

export function verifyReceipt(
  actor: TeamMember,
  receiptId: string,
  input: AdminReceiptDecisionInput,
) {
  return updateReceiptStatus(actor, receiptId, 'verified', input);
}

export function rejectReceipt(
  actor: TeamMember,
  receiptId: string,
  input: AdminReceiptDecisionInput,
) {
  return updateReceiptStatus(actor, receiptId, 'rejected', input);
}

export function markReceiptMoneyDelivered(
  actor: TeamMember,
  receiptId: string,
  input: AdminReceiptDecisionInput,
) {
  return updateReceiptStatus(actor, receiptId, 'money_delivered', input);
}

export async function bulkMarkReceiptsMoneyDelivered(
  actor: TeamMember,
  input: AdminBulkDeliveryInput,
): Promise<AdminBulkDeliveryResult> {
  if (!canBulkMarkReceiptsDelivered(actor)) {
    throw new ForbiddenError('You do not have permission to bulk mark receipts delivered.');
  }

  const exclude = new Set(input.excludeReceiptIds ?? []);
  let selectedIds: string[] = [];

  if (input.selectionMode === 'filtered') {
    const receipts = await queryReceiptRows({ ...(input.filters ?? {}), status: 'verified' });
    selectedIds = receipts.map((receipt) => receipt.id).filter((id) => !exclude.has(id));
  } else {
    selectedIds = [...new Set(input.receiptIds ?? [])].filter((id) => !exclude.has(id));
  }

  if (selectedIds.length === 0) {
    throw new FinanceValidationError({ receipts: 'Choose at least one verified receipt.' });
  }

  const supabase = createSupabaseAdminClient();
  const { data: existing, error: existingError } = await supabase
    .from('donation_receipts')
    .select('id, status')
    .in('id', selectedIds)
    .returns<Array<{ id: string; status: DonorPortalReceiptStatus }>>();

  if (existingError) throw new Error(existingError.message);

  const verifiedIds = existing.filter((row) => row.status === 'verified').map((row) => row.id);
  const now = new Date().toISOString();

  if (verifiedIds.length > 0) {
    const { error } = await supabase
      .from('donation_receipts')
      .update({
        delivery_reference: normalizeText(input.deliveryReference),
        money_delivered_at: now,
        money_delivered_by_team_member_id: actor.id,
        status: 'money_delivered',
        status_changed_at: now,
      })
      .in('id', verifiedIds)
      .eq('status', 'verified');

    if (error) throw new Error(error.message);
  }

  return {
    selected: selectedIds.length,
    skippedForbiddenOrMissing: selectedIds.length - existing.length,
    skippedNotVerified: existing.length - verifiedIds.length,
    updated: verifiedIds.length,
  };
}

export async function getReceiptFileSignedUrl(actor: TeamMember, receiptId: string) {
  if (!canViewFinanceReceiptFiles(actor)) {
    throw new ForbiddenError('You do not have permission to view receipt files.');
  }

  const row = await getReceiptRow(receiptId);

  if (!row) {
    return null;
  }

  if (row.receipt_file_type === MANUAL_RECEIPT_FILE_TYPE) {
    return null;
  }

  if (isExternalReceiptUrl(row.receipt_file_url)) {
    return row.receipt_file_url;
  }

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase.storage
    .from('donation-receipts')
    .createSignedUrl(row.receipt_file_url, 60);

  if (error) throw new Error(error.message);

  return data.signedUrl;
}

export async function getAdminFinanceSummary(
  actor: TeamMember,
  requestedMonth?: string | null,
): Promise<AdminFinanceSummary> {
  if (!canViewFinanceSummary(actor)) {
    throw new ForbiddenError('You do not have permission to view finance summaries.');
  }

  const month = monthStart(requestedMonth) ?? currentMonthStart();
  const supabase = createSupabaseAdminClient();
  const { data: summary, error: summaryError } = await supabase.rpc('admin_finance_summary', {
    p_month: month,
  });

  if (!summaryError) {
    return summary as AdminFinanceSummary;
  }

  if (!isMissingDatabaseFunctionError(summaryError, 'admin_finance_summary')) {
    throw new Error(summaryError.message);
  }

  const [receipts, overdue] = await Promise.all([
    queryReceiptRows({ monthFrom: month, monthTo: month }),
    listOverdueSponsorships(actor, month),
  ]);

  return {
    deliveredThisMonth: receipts.filter((receipt) => receipt.status === 'money_delivered').length,
    expectedCurrentMonthTotal: overdue.reduce((total, item) => total + item.expectedAmount, 0),
    month,
    overdueSponsorships: overdue.length,
    readyForReview: receipts.filter((receipt) =>
      ['submitted', 'ready_for_review'].includes(receipt.status),
    ).length,
    rejectedThisMonth: receipts.filter((receipt) => receipt.status === 'rejected').length,
    reviewedAwaitingVerification: receipts.filter((receipt) => receipt.status === 'reviewed')
      .length,
    verifiedCurrentMonthTotal: receipts
      .filter((receipt) => receipt.status === 'verified' || receipt.status === 'money_delivered')
      .reduce((total, receipt) => total + receipt.amount, 0),
    verifiedThisMonth: receipts.filter((receipt) => receipt.status === 'verified').length,
  };
}

export async function listOverdueSponsorships(
  actor: TeamMember,
  requestedMonth = currentMonthStart(),
): Promise<AdminOverdueSponsorship[]> {
  if (!canViewFinanceSummary(actor)) {
    throw new ForbiddenError('You do not have permission to view overdue sponsorships.');
  }

  const month = monthStart(requestedMonth) ?? currentMonthStart();

  // Sponsorship receipts are due through the 10th in Pakistan time. A missing
  // receipt becomes overdue on the 11th; future months are never overdue.
  if (!isLateForMonth(month)) {
    return [];
  }

  const supabase = createSupabaseAdminClient();
  const { data: matches, error: matchesError } = await supabase
    .from('sponsorship_matches')
    .select(
      `
        id,
        monthly_amount,
        currency,
        status,
        started_at,
        ended_at,
        donor:donors!sponsorship_matches_donor_id_fkey(id, full_name, email, phone),
        orphan:orphan_profiles!sponsorship_matches_orphan_id_fkey(id, orphan_code, full_name)
      `,
    )
    .neq('status', 'voided')
    .returns<
      Array<{
        currency: string;
        donor: { email: string; full_name: string; id: string; phone: string | null } | null;
        ended_at: string | null;
        id: string;
        monthly_amount: number | string;
        orphan: { full_name: string; id: string; orphan_code: string } | null;
        started_at: string;
        status: SponsorshipMatchStatus;
      }>
    >();

  if (matchesError) throw new Error(matchesError.message);

  const { data: receipts, error: receiptsError } = await supabase
    .from('donation_receipts')
    .select('sponsorship_match_id')
    .eq('donation_month', month)
    .neq('status', 'rejected')
    .returns<Array<{ sponsorship_match_id: string }>>();

  if (receiptsError) throw new Error(receiptsError.message);

  // Rejected receipts do not resolve the obligation. Keep the sponsorship in
  // the overdue list until a replacement receipt is submitted for the month.
  const submittedMatchIds = new Set(receipts.map((receipt) => receipt.sponsorship_match_id));

  return matches
    .filter(
      (match) =>
        matchExpectedForMonth(match, month) &&
        !submittedMatchIds.has(match.id) &&
        match.donor &&
        match.orphan,
    )
    .map((match) => ({
      currency: APP_CURRENCY,
      donorEmail: match.donor?.email ?? '',
      donorId: match.donor?.id ?? '',
      donorName: match.donor?.full_name ?? 'Unknown donor',
      donorPhone: match.donor?.phone ?? null,
      expectedAmount: Number(match.monthly_amount),
      matchId: match.id,
      orphanCode: match.orphan?.orphan_code ?? '',
      orphanName: match.orphan?.full_name ?? 'Unknown orphan',
    }));
}

export async function listOverdueSponsorshipsPage(
  actor: TeamMember,
  options: { month?: string; search?: string } = {},
  paginationOptions: PaginationOptions = {},
) {
  const overdue = await listOverdueSponsorships(actor, options.month);
  const search = options.search?.trim().toLowerCase();
  const filtered = search
    ? overdue.filter((item) =>
        [item.donorName, item.donorEmail, item.donorPhone, item.orphanCode, item.orphanName]
          .filter(Boolean)
          .some((value) => value?.toLowerCase().includes(search)),
      )
    : overdue;

  return paginateArray(filtered, normalizePaginationOptions(paginationOptions));
}

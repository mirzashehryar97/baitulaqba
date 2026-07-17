import {
  canViewFinanceSummary,
  canViewMatches,
  canViewOrphans,
  canViewSponsorshipRequests,
  isAssignedOnlySponsorshipRole,
} from '@/lib/adminPermissions';
import { createSupabaseAdminClient } from '@/lib/supabase/server';

import type { TeamMember } from '@/types/accounts';
import type {
  AdminDashboardActivity,
  AdminDashboardContributionMonth,
  AdminDashboardSummary,
} from '@/types/dashboard';
import type { SponsorshipMatchStatus } from '@/types/matches';
import type { OrphanProfileStatus } from '@/types/orphans';
import type { DonorPortalReceiptStatus } from '@/types/portal';
import type { SponsorshipRequestStatus } from '@/types/sponsorship';

type DashboardRequestRow = {
  assigned_team_member_id: string | null;
  created_at: string;
  id: string;
  next_follow_up_at: string | null;
  status: SponsorshipRequestStatus;
};

type DashboardOrphanRow = {
  approved_at: string | null;
  created_at: string;
  id: string;
  profile_status: OrphanProfileStatus;
};

type DashboardMatchRow = {
  created_at: string;
  ended_at: string | null;
  id: string;
  monthly_amount: number | string;
  started_at: string;
  status: SponsorshipMatchStatus;
};

type DashboardReceiptRow = {
  amount: number | string;
  donation_month: string;
  id: string;
  money_delivered_at: string | null;
  sponsorship_match_id: string;
  status: DonorPortalReceiptStatus;
  submitted_at: string;
  verified_at: string | null;
};

type DashboardLifetimeReceiptRow = {
  amount: number | string;
  id: string;
  status: DonorPortalReceiptStatus;
};

const ADMIN_TIME_ZONE = 'Asia/Karachi';
const LIFETIME_RECEIPT_PAGE_SIZE = 1_000;

function currentAdminMonth() {
  const parts = new Intl.DateTimeFormat('en-CA', {
    month: '2-digit',
    timeZone: ADMIN_TIME_ZONE,
    year: 'numeric',
  }).formatToParts(new Date());
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}`;
}

function normalizeMonth(value?: string | null) {
  return /^\d{4}-(0[1-9]|1[0-2])$/.test(value ?? '') ? (value as string) : currentAdminMonth();
}

function monthKey(date: Date) {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`;
}

function monthWindow(selectedMonth: string) {
  const [year, month] = selectedMonth.split('-').map(Number);

  return Array.from({ length: 6 }, (_, index) => {
    const date = new Date(Date.UTC(year, month - 1 - (5 - index), 1));
    const nextDate = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 1));

    return {
      key: monthKey(date),
      label: new Intl.DateTimeFormat('en', { month: 'short', timeZone: 'UTC' }).format(date),
      nextStart: `${monthKey(nextDate)}-01`,
      start: `${monthKey(date)}-01`,
    };
  });
}

function monthEndIso(selectedMonth: string) {
  const [year, month] = selectedMonth.split('-').map(Number);
  return new Date(Date.UTC(year, month, 1)).toISOString();
}

function requestFallsInMonth(request: DashboardRequestRow, month: string) {
  return (
    request.created_at >= `${month}-01T00:00:00.000Z` && request.created_at < monthEndIso(month)
  );
}

function matchExpectedForMonth(match: DashboardMatchRow, start: string, nextStart: string) {
  return (
    match.status !== 'voided' &&
    match.started_at < nextStart &&
    (!match.ended_at || match.ended_at >= start)
  );
}

function activityTimestamp(value: string | null | undefined) {
  return value ? new Date(value).getTime() : 0;
}

function latestBy<T>(rows: T[], getValue: (row: T) => string | null | undefined) {
  return rows.reduce<T | null>((latest, row) => {
    if (!latest) return row;
    return activityTimestamp(getValue(row)) > activityTimestamp(getValue(latest)) ? row : latest;
  }, null);
}

async function listLifetimeReceiptRows() {
  const supabase = createSupabaseAdminClient();
  const rows: DashboardLifetimeReceiptRow[] = [];
  let offset = 0;
  let total = Number.POSITIVE_INFINITY;

  while (offset < total) {
    const { count, data, error } = await supabase
      .from('donation_receipts')
      .select('id, amount, status', { count: 'exact' })
      .order('id', { ascending: true })
      .range(offset, offset + LIFETIME_RECEIPT_PAGE_SIZE - 1)
      .returns<DashboardLifetimeReceiptRow[]>();

    if (error) throw new Error(error.message);

    rows.push(...data);
    total = count ?? rows.length;

    if (data.length === 0) break;
    offset += data.length;
  }

  return rows;
}

export async function getAdminDashboardSummary(
  actor: TeamMember,
  requestedMonth?: string | null,
): Promise<AdminDashboardSummary> {
  const supabase = createSupabaseAdminClient();
  const month = normalizeMonth(requestedMonth);
  const availability = {
    finance: canViewFinanceSummary(actor),
    matches: canViewMatches(actor),
    orphans: canViewOrphans(actor),
    requests: canViewSponsorshipRequests(actor),
  };

  const [requests, orphans, matches, receipts, lifetimeReceipts] = await Promise.all([
    availability.requests
      ? (async () => {
          let query = supabase
            .from('sponsorship_requests')
            .select('id, status, assigned_team_member_id, next_follow_up_at, created_at')
            .order('created_at', { ascending: false });

          if (isAssignedOnlySponsorshipRole(actor.role)) {
            query = query.eq('assigned_team_member_id', actor.id);
          }

          const { data, error } = await query.returns<DashboardRequestRow[]>();
          if (error) throw new Error(error.message);
          return data;
        })()
      : Promise.resolve([] as DashboardRequestRow[]),
    availability.orphans
      ? (async () => {
          const { data, error } = await supabase
            .from('orphan_profiles')
            .select('id, profile_status, approved_at, created_at')
            .order('created_at', { ascending: false })
            .returns<DashboardOrphanRow[]>();
          if (error) throw new Error(error.message);
          return data;
        })()
      : Promise.resolve([] as DashboardOrphanRow[]),
    availability.matches || availability.finance
      ? (async () => {
          const { data, error } = await supabase
            .from('sponsorship_matches')
            .select('id, monthly_amount, status, started_at, ended_at, created_at')
            .order('created_at', { ascending: false })
            .returns<DashboardMatchRow[]>();
          if (error) throw new Error(error.message);
          return data;
        })()
      : Promise.resolve([] as DashboardMatchRow[]),
    availability.finance
      ? (async () => {
          const firstMonth = monthWindow(month)[0]?.start ?? `${month}-01`;
          const { data, error } = await supabase
            .from('donation_receipts')
            .select(
              'id, sponsorship_match_id, amount, donation_month, status, submitted_at, verified_at, money_delivered_at',
            )
            .gte('donation_month', firstMonth)
            .lte('donation_month', `${month}-01`)
            .order('submitted_at', { ascending: false })
            .returns<DashboardReceiptRow[]>();
          if (error) throw new Error(error.message);
          return data;
        })()
      : Promise.resolve([] as DashboardReceiptRow[]),
    availability.finance
      ? listLifetimeReceiptRows()
      : Promise.resolve([] as DashboardLifetimeReceiptRow[]),
  ]);

  const selectedMonthReceipts = receipts.filter(
    (receipt) => receipt.donation_month === `${month}-01`,
  );
  const selectedMonthRequests = requests.filter((request) => requestFallsInMonth(request, month));
  const submittedMatchIds = new Set(
    selectedMonthReceipts.map((receipt) => receipt.sponsorship_match_id),
  );
  const currentMonthWindow = monthWindow(month).at(-1);
  const expectedCurrentMatches = currentMonthWindow
    ? matches.filter((match) =>
        matchExpectedForMonth(match, currentMonthWindow.start, currentMonthWindow.nextStart),
      )
    : [];
  const overdueDonors = availability.finance
    ? expectedCurrentMatches.filter((match) => !submittedMatchIds.has(match.id)).length
    : 0;
  const contributionHealth: AdminDashboardContributionMonth[] = monthWindow(month).map((window) => {
    const monthReceipts = receipts.filter((receipt) => receipt.donation_month === window.start);
    const expected = matches
      .filter((match) => matchExpectedForMonth(match, window.start, window.nextStart))
      .reduce((total, match) => total + Number(match.monthly_amount), 0);
    const verified = monthReceipts
      .filter((receipt) => ['verified', 'money_delivered'].includes(receipt.status))
      .reduce((total, receipt) => total + Number(receipt.amount), 0);
    const delivered = monthReceipts
      .filter((receipt) => receipt.status === 'money_delivered')
      .reduce((total, receipt) => total + Number(receipt.amount), 0);

    return { delivered, expected, label: window.label, month: window.key, verified };
  });

  const endOfToday = new Date();
  endOfToday.setHours(23, 59, 59, 999);
  const followUpsDue = requests.filter(
    (request) =>
      request.status !== 'closed' &&
      request.next_follow_up_at &&
      new Date(request.next_follow_up_at) <= endOfToday,
  ).length;

  const activity: AdminDashboardActivity[] = [];
  const latestRequest = latestBy(requests, (request) => request.created_at);
  const latestApprovedOrphan = latestBy(
    orphans.filter((orphan) => orphan.approved_at),
    (orphan) => orphan.approved_at,
  );
  const latestMatch = latestBy(matches, (match) => match.created_at);
  const latestVerifiedReceipt = latestBy(
    receipts.filter((receipt) => receipt.verified_at),
    (receipt) => receipt.verified_at,
  );

  if (latestRequest) {
    activity.push({
      at: latestRequest.created_at,
      href: '/admin/sponsorship-requests',
      id: `request-${latestRequest.id}`,
      kind: 'request_received',
      label: 'New sponsorship request received',
    });
  }
  if (latestVerifiedReceipt?.verified_at) {
    activity.push({
      at: latestVerifiedReceipt.verified_at,
      href: `/admin/receipts/${latestVerifiedReceipt.id}`,
      id: `receipt-${latestVerifiedReceipt.id}`,
      kind: 'receipt_verified',
      label: 'Receipt verified',
    });
  }
  if (latestApprovedOrphan?.approved_at) {
    activity.push({
      at: latestApprovedOrphan.approved_at,
      href: `/admin/orphans/${latestApprovedOrphan.id}`,
      id: `orphan-${latestApprovedOrphan.id}`,
      kind: 'orphan_approved',
      label: 'Orphan profile approved',
    });
  }
  if (latestMatch) {
    activity.push({
      at: latestMatch.created_at,
      href: `/admin/matches/${latestMatch.id}`,
      id: `match-${latestMatch.id}`,
      kind: 'match_created',
      label: 'New match created',
    });
  }

  const verifiedThisMonth = selectedMonthReceipts
    .filter((receipt) => ['verified', 'money_delivered'].includes(receipt.status))
    .reduce((total, receipt) => total + Number(receipt.amount), 0);
  const receiptsNeedReview = selectedMonthReceipts.filter((receipt) =>
    ['submitted', 'ready_for_review'].includes(receipt.status),
  ).length;
  const lifetimeContributions = {
    awaitingReviewAmount: lifetimeReceipts
      .filter((receipt) => ['submitted', 'ready_for_review', 'reviewed'].includes(receipt.status))
      .reduce((total, receipt) => total + Number(receipt.amount), 0),
    deliveredAmount: lifetimeReceipts
      .filter((receipt) => receipt.status === 'money_delivered')
      .reduce((total, receipt) => total + Number(receipt.amount), 0),
    receiptCount: lifetimeReceipts.length,
    verifiedAmount: lifetimeReceipts
      .filter((receipt) => ['verified', 'money_delivered'].includes(receipt.status))
      .reduce((total, receipt) => total + Number(receipt.amount), 0),
  };

  return {
    activity: activity
      .sort((first, second) => activityTimestamp(second.at) - activityTimestamp(first.at))
      .slice(0, 4),
    availability,
    contributionHealth,
    kpis: {
      activeMatches: availability.matches
        ? matches.filter((match) => match.status === 'active').length
        : 0,
      newRequests: availability.requests
        ? requests.filter((request) => request.status === 'new').length
        : 0,
      overdueDonors,
      profilesUnderReview: availability.orphans
        ? orphans.filter((orphan) => orphan.profile_status === 'under_review').length
        : 0,
      receiptsNeedReview,
      verifiedThisMonth,
    },
    lifetimeContributions,
    month: `${month}-01`,
    pipeline: {
      contacted: selectedMonthRequests.filter((request) => request.status === 'contacted').length,
      converted: selectedMonthRequests.filter((request) => request.status === 'converted_to_donor')
        .length,
      matched: selectedMonthRequests.filter((request) => request.status === 'closed').length,
      new: selectedMonthRequests.filter((request) => request.status === 'new').length,
      profilesPrepared: selectedMonthRequests.filter(
        (request) => request.status === 'profiles_prepared',
      ).length,
      profilesShared: selectedMonthRequests.filter(
        (request) => request.status === 'profiles_shared',
      ).length,
    },
    updatedAt: new Date().toISOString(),
    workQueue: {
      followUpsDue: availability.requests ? followUpsDue : 0,
      orphanProfilesAwaitingApproval: availability.orphans
        ? orphans.filter((orphan) => orphan.profile_status === 'under_review').length
        : 0,
      receiptsReadyForReview: receiptsNeedReview,
      unpaidDonors: overdueDonors,
    },
  };
}

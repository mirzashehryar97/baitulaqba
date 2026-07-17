'use client';

import { useEffect, useMemo, useState } from 'react';

import Image from 'next/image';
import Link from 'next/link';

import {
  CheckCircle2,
  Clock3,
  Download,
  ExternalLink,
  Link2,
  LockKeyhole,
  PauseCircle,
  Pencil,
  PlayCircle,
  ReceiptText,
  ShieldCheck,
  SquareX,
  UserRound,
} from 'lucide-react';
import useSWR from 'swr';

import { useAdminAccount } from '@/components/admin/AdminShell';
import BackLink from '@/components/ui/BackLink';
import { useConfirmation } from '@/components/ui/ConfirmationProvider';
import { CustomSelect } from '@/components/ui/CustomSelect';
import { NavLinkIcon } from '@/components/ui/NavLinkIcon';
import { useToast } from '@/components/ui/ToastProvider';
import { workflowStatus, workSurface } from '@/components/ui/work-surface';

import {
  canDownloadMatchCertificate,
  canEndMatches,
  canPauseMatches,
  canResumeMatches,
  canUpdateMatches,
  canVoidMatches,
} from '@/lib/adminPermissions';
import { fetchApiData } from '@/lib/apiFetcher';
import { formatCertificateNumber } from '@/lib/certificateNumber';
import { formatCurrency } from '@/lib/currency';
import { currentMonthValue } from '@/lib/months';
import { cn } from '@/lib/utils';

import type {
  MatchDetailActivity,
  MatchDetailOverview,
  MatchDetailPayment,
  MatchDetailRecord,
} from '@/types/matchDetail';
import type { SponsorshipMatchStatus } from '@/types/matches';
import type { OrphanVerificationStatus } from '@/types/orphans';
import type { DonorPortalReceiptStatus } from '@/types/portal';

const statusLabels: Record<SponsorshipMatchStatus, string> = {
  active: 'Active',
  ended: 'Ended',
  paused: 'Paused',
  voided: 'Voided',
};

const verificationLabels: Record<OrphanVerificationStatus, string> = {
  documents_received: 'Documents Received',
  field_verified: 'Field Verified',
  needs_more_information: 'Needs More Information',
  rejected: 'Rejected',
  unverified: 'Unverified',
};

const receiptStatusLabels: Record<DonorPortalReceiptStatus, string> = {
  money_delivered: 'Delivered',
  ready_for_review: 'Ready for Review',
  rejected: 'Rejected',
  reviewed: 'Reviewed',
  submitted: 'Submitted',
  verified: 'Verified',
};

const contactMethodLabels = {
  email: 'Email',
  phone: 'Phone',
  whatsapp: 'WhatsApp',
} as const;

const paidStatuses = new Set<DonorPortalReceiptStatus>(['verified', 'money_delivered']);

type TabKey = 'overview' | 'payments' | 'activity';
type PaymentFilter = 'all' | 'verified' | 'delivered' | 'in_review' | 'rejected';
type PendingAction = 'pause' | 'end' | 'void';
type EditMode = 'terms' | 'notes';

const actionTitles: Record<PendingAction, string> = {
  end: 'End Sponsorship Match',
  pause: 'Pause Sponsorship Match',
  void: 'Void Sponsorship Match',
};

function formatDate(value: string | null | undefined) {
  if (!value) return 'Not recorded';
  return new Intl.DateTimeFormat('en-PK', { dateStyle: 'medium' }).format(new Date(value));
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat('en-PK', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

function formatMonth(value: string) {
  return new Intl.DateTimeFormat('en-PK', {
    month: 'long',
    timeZone: 'UTC',
    year: 'numeric',
  }).format(new Date(value));
}

function todayDateInput() {
  return new Date().toISOString().slice(0, 10);
}

function getInitials(value: string | null | undefined) {
  return (value ?? '')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');
}

function getPaymentDate(payment: MatchDetailPayment) {
  return (
    payment.transferDate ?? payment.moneyDeliveredAt ?? payment.verifiedAt ?? payment.submittedAt
  );
}

function monthSequence(start: string, end: string) {
  if (!/^\d{4}-\d{2}$/.test(start) || !/^\d{4}-\d{2}$/.test(end) || start > end) return [];

  const [startYear, startMonth] = start.split('-').map(Number);
  const [endYear, endMonth] = end.split('-').map(Number);
  const months: string[] = [];
  let cursor = new Date(Date.UTC(startYear, startMonth - 1, 1));
  const finalMonth = Date.UTC(endYear, endMonth - 1, 1);

  while (cursor.getTime() <= finalMonth) {
    months.push(`${cursor.getUTCFullYear()}-${String(cursor.getUTCMonth() + 1).padStart(2, '0')}`);
    cursor = new Date(Date.UTC(cursor.getUTCFullYear(), cursor.getUTCMonth() + 1, 1));
  }

  return months;
}

function currentPakistanDay() {
  const parts = new Intl.DateTimeFormat('en-CA', {
    day: '2-digit',
    timeZone: 'Asia/Karachi',
  }).formatToParts(new Date());
  return Number(parts.find((part) => part.type === 'day')?.value ?? 1);
}

function buildPaymentSummary(match: MatchDetailRecord, payments: MatchDetailPayment[] | null) {
  const currentMonth = currentMonthValue();
  const paidPayments = (payments ?? []).filter((payment) => paidStatuses.has(payment.status));
  const totalReceived = paidPayments.reduce((total, payment) => total + payment.amount, 0);
  const paidByMonth = new Map<string, number>();

  for (const payment of paidPayments) {
    const month = payment.donationMonth.slice(0, 7);
    paidByMonth.set(month, (paidByMonth.get(month) ?? 0) + payment.amount);
  }

  const endMonth = match.endedAt
    ? [match.endedAt.slice(0, 7), currentMonth].sort()[0]
    : currentMonth;
  const expectedMonths =
    match.status === 'voided'
      ? []
      : monthSequence(match.startedAt.slice(0, 7), endMonth).filter(
          (month) => !(match.status === 'paused' && month === currentMonth),
        );
  const paidPeriods =
    match.monthlyAmount === null
      ? 0
      : expectedMonths.filter(
          (month) => (paidByMonth.get(month) ?? 0) >= (match.monthlyAmount ?? 0),
        ).length;
  const expectedPeriods = expectedMonths.length;
  const percentage =
    expectedPeriods === 0 ? 0 : Math.min(100, Math.round((paidPeriods / expectedPeriods) * 100));
  const currentPayments = (payments ?? []).filter(
    (payment) => payment.donationMonth.slice(0, 7) === currentMonth,
  );
  const currentPaidAmount = currentPayments
    .filter((payment) => paidStatuses.has(payment.status))
    .reduce((total, payment) => total + payment.amount, 0);
  const currentPaidReceipt = currentPayments
    .filter((payment) => paidStatuses.has(payment.status))
    .sort(
      (first, second) =>
        new Date(getPaymentDate(second)).getTime() - new Date(getPaymentDate(first)).getTime(),
    )[0];

  let currentStatus: CurrentPaymentStatus = 'pending';

  if (payments === null) {
    currentStatus = 'restricted';
  } else if (
    match.monthlyAmount !== null &&
    currentPaidAmount >= match.monthlyAmount &&
    currentPaidAmount > 0
  ) {
    currentStatus = 'paid';
  } else if (match.monthlyAmount === null && currentPaidAmount > 0) {
    currentStatus = 'received';
  } else if (currentPaidAmount > 0) {
    currentStatus = 'partial';
  } else if (
    currentPayments.some((payment) =>
      ['submitted', 'ready_for_review', 'reviewed'].includes(payment.status),
    )
  ) {
    currentStatus = 'in_review';
  } else if (currentPayments.some((payment) => payment.status === 'rejected')) {
    currentStatus = 'rejected';
  } else if (
    match.status === 'voided' ||
    (match.endedAt && match.endedAt.slice(0, 7) < currentMonth)
  ) {
    currentStatus = 'not_applicable';
  } else if (match.status === 'paused') {
    currentStatus = 'paused';
  } else if (
    currentPakistanDay() > 10 &&
    match.startedAt.slice(0, 7) <= currentMonth &&
    ['active', 'paused'].includes(match.status)
  ) {
    currentStatus = 'overdue';
  }

  return {
    currentMonth,
    currentPaymentDate: currentPaidReceipt ? getPaymentDate(currentPaidReceipt) : null,
    currentStatus,
    expectedPeriods,
    paidPeriods,
    percentage,
    totalReceived,
  };
}

type CurrentPaymentStatus =
  | 'paid'
  | 'received'
  | 'partial'
  | 'in_review'
  | 'pending'
  | 'overdue'
  | 'rejected'
  | 'paused'
  | 'not_applicable'
  | 'restricted';

export function MatchDetailPage({ initialOverview }: { initialOverview: MatchDetailOverview }) {
  const { teamMember } = useAdminAccount();
  const toast = useToast();
  const confirm = useConfirmation();
  const [activeTab, setActiveTab] = useState<TabKey>('overview');
  const [editMode, setEditMode] = useState<EditMode | null>(null);
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);
  const [saving, setSaving] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [amount, setAmount] = useState(String(initialOverview.match.monthlyAmount ?? ''));
  const [startedAt, setStartedAt] = useState(initialOverview.match.startedAt);
  const [notes, setNotes] = useState(initialOverview.match.notes ?? '');
  const [reason, setReason] = useState('');
  const [endedAt, setEndedAt] = useState(todayDateInput());

  const { data, mutate } = useSWR<MatchDetailOverview>(
    `/api/admin/matches/${initialOverview.match.id}`,
    fetchApiData,
    {
      dedupingInterval: 10_000,
      fallbackData: initialOverview,
    },
  );

  const overview = data ?? initialOverview;
  const { activity, match, payments, permissions } = overview;
  const paymentSummary = useMemo(() => buildPaymentSummary(match, payments), [match, payments]);
  const editable = canUpdateMatches(teamMember) && !['ended', 'voided'].includes(match.status);
  const canPause = canPauseMatches(teamMember);
  const canResume = canResumeMatches(teamMember);
  const canEnd = canEndMatches(teamMember);
  const canVoid = canVoidMatches(teamMember);
  const canDownload = canDownloadMatchCertificate(teamMember);
  const hasActions = canPause || canResume || canEnd || canVoid;

  useEffect(() => {
    setAmount(String(match.monthlyAmount ?? ''));
    setStartedAt(match.startedAt);
    setNotes(match.notes ?? '');
  }, [match.monthlyAmount, match.notes, match.startedAt]);

  const saveChanges = async () => {
    if (!editMode) return;

    const body = editMode === 'terms' ? { monthlyAmount: Number(amount), startedAt } : { notes };

    if (editMode === 'terms' && (!Number.isFinite(Number(amount)) || Number(amount) <= 0)) {
      toast({
        description: 'Enter a positive monthly sponsorship amount.',
        title: 'Amount required',
        type: 'error',
      });
      return;
    }

    setSaving(true);

    try {
      const response = await fetch(`/api/admin/matches/${match.id}`, {
        body: JSON.stringify(body),
        headers: { 'Content-Type': 'application/json' },
        method: 'PATCH',
      });
      const responseBody = (await response.json().catch(() => null)) as {
        error?: string;
      } | null;

      if (!response.ok) {
        toast({
          description: responseBody?.error ?? 'The match could not be updated.',
          title: 'Update failed',
          type: 'error',
        });
        return;
      }

      await mutate();
      setEditMode(null);
      toast({
        description: editMode === 'terms' ? 'Sponsorship terms updated.' : 'Internal note updated.',
        title: 'Match saved',
        type: 'success',
      });
    } catch {
      toast({
        description: 'Please check your connection and try again.',
        title: 'Update failed',
        type: 'error',
      });
    } finally {
      setSaving(false);
    }
  };

  const runAction = async (action: 'pause' | 'resume' | 'end' | 'void') => {
    try {
      const payload =
        action === 'resume'
          ? undefined
          : {
              endedAt: action === 'end' ? endedAt : undefined,
              reason,
            };
      const response = await fetch(`/api/admin/matches/${match.id}/${action}`, {
        body: payload ? JSON.stringify(payload) : undefined,
        headers: payload ? { 'Content-Type': 'application/json' } : undefined,
        method: 'POST',
      });
      const responseBody = (await response.json().catch(() => null)) as {
        error?: string;
      } | null;

      if (!response.ok) {
        toast({
          description: responseBody?.error ?? 'The match status could not be changed.',
          title: 'Action failed',
          type: 'error',
        });
        return false;
      }

      await mutate();
      toast({
        description: `The sponsorship match was ${
          action === 'resume'
            ? 'resumed'
            : action === 'pause'
              ? 'paused'
              : action === 'end'
                ? 'ended'
                : 'voided'
        }.`,
        title: 'Match updated',
        type: 'success',
      });
      return true;
    } catch {
      toast({
        description: 'Please check your connection and try again.',
        title: 'Action failed',
        type: 'error',
      });
      return false;
    }
  };

  const resumeMatch = async () => {
    const confirmed = await confirm({
      confirmLabel: 'Resume Match',
      description: `Resume ${match.orphan?.orphanCode ?? 'this sponsorship match'}.`,
      title: 'Resume match?',
    });

    if (!confirmed) return;
    setSaving(true);
    await runAction('resume');
    setSaving(false);
  };

  const confirmAction = async () => {
    if (!pendingAction || !reason.trim()) return;
    setSaving(true);
    const succeeded = await runAction(pendingAction);
    setSaving(false);

    if (succeeded) {
      setPendingAction(null);
      setReason('');
      setEndedAt(todayDateInput());
    }
  };

  const downloadCertificate = async () => {
    setDownloading(true);

    try {
      const response = await fetch(`/api/admin/matches/${match.id}/certificate`);

      if (!response.ok) {
        const responseBody = (await response.json().catch(() => null)) as {
          error?: string;
        } | null;
        toast({
          description: responseBody?.error ?? 'The certificate could not be generated.',
          title: 'Certificate not ready',
          type: 'error',
        });
        return;
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `${formatCertificateNumber(match)}.pdf`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
    } catch {
      toast({
        description: 'Please check your connection and try again.',
        title: 'Download failed',
        type: 'error',
      });
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className={workSurface.page}>
      <header className="space-y-4">
        <BackLink href="/admin/matches" label="Back to Matches" />
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className={cn(workSurface.title, 'leading-tight')}>Match Details</h1>
              <StatusPill status={match.status} />
            </div>
            <p className="mt-2 text-sm font-normal text-[#596274]">
              Certificate {formatCertificateNumber(match)}
              <span className="px-2 text-[#a0a7b2]">·</span>
              Started {formatDate(match.startedAt)}
              {match.endedAt ? (
                <>
                  <span className="px-2 text-[#a0a7b2]">·</span>
                  Ended {formatDate(match.endedAt)}
                </>
              ) : null}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {canDownload ? (
              <button
                className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-[#0d6b50] bg-white px-4 text-sm font-semibold text-[#006b4f] transition hover:bg-emerald-50 disabled:cursor-wait disabled:opacity-60"
                disabled={downloading}
                onClick={downloadCertificate}
                type="button"
              >
                <Download className="h-4 w-4" />
                {downloading ? 'Preparing...' : 'Download Certificate'}
              </button>
            ) : null}
          </div>
        </div>
      </header>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Monthly Sponsorship">
          {permissions.canViewMonthlyAmount && match.monthlyAmount !== null ? (
            <p className="text-2xl font-semibold tracking-[-0.025em] text-[#111827]">
              {formatCurrency(match.monthlyAmount)}
            </p>
          ) : (
            <RestrictedMetric label="Amount restricted" />
          )}
        </MetricCard>
        <MetricCard label="Total Received">
          {permissions.canViewPaymentHistory ? (
            <p className="text-2xl font-semibold tracking-[-0.025em] text-[#111827]">
              {formatCurrency(paymentSummary.totalReceived)}
            </p>
          ) : (
            <RestrictedMetric label="Total restricted" />
          )}
        </MetricCard>
        <MetricCard label="Current Month">
          <CurrentPaymentPill status={paymentSummary.currentStatus} />
          <p className="mt-2 text-xs font-normal text-[#6b7280]">
            {paymentSummary.currentPaymentDate
              ? `Received ${formatDate(paymentSummary.currentPaymentDate)}`
              : formatMonth(`${paymentSummary.currentMonth}-01`)}
          </p>
        </MetricCard>
        <MetricCard label="Payment Coverage">
          {permissions.canViewPaymentHistory && permissions.canViewMonthlyAmount ? (
            <>
              <p className="text-xl font-semibold tracking-[-0.02em] text-[#111827]">
                {paymentSummary.paidPeriods} of {paymentSummary.expectedPeriods} months
              </p>
              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[#e2e8e3]">
                <span
                  className="block h-full rounded-full bg-[#006b4f]"
                  style={{ width: `${paymentSummary.percentage}%` }}
                />
              </div>
            </>
          ) : (
            <RestrictedMetric label="Coverage restricted" />
          )}
        </MetricCard>
      </section>

      <p className="flex items-center gap-2 text-xs font-normal text-[#6b7280]">
        <LockKeyhole className="h-3.5 w-3.5" />
        Financial details are visible to authorized roles only.
      </p>

      <nav aria-label="Match detail sections" className="border-b border-[#dfe5df]">
        <div className="flex gap-7 overflow-x-auto">
          {(
            [
              ['overview', 'Overview'],
              ['payments', 'Payment History'],
              ['activity', 'Activity Log'],
            ] as const
          ).map(([key, label]) => (
            <button
              className={cn(
                'relative whitespace-nowrap px-1 pb-3 text-sm font-medium transition',
                activeTab === key ? 'text-[#006b4f]' : 'text-[#6b7280] hover:text-[#374151]',
              )}
              key={key}
              onClick={() => setActiveTab(key)}
              type="button"
            >
              {label}
              {activeTab === key ? (
                <span className="absolute inset-x-0 bottom-0 h-0.5 rounded-full bg-[#006b4f]" />
              ) : null}
            </button>
          ))}
        </div>
      </nav>

      {activeTab === 'overview' ? (
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1.75fr)_minmax(19rem,0.8fr)]">
          <main className="min-w-0 space-y-4">
            <RelationshipCard overview={overview} />
            <PaymentHistoryCard
              compact
              onViewAll={() => setActiveTab('payments')}
              overview={overview}
            />
            <ActivityCard
              activity={activity.slice(0, 3)}
              canOpenReceipt={permissions.canOpenReceipt}
              compact
              onViewAll={() => setActiveTab('activity')}
            />
          </main>
          <aside className="min-w-0 space-y-4">
            <TermsCard
              editable={editable && permissions.canViewMonthlyAmount}
              match={match}
              onEdit={() => setEditMode('terms')}
            />
            <NotesCard
              editable={editable}
              notes={match.notes}
              onEdit={() => setEditMode('notes')}
            />
            {hasActions ? (
              <MatchActions
                canEnd={canEnd}
                canPause={canPause}
                canResume={canResume}
                canVoid={canVoid}
                disabled={saving}
                match={match}
                onAction={(action) => {
                  setPendingAction(action);
                  setReason('');
                  setEndedAt(todayDateInput());
                }}
                onResume={resumeMatch}
              />
            ) : null}
          </aside>
        </div>
      ) : null}

      {activeTab === 'payments' ? (
        <PaymentHistoryCard onViewAll={() => undefined} overview={overview} />
      ) : null}

      {activeTab === 'activity' ? (
        <ActivityCard activity={activity} canOpenReceipt={permissions.canOpenReceipt} />
      ) : null}

      {editMode ? (
        <EditMatchModal
          amount={amount}
          currency={match.currency}
          mode={editMode}
          notes={notes}
          onAmountChange={setAmount}
          onCancel={() => setEditMode(null)}
          onNotesChange={setNotes}
          onSave={saveChanges}
          onStartedAtChange={setStartedAt}
          saving={saving}
          startedAt={startedAt}
        />
      ) : null}

      {pendingAction ? (
        <ActionModal
          action={pendingAction}
          endedAt={endedAt}
          onCancel={() => setPendingAction(null)}
          onConfirm={confirmAction}
          onEndedAtChange={setEndedAt}
          onReasonChange={setReason}
          reason={reason}
          saving={saving}
        />
      ) : null}
    </div>
  );
}

function MetricCard({ children, label }: { children: React.ReactNode; label: string }) {
  return (
    <article className={cn(workSurface.card, 'min-h-28 p-4')}>
      <p className="text-[0.68rem] font-semibold uppercase tracking-[0.04em] text-[#4b5563]">
        {label}
      </p>
      <div className="mt-3">{children}</div>
    </article>
  );
}

function RestrictedMetric({ label }: { label: string }) {
  return (
    <p className="flex items-center gap-2 text-sm font-semibold text-[#6b7280]">
      <LockKeyhole className="h-4 w-4" />
      {label}
    </p>
  );
}

function RelationshipCard({ overview }: { overview: MatchDetailOverview }) {
  const { match, permissions } = overview;
  const donor = match.donor;
  const orphan = match.orphan;

  return (
    <section className={cn(workSurface.card, 'p-4 sm:p-5')}>
      <h2 className="text-lg font-semibold text-[#111827]">Sponsorship Relationship</h2>
      <div className="mt-4 grid gap-3 md:grid-cols-[minmax(0,1fr)_3.5rem_minmax(0,1.15fr)] md:items-stretch">
        <article className="rounded-lg border border-[#dfe5df] bg-[#fcfdfc] p-4">
          <div className="flex items-start gap-3">
            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border border-[#d8ded8] bg-white text-lg font-semibold text-[#111827]">
              {getInitials(donor?.fullName) || 'D'}
            </span>
            <div className="min-w-0">
              <p className="text-[0.68rem] font-semibold uppercase tracking-[0.06em] text-[#006b4f]">
                Donor
              </p>
              <p className="mt-1 truncate font-semibold text-[#111827]">
                {donor?.fullName ?? 'Unknown donor'}
              </p>
              {permissions.canViewDonorContact ? (
                <>
                  <p className="mt-1 truncate text-xs text-[#596274]">{donor?.email}</p>
                  {donor?.phone ? (
                    <p className="mt-1 text-xs text-[#596274]">{donor.phone}</p>
                  ) : null}
                  <p className="mt-2 text-xs text-[#6b7280]">
                    Preferred contact:{' '}
                    {donor?.preferredContactMethod
                      ? contactMethodLabels[donor.preferredContactMethod]
                      : 'Not set'}
                  </p>
                </>
              ) : (
                <p className="mt-2 flex items-center gap-1.5 text-xs text-[#6b7280]">
                  <LockKeyhole className="h-3.5 w-3.5" />
                  Contact details restricted
                </p>
              )}
              {permissions.canOpenDonor ? (
                <Link
                  className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-[#006b4f] hover:underline"
                  href={`/admin/donors/${match.donorId}`}
                >
                  View donor profile
                  <NavLinkIcon className="h-3 w-3" icon={ExternalLink} />
                </Link>
              ) : null}
            </div>
          </div>
        </article>

        <div className="hidden items-center md:flex">
          <span className="h-px flex-1 bg-[#cfd8d1]" />
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#cfd8d1] bg-white text-[#4b5563]">
            <Link2 className="h-4 w-4" />
          </span>
          <span className="h-px flex-1 bg-[#cfd8d1]" />
        </div>

        <article className="rounded-lg border border-[#dfe5df] bg-[#fcfdfc] p-4">
          <div className="flex items-start gap-3">
            {orphan?.profileImageUrl ? (
              <Image
                alt={`${orphan.fullName} profile`}
                className="h-14 w-14 shrink-0 rounded-full border border-[#d8ded8] object-cover"
                height={56}
                src={orphan.profileImageUrl}
                unoptimized
                width={56}
              />
            ) : (
              <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border border-emerald-100 bg-emerald-50 text-emerald-700">
                <UserRound className="h-6 w-6" />
              </span>
            )}
            <div className="min-w-0">
              <p className="text-[0.68rem] font-semibold uppercase tracking-[0.06em] text-[#006b4f]">
                Orphan
              </p>
              <p className="mt-1 font-semibold text-[#111827]">
                {orphan?.orphanCode ?? 'No code'} · {orphan?.fullName ?? 'Unknown profile'}
              </p>
              <p className="mt-1 text-xs text-[#596274]">
                {orphan?.cityArea || 'Location not recorded'}
              </p>
              {orphan ? (
                <div className="mt-2">
                  <VerificationPill status={orphan.verificationStatus} />
                </div>
              ) : null}
              {permissions.canOpenOrphan ? (
                <Link
                  className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-[#006b4f] hover:underline"
                  href={`/admin/orphans/${match.orphanId}`}
                >
                  View orphan profile
                  <NavLinkIcon className="h-3 w-3" icon={ExternalLink} />
                </Link>
              ) : null}
            </div>
          </div>
        </article>
      </div>
    </section>
  );
}

function PaymentHistoryCard({
  compact = false,
  onViewAll,
  overview,
}: {
  compact?: boolean;
  onViewAll: () => void;
  overview: MatchDetailOverview;
}) {
  const { payments, permissions } = overview;
  const [statusFilter, setStatusFilter] = useState<PaymentFilter>('all');
  const paymentYears = useMemo(() => {
    const years = Array.from(
      new Set((payments ?? []).map((payment) => payment.donationMonth.slice(0, 4))),
    ).sort((first, second) => second.localeCompare(first));
    return years.length > 0 ? years : [String(new Date().getFullYear())];
  }, [payments]);
  const [year, setYear] = useState(paymentYears[0]);

  useEffect(() => {
    if (!paymentYears.includes(year)) setYear(paymentYears[0]);
  }, [paymentYears, year]);

  const filtered = useMemo(
    () =>
      (payments ?? []).filter(
        (payment) =>
          payment.donationMonth.startsWith(year) && matchesPaymentFilter(payment, statusFilter),
      ),
    [payments, statusFilter, year],
  );
  const visible = compact ? filtered.slice(0, 4) : filtered;

  return (
    <section className={workSurface.card}>
      <div className="flex flex-col gap-3 border-b border-[#e8ece8] px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:px-5">
        <div>
          <h2 className="text-lg font-semibold text-[#111827]">Payment History</h2>
          {!compact ? (
            <p className="mt-1 text-xs text-[#6b7280]">
              Complete receipt record for this sponsorship match
            </p>
          ) : null}
        </div>
        {permissions.canViewPaymentHistory ? (
          <div className="flex gap-2">
            <CustomSelect
              ariaLabel="Filter payment status"
              className="w-40"
              onChange={(value) => setStatusFilter(value as PaymentFilter)}
              options={[
                { label: 'All statuses', value: 'all' },
                { label: 'Verified', value: 'verified' },
                { label: 'Delivered', value: 'delivered' },
                { label: 'In review', value: 'in_review' },
                { label: 'Rejected', value: 'rejected' },
              ]}
              triggerClassName="h-9 border-[#d9ded8] text-xs font-medium"
              value={statusFilter}
            />
            <CustomSelect
              ariaLabel="Filter payment year"
              className="w-28"
              onChange={setYear}
              options={paymentYears.map((value) => ({ label: value, value }))}
              triggerClassName="h-9 border-[#d9ded8] text-xs font-medium"
              value={year}
            />
          </div>
        ) : null}
      </div>

      {permissions.canViewPaymentHistory && payments ? (
        <>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] border-collapse text-left">
              <thead>
                <tr className="border-b border-[#e8ece8] text-[0.68rem] font-semibold uppercase tracking-[0.04em] text-[#4b5563]">
                  <th className="px-4 py-3 sm:px-5">Month</th>
                  <th className="px-3 py-3">Received</th>
                  <th className="px-3 py-3">Amount</th>
                  <th className="px-3 py-3">Status</th>
                  <th className="px-3 py-3">Reference</th>
                  <th className="px-4 py-3 text-right sm:px-5">Receipt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#edf0ed]">
                {visible.map((payment) => (
                  <tr className="text-xs text-[#374151]" key={payment.id}>
                    <td className="whitespace-nowrap px-4 py-3 font-medium text-[#111827] sm:px-5">
                      {formatMonth(payment.donationMonth)}
                    </td>
                    <td className="whitespace-nowrap px-3 py-3">
                      {formatDate(getPaymentDate(payment))}
                    </td>
                    <td className="whitespace-nowrap px-3 py-3 font-semibold text-[#111827]">
                      {formatCurrency(payment.amount)}
                    </td>
                    <td className="px-3 py-3">
                      <ReceiptStatusPill status={payment.status} />
                    </td>
                    <td className="max-w-36 truncate px-3 py-3">
                      {payment.transferReference || '—'}
                    </td>
                    <td className="px-4 py-3 text-right sm:px-5">
                      {permissions.canOpenReceipt ? (
                        <Link
                          className="inline-flex items-center gap-1 font-semibold text-[#006b4f] hover:underline"
                          href={`/admin/receipts/${payment.id}`}
                        >
                          View
                          <NavLinkIcon className="h-3 w-3" icon={ExternalLink} />
                        </Link>
                      ) : (
                        'Restricted'
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {visible.length === 0 ? (
              <div className="px-5 py-12 text-center">
                <ReceiptText className="mx-auto h-8 w-8 text-[#9ca3af]" />
                <p className="mt-3 text-sm font-semibold text-[#374151]">No payments found</p>
                <p className="mt-1 text-xs text-[#6b7280]">
                  No receipt records match the selected filters.
                </p>
              </div>
            ) : null}
          </div>
          {compact && payments.length > 0 ? (
            <div className="border-t border-[#e8ece8] px-4 py-3 text-center sm:px-5">
              <button
                className="text-xs font-semibold text-[#006b4f] hover:underline"
                onClick={onViewAll}
                type="button"
              >
                View complete payment history
              </button>
            </div>
          ) : null}
          {!compact ? (
            <div className="flex items-center gap-2 border-t border-[#e8ece8] px-4 py-3 text-xs text-[#6b7280] sm:px-5">
              <ShieldCheck className="h-3.5 w-3.5 text-[#006b4f]" />
              {permissions.canViewReceiptFiles
                ? 'Receipt files are available to your role.'
                : 'Receipt details are visible; file downloads remain restricted.'}
            </div>
          ) : null}
        </>
      ) : (
        <RestrictedPanel
          description="This role can view the sponsorship relationship, but payment amounts and receipt history are withheld by the server."
          title="Payment history restricted"
        />
      )}
    </section>
  );
}

function ActivityCard({
  activity,
  canOpenReceipt,
  compact = false,
  onViewAll,
}: {
  activity: MatchDetailActivity[];
  canOpenReceipt: boolean;
  compact?: boolean;
  onViewAll?: () => void;
}) {
  return (
    <section className={workSurface.card}>
      <div className="border-b border-[#e8ece8] px-4 py-3.5 sm:px-5">
        <h2 className="text-lg font-semibold text-[#111827]">
          {compact ? 'Recent Activity' : 'Activity Log'}
        </h2>
        {!compact ? (
          <p className="mt-1 text-xs text-[#6b7280]">
            Match changes and receipt milestones in chronological order
          </p>
        ) : null}
      </div>
      {activity.length > 0 ? (
        <div className="divide-y divide-[#edf0ed] px-4 sm:px-5">
          {activity.map((item) => (
            <div className="grid gap-2 py-3 sm:grid-cols-[1fr_auto] sm:items-center" key={item.id}>
              <div className="flex min-w-0 items-center gap-3">
                <ActivityIcon kind={item.kind} />
                <div className="min-w-0">
                  {item.receiptId && canOpenReceipt ? (
                    <Link
                      className="text-sm font-medium text-[#111827] hover:text-[#006b4f] hover:underline"
                      href={`/admin/receipts/${item.receiptId}`}
                    >
                      {item.label}
                    </Link>
                  ) : (
                    <p className="text-sm font-medium text-[#111827]">{item.label}</p>
                  )}
                  {item.actorName ? (
                    <p className="mt-0.5 text-xs text-[#6b7280]">by {item.actorName}</p>
                  ) : null}
                </div>
              </div>
              <p className="pl-9 text-xs text-[#6b7280] sm:pl-0">{formatDateTime(item.at)}</p>
            </div>
          ))}
        </div>
      ) : (
        <div className="px-5 py-12 text-center">
          <Clock3 className="mx-auto h-8 w-8 text-[#9ca3af]" />
          <p className="mt-3 text-sm font-semibold text-[#374151]">No activity recorded</p>
        </div>
      )}
      {compact && onViewAll && activity.length > 0 ? (
        <div className="border-t border-[#e8ece8] px-4 py-3 text-center sm:px-5">
          <button
            className="text-xs font-semibold text-[#006b4f] hover:underline"
            onClick={onViewAll}
            type="button"
          >
            View complete activity log
          </button>
        </div>
      ) : null}
    </section>
  );
}

function ActivityIcon({ kind }: { kind: MatchDetailActivity['kind'] }) {
  const Icon =
    kind === 'receipt_verified' || kind === 'money_delivered'
      ? CheckCircle2
      : kind === 'receipt_submitted'
        ? ReceiptText
        : kind === 'match_updated'
          ? Pencil
          : Link2;

  return (
    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-emerald-100 bg-emerald-50 text-emerald-700">
      <Icon className="h-3.5 w-3.5" />
    </span>
  );
}

function TermsCard({
  editable,
  match,
  onEdit,
}: {
  editable: boolean;
  match: MatchDetailRecord;
  onEdit: () => void;
}) {
  return (
    <section className={workSurface.card}>
      <div className="flex items-center justify-between gap-3 border-b border-[#e8ece8] px-4 py-3.5">
        <h2 className="text-lg font-semibold text-[#111827]">Sponsorship Terms</h2>
        {editable ? (
          <button
            className={cn(workSurface.secondaryButton, 'h-8 px-3 text-xs')}
            onClick={onEdit}
            type="button"
          >
            Edit Terms
          </button>
        ) : null}
      </div>
      <dl className="space-y-3 p-4 text-sm">
        <TermRow label="Start date" value={formatDate(match.startedAt)} />
        <TermRow
          label="Expected monthly"
          value={match.monthlyAmount === null ? 'Restricted' : formatCurrency(match.monthlyAmount)}
        />
        <TermRow label="Currency" value={match.currency} />
        <TermRow label="Receipt due" value="10th of each month" />
        <TermRow label="Created by" value={match.createdByTeamMember?.fullName ?? 'Not recorded'} />
        <TermRow label="Last updated" value={formatDateTime(match.updatedAt)} />
      </dl>
      {match.statusReason ? (
        <div className="border-t border-[#e8ece8] p-4">
          <p
            className={cn('rounded-lg border px-3 py-2 text-xs font-medium', workflowStatus.amber)}
          >
            Status note: {match.statusReason}
          </p>
        </div>
      ) : null}
    </section>
  );
}

function TermRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] gap-3">
      <dt className="text-[#6b7280]">{label}</dt>
      <dd className="font-medium text-[#1f2937]">{value}</dd>
    </div>
  );
}

function NotesCard({
  editable,
  notes,
  onEdit,
}: {
  editable: boolean;
  notes: string | null;
  onEdit: () => void;
}) {
  return (
    <section className={cn(workSurface.card, 'p-4')}>
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-[#111827]">Internal Notes</h2>
        {editable ? (
          <button
            className="text-xs font-semibold text-[#006b4f] hover:underline"
            onClick={onEdit}
            type="button"
          >
            Edit note
          </button>
        ) : null}
      </div>
      <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-[#374151]">
        {notes || 'No internal notes have been added.'}
      </p>
    </section>
  );
}

function MatchActions({
  canEnd,
  canPause,
  canResume,
  canVoid,
  disabled,
  match,
  onAction,
  onResume,
}: {
  canEnd: boolean;
  canPause: boolean;
  canResume: boolean;
  canVoid: boolean;
  disabled: boolean;
  match: MatchDetailRecord;
  onAction: (action: PendingAction) => void;
  onResume: () => void;
}) {
  return (
    <section className={cn(workSurface.card, 'p-4')} id="match-actions">
      <h2 className="text-lg font-semibold text-[#111827]">Match Actions</h2>
      <div className="mt-3 space-y-2">
        {match.status === 'active' && canPause ? (
          <ActionButton
            disabled={disabled}
            icon={PauseCircle}
            label="Pause Match"
            onClick={() => onAction('pause')}
          />
        ) : null}
        {match.status === 'paused' && canResume ? (
          <ActionButton
            disabled={disabled}
            icon={PlayCircle}
            label="Resume Match"
            onClick={onResume}
          />
        ) : null}
        {(match.status === 'active' || match.status === 'paused') && canEnd ? (
          <ActionButton
            disabled={disabled}
            icon={Clock3}
            label="End Match"
            onClick={() => onAction('end')}
          />
        ) : null}
        {(match.status === 'active' || match.status === 'paused') && canVoid ? (
          <ActionButton
            destructive
            disabled={disabled}
            icon={SquareX}
            label="Void Match"
            onClick={() => onAction('void')}
          />
        ) : null}
      </div>
    </section>
  );
}

function ActionButton({
  destructive = false,
  disabled,
  icon: Icon,
  label,
  onClick,
}: {
  destructive?: boolean;
  disabled: boolean;
  icon: React.ElementType;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      className={cn(
        'inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg border bg-white px-4 text-sm font-semibold transition disabled:cursor-wait disabled:opacity-50',
        destructive
          ? 'border-red-300 text-red-600 hover:bg-red-50'
          : 'border-[#0d6b50] text-[#006b4f] hover:bg-emerald-50',
      )}
      disabled={disabled}
      onClick={onClick}
      type="button"
    >
      <Icon className="h-4 w-4" />
      {label}
    </button>
  );
}

function ReceiptStatusPill({ status }: { status: DonorPortalReceiptStatus }) {
  const tone =
    status === 'verified'
      ? workflowStatus.green
      : status === 'money_delivered'
        ? workflowStatus.blue
        : status === 'rejected'
          ? workflowStatus.red
          : workflowStatus.amber;

  return (
    <span
      className={cn(
        'inline-flex whitespace-nowrap rounded-md border px-2 py-1 text-[0.62rem] font-semibold uppercase tracking-[0.03em]',
        tone,
      )}
    >
      {receiptStatusLabels[status]}
    </span>
  );
}

function CurrentPaymentPill({ status }: { status: CurrentPaymentStatus }) {
  const labels: Record<CurrentPaymentStatus, string> = {
    in_review: 'In Review',
    not_applicable: 'Not Applicable',
    overdue: 'Overdue',
    paid: 'Paid',
    paused: 'Paused',
    partial: 'Partial',
    pending: 'Pending',
    received: 'Received',
    rejected: 'Rejected',
    restricted: 'Restricted',
  };
  const tone =
    status === 'paid' || status === 'received'
      ? workflowStatus.green
      : status === 'overdue' || status === 'rejected'
        ? workflowStatus.red
        : status === 'partial' || status === 'in_review' || status === 'paused'
          ? workflowStatus.amber
          : workflowStatus.neutral;

  return (
    <span className={cn('inline-flex rounded-md border px-2.5 py-1 text-xs font-semibold', tone)}>
      {labels[status]}
    </span>
  );
}

function StatusPill({ status }: { status: SponsorshipMatchStatus }) {
  return (
    <span
      className={cn(
        'inline-flex rounded-lg border px-2.5 py-1 text-xs font-semibold uppercase',
        status === 'active' && workflowStatus.green,
        status === 'paused' && workflowStatus.amber,
        status === 'ended' && workflowStatus.neutral,
        status === 'voided' && workflowStatus.red,
      )}
    >
      {statusLabels[status]}
    </span>
  );
}

function VerificationPill({ status }: { status: OrphanVerificationStatus }) {
  return (
    <span
      className={cn(
        'inline-flex rounded-md border px-2 py-1 text-[0.62rem] font-semibold uppercase tracking-[0.03em]',
        status === 'field_verified' && workflowStatus.green,
        status === 'documents_received' && workflowStatus.blue,
        status === 'needs_more_information' && workflowStatus.amber,
        status === 'rejected' && workflowStatus.red,
        status === 'unverified' && workflowStatus.neutral,
      )}
    >
      {verificationLabels[status]}
    </span>
  );
}

function RestrictedPanel({ description, title }: { description: string; title: string }) {
  return (
    <div className="flex flex-col items-center justify-center px-5 py-14 text-center">
      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#f2f4f2] text-[#6b7280]">
        <LockKeyhole className="h-5 w-5" />
      </span>
      <p className="mt-3 text-sm font-semibold text-[#374151]">{title}</p>
      <p className="mt-1 max-w-lg text-xs leading-5 text-[#6b7280]">{description}</p>
    </div>
  );
}

function matchesPaymentFilter(payment: MatchDetailPayment, filter: PaymentFilter) {
  if (filter === 'all') return true;
  if (filter === 'verified') return payment.status === 'verified';
  if (filter === 'delivered') return payment.status === 'money_delivered';
  if (filter === 'rejected') return payment.status === 'rejected';
  return ['submitted', 'ready_for_review', 'reviewed'].includes(payment.status);
}

function EditMatchModal({
  amount,
  currency,
  mode,
  notes,
  onAmountChange,
  onCancel,
  onNotesChange,
  onSave,
  onStartedAtChange,
  saving,
  startedAt,
}: {
  amount: string;
  currency: string;
  mode: EditMode;
  notes: string;
  onAmountChange: (value: string) => void;
  onCancel: () => void;
  onNotesChange: (value: string) => void;
  onSave: () => void;
  onStartedAtChange: (value: string) => void;
  saving: boolean;
  startedAt: string;
}) {
  return (
    <ModalFrame
      onCancel={onCancel}
      title={mode === 'terms' ? 'Edit Sponsorship Terms' : 'Edit Internal Note'}
    >
      {mode === 'terms' ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Monthly amount">
            <input
              aria-label="Monthly amount"
              className={cn(workSurface.field, 'h-11 w-full px-3')}
              min="1"
              onChange={(event) => onAmountChange(event.target.value)}
              type="number"
              value={amount}
            />
          </Field>
          <Field label="Currency">
            <div className="flex h-11 items-center rounded-lg border border-[#d8ded8] bg-[#f8faf8] px-3 text-sm font-medium text-[#4b5563]">
              {currency}
            </div>
          </Field>
          <div className="sm:col-span-2">
            <Field label="Start date">
              <input
                aria-label="Start date"
                className={cn(workSurface.field, 'h-11 w-full px-3')}
                onChange={(event) => onStartedAtChange(event.target.value)}
                type="date"
                value={startedAt}
              />
            </Field>
          </div>
        </div>
      ) : (
        <Field label="Internal note">
          <textarea
            aria-label="Internal note"
            className={cn(workSurface.field, 'min-h-36 w-full px-3 py-2')}
            maxLength={1200}
            onChange={(event) => onNotesChange(event.target.value)}
            value={notes}
          />
        </Field>
      )}
      <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-end">
        <button
          className={cn(workSurface.secondaryButton, 'h-10 px-4 text-sm')}
          onClick={onCancel}
          type="button"
        >
          Cancel
        </button>
        <button
          className={cn(workSurface.primaryButton, 'h-10 px-4 text-sm')}
          disabled={saving}
          onClick={onSave}
          type="button"
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </ModalFrame>
  );
}

function ActionModal({
  action,
  endedAt,
  onCancel,
  onConfirm,
  onEndedAtChange,
  onReasonChange,
  reason,
  saving,
}: {
  action: PendingAction;
  endedAt: string;
  onCancel: () => void;
  onConfirm: () => void;
  onEndedAtChange: (value: string) => void;
  onReasonChange: (value: string) => void;
  reason: string;
  saving: boolean;
}) {
  return (
    <ModalFrame onCancel={onCancel} title={actionTitles[action]}>
      <p className="mb-4 text-sm text-[#6b7280]">
        Add the operational details. This updates the sponsorship record.
      </p>
      <div className="space-y-4">
        {action === 'end' ? (
          <Field label="End date">
            <input
              aria-label="End date"
              className={cn(workSurface.field, 'h-11 w-full px-3')}
              onChange={(event) => onEndedAtChange(event.target.value)}
              type="date"
              value={endedAt}
            />
          </Field>
        ) : null}
        <Field label="Reason">
          <textarea
            aria-label="Reason"
            className={cn(workSurface.field, 'min-h-28 w-full px-3 py-2')}
            maxLength={600}
            onChange={(event) => onReasonChange(event.target.value)}
            value={reason}
          />
        </Field>
      </div>
      <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-end">
        <button
          className={cn(workSurface.secondaryButton, 'h-10 px-4 text-sm')}
          onClick={onCancel}
          type="button"
        >
          Cancel
        </button>
        <button
          className={cn(workSurface.primaryButton, 'h-10 px-4 text-sm')}
          disabled={saving || !reason.trim()}
          onClick={onConfirm}
          type="button"
        >
          {saving ? 'Updating...' : 'Continue'}
        </button>
      </div>
    </ModalFrame>
  );
}

function ModalFrame({
  children,
  onCancel,
  title,
}: {
  children: React.ReactNode;
  onCancel: () => void;
  title: string;
}) {
  return (
    <div
      aria-modal="true"
      className="fixed inset-0 z-[95] flex items-center justify-center p-4"
      role="dialog"
    >
      <button
        aria-label="Close dialog backdrop"
        className="absolute inset-0 bg-emerald-deepest/44 backdrop-blur-sm"
        onClick={onCancel}
        type="button"
      />
      <div className={cn(workSurface.card, 'relative w-full max-w-lg p-5')}>
        <h2 className="text-lg font-semibold text-[#111827]">{title}</h2>
        <div className="mt-4">{children}</div>
      </div>
    </div>
  );
}

function Field({ children, label }: { children: React.ReactNode; label: string }) {
  return (
    <div>
      <span className="text-xs font-semibold uppercase tracking-[0.05em] text-[#6b7280]">
        {label}
      </span>
      <span className="mt-1.5 block">{children}</span>
    </div>
  );
}

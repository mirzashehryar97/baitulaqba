'use client';

import Image from 'next/image';
import Link from 'next/link';

import {
  BookOpen,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  FileCheck2,
  FileUp,
  HeartHandshake,
  HeartPulse,
  Soup,
} from 'lucide-react';
import useSWR from 'swr';

import { NavLinkIcon, NavLinkSpinner } from '@/components/ui/NavLinkIcon';

import { fetchApiData } from '@/lib/apiFetcher';
import { formatCurrency } from '@/lib/currency';
import { cn } from '@/lib/utils';

import type {
  DonorMonthlyPaymentStatus,
  DonorPortalOrphan,
  DonorPortalSponsorship,
  PortalDashboard,
} from '@/types/portal';

const statusLabels: Record<DonorMonthlyPaymentStatus, string> = {
  due_soon: 'Receipt pending',
  money_delivered: 'Money delivered',
  overdue: 'Overdue',
  pending: 'Receipt pending',
  ready_for_review: 'Ready for review',
  rejected: 'Needs correction',
  reviewed: 'Reviewed',
  submitted: 'Submitted',
  verified: 'Verified',
};

const receiptAttentionStatuses: DonorMonthlyPaymentStatus[] = [
  'due_soon',
  'overdue',
  'pending',
  'rejected',
];

const impactItems = [
  {
    description: 'School fees, learning materials and continued access to education.',
    icon: BookOpen,
    title: 'Education',
    tone: 'green',
  },
  {
    description: 'Monthly essentials and dependable nourishment for each child.',
    icon: Soup,
    title: 'Food support',
    tone: 'gold',
  },
  {
    description: 'Access to medical care and essential health support.',
    icon: HeartPulse,
    title: 'Healthcare',
    tone: 'green',
  },
] as const;

function formatMonth(value: string) {
  return new Intl.DateTimeFormat('en', { month: 'long', year: 'numeric' }).format(new Date(value));
}

function formatMonthShort(value: string) {
  return new Intl.DateTimeFormat('en', { month: 'short' }).format(new Date(value));
}

function formatDonationDeadline(value: string) {
  const [year, month] = value.split('-').map(Number);
  const deadline = new Date(year, month - 1, 10);

  return new Intl.DateTimeFormat('en', { day: 'numeric', month: 'long' }).format(deadline);
}

function formatCompactNumber(value: number) {
  return new Intl.NumberFormat('en-PK', {
    maximumFractionDigits: 0,
    notation: 'compact',
  }).format(value);
}

function getFirstName(name: string) {
  return name.trim().split(/\s+/)[0] || 'Donor';
}

function statusClassName(status: DonorMonthlyPaymentStatus) {
  if (status === 'overdue' || status === 'rejected') {
    return 'border-red-200 bg-red-50 text-red-700';
  }

  if (status === 'due_soon' || status === 'pending') {
    return 'border-[#e7c36d] bg-[#fff4d8] text-[#825200]';
  }

  if (status === 'money_delivered' || status === 'verified') {
    return 'border-emerald-200 bg-emerald-50 text-emerald-800';
  }

  if (status === 'ready_for_review' || status === 'reviewed' || status === 'submitted') {
    return 'border-slate-200 bg-slate-100 text-slate-700';
  }

  return 'border-[#d9ded8] bg-white text-[#4b5563]';
}

function canUploadCurrentReceipt(sponsorship: DonorPortalSponsorship) {
  return !sponsorship.currentMonthReceipt || sponsorship.currentMonthStatus === 'rejected';
}

export function PortalDashboardView({
  donorName,
  initialDashboard,
}: {
  donorName: string;
  initialDashboard: PortalDashboard;
}) {
  const { data } = useSWR<PortalDashboard>('/api/portal/dashboard', fetchApiData, {
    fallbackData: initialDashboard,
  });
  const dashboard = data ?? initialDashboard;
  const activeSponsorships = dashboard.sponsorships.filter(
    (sponsorship) => sponsorship.matchStatus === 'active',
  );
  const currentMonth = activeSponsorships[0]?.currentMonth;
  const currentMonthExpected = activeSponsorships.reduce(
    (total, sponsorship) => total + sponsorship.monthlyAmount,
    0,
  );
  const attentionSponsorships = activeSponsorships.filter((sponsorship) =>
    receiptAttentionStatuses.includes(sponsorship.currentMonthStatus),
  );
  const attentionCount = attentionSponsorships.length;
  const onlyAttentionSponsorship = attentionCount === 1 ? attentionSponsorships[0] : null;
  const hasNoSponsorships = activeSponsorships.length === 0;
  const hasOneDirectUpload =
    onlyAttentionSponsorship && canUploadCurrentReceipt(onlyAttentionSponsorship);
  const monthActionHref = hasNoSponsorships
    ? '/portal/available-orphans'
    : attentionCount === 0
      ? '/portal/receipts'
      : hasOneDirectUpload
        ? `/portal/receipts/upload?matchId=${onlyAttentionSponsorship.matchId}`
        : '/portal/receipts/upload';
  const monthActionLabel = hasNoSponsorships
    ? 'Browse orphans'
    : attentionCount === 0
      ? 'View receipts'
      : hasOneDirectUpload && activeSponsorships.length === 1
        ? 'Upload receipt'
        : 'Manage receipts';
  const receiptSummary = hasNoSponsorships
    ? 'No active sponsorships'
    : attentionCount === 0
      ? 'All receipts submitted'
      : `${attentionCount} ${attentionCount === 1 ? 'receipt needs' : 'receipts need'} attention`;
  const commitmentContext = hasNoSponsorships
    ? 'Choose an orphan profile when you are ready to begin.'
    : activeSponsorships.length === 1
      ? 'For your active sponsorship'
      : `Across ${activeSponsorships.length} active sponsorships`;

  return (
    <div className="space-y-5 pb-2 font-sans text-[#17211d] sm:space-y-6">
      <section>
        <h2 className="font-serif text-4xl font-semibold leading-none tracking-[-0.025em] text-[#10241c] sm:text-[2.75rem]">
          Assalamu Alaikum, {getFirstName(donorName)}
        </h2>
        <p className="mt-2 text-sm text-[#65716b] sm:text-base">
          Here&apos;s the impact of your sponsorship.
        </p>
      </section>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.62fr)_minmax(18rem,1fr)]">
        <article className="relative overflow-hidden rounded-[1.15rem] bg-[#063e30] px-5 py-5 text-white shadow-[0_20px_45px_-30px_rgba(4,54,41,0.8)] sm:px-6">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_85%_10%,rgba(200,163,91,0.13),transparent_34%)]" />
          <div className="relative grid gap-5 lg:grid-cols-[auto_minmax(0,1fr)_auto] lg:items-center">
            <div className="border-white/15 lg:border-r lg:pr-6">
              <p className="text-sm font-medium text-white/72">This month</p>
              <p className="mt-1 text-2xl font-semibold text-[#e3b954]">
                {currentMonth ? formatMonth(currentMonth) : 'Current month'}
              </p>
            </div>

            <div className="min-w-0">
              <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                <p className="text-3xl font-semibold tracking-[-0.03em] text-white sm:text-4xl">
                  {hasNoSponsorships ? 'No commitment yet' : formatCurrency(currentMonthExpected)}
                </p>
                {!hasNoSponsorships ? (
                  <span className="text-sm font-medium text-white/72">monthly commitment</span>
                ) : null}
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <span
                  className={cn(
                    'inline-flex rounded-full border px-3 py-1 text-xs font-semibold',
                    attentionCount > 0
                      ? 'border-[#dfa72a]/50 bg-[#b87500] text-white'
                      : 'border-emerald-200/20 bg-white/10 text-emerald-50',
                  )}
                >
                  {receiptSummary}
                </span>
                <span className="text-xs font-medium text-white/68">{commitmentContext}</span>
              </div>
            </div>

            <div className="flex flex-col items-start gap-3 lg:items-stretch">
              <Link
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-[#e1b656] bg-[#e4b84f] px-5 text-sm font-bold text-[#2f2209] shadow-sm transition hover:border-[#edc76f] hover:bg-[#edc76f]"
                href={monthActionHref}
              >
                <NavLinkIcon className="h-4 w-4" icon={FileUp} />
                {monthActionLabel}
              </Link>
              {currentMonth ? (
                <span className="inline-flex items-center gap-2 text-xs font-medium text-white/78">
                  <CalendarDays className="h-4 w-4" />
                  Submit by {formatDonationDeadline(currentMonth)}
                </span>
              ) : null}
            </div>
          </div>
        </article>

        <article className="relative overflow-hidden rounded-[1.15rem] border border-[#e6d6b7] bg-[#fcf7ed] px-5 py-5 shadow-[0_18px_45px_-36px_rgba(74,56,21,0.5)] sm:px-6">
          <HeartHandshake
            aria-hidden="true"
            className="absolute -bottom-5 -right-3 h-36 w-36 text-[#c9a760]/10"
            strokeWidth={1.15}
          />
          <div className="relative">
            <p className="text-lg font-semibold text-[#16372c]">Your impact</p>
            <p className="mt-4 break-words text-3xl font-semibold tracking-[-0.035em] text-[#07513f] sm:text-4xl">
              {formatCurrency(dashboard.contributionSummary.lifetimeVerified)}
            </p>
            <p className="mt-1.5 text-base font-semibold text-[#b2740d]">Lifetime verified</p>
            <p className="mt-2 text-sm text-[#66716c]">Across all of your sponsorships</p>
          </div>
        </article>
      </section>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,0.93fr)_minmax(0,1.07fr)]">
        <SponsorshipPanel sponsorships={activeSponsorships} />
        <ContributionChart dashboard={dashboard} />
      </div>

      <section className="rounded-[1.15rem] border border-[#dfe3dc] bg-white p-4 shadow-[0_18px_45px_-38px_rgba(17,55,43,0.5)] sm:p-5">
        <div>
          <h3 className="text-xl font-semibold tracking-[-0.02em] text-[#17342a]">
            Your sponsorship supports
          </h3>
          <p className="mt-1 text-sm text-[#68736d]">
            Care that reaches every part of a child&apos;s life.
          </p>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {impactItems.map((item) => (
            <article
              className={cn(
                'flex min-w-0 items-start gap-4 rounded-xl border p-4',
                item.tone === 'gold'
                  ? 'border-[#ead8b5] bg-[#fff9ef]'
                  : 'border-[#d7e5de] bg-[#f5faf7]',
              )}
              key={item.title}
            >
              <span
                className={cn(
                  'flex h-12 w-12 shrink-0 items-center justify-center rounded-xl',
                  item.tone === 'gold'
                    ? 'bg-[#f8e8c5] text-[#b77910]'
                    : 'bg-[#e5f2eb] text-[#0c6a50]',
                )}
              >
                <item.icon className="h-6 w-6" strokeWidth={1.7} />
              </span>
              <div className="min-w-0">
                <h4 className="font-semibold text-[#17372c]">{item.title}</h4>
                <p className="mt-1 text-xs leading-5 text-[#69736e]">{item.description}</p>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

function SponsorshipPanel({ sponsorships }: { sponsorships: DonorPortalSponsorship[] }) {
  const displayedSponsorships = sponsorships.slice(0, 3);
  const hasOneSponsorship = sponsorships.length === 1;

  return (
    <section className="flex min-h-[22rem] min-w-0 flex-col overflow-hidden rounded-[1.15rem] border border-[#dfe3dc] bg-white p-4 shadow-[0_18px_45px_-38px_rgba(17,55,43,0.5)] sm:p-5">
      <div className="flex flex-wrap items-center gap-3">
        <h3 className="text-xl font-semibold tracking-[-0.02em] text-[#17342a]">
          {hasOneSponsorship ? 'My sponsorship' : 'My sponsorships'}
        </h3>
        <span className="inline-flex rounded-full bg-[#e5f1e9] px-3 py-1 text-xs font-semibold text-[#285746]">
          {sponsorships.length} active
        </span>
      </div>

      {sponsorships.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center px-4 py-8 text-center">
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-[#edf5f0] text-[#0c624a]">
            <HeartHandshake className="h-8 w-8" strokeWidth={1.6} />
          </span>
          <h4 className="mt-4 text-lg font-semibold text-[#17342a]">No active sponsorships yet</h4>
          <p className="mt-2 max-w-sm text-sm leading-6 text-[#68736d]">
            Explore verified orphan profiles when you are ready to begin a sponsorship.
          </p>
          <Link
            className="mt-5 inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-[#07543f] px-4 text-sm font-semibold text-white transition hover:bg-[#063e30]"
            href="/portal/available-orphans"
          >
            Browse available orphans
            <NavLinkIcon className="h-4 w-4" icon={ChevronRight} />
          </Link>
        </div>
      ) : hasOneSponsorship ? (
        <SingleSponsorship sponsorship={sponsorships[0]} />
      ) : (
        <>
          <div className="mt-4 divide-y divide-[#e2e6e1] overflow-hidden rounded-xl border border-[#e1e5df]">
            {displayedSponsorships.map((sponsorship) => (
              <SponsorshipRow
                generous={sponsorships.length === 2}
                key={sponsorship.matchId}
                sponsorship={sponsorship}
              />
            ))}
          </div>
          <Link
            className="mt-auto inline-flex items-center gap-1.5 pt-4 text-sm font-semibold text-[#07543f] underline-offset-4 transition hover:underline"
            href="/portal/sponsorships"
          >
            View all sponsorships
            <NavLinkIcon className="h-4 w-4" icon={ChevronRight} />
          </Link>
        </>
      )}
    </section>
  );
}

function SingleSponsorship({ sponsorship }: { sponsorship: DonorPortalSponsorship }) {
  const canUpload = canUploadCurrentReceipt(sponsorship);

  return (
    <div className="flex flex-1 flex-col justify-center py-5">
      <div className="grid items-center gap-5 sm:grid-cols-[7rem_minmax(0,1fr)]">
        <OrphanAvatar className="h-28 w-28" orphan={sponsorship.orphan} />
        <div className="min-w-0">
          <Link
            className="text-2xl font-semibold tracking-[-0.025em] text-[#172d25] underline-offset-4 hover:underline"
            href={`/portal/sponsorships/${sponsorship.matchId}`}
          >
            {sponsorship.orphan.fullName}
          </Link>
          <p className="mt-1 text-sm font-medium text-[#6b756f]">{sponsorship.orphan.orphanCode}</p>
          <p className="mt-2 text-xl font-semibold text-[#18392e]">
            {formatCurrency(sponsorship.monthlyAmount)}
            <span className="ml-1 text-sm font-medium text-[#6d7772]">/ month</span>
          </p>
          <span
            className={cn(
              'mt-3 inline-flex rounded-full border px-3 py-1 text-xs font-semibold',
              statusClassName(sponsorship.currentMonthStatus),
            )}
          >
            {statusLabels[sponsorship.currentMonthStatus]}
          </span>
        </div>
      </div>

      <div className="mt-5 flex flex-col gap-3 border-t border-[#e4e7e2] pt-4 sm:flex-row sm:items-center sm:justify-between">
        <span className="inline-flex items-center gap-2 text-sm font-medium text-[#17644d]">
          <CheckCircle2 className="h-5 w-5" />
          Sponsorship active
        </span>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-[#d8dfd9] bg-white px-4 text-sm font-semibold text-[#255243] transition hover:bg-[#f7faf8]"
            href={`/portal/sponsorships/${sponsorship.matchId}`}
          >
            View sponsorship
            <NavLinkSpinner className="h-4 w-4" />
          </Link>
          <Link
            className={cn(
              'inline-flex min-h-10 items-center justify-center gap-2 rounded-lg px-4 text-sm font-semibold transition',
              canUpload
                ? 'border border-[#daa72f] bg-[#e4b84f] text-[#33250b] hover:bg-[#edc76f]'
                : 'border border-[#d8dfd9] bg-white text-[#255243] hover:bg-[#f7faf8]',
            )}
            href={
              canUpload
                ? `/portal/receipts/upload?matchId=${sponsorship.matchId}`
                : '/portal/receipts'
            }
          >
            {canUpload ? 'Upload receipt' : 'View receipt'}
            <NavLinkSpinner className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}

function SponsorshipRow({
  generous,
  sponsorship,
}: {
  generous: boolean;
  sponsorship: DonorPortalSponsorship;
}) {
  const canUpload = canUploadCurrentReceipt(sponsorship);

  return (
    <article
      className={cn(
        'flex min-w-0 flex-col gap-3 bg-white px-3.5 sm:flex-row sm:items-center sm:justify-between',
        generous ? 'py-5' : 'py-3.5',
      )}
    >
      <div className="flex min-w-0 items-center gap-3">
        <OrphanAvatar className="h-14 w-14" orphan={sponsorship.orphan} />
        <div className="min-w-0">
          <Link
            className="block truncate font-semibold text-[#172d25] underline-offset-4 hover:underline"
            href={`/portal/sponsorships/${sponsorship.matchId}`}
          >
            {sponsorship.orphan.fullName}
          </Link>
          <p className="mt-0.5 text-xs font-medium text-[#707a74]">
            {sponsorship.orphan.orphanCode}
          </p>
          <p className="mt-1 text-sm font-semibold text-[#18392e]">
            {formatCurrency(sponsorship.monthlyAmount)}
            <span className="ml-1 text-xs font-medium text-[#707a74]">/ month</span>
          </p>
        </div>
      </div>

      <div className="flex shrink-0 flex-wrap items-center gap-2 sm:flex-col sm:items-stretch">
        <span
          className={cn(
            'inline-flex min-w-24 justify-center rounded-full border px-3 py-1 text-xs font-semibold',
            statusClassName(sponsorship.currentMonthStatus),
          )}
        >
          {statusLabels[sponsorship.currentMonthStatus]}
        </span>
        <Link
          className="inline-flex min-h-8 min-w-24 items-center justify-center gap-1.5 rounded-lg border border-[#cfd8d1] bg-white px-3 text-xs font-semibold text-[#225342] transition hover:border-[#9fb6aa] hover:bg-[#f7faf8]"
          href={
            canUpload
              ? `/portal/receipts/upload?matchId=${sponsorship.matchId}`
              : '/portal/receipts'
          }
        >
          {canUpload ? 'Upload' : 'View'}
          <NavLinkSpinner className="h-3.5 w-3.5" />
        </Link>
      </div>
    </article>
  );
}

function OrphanAvatar({ className, orphan }: { className: string; orphan: DonorPortalOrphan }) {
  if (!orphan.profileImageUrl) {
    return (
      <span
        aria-label={`${orphan.fullName} profile placeholder`}
        className={cn(
          'flex shrink-0 items-center justify-center rounded-full bg-[#e8f1ec] text-[#17634d]',
          className,
        )}
        role="img"
      >
        <HeartHandshake className="h-1/2 w-1/2" strokeWidth={1.5} />
      </span>
    );
  }

  return (
    <Image
      alt={`${orphan.fullName} profile`}
      className={cn('shrink-0 rounded-full object-cover', className)}
      height={112}
      src={orphan.profileImageUrl}
      unoptimized
      width={112}
    />
  );
}

function ContributionChart({ dashboard }: { dashboard: PortalDashboard }) {
  const series = dashboard.contributionSummary.monthlySeries;
  const maxChartValue = Math.max(1, ...series.map((point) => point.verified));
  const chartTicks = [1, 0.75, 0.5, 0.25, 0].map((ratio) => ({
    key: String(ratio),
    value: Math.round(maxChartValue * ratio),
  }));

  return (
    <section className="flex min-h-[22rem] min-w-0 flex-col overflow-hidden rounded-[1.15rem] border border-[#dfe3dc] bg-white p-4 shadow-[0_18px_45px_-38px_rgba(17,55,43,0.5)] sm:p-5">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-baseline sm:justify-between">
        <h3 className="text-xl font-semibold tracking-[-0.02em] text-[#17342a]">
          Contribution history
        </h3>
        <p className="text-sm text-[#65716b]">
          <span className="text-lg font-semibold text-[#174c3b]">
            {formatCurrency(dashboard.contributionSummary.thisYearVerified)}
          </span>{' '}
          verified
        </p>
      </div>

      {series.length > 0 ? (
        <div
          aria-label={`Verified contributions over ${series.length} months`}
          className="mt-6 grid flex-1 grid-cols-[auto_minmax(0,1fr)] gap-3"
          role="img"
        >
          <div className="flex h-52 flex-col justify-between pb-7 text-right text-[0.65rem] font-medium text-[#7a847f]">
            {chartTicks.map((tick) => (
              <span key={tick.key}>{formatCompactNumber(tick.value)}</span>
            ))}
          </div>

          <div className="relative flex h-52 items-end gap-2 border-b border-[#dfe4df] pb-7 sm:gap-3">
            <div className="pointer-events-none absolute inset-x-0 bottom-7 top-0 flex flex-col justify-between">
              {chartTicks.slice(0, -1).map((tick) => (
                <span className="block border-t border-dashed border-[#e4e8e4]" key={tick.key} />
              ))}
            </div>

            {series.map((point, index) => {
              const barHeight = Math.max(3, (point.verified / maxChartValue) * 100);
              const isLatest = index === series.length - 1;

              return (
                <div
                  className="relative z-10 flex h-full min-w-0 flex-1 flex-col justify-end"
                  key={point.month}
                >
                  <div
                    className={cn(
                      'mx-auto w-[58%] min-w-3 rounded-t-sm transition-colors',
                      isLatest ? 'bg-[#d9a62e]' : 'bg-[#07543f]',
                    )}
                    style={{ height: `${barHeight}%` }}
                    title={`${formatMonth(point.month)}: ${formatCurrency(point.verified)}`}
                  />
                  <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[0.65rem] font-medium text-[#626d67]">
                    {formatMonthShort(point.month)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="flex flex-1 flex-col items-center justify-center py-10 text-center">
          <FileCheck2 className="h-9 w-9 text-[#7b9489]" strokeWidth={1.5} />
          <p className="mt-3 text-sm font-medium text-[#5f6d66]">
            Verified contributions will appear here.
          </p>
        </div>
      )}
    </section>
  );
}

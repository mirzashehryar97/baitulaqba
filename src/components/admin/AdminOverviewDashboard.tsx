'use client';

import { useMemo, useState } from 'react';

import Link from 'next/link';

import {
  ArrowRight,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronRight,
  ClipboardCheck,
  Clock3,
  Droplets,
  FileCheck2,
  HandHeart,
  HeartHandshake,
  Landmark,
  PhoneCall,
  Plus,
  ReceiptText,
  Send,
  UserPlus,
  UsersRound,
  WalletCards,
} from 'lucide-react';
import useSWR from 'swr';

import { useAdminAccount } from '@/components/admin/AdminShell';
import { CustomSelect } from '@/components/ui/CustomSelect';
import { NavLinkIcon } from '@/components/ui/NavLinkIcon';

import {
  canCreateSponsorshipRequests,
  canViewFinanceSummary,
  canViewMatches,
  canViewOrphans,
  canViewSponsorshipRequests,
} from '@/lib/adminPermissions';
import { fetchApiData } from '@/lib/apiFetcher';
import { buildMonthOptions } from '@/lib/months';
import { cn } from '@/lib/utils';

import type {
  AdminDashboardActivity,
  AdminDashboardActivityKind,
  AdminDashboardContributionMonth,
  AdminDashboardSummary,
} from '@/types/dashboard';

const cardClass =
  'rounded-lg border border-[#dfe5df] bg-white shadow-[0_14px_40px_-34px_rgba(17,24,39,0.45)]';

function compactCurrency(amount: number) {
  if (amount >= 1_000_000) {
    return `PKR ${(amount / 1_000_000).toFixed(amount >= 10_000_000 ? 1 : 2)}M`;
  }
  if (amount >= 1_000) {
    return `PKR ${(amount / 1_000).toFixed(amount >= 100_000 ? 0 : 1)}K`;
  }
  return `PKR ${Math.round(amount).toLocaleString('en-PK')}`;
}

function fullAmount(amount: number) {
  return new Intl.NumberFormat('en-PK', {
    maximumFractionDigits: 0,
  }).format(amount);
}

function axisCurrency(amount: number) {
  if (amount >= 1_000_000) return `PKR ${(amount / 1_000_000).toFixed(1)}M`;
  if (amount >= 1_000) return `PKR ${Math.round(amount / 1_000)}K`;
  return `PKR ${Math.round(amount)}`;
}

function relativeTime(value: string) {
  const difference = Date.now() - new Date(value).getTime();
  const minutes = Math.max(0, Math.floor(difference / 60_000));

  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;

  return new Intl.DateTimeFormat('en', { day: 'numeric', month: 'short' }).format(new Date(value));
}

export function AdminOverviewDashboard({
  initialSummary,
}: {
  initialSummary: AdminDashboardSummary;
}) {
  const { teamMember } = useAdminAccount();
  const initialMonth = initialSummary.month.slice(0, 7);
  const [month, setMonth] = useState(initialMonth);
  const monthOptions = useMemo(
    () => buildMonthOptions({ includeAll: false, monthsAhead: 0, monthsBack: 18 }),
    [],
  );
  const { data, error, isValidating } = useSWR<AdminDashboardSummary>(
    `/api/admin/dashboard?month=${month}`,
    fetchApiData,
    {
      dedupingInterval: 15_000,
      fallbackData: month === initialMonth ? initialSummary : undefined,
      keepPreviousData: true,
      revalidateOnFocus: true,
      revalidateOnMount: month !== initialMonth,
    },
  );
  const summary = data ?? initialSummary;
  const selectedMonthLabel =
    monthOptions.find((option) => option.value === month)?.label ?? 'Selected month';
  const canQuickAdd = canCreateSponsorshipRequests(teamMember);

  const kpis = [
    {
      available: canViewSponsorshipRequests(teamMember),
      href: '/admin/sponsorship-requests',
      icon: UserPlus,
      label: 'New Requests',
      tone: 'green' as const,
      value: summary.kpis.newRequests.toLocaleString('en-PK'),
    },
    {
      available: canViewOrphans(teamMember),
      href: '/admin/orphans',
      icon: UsersRound,
      label: 'Profiles Under Review',
      tone: 'amber' as const,
      value: summary.kpis.profilesUnderReview.toLocaleString('en-PK'),
    },
    {
      available: canViewMatches(teamMember),
      href: '/admin/matches',
      icon: HeartHandshake,
      label: 'Active Matches',
      tone: 'green' as const,
      value: summary.kpis.activeMatches.toLocaleString('en-PK'),
    },
    {
      available: canViewFinanceSummary(teamMember),
      href: '/admin/receipts',
      icon: ReceiptText,
      label: 'Receipts Need Review',
      tone: 'amber' as const,
      value: summary.kpis.receiptsNeedReview.toLocaleString('en-PK'),
    },
    {
      available: canViewFinanceSummary(teamMember),
      href: '/admin/unpaid-donors',
      icon: Clock3,
      label: 'Overdue Donors',
      tone: 'red' as const,
      value: summary.kpis.overdueDonors.toLocaleString('en-PK'),
    },
    {
      available: canViewFinanceSummary(teamMember),
      href: '/admin/receipts',
      icon: WalletCards,
      label: 'Verified This Month',
      tone: 'green' as const,
      value: compactCurrency(summary.kpis.verifiedThisMonth),
    },
  ].filter((kpi) => kpi.available);

  return (
    <div className="space-y-4 pb-5">
      <section className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-[1.85rem] font-semibold leading-tight tracking-[-0.035em] text-[#111827] sm:text-[2rem]">
              Orphan Sponsorship Overview
            </h1>
            {isValidating ? (
              <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.08em] text-emerald-700">
                Syncing
              </span>
            ) : null}
          </div>
          <p className="mt-1 text-sm font-normal text-[#6b7280]">
            Operations, sponsorship health and finance at a glance.
          </p>
          {error ? (
            <p className="mt-1.5 text-xs font-medium text-red-600">
              Live refresh failed. Showing the most recent dashboard data.
            </p>
          ) : null}
        </div>

        <div className="flex items-center gap-2">
          <div className="relative w-40">
            <CalendarDays className="pointer-events-none absolute left-3 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-[#374151]" />
            <CustomSelect
              ariaLabel="Dashboard month"
              onChange={setMonth}
              options={monthOptions}
              triggerClassName="h-10 border-[#d9ded8] pl-9 pr-2 font-medium text-[#1f2937]"
              value={month}
            />
          </div>
          {canQuickAdd ? (
            <Link
              className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-[#006b4f] bg-[#006b4f] px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-[#07543f]"
              href="/admin/sponsorship-requests"
            >
              <NavLinkIcon className="h-4 w-4" icon={Plus} />
              Quick Add
            </Link>
          ) : null}
        </div>
      </section>

      {kpis.length > 0 ? (
        <section className="grid grid-cols-2 gap-3 xl:grid-cols-3 2xl:grid-cols-6">
          {kpis.map((kpi) => (
            <KpiCard key={kpi.label} {...kpi} />
          ))}
        </section>
      ) : null}

      {summary.availability.finance ? <LifetimeContributionSummary summary={summary} /> : null}

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.48fr)_minmax(22rem,1fr)]">
        {summary.availability.finance ? (
          <ContributionHealthChart data={summary.contributionHealth} />
        ) : (
          <PermissionAwarePlaceholder />
        )}
        <AttentionRequired selectedMonthLabel={selectedMonthLabel} summary={summary} />
      </section>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.48fr)_minmax(22rem,1fr)]">
        <SponsorshipPipeline summary={summary} selectedMonthLabel={selectedMonthLabel} />
        <RecentActivity activity={summary.activity} />
      </section>

      <InitiativesAtGlance summary={summary} />
    </div>
  );
}

function KpiCard({
  href,
  icon: Icon,
  label,
  tone,
  value,
}: {
  href: string;
  icon: typeof UserPlus;
  label: string;
  tone: 'amber' | 'green' | 'red';
  value: string;
}) {
  const tones = {
    amber: 'bg-[#fff4d8] text-[#b77900]',
    green: 'bg-[#e6f3ec] text-[#075b43]',
    red: 'bg-[#fee9e7] text-[#ef4444]',
  };

  return (
    <Link
      className={cn(
        cardClass,
        'group flex min-h-[5.65rem] items-center gap-3 px-3.5 py-3 transition hover:-translate-y-0.5 hover:border-[#b9c9be]',
      )}
      href={href}
    >
      <span
        className={cn(
          'flex h-11 w-11 shrink-0 items-center justify-center rounded-full',
          tones[tone],
        )}
      >
        <NavLinkIcon className="h-5 w-5" icon={Icon} />
      </span>
      <span className="min-w-0">
        <span className="block truncate text-xs font-medium text-[#4b5563]">{label}</span>
        <span className="mt-1 block truncate text-[1.45rem] font-semibold leading-none tracking-[-0.03em] text-[#111827]">
          {value}
        </span>
      </span>
    </Link>
  );
}

function LifetimeContributionSummary({ summary }: { summary: AdminDashboardSummary }) {
  const cards: Array<{
    description: string;
    icon: typeof WalletCards;
    label: string;
    tone: 'amber' | 'gold' | 'green' | 'neutral';
    value: string;
  }> = [
    {
      description: 'Verified and delivered receipts',
      icon: WalletCards,
      label: 'Lifetime Verified',
      tone: 'green',
      value: fullAmount(summary.lifetimeContributions.verifiedAmount),
    },
    {
      description: 'Confirmed as delivered to date',
      icon: HandHeart,
      label: 'Money Delivered',
      tone: 'gold',
      value: fullAmount(summary.lifetimeContributions.deliveredAmount),
    },
    {
      description: 'Submitted, ready or reviewed',
      icon: Clock3,
      label: 'Amount In Review',
      tone: 'amber',
      value: fullAmount(summary.lifetimeContributions.awaitingReviewAmount),
    },
    {
      description: 'Every submitted receipt record',
      icon: ReceiptText,
      label: 'Total Receipts',
      tone: 'neutral',
      value: summary.lifetimeContributions.receiptCount.toLocaleString('en-PK'),
    },
  ];
  const tones = {
    amber: 'border-amber-200 bg-amber-50 text-amber-700',
    gold: 'border-[#ecdcae] bg-[#fff9e9] text-[#a56c00]',
    green: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    neutral: 'border-[#dfe5df] bg-[#f7f9f7] text-[#4b5563]',
  };

  return (
    <section className={cn(cardClass, 'p-4')}>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-base font-semibold tracking-[-0.02em] text-[#111827]">
            Contributions to Date
          </h2>
          <p className="mt-1 text-xs font-normal text-[#6b7280]">
            All donors and sponsorships · Complete receipt history · Amounts in PKR
          </p>
        </div>
        <span className="inline-flex w-max rounded-full border border-[#c9ded3] bg-[#eef7f2] px-2.5 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.08em] text-[#075b43]">
          All time
        </span>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <Link
            className="group flex min-w-0 items-start gap-3 rounded-lg border border-[#e1e6e1] bg-white p-3 transition hover:-translate-y-0.5 hover:border-[#b8cbbf] hover:shadow-[0_12px_30px_-24px_rgba(17,55,43,0.6)]"
            href="/admin/receipts"
            key={card.label}
          >
            <span
              className={cn(
                'mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-full border',
                tones[card.tone],
              )}
            >
              <NavLinkIcon className="h-5 w-5" icon={card.icon} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-xs font-medium text-[#66716c]">{card.label}</span>
              <span className="mt-1 block text-xl font-semibold leading-tight tracking-[-0.03em] text-[#111827] [overflow-wrap:anywhere]">
                {card.value}
              </span>
              <span className="mt-1.5 block text-[0.68rem] font-normal leading-snug text-[#7a837e]">
                {card.description}
              </span>
            </span>
            <ChevronRight className="mt-3.5 h-4 w-4 shrink-0 text-[#8a938e] transition group-hover:translate-x-0.5 group-hover:text-[#006b4f]" />
          </Link>
        ))}
      </div>
    </section>
  );
}

function ContributionHealthChart({ data }: { data: AdminDashboardContributionMonth[] }) {
  const rawMax = Math.max(
    0,
    ...data.flatMap((item) => [item.expected, item.verified, item.delivered]),
  );
  const step =
    rawMax >= 1_000_000
      ? 250_000
      : rawMax >= 400_000
        ? 100_000
        : rawMax >= 200_000
          ? 50_000
          : 25_000;
  const chartMax = Math.max(step, Math.ceil(rawMax / step) * step);
  const ticks = [chartMax, chartMax * 0.75, chartMax * 0.5, chartMax * 0.25, 0];
  const latest = data.at(-1) ?? { delivered: 0, expected: 0, verified: 0 };

  return (
    <section className={cn(cardClass, 'min-w-0 p-4')} id="contribution-health">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h3 className="text-base font-semibold tracking-[-0.02em] text-[#111827]">
            Contribution Health
          </h3>
          <p className="mt-1 text-xs font-normal text-[#6b7280]">
            Expected, verified and delivered · Last 6 months
          </p>
        </div>
        <div className="grid grid-cols-3 gap-4 sm:gap-6">
          <ChartLegend
            color="bg-[#075844]"
            label="Expected"
            value={compactCurrency(latest.expected)}
          />
          <ChartLegend
            color="bg-[#0b8b63]"
            label="Verified"
            value={compactCurrency(latest.verified)}
          />
          <ChartLegend
            color="bg-[#d39a22]"
            label="Delivered"
            value={compactCurrency(latest.delivered)}
          />
        </div>
      </div>

      <div className="mt-4 grid h-44 grid-cols-[3.4rem_minmax(0,1fr)] gap-2">
        <div className="flex flex-col justify-between pb-5 text-right text-[0.65rem] font-medium text-[#6b7280]">
          {ticks.map((tick) => (
            <span key={tick}>{axisCurrency(tick)}</span>
          ))}
        </div>
        <div className="relative min-w-0">
          <div className="absolute inset-x-0 bottom-5 top-0 flex flex-col justify-between">
            {ticks.map((tick) => (
              <span className="block border-t border-[#e7ebe7]" key={tick} />
            ))}
          </div>
          <div className="absolute inset-x-1 bottom-0 top-0 grid grid-cols-6 gap-3 sm:gap-5">
            {data.map((item) => (
              <div className="flex min-w-0 flex-col" key={item.month}>
                <div className="flex flex-1 items-end justify-center gap-1 sm:gap-1.5">
                  <ChartBar color="bg-[#075844]" max={chartMax} value={item.expected} />
                  <ChartBar color="bg-[#0b8b63]" max={chartMax} value={item.verified} />
                  <ChartBar color="bg-[#d39a22]" max={chartMax} value={item.delivered} />
                </div>
                <span className="mt-1.5 text-center text-[0.68rem] font-medium text-[#6b7280]">
                  {item.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function ChartLegend({ color, label, value }: { color: string; label: string; value: string }) {
  return (
    <div className="min-w-0">
      <span className="flex items-center gap-1.5 text-[0.67rem] font-medium text-[#4b5563]">
        <span className={cn('h-2 w-2 shrink-0 rounded-full', color)} />
        {label}
      </span>
      <span className="mt-1 block whitespace-nowrap text-xs font-semibold text-[#111827]">
        {value}
      </span>
    </div>
  );
}

function ChartBar({ color, max, value }: { color: string; max: number; value: number }) {
  return (
    <span
      className={cn('relative z-10 block w-3.5 rounded-t-[3px] sm:w-5', color)}
      style={{ height: value > 0 ? `${Math.max(3, (value / max) * 100)}%` : 0 }}
      title={compactCurrency(value)}
    />
  );
}

function AttentionRequired({
  selectedMonthLabel,
  summary,
}: {
  selectedMonthLabel: string;
  summary: AdminDashboardSummary;
}) {
  const selectedMonthName = selectedMonthLabel.split(' ')[0] ?? 'this month';
  const rows = [
    {
      count: summary.workQueue.orphanProfilesAwaitingApproval,
      href: '/admin/orphans',
      label: 'Orphan profiles awaiting approval',
      show: summary.availability.orphans,
      tone: 'amber' as const,
    },
    {
      count: summary.workQueue.receiptsReadyForReview,
      href: '/admin/receipts',
      label: 'Receipts ready for review',
      show: summary.availability.finance,
      tone: 'amber' as const,
    },
    {
      count: summary.workQueue.unpaidDonors,
      href: '/admin/unpaid-donors',
      label: `Donors unpaid for ${selectedMonthName}`,
      show: summary.availability.finance,
      tone: 'red' as const,
    },
    {
      count: summary.workQueue.followUpsDue,
      href: '/admin/sponsorship-requests',
      label: 'Follow-ups due today',
      show: summary.availability.requests,
      tone: 'green' as const,
    },
  ].filter((row) => row.show);

  return (
    <section className={cn(cardClass, 'overflow-hidden')}>
      <div className="flex h-[3.75rem] items-center justify-between border-b border-[#e8ece8] px-5">
        <h3 className="text-base font-semibold tracking-[-0.02em] text-[#111827]">
          Attention Required
        </h3>
        <Link className="text-xs font-medium text-[#006b4f] hover:underline" href="/admin">
          View all
        </Link>
      </div>
      <div className="divide-y divide-[#e8ece8] px-3">
        {rows.map((row) => (
          <Link
            className="group flex min-h-[3.55rem] items-center gap-3 px-2 transition hover:bg-[#f8faf8]"
            href={row.href}
            key={row.label}
          >
            <span
              className={cn(
                'h-2.5 w-2.5 shrink-0 rounded-full',
                row.tone === 'red'
                  ? 'bg-red-500'
                  : row.tone === 'amber'
                    ? 'bg-[#dba326]'
                    : 'bg-emerald-500',
              )}
            />
            <span className="min-w-0 flex-1 truncate text-sm font-medium text-[#1f2937]">
              {row.label}
            </span>
            <span
              className={cn(
                'min-w-11 rounded-md border px-2 py-1 text-center text-xs font-semibold',
                row.tone === 'red'
                  ? 'border-red-200 bg-red-50 text-red-700'
                  : row.tone === 'amber'
                    ? 'border-amber-200 bg-amber-50 text-amber-800'
                    : 'border-emerald-200 bg-emerald-50 text-emerald-700',
              )}
            >
              {row.count}
            </span>
            <NavLinkIcon
              className="h-4 w-4 text-[#111827] transition group-hover:translate-x-0.5"
              icon={ChevronRight}
            />
          </Link>
        ))}
      </div>
    </section>
  );
}

function SponsorshipPipeline({
  selectedMonthLabel,
  summary,
}: {
  selectedMonthLabel: string;
  summary: AdminDashboardSummary;
}) {
  const stages = [
    { icon: UserPlus, label: 'New', value: summary.pipeline.new },
    { icon: PhoneCall, label: 'Contacted', value: summary.pipeline.contacted },
    { icon: ClipboardCheck, label: 'Profiles Prepared', value: summary.pipeline.profilesPrepared },
    { icon: Send, label: 'Profiles Shared', value: summary.pipeline.profilesShared },
    { icon: CheckCircle2, label: 'Converted', value: summary.pipeline.converted },
    { icon: HandHeart, label: 'Matched', value: summary.pipeline.matched, final: true },
  ];

  return (
    <section className={cn(cardClass, 'min-w-0 p-4')}>
      <div className="flex items-center justify-between gap-4">
        <h3 className="text-base font-semibold tracking-[-0.02em] text-[#111827]">
          Sponsorship Pipeline
        </h3>
        <span className="text-[0.68rem] font-medium text-[#4b5563]">{selectedMonthLabel}</span>
      </div>
      <div className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-[1fr_auto_1fr_auto_1fr] xl:grid-cols-[1fr_auto_1fr_auto_1fr_auto_1fr_auto_1fr_auto_1fr]">
        {stages.map((stage, index) => (
          <div className="contents" key={stage.label}>
            <div
              className={cn(
                'flex min-h-[6.3rem] min-w-0 flex-col items-center justify-center rounded-lg border px-2 text-center',
                stage.final
                  ? 'border-amber-300 bg-gradient-to-b from-amber-50 to-white text-amber-800'
                  : 'border-[#a8c9ba] bg-gradient-to-b from-[#eef8f3] to-white text-[#075b43]',
              )}
            >
              <stage.icon className="h-5 w-5" strokeWidth={1.7} />
              <span className="mt-1.5 block text-[0.63rem] font-medium text-[#374151]">
                {stage.label}
              </span>
              <span className="mt-1 block text-[1.55rem] font-semibold leading-none text-[#111827]">
                {stage.value}
              </span>
            </div>
            {index < stages.length - 1 ? (
              <ArrowRight
                className={cn(
                  'hidden h-4 w-4 self-center text-[#6b7280] sm:block',
                  index === 2 && 'sm:hidden xl:block',
                )}
              />
            ) : null}
          </div>
        ))}
      </div>
    </section>
  );
}

const activityIcons: Record<AdminDashboardActivityKind, typeof Plus> = {
  match_created: HeartHandshake,
  orphan_approved: UsersRound,
  receipt_verified: CheckCircle2,
  request_received: Plus,
};

const activityTones: Record<AdminDashboardActivityKind, string> = {
  match_created: 'bg-[#e2f1e9] text-[#0d6b50]',
  orphan_approved: 'bg-[#fff1cc] text-[#c78909]',
  receipt_verified: 'bg-[#e0f2e9] text-[#087254]',
  request_received: 'bg-[#006b4f] text-white',
};

function RecentActivity({ activity }: { activity: AdminDashboardActivity[] }) {
  return (
    <section className={cn(cardClass, 'p-4')}>
      <h3 className="text-base font-semibold tracking-[-0.02em] text-[#111827]">Recent Activity</h3>
      <div className="mt-2 divide-y divide-[#e8ece8]">
        {activity.length > 0 ? (
          activity.map((item) => {
            const Icon = activityIcons[item.kind];
            return (
              <Link
                className="group flex min-h-9 items-center gap-2.5 py-1.5"
                href={item.href}
                key={item.id}
              >
                <span
                  className={cn(
                    'flex h-5 w-5 shrink-0 items-center justify-center rounded-full',
                    activityTones[item.kind],
                  )}
                >
                  <NavLinkIcon className="h-3 w-3" icon={Icon} />
                </span>
                <span className="min-w-0 flex-1 truncate text-[0.72rem] font-medium text-[#374151] group-hover:text-[#006b4f]">
                  {item.label}
                </span>
                <span className="shrink-0 text-[0.65rem] font-normal text-[#6b7280]">
                  {relativeTime(item.at)}
                </span>
              </Link>
            );
          })
        ) : (
          <div className="flex min-h-[9rem] flex-col items-center justify-center text-center">
            <Check className="h-6 w-6 text-emerald-600" />
            <p className="mt-2 text-sm font-medium text-[#374151]">No recent activity to show</p>
          </div>
        )}
      </div>
    </section>
  );
}

function InitiativesAtGlance({ summary }: { summary: AdminDashboardSummary }) {
  return (
    <section className={cn(cardClass, 'p-4')}>
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-base font-semibold tracking-[-0.02em] text-[#111827]">
          Initiatives at a Glance
        </h3>
        <span className="text-xs font-medium text-[#006b4f]">View all initiatives</span>
      </div>
      <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <article className="rounded-lg border border-[#d9ded8] bg-white p-3">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#e4f3eb] text-[#087254]">
              <HandHeart className="h-5 w-5" />
            </span>
            <h4 className="min-w-0 flex-1 truncate text-sm font-semibold text-[#111827]">
              Orphan Sponsorship
            </h4>
            <span className="rounded bg-[#006b4f] px-2 py-0.5 text-[0.58rem] font-semibold text-white">
              LIVE
            </span>
          </div>
          <div className="mt-3 grid grid-cols-3 divide-x divide-[#e5e7eb] text-center">
            <InitiativeMetric
              label="Active Matches"
              value={summary.kpis.activeMatches.toString()}
            />
            <InitiativeMetric label="Requests" value={summary.kpis.newRequests.toString()} />
            <InitiativeMetric
              label="Verified"
              value={compactCurrency(summary.kpis.verifiedThisMonth)}
            />
          </div>
        </article>

        <InitiativePlaceholder
          badge="PLANNING"
          badgeClassName="bg-amber-100 text-amber-800"
          icon={Landmark}
          iconClassName="bg-amber-50 text-amber-600"
          items="Projects · Locations · Donations"
          title="Mosques"
        />
        <InitiativePlaceholder
          badge="FUTURE"
          badgeClassName="bg-[#eef0ef] text-[#4b5563]"
          icon={Droplets}
          iconClassName="bg-[#f1f3f2] text-[#111827]"
          items="Campaigns · Beneficiaries · Distributions"
          title="Food & Water Supply"
        />
        <button
          className="flex min-h-[7.8rem] flex-col items-center justify-center rounded-lg border border-dashed border-[#87928a] bg-white text-[#006b4f] transition hover:border-[#006b4f] hover:bg-emerald-50/40"
          title="Initiative setup will be available in a future phase"
          type="button"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-full border border-[#006b4f]">
            <Plus className="h-5 w-5" />
          </span>
          <span className="mt-2 text-sm font-medium">Add Initiative</span>
        </button>
      </div>
    </section>
  );
}

function InitiativeMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 px-1.5">
      <p className="truncate text-sm font-semibold tracking-[-0.02em] text-[#111827]">{value}</p>
      <p className="mt-1 truncate text-[0.58rem] font-normal text-[#6b7280]">{label}</p>
    </div>
  );
}

function InitiativePlaceholder({
  badge,
  badgeClassName,
  icon: Icon,
  iconClassName,
  items,
  title,
}: {
  badge: string;
  badgeClassName: string;
  icon: typeof Landmark;
  iconClassName: string;
  items: string;
  title: string;
}) {
  return (
    <article className="rounded-lg border border-[#d9ded8] bg-white p-3">
      <div className="flex items-center gap-3">
        <span
          className={cn('flex h-11 w-11 items-center justify-center rounded-full', iconClassName)}
        >
          <Icon className="h-5 w-5" />
        </span>
        <h4 className="min-w-0 flex-1 truncate text-sm font-semibold text-[#111827]">{title}</h4>
        <span className={cn('rounded px-1.5 py-0.5 text-[0.55rem] font-semibold', badgeClassName)}>
          {badge}
        </span>
      </div>
      <p className="mt-5 text-center text-[0.68rem] font-normal text-[#6b7280]">{items}</p>
    </article>
  );
}

function PermissionAwarePlaceholder() {
  return (
    <section
      className={cn(cardClass, 'flex min-h-[17rem] items-center justify-center p-6 text-center')}
    >
      <div>
        <FileCheck2 className="mx-auto h-8 w-8 text-[#0d6b50]" />
        <h3 className="mt-3 text-base font-semibold text-[#111827]">Operational overview</h3>
        <p className="mt-1 max-w-sm text-sm font-normal text-[#6b7280]">
          Finance contribution totals are hidden for this role. Your accessible work queues remain
          available on the dashboard.
        </p>
      </div>
    </section>
  );
}

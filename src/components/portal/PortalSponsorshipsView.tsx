'use client';

import { useState } from 'react';

import Image from 'next/image';
import Link from 'next/link';

import {
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Gift,
  GraduationCap,
  HeartHandshake,
  MapPin,
  Upload,
  UserRound,
} from 'lucide-react';

import { NavLinkIcon, NavLinkSpinner } from '@/components/ui/NavLinkIcon';
import { workflowStatus, workSurface } from '@/components/ui/work-surface';

import { formatCurrency } from '@/lib/currency';
import { cn } from '@/lib/utils';

import type { SponsorshipMatchStatus } from '@/types/matches';
import type { DonorMonthlyPaymentStatus, DonorPortalSponsorship } from '@/types/portal';

type SponsorshipFilter = 'active' | 'all' | 'past';

const receiptAttentionStatuses: DonorMonthlyPaymentStatus[] = [
  'due_soon',
  'overdue',
  'pending',
  'rejected',
];

const paymentStatusLabels: Record<DonorMonthlyPaymentStatus, string> = {
  due_soon: 'Receipt due',
  money_delivered: 'Money delivered',
  overdue: 'Overdue',
  pending: 'Receipt due',
  ready_for_review: 'Ready for review',
  rejected: 'Needs correction',
  reviewed: 'Reviewed',
  submitted: 'Submitted',
  verified: 'Verified',
};

const matchStatusLabels: Record<SponsorshipMatchStatus, string> = {
  active: 'Active',
  ended: 'Ended',
  paused: 'Paused',
  voided: 'Voided',
};

function isCurrentSponsorship(sponsorship: DonorPortalSponsorship) {
  return sponsorship.matchStatus === 'active' || sponsorship.matchStatus === 'paused';
}

function paymentStatusClassName(status: DonorMonthlyPaymentStatus) {
  if (status === 'overdue' || status === 'rejected') return workflowStatus.red;
  if (status === 'due_soon' || status === 'pending') return workflowStatus.amber;
  if (status === 'money_delivered' || status === 'verified') return workflowStatus.green;
  return workflowStatus.neutral;
}

function matchStatusClassName(status: SponsorshipMatchStatus) {
  if (status === 'active') return workflowStatus.green;
  if (status === 'paused') return workflowStatus.amber;
  if (status === 'voided') return workflowStatus.red;
  return workflowStatus.neutral;
}

function formatMonth(value: string) {
  return new Intl.DateTimeFormat('en', {
    month: 'long',
    timeZone: 'UTC',
    year: 'numeric',
  }).format(new Date(`${value}T00:00:00Z`));
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('en', {
    day: '2-digit',
    month: 'short',
    timeZone: 'UTC',
    year: 'numeric',
  }).format(new Date(`${value.slice(0, 10)}T00:00:00Z`));
}

export function PortalSponsorshipsView({
  sponsorships,
}: {
  sponsorships: DonorPortalSponsorship[];
}) {
  const [filter, setFilter] = useState<SponsorshipFilter>('all');
  const activeSponsorships = sponsorships.filter(
    (sponsorship) => sponsorship.matchStatus === 'active',
  );
  const pastSponsorships = sponsorships.filter((sponsorship) => !isCurrentSponsorship(sponsorship));
  const monthlyCommitment = activeSponsorships.reduce(
    (total, sponsorship) => total + sponsorship.monthlyAmount,
    0,
  );
  const totalDelivered = sponsorships.reduce(
    (total, sponsorship) => total + sponsorship.totalDeliveredContributed,
    0,
  );
  const attentionSponsorships = activeSponsorships.filter((sponsorship) =>
    receiptAttentionStatuses.includes(sponsorship.currentMonthStatus),
  );
  const filteredSponsorships =
    filter === 'active' ? activeSponsorships : filter === 'past' ? pastSponsorships : sponsorships;
  const attentionMatch = attentionSponsorships.length === 1 ? attentionSponsorships[0] : null;

  return (
    <div className="space-y-5 font-sans text-[#111827] sm:space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className={workSurface.title}>My Sponsorships</h1>
          <p className="mt-2 text-sm font-normal text-[#6b7280]">
            Manage each sponsorship, monthly payment status, and receipt history.
          </p>
        </div>
        <Link
          className={cn(workSurface.secondaryButton, 'h-11 shrink-0 px-4 text-sm text-[#07543f]')}
          href="/portal/available-orphans"
        >
          <NavLinkIcon className="h-4 w-4" icon={HeartHandshake} />
          Browse Available Orphans
        </Link>
      </header>

      <section className="grid gap-3 md:grid-cols-3">
        <SummaryCard
          icon={UserRound}
          label="Active Sponsorships"
          value={String(activeSponsorships.length)}
        />
        <SummaryCard
          icon={CalendarDays}
          label="Monthly Commitment"
          value={formatCurrency(monthlyCommitment)}
        />
        <SummaryCard icon={Gift} label="Total Delivered" value={formatCurrency(totalDelivered)} />
      </section>

      {activeSponsorships.length > 0 ? (
        attentionSponsorships.length > 0 ? (
          <section className="flex flex-col gap-4 rounded-lg border border-[#e7c36d] bg-[#fffaf0] px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
            <div className="flex min-w-0 items-start gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[#d99b20] text-[#9a5d00]">
                <Clock3 className="h-5 w-5" />
              </span>
              <div className="min-w-0">
                <h2 className="font-semibold text-[#111827]">
                  {attentionSponsorships.length}{' '}
                  {attentionSponsorships.length === 1
                    ? 'receipt needs your attention'
                    : 'receipts need your attention'}
                </h2>
                <p className="mt-1 text-sm text-[#6b7280]">
                  {attentionMatch
                    ? `Upload the ${formatMonth(attentionMatch.currentMonth)} receipt for ${attentionMatch.orphan.fullName}.`
                    : 'Review the current payment status for your active sponsorships.'}
                </p>
              </div>
            </div>
            <Link
              className={cn(workSurface.primaryButton, 'h-11 shrink-0 px-5 text-sm')}
              href={
                attentionMatch
                  ? `/portal/receipts/upload?matchId=${attentionMatch.matchId}`
                  : '/portal/receipts'
              }
            >
              <NavLinkIcon className="h-4 w-4" icon={Upload} />
              {attentionMatch ? 'Upload Receipt' : 'Manage Receipts'}
            </Link>
          </section>
        ) : (
          <section className="flex items-center gap-3 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-4 text-emerald-800 sm:px-5">
            <CheckCircle2 className="h-5 w-5 shrink-0" />
            <p className="text-sm font-medium">All current sponsorship receipts are up to date.</p>
          </section>
        )
      ) : null}

      <section>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-2xl font-semibold tracking-[-0.02em] text-[#111827]">
              Your sponsorships
            </h2>
            <p className="mt-1 text-sm text-[#6b7280]">
              Current relationships and your complete sponsorship history.
            </p>
          </div>
          <div
            aria-label="Filter sponsorships"
            className="grid grid-cols-3 overflow-hidden rounded-lg border border-[#d8ded8] bg-white"
            role="group"
          >
            <FilterButton
              active={filter === 'all'}
              count={sponsorships.length}
              label="All"
              onClick={() => setFilter('all')}
            />
            <FilterButton
              active={filter === 'active'}
              count={activeSponsorships.length}
              label="Active"
              onClick={() => setFilter('active')}
            />
            <FilterButton
              active={filter === 'past'}
              count={pastSponsorships.length}
              label="Past"
              onClick={() => setFilter('past')}
            />
          </div>
        </div>

        {filteredSponsorships.length > 0 ? (
          <div className="mt-4 space-y-3">
            {filteredSponsorships.map((sponsorship) => (
              <SponsorshipCard key={sponsorship.matchId} sponsorship={sponsorship} />
            ))}
          </div>
        ) : (
          <div className="mt-4 rounded-lg border border-dashed border-[#cfd7d1] bg-white px-5 py-10 text-center">
            <HeartHandshake className="mx-auto h-8 w-8 text-[#8b9891]" />
            <p className="mt-3 text-sm font-medium text-[#6b7280]">
              {sponsorships.length === 0
                ? 'No sponsorships are connected to your donor profile yet.'
                : `No ${filter} sponsorships to show.`}
            </p>
            {sponsorships.length === 0 ? (
              <Link
                className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-[#075d46] underline underline-offset-4"
                href="/portal/available-orphans"
              >
                Browse available orphans
                <NavLinkSpinner className="h-3.5 w-3.5" />
              </Link>
            ) : null}
          </div>
        )}
      </section>
    </div>
  );
}

function SummaryCard({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof UserRound;
  label: string;
  value: string;
}) {
  return (
    <article className="flex min-w-0 items-center gap-4 rounded-lg border border-[#dfe5df] bg-white px-4 py-4 shadow-[0_14px_40px_-34px_rgba(17,24,39,0.45)] sm:px-5">
      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#edf4ef] text-[#07543f]">
        <Icon className="h-5 w-5" strokeWidth={1.8} />
      </span>
      <div className="min-w-0">
        <p className="text-xs font-medium uppercase tracking-[0.04em] text-[#4b5563]">{label}</p>
        <p className="mt-1 truncate text-2xl font-semibold tracking-[-0.02em] text-[#111827]">
          {value}
        </p>
      </div>
    </article>
  );
}

function FilterButton({
  active,
  count,
  label,
  onClick,
}: {
  active: boolean;
  count: number;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      aria-pressed={active}
      className={cn(
        'min-h-11 border-r border-[#d8ded8] px-5 text-sm font-medium transition last:border-r-0',
        active ? 'bg-[#07543f] text-white' : 'text-[#374151] hover:bg-[#f7f9f7]',
      )}
      onClick={onClick}
      type="button"
    >
      {label} <span className={active ? 'text-white/80' : 'text-[#6b7280]'}>{count}</span>
    </button>
  );
}

function SponsorshipCard({ sponsorship }: { sponsorship: DonorPortalSponsorship }) {
  const isCurrent = isCurrentSponsorship(sponsorship);
  const isPaused = sponsorship.matchStatus === 'paused';
  const meta = [
    sponsorship.orphan.ageEstimate ? `${sponsorship.orphan.ageEstimate} years` : null,
    sponsorship.orphan.cityArea,
    sponsorship.orphan.educationStatus,
  ].filter(Boolean);

  return (
    <article className="grid min-w-0 overflow-hidden rounded-lg border border-[#dfe5df] bg-white shadow-[0_14px_40px_-34px_rgba(17,24,39,0.45)] xl:grid-cols-[9rem_minmax(15rem,1.5fr)_minmax(10rem,0.65fr)_minmax(11rem,0.65fr)_12rem] xl:items-stretch">
      <OrphanImage sponsorship={sponsorship} />

      <div className="min-w-0 p-4 xl:border-r xl:border-[#e5e9e5]">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={cn(
              'inline-flex rounded-md border px-2.5 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.04em]',
              matchStatusClassName(sponsorship.matchStatus),
            )}
          >
            {matchStatusLabels[sponsorship.matchStatus]}
          </span>
          <span className="text-sm font-semibold text-[#07543f]">
            {sponsorship.orphan.orphanCode}
          </span>
        </div>
        <h3 className="mt-2 truncate text-xl font-semibold tracking-[-0.02em] text-[#111827]">
          {sponsorship.orphan.fullName}
        </h3>
        {meta.length > 0 ? (
          <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-[#6b7280]">
            {sponsorship.orphan.ageEstimate ? (
              <span className="inline-flex items-center gap-1">
                <UserRound className="h-3.5 w-3.5" />
                {sponsorship.orphan.ageEstimate} years
              </span>
            ) : null}
            {sponsorship.orphan.cityArea ? (
              <span className="inline-flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" />
                {sponsorship.orphan.cityArea}
              </span>
            ) : null}
            {sponsorship.orphan.educationStatus ? (
              <span className="inline-flex items-center gap-1">
                <GraduationCap className="h-3.5 w-3.5" />
                {sponsorship.orphan.educationStatus}
              </span>
            ) : null}
          </div>
        ) : null}
      </div>

      {isCurrent ? (
        <>
          <div className="flex flex-col justify-center border-t border-[#e5e9e5] px-4 py-4 xl:border-r xl:border-t-0">
            <p className="text-xl font-semibold text-[#111827]">
              {formatCurrency(sponsorship.monthlyAmount)}
            </p>
            <p className="mt-1 text-sm text-[#6b7280]">monthly</p>
          </div>
          <div className="flex flex-col justify-center border-t border-[#e5e9e5] px-4 py-4 xl:border-r xl:border-t-0 xl:text-center">
            <p className="text-xs font-medium uppercase tracking-[0.04em] text-[#4b5563]">
              {isPaused ? 'Sponsorship' : formatMonth(sponsorship.currentMonth)}
            </p>
            <span
              className={cn(
                'mt-2 inline-flex w-fit rounded-md border px-2.5 py-1 text-xs font-medium xl:self-center',
                isPaused
                  ? workflowStatus.amber
                  : paymentStatusClassName(sponsorship.currentMonthStatus),
              )}
            >
              {isPaused ? 'Paused' : paymentStatusLabels[sponsorship.currentMonthStatus]}
            </span>
          </div>
        </>
      ) : (
        <>
          <div className="flex flex-col justify-center border-t border-[#e5e9e5] px-4 py-4 xl:border-r xl:border-t-0">
            <p className="text-sm text-[#6b7280]">Sponsorship ended</p>
            <p className="mt-1 font-semibold text-[#111827]">
              {sponsorship.endedAt ? formatDate(sponsorship.endedAt) : 'Date not recorded'}
            </p>
          </div>
          <div className="flex flex-col justify-center border-t border-[#e5e9e5] px-4 py-4 xl:border-r xl:border-t-0 xl:text-center">
            <p className="text-xl font-semibold text-[#111827]">
              {formatCurrency(sponsorship.totalDeliveredContributed)}
            </p>
            <p className="mt-1 text-sm text-[#6b7280]">delivered</p>
          </div>
        </>
      )}

      <div className="flex items-center border-t border-[#e5e9e5] p-4 xl:border-t-0">
        <Link
          className={cn(
            isCurrent ? workSurface.primaryButton : workSurface.secondaryButton,
            'h-11 w-full px-3 text-sm',
          )}
          href={`/portal/sponsorships/${sponsorship.matchId}`}
        >
          {isCurrent ? 'View Sponsorship' : 'View History'}
          <NavLinkIcon className="h-4 w-4" icon={ChevronRight} />
        </Link>
      </div>
    </article>
  );
}

function OrphanImage({ sponsorship }: { sponsorship: DonorPortalSponsorship }) {
  if (!sponsorship.orphan.profileImageUrl) {
    return (
      <div className="flex min-h-36 items-center justify-center bg-[#edf4ef] text-[#17634d] xl:min-h-full">
        <HeartHandshake className="h-12 w-12" strokeWidth={1.4} />
      </div>
    );
  }

  return (
    <div className="relative min-h-52 overflow-hidden bg-[#edf4ef] sm:min-h-60 xl:min-h-full">
      <Image
        alt={`${sponsorship.orphan.fullName} profile`}
        className="object-cover"
        fill
        sizes="(min-width: 1280px) 144px, 100vw"
        src={sponsorship.orphan.profileImageUrl}
        unoptimized
      />
    </div>
  );
}

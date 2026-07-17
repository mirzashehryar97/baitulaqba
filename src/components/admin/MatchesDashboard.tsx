'use client';

import { useEffect, useMemo, useState } from 'react';

import Link from 'next/link';

import {
  CalendarDays,
  HeartHandshake,
  PauseCircle,
  Plus,
  Search,
  ShieldCheck,
  UserRound,
  UsersRound,
  X,
} from 'lucide-react';
import useSWR from 'swr';

import { useAdminAccount } from '@/components/admin/AdminShell';
import { InfiniteListLoader, useInfiniteAdminList } from '@/components/admin/InfiniteListLoader';
import { TableRowsSkeleton } from '@/components/admin/TableRowsSkeleton';
import { useConfirmation } from '@/components/ui/ConfirmationProvider';
import { CustomSelect } from '@/components/ui/CustomSelect';
import { NavigationSpinner, NavLinkSpinner } from '@/components/ui/NavLinkIcon';
import { SkeletonBlock } from '@/components/ui/SkeletonBlock';
import { useToast } from '@/components/ui/ToastProvider';
import { usePendingRowNavigation } from '@/components/ui/usePendingRowNavigation';
import { workflowStatus, workSurface } from '@/components/ui/work-surface';

import { canCreateMatches, canViewMatchFinancialAmount } from '@/lib/adminPermissions';
import { fetchApiData } from '@/lib/apiFetcher';
import { APP_CURRENCIES, APP_CURRENCY, formatCurrency } from '@/lib/currency';
import type { PaginatedResult } from '@/lib/pagination';
import type { SponsorshipMatchListSummary } from '@/lib/sponsorshipMatches';
import { useDebouncedValue } from '@/lib/useDebouncedValue';
import { cn } from '@/lib/utils';

import type {
  MatchableDonor,
  MatchableOrphan,
  SponsorshipMatch,
  SponsorshipMatchInput,
  SponsorshipMatchStatus,
} from '@/types/matches';

const statusLabels: Record<SponsorshipMatchStatus, string> = {
  active: 'Active',
  ended: 'Ended',
  paused: 'Paused',
  voided: 'Voided',
};

const donorStateLabels: Record<MatchableDonor['donorState'], string> = {
  already_sponsoring: 'Already Sponsoring',
  pending_first_login: 'Pending First Login',
  ready: 'Ready',
};

const currencyOptions = APP_CURRENCIES;

const drawerPanelClassName =
  'admin-member-drawer-panel fixed inset-x-0 bottom-0 flex max-h-[88vh] transform-gpu flex-col overflow-hidden rounded-t-2xl border border-gold/18 bg-offwhite shadow-[0_-24px_70px_-42px_rgba(7,39,29,0.8)] will-change-transform lg:inset-y-0 lg:left-auto lg:right-0 lg:max-h-none lg:w-[32rem] lg:rounded-l-2xl lg:rounded-r-none lg:border-y-0 lg:border-r-0 lg:shadow-[-28px_0_80px_-52px_rgba(7,39,29,0.85)]';

function formatDate(value: string) {
  return new Intl.DateTimeFormat('en', {
    dateStyle: 'medium',
  }).format(new Date(value));
}

function getInitials(value?: string | null) {
  return (value ?? '?')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');
}

function todayDateInput() {
  return new Date().toISOString().slice(0, 10);
}

function emptyMatchForm(): SponsorshipMatchInput {
  return {
    currency: APP_CURRENCY,
    donorId: '',
    monthlyAmount: 70,
    notes: '',
    orphanId: '',
    startedAt: todayDateInput(),
  };
}

function useDrawerLifecycle(open: boolean, onClose: () => void) {
  useEffect(() => {
    if (!open) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    const previousPaddingRight = document.body.style.paddingRight;
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;

    document.body.style.overflow = 'hidden';
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.body.style.paddingRight = previousPaddingRight;
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open, onClose]);
}

export function MatchesDashboard({
  initialMatchableDonors = [],
  initialMatchableOrphans = [],
  initialPage,
  initialSummary,
}: {
  initialMatchableDonors?: MatchableDonor[];
  initialMatchableOrphans?: MatchableOrphan[];
  initialPage?: PaginatedResult<SponsorshipMatch>;
  initialSummary: SponsorshipMatchListSummary;
}) {
  const { searchValue: search, setSearchValue: setSearch, teamMember } = useAdminAccount();
  const toast = useToast();
  const confirm = useConfirmation();
  const { navigateToRow, pendingRowId } = usePendingRowNavigation();
  const canCreate = canCreateMatches(teamMember);
  const canViewAmount = canViewMatchFinancialAmount(teamMember);
  const [statusFilter, setStatusFilter] = useState<SponsorshipMatchStatus | 'all'>('all');
  const [createdByFilter, setCreatedByFilter] = useState('all');
  const [startedFromFilter, setStartedFromFilter] = useState('');
  const [startedToFilter, setStartedToFilter] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState<SponsorshipMatchInput>(() => emptyMatchForm());
  const [formErrors, setFormErrors] = useState<
    Partial<Record<keyof SponsorshipMatchInput, string>>
  >({});
  const [saving, setSaving] = useState(false);

  const debouncedSearch = useDebouncedValue(search);
  const matchParams = new URLSearchParams();
  if (debouncedSearch.trim()) matchParams.set('search', debouncedSearch.trim());
  if (statusFilter !== 'all') matchParams.set('status', statusFilter);
  if (createdByFilter !== 'all') matchParams.set('createdBy', createdByFilter);
  if (startedFromFilter) matchParams.set('startedFrom', startedFromFilter);
  if (startedToFilter) matchParams.set('startedTo', startedToFilter);
  const matchesInitialUrl = '/api/admin/matches';
  const matchesUrl =
    matchParams.size > 0 ? `${matchesInitialUrl}?${matchParams.toString()}` : matchesInitialUrl;
  const {
    error: matchesError,
    hasMore,
    isLoading,
    isLoadingMore,
    isValidating,
    items: matches,
    loadMore,
    mutate: mutateMatches,
  } = useInfiniteAdminList({ initialPage, initialUrl: matchesInitialUrl, url: matchesUrl });
  const { data: donorsData, mutate: mutateDonors } = useSWR<MatchableDonor[]>(
    '/api/admin/matches/matchable-donors',
    fetchApiData,
    {
      dedupingInterval: 10_000,
      fallbackData: initialMatchableDonors.length > 0 ? initialMatchableDonors : undefined,
    },
  );
  const { data: orphansData, mutate: mutateOrphans } = useSWR<MatchableOrphan[]>(
    '/api/admin/matches/matchable-orphans',
    fetchApiData,
    {
      dedupingInterval: 10_000,
      fallbackData: initialMatchableOrphans.length > 0 ? initialMatchableOrphans : undefined,
    },
  );
  const { data: summary = initialSummary, mutate: mutateSummary } =
    useSWR<SponsorshipMatchListSummary>('/api/admin/matches/summary', fetchApiData, {
      dedupingInterval: 15_000,
      fallbackData: initialSummary,
      revalidateOnFocus: true,
      revalidateOnMount: false,
    });

  const matchableDonors = donorsData ?? initialMatchableDonors;
  const matchableOrphans = orphansData ?? initialMatchableOrphans;
  const showListSkeleton = isLoading && matches.length === 0 && !matchesError;

  const filteredMatches = matches;

  const creatorFilterOptions = useMemo(
    () =>
      Array.from(
        new Map(
          matches
            .filter((match) => match.createdByTeamMemberId && match.createdByTeamMember)
            .map((match) => [
              match.createdByTeamMemberId ?? '',
              match.createdByTeamMember?.fullName ?? match.createdByTeamMember?.email ?? 'Unknown',
            ]),
        ),
      ).sort(([, nameA], [, nameB]) => nameA.localeCompare(nameB)),
    [matches],
  );

  const stats = [
    {
      icon: HeartHandshake,
      label: 'Active Matches',
      value: summary.active,
    },
    {
      icon: PauseCircle,
      label: 'Paused',
      value: summary.paused,
    },
    {
      icon: CalendarDays,
      label: 'New This Month',
      value: summary.newThisMonth,
    },
    {
      icon: UserRound,
      label: 'Orphans Available',
      value: summary.availableOrphans,
    },
  ];

  const updateForm = <Key extends keyof SponsorshipMatchInput>(
    key: Key,
    value: SponsorshipMatchInput[Key],
  ) => {
    setForm((current) => ({ ...current, [key]: value }));
    setFormErrors((current) => ({ ...current, [key]: undefined }));
  };

  const createMatch = async () => {
    const confirmed = await confirm({
      confirmLabel: 'Create Match',
      description: 'Create this donor-orphan sponsorship match.',
      title: 'Create sponsorship match?',
    });

    if (!confirmed) return;

    setSaving(true);

    try {
      const response = await fetch('/api/admin/matches', {
        body: JSON.stringify(form),
        headers: { 'Content-Type': 'application/json' },
        method: 'POST',
      });
      const body = (await response.json().catch(() => null)) as {
        data?: SponsorshipMatch;
        error?: string;
        errors?: Partial<Record<keyof SponsorshipMatchInput, string>>;
      } | null;

      if (!response.ok || !body?.data) {
        setFormErrors(body?.errors ?? {});
        toast({
          description: body?.error ?? 'Please review the match details and try again.',
          title: 'Match not created',
          type: 'error',
        });
        return;
      }

      await mutateMatches();
      void mutateMatches();
      void mutateDonors();
      void mutateOrphans();
      void mutateSummary();
      setForm(emptyMatchForm());
      setCreateOpen(false);
      toast({
        description: `${body.data.donor?.fullName ?? 'Donor'} is now matched with ${
          body.data.orphan?.orphanCode ?? 'the orphan profile'
        }.`,
        title: 'Match created',
        type: 'success',
      });
    } catch {
      toast({
        description: 'Please check your connection and try again.',
        title: 'Match not created',
        type: 'error',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h2 className={cn(workSurface.title, 'leading-tight')}>Sponsorship Matches</h2>
            {isValidating && !showListSkeleton ? (
              <span
                className={cn(
                  'inline-flex rounded-lg border px-2.5 py-1 text-xs font-semibold',
                  workflowStatus.amber,
                )}
              >
                Live Registry
              </span>
            ) : null}
          </div>
          <p className={cn('mt-2 text-base font-normal', workSurface.mutedText)}>
            Connect active donors with approved, field-verified orphan profiles.
          </p>
          {matchesError && !showListSkeleton ? (
            <p className="mt-2 text-sm font-semibold text-red-600">
              Could not refresh matches. Showing cached data.
            </p>
          ) : null}
        </div>
        {canCreate ? (
          <button
            className={cn(workSurface.primaryButton, 'h-12 px-6 text-base')}
            onClick={() => setCreateOpen(true)}
            type="button"
          >
            <Plus className="h-4 w-4" />
            New Match
          </button>
        ) : null}
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <article
            className="rounded-lg border border-gold/16 bg-offwhite px-4 py-3.5 shadow-[0_16px_36px_-30px_rgba(7,39,29,0.6)]"
            key={stat.label}
          >
            <div className="flex items-start gap-3">
              <div className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-deepest text-gold-soft shadow-[0_14px_26px_-18px_rgba(0,0,0,0.85)]">
                <stat.icon className="h-4.5 w-4.5" />
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold leading-4 text-ink/78">{stat.label}</p>
                {showListSkeleton ? (
                  <SkeletonBlock className="mt-5 h-8 w-14" />
                ) : (
                  <p className="mt-5 font-sans text-[2rem] font-semibold leading-none text-emerald-deep tabular-nums">
                    {stat.value}
                  </p>
                )}
              </div>
            </div>
          </article>
        ))}
      </div>

      <section className="mt-5 min-w-0 overflow-hidden rounded-xl border border-gold/16 bg-offwhite shadow-soft">
        <div className="grid gap-4 border-b border-emerald/10 px-5 py-5 md:grid-cols-2 xl:grid-cols-[minmax(15rem,1fr)_12rem_14rem_11rem_11rem]">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/60" />
            <input
              className="h-12 w-full rounded-lg border border-emerald/10 bg-white pl-11 pr-3 text-sm font-semibold outline-none transition focus:border-gold focus:ring-4 focus:ring-gold/15"
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search donor, orphan, code..."
              value={search}
            />
          </div>
          <CustomSelect
            ariaLabel="All Statuses"
            onChange={(value) => setStatusFilter(value as SponsorshipMatchStatus | 'all')}
            triggerClassName="h-12 rounded-lg border border-emerald/10 bg-white px-3 text-sm font-semibold text-ink/72 outline-none transition focus:border-gold focus:ring-4 focus:ring-gold/15"
            value={statusFilter}
          >
            <option value="all">All Statuses</option>
            {(Object.keys(statusLabels) as SponsorshipMatchStatus[]).map((status) => (
              <option key={status} value={status}>
                {statusLabels[status]}
              </option>
            ))}
          </CustomSelect>
          <CustomSelect
            ariaLabel="All Creators"
            onChange={setCreatedByFilter}
            triggerClassName="h-12 rounded-lg border border-emerald/10 bg-white px-3 text-sm font-semibold text-ink/72 outline-none transition focus:border-gold focus:ring-4 focus:ring-gold/15"
            value={createdByFilter}
          >
            <option value="all">All Creators</option>
            {creatorFilterOptions.map(([id, name]) => (
              <option key={id} value={id}>
                {name}
              </option>
            ))}
          </CustomSelect>
          <input
            aria-label="Started from"
            className="h-12 rounded-lg border border-emerald/10 bg-white px-3 text-sm font-semibold text-ink/72 outline-none transition focus:border-gold focus:ring-4 focus:ring-gold/15"
            onChange={(event) => setStartedFromFilter(event.target.value)}
            type="date"
            value={startedFromFilter}
          />
          <input
            aria-label="Started to"
            className="h-12 rounded-lg border border-emerald/10 bg-white px-3 text-sm font-semibold text-ink/72 outline-none transition focus:border-gold focus:ring-4 focus:ring-gold/15"
            onChange={(event) => setStartedToFilter(event.target.value)}
            type="date"
            value={startedToFilter}
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] border-collapse text-left text-sm">
            <thead>
              <tr className="text-xs font-semibold uppercase text-[#6b7280]">
                <th className="border-b border-[#e8ece8] px-5 py-4">Donor</th>
                <th className="border-b border-[#e8ece8] px-4 py-4">Orphan</th>
                <th className="border-b border-[#e8ece8] px-4 py-4">Amount</th>
                <th className="border-b border-[#e8ece8] px-4 py-4">Status</th>
                <th className="border-b border-[#e8ece8] px-4 py-4">Started</th>
                <th className="border-b border-[#e8ece8] px-4 py-4">Created By</th>
              </tr>
            </thead>
            <tbody>
              {showListSkeleton ? <TableRowsSkeleton columns={6} /> : null}
              {filteredMatches.map((match) => (
                <MatchRow
                  canViewAmount={canViewAmount}
                  key={match.id}
                  match={match}
                  onOpen={() => navigateToRow(match.id, `/admin/matches/${match.id}`)}
                  pending={pendingRowId === match.id}
                />
              ))}
            </tbody>
          </table>
        </div>

        {!showListSkeleton && filteredMatches.length === 0 ? (
          <div className="border-t border-emerald/8 px-4 py-10 text-center">
            <HeartHandshake className="mx-auto h-9 w-9 text-[#0d6b50]" />
            <h3 className="mt-3 text-xl font-semibold text-[#111827]">No matches found</h3>
            <p className={cn('mx-auto mt-2 max-w-md text-sm font-normal', workSurface.mutedText)}>
              Approved field-verified orphan profiles and active donors will appear here when
              matched.
            </p>
          </div>
        ) : null}
        {filteredMatches.length > 0 ? (
          <InfiniteListLoader hasMore={hasMore} isLoadingMore={isLoadingMore} loadMore={loadMore} />
        ) : null}
      </section>

      {createOpen ? (
        <CreateMatchPanel
          donors={matchableDonors}
          errors={formErrors}
          form={form}
          onClose={() => setCreateOpen(false)}
          onSubmit={createMatch}
          onUpdate={updateForm}
          orphans={matchableOrphans}
          saving={saving}
        />
      ) : null}
    </>
  );
}

function MatchRow({
  canViewAmount,
  match,
  onOpen,
  pending,
}: {
  canViewAmount: boolean;
  match: SponsorshipMatch;
  onOpen: () => void;
  pending: boolean;
}) {
  return (
    <>
      <tr
        aria-busy={pending}
        className={cn(
          'cursor-pointer border-t border-emerald/8 align-top transition hover:bg-cream/42 focus-within:bg-cream/42',
          pending && 'cursor-wait',
        )}
        onClick={onOpen}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            onOpen();
          }
        }}
        tabIndex={0}
      >
        <td className="px-5 py-5">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-deepest text-sm font-black text-gold-soft">
              {getInitials(match.donor?.fullName)}
            </div>
            <div>
              <Link
                className="font-semibold text-[#111827] underline-offset-4 hover:text-[#006b4f] hover:underline"
                href={`/admin/donors/${match.donorId}`}
                onClick={(event) => event.stopPropagation()}
                onKeyDown={(event) => event.stopPropagation()}
              >
                {match.donor?.fullName ?? 'Unknown donor'}
                <NavLinkSpinner className="ml-1 h-3.5 w-3.5" />
              </Link>
              <p className="mt-1 text-sm font-normal text-[#6b7280]">{match.donor?.email}</p>
              {match.donor?.phone ? (
                <p className="mt-0.5 text-sm font-normal text-[#6b7280]">{match.donor.phone}</p>
              ) : null}
            </div>
          </div>
        </td>
        <td className="px-4 py-5">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-deepest text-sm font-black text-gold-soft">
              {getInitials(match.orphan?.fullName)}
            </div>
            <div>
              <Link
                className="font-semibold text-[#111827] underline-offset-4 hover:text-[#006b4f] hover:underline"
                href={`/admin/orphans/${match.orphanId}`}
                onClick={(event) => event.stopPropagation()}
                onKeyDown={(event) => event.stopPropagation()}
              >
                {match.orphan?.fullName ?? 'Orphan profile'}
                <NavLinkSpinner className="ml-1 h-3.5 w-3.5" />
              </Link>
              <p className="mt-1 text-sm font-normal text-[#6b7280]">
                {match.orphan?.orphanCode ?? 'Unknown'}
              </p>
              <p className="mt-0.5 text-sm font-normal capitalize text-[#6b7280]">
                {match.orphan?.verificationStatus.replaceAll('_', ' ')}
              </p>
            </div>
          </div>
        </td>
        <td className="px-4 py-5">
          {canViewAmount ? (
            <span className="font-semibold text-[#111827]">
              {formatCurrency(match.monthlyAmount)}
            </span>
          ) : (
            <span className="font-medium text-[#6b7280]">Restricted</span>
          )}
          {canViewAmount ? (
            <p className="mt-1 text-sm font-normal text-[#6b7280]">Monthly</p>
          ) : null}
        </td>
        <td className="px-4 py-5">
          <StatusPill status={match.status} />
          {match.statusReason ? (
            <p className="mt-2 max-w-36 text-xs font-normal text-[#6b7280]">{match.statusReason}</p>
          ) : null}
        </td>
        <td className="px-4 py-5">
          <p className="font-medium text-[#111827]">{formatDate(match.startedAt)}</p>
          {match.endedAt ? (
            <p className="mt-1 text-xs font-normal text-[#6b7280]">
              Ended {formatDate(match.endedAt)}
            </p>
          ) : null}
        </td>
        <td className="px-4 py-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-medium text-[#111827]">
                {match.createdByTeamMember?.fullName ?? 'Unknown'}
              </p>
              {match.createdByTeamMember?.role ? (
                <p className="mt-1 text-xs font-normal capitalize text-[#6b7280]">
                  {match.createdByTeamMember.role.replaceAll('_', ' ')}
                </p>
              ) : null}
            </div>
            {pending ? <NavigationSpinner className="mt-0.5 h-4 w-4" /> : null}
          </div>
        </td>
      </tr>
    </>
  );
}

function CreateMatchPanel({
  donors,
  errors,
  form,
  onClose,
  onSubmit,
  onUpdate,
  orphans,
  saving,
}: {
  donors: MatchableDonor[];
  errors: Partial<Record<keyof SponsorshipMatchInput, string>>;
  form: SponsorshipMatchInput;
  onClose: () => void;
  onSubmit: () => void;
  onUpdate: <Key extends keyof SponsorshipMatchInput>(
    key: Key,
    value: SponsorshipMatchInput[Key],
  ) => void;
  orphans: MatchableOrphan[];
  saving: boolean;
}) {
  const selectedDonor = donors.find((donor) => donor.id === form.donorId) ?? null;
  const selectedOrphan = orphans.find((orphan) => orphan.id === form.orphanId) ?? null;

  useDrawerLifecycle(true, onClose);

  return (
    <div className="fixed inset-0 z-50">
      <button
        aria-label="Close new match backdrop"
        className="absolute inset-0 bg-emerald-deepest/35 backdrop-blur-sm"
        onClick={onClose}
        type="button"
      />
      <section className={drawerPanelClassName}>
        <header className="border-b border-gold/18 px-5 py-4 lg:px-6">
          <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-ink/14 lg:hidden" />
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="font-display text-2xl font-semibold text-emerald-deep">New Match</h3>
              <p className="mt-1 text-sm font-semibold text-ink/65">
                Select an active donor and one approved field-verified orphan profile. Donors can
                support multiple orphans.
              </p>
            </div>
            <button
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-emerald/10 bg-white text-emerald-deep transition hover:border-gold/50"
              onClick={onClose}
              type="button"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto px-5 py-5 lg:px-6">
          <div className="grid gap-4">
            <Field label="Donor" error={errors.donorId}>
              <CustomSelect
                ariaLabel="Donor"
                onChange={(value) => onUpdate('donorId', value)}
                triggerClassName="h-11 text-emerald-deep"
                value={form.donorId}
              >
                <option value="">Choose donor</option>
                {donors.map((donor) => (
                  <option key={donor.id} value={donor.id}>
                    {donor.fullName} · {donorStateLabels[donor.donorState]}
                  </option>
                ))}
              </CustomSelect>
            </Field>

            {selectedDonor ? (
              <SummaryBox icon={UsersRound}>
                <p className="font-bold text-emerald-deep">{selectedDonor.fullName}</p>
                <p className="text-sm font-semibold text-ink/65">
                  {selectedDonor.email} · {donorStateLabels[selectedDonor.donorState]}
                </p>
                {selectedDonor.donorState === 'pending_first_login' ? (
                  <p className="mt-2 text-xs font-bold text-gold-deep">
                    Donor has not logged in yet. Match only if sponsorship was confirmed offline.
                  </p>
                ) : null}
                {selectedDonor.donorState === 'already_sponsoring' ? (
                  <p className="mt-2 text-xs font-bold text-emerald-deep">
                    This donor already supports {selectedDonor.activeMatchCount}{' '}
                    {selectedDonor.activeMatchCount === 1 ? 'orphan' : 'orphans'} and can be matched
                    with another eligible orphan.
                  </p>
                ) : null}
              </SummaryBox>
            ) : null}

            <Field label="Orphan profile" error={errors.orphanId}>
              <CustomSelect
                ariaLabel="Orphan profile"
                onChange={(value) => onUpdate('orphanId', value)}
                triggerClassName="h-11 text-emerald-deep"
                value={form.orphanId}
              >
                <option value="">Choose orphan</option>
                {orphans.map((orphan) => (
                  <option key={orphan.id} value={orphan.id}>
                    {orphan.orphanCode} · {orphan.fullName}
                  </option>
                ))}
              </CustomSelect>
            </Field>

            {selectedOrphan ? (
              <SummaryBox icon={ShieldCheck}>
                <p className="font-bold text-emerald-deep">
                  {selectedOrphan.orphanCode} · {selectedOrphan.fullName}
                </p>
                <p className="text-sm font-semibold text-ink/65">
                  Approved and field verified
                  {selectedOrphan.cityArea ? ` · ${selectedOrphan.cityArea}` : ''}
                </p>
              </SummaryBox>
            ) : null}

            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="Monthly amount" error={errors.monthlyAmount}>
                <input
                  className="h-11 w-full rounded-lg border border-emerald/10 bg-white px-3 text-sm font-bold outline-none transition focus:border-gold focus:ring-4 focus:ring-gold/15"
                  min="1"
                  onChange={(event) => onUpdate('monthlyAmount', Number(event.target.value))}
                  type="number"
                  value={form.monthlyAmount}
                />
              </Field>
              <Field label="Currency" error={errors.currency}>
                <CustomSelect
                  ariaLabel="Currency"
                  onChange={(value) => onUpdate('currency', value)}
                  triggerClassName="h-11 text-emerald-deep"
                  value={form.currency}
                >
                  {currencyOptions.map((currency) => (
                    <option key={currency} value={currency}>
                      {currency}
                    </option>
                  ))}
                </CustomSelect>
              </Field>
              <Field label="Start date" error={errors.startedAt}>
                <input
                  className="h-11 w-full rounded-lg border border-emerald/10 bg-white px-3 text-sm font-bold outline-none transition focus:border-gold focus:ring-4 focus:ring-gold/15"
                  onChange={(event) => onUpdate('startedAt', event.target.value)}
                  type="date"
                  value={form.startedAt}
                />
              </Field>
            </div>

            <Field label="Internal notes" error={errors.notes}>
              <textarea
                className="min-h-28 w-full rounded-lg border border-emerald/10 bg-white px-3 py-2 text-sm font-semibold outline-none transition focus:border-gold focus:ring-4 focus:ring-gold/15"
                onChange={(event) => onUpdate('notes', event.target.value)}
                value={form.notes ?? ''}
              />
            </Field>
          </div>
        </div>

        <footer className="flex flex-col gap-3 border-t border-gold/18 px-5 py-4 sm:flex-row sm:justify-end lg:px-6">
          <button
            className="inline-flex h-11 items-center justify-center rounded-lg border border-emerald/10 bg-white px-5 text-sm font-bold text-emerald-deep transition hover:border-gold/50"
            onClick={onClose}
            type="button"
          >
            Cancel
          </button>
          <button
            className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-emerald-deepest px-5 text-sm font-bold text-cream-soft transition hover:bg-emerald-deep disabled:cursor-not-allowed disabled:opacity-55"
            disabled={saving}
            onClick={onSubmit}
            type="button"
          >
            <HeartHandshake className="h-4 w-4" />
            {saving ? 'Creating...' : 'Create Match'}
          </button>
        </footer>
      </section>
    </div>
  );
}

function Field({
  children,
  error,
  label,
}: {
  children: React.ReactNode;
  error?: string;
  label: string;
}) {
  return (
    <div>
      <span className="text-xs font-bold uppercase tracking-[0.14em] text-ink/60">{label}</span>
      <div className="mt-1">{children}</div>
      {error ? <p className="mt-1.5 text-sm font-bold text-red-600">{error}</p> : null}
    </div>
  );
}

function SummaryBox({
  children,
  icon: Icon,
}: {
  children: React.ReactNode;
  icon: React.ElementType;
}) {
  return (
    <div className="flex gap-3 rounded-lg border border-gold/16 bg-cream/45 px-4 py-3">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-deepest text-gold-soft">
        <Icon className="h-4.5 w-4.5" />
      </div>
      <div>{children}</div>
    </div>
  );
}

function StatusPill({ status }: { status: SponsorshipMatchStatus }) {
  return (
    <span
      className={cn(
        'inline-flex rounded-lg border px-2.5 py-1 text-xs font-semibold',
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

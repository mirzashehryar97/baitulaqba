'use client';

import { useState } from 'react';

import Link from 'next/link';

import { CheckCircle2, Clock3, FileText, Plus, Search, UserRound, UsersRound } from 'lucide-react';
import useSWR from 'swr';

import { useAdminAccount } from '@/components/admin/AdminShell';
import { InfiniteListLoader, useInfiniteAdminList } from '@/components/admin/InfiniteListLoader';
import { TableRowsSkeleton } from '@/components/admin/TableRowsSkeleton';
import { CustomSelect } from '@/components/ui/CustomSelect';
import { NavLinkIcon, NavLinkSpinner } from '@/components/ui/NavLinkIcon';
import { SkeletonBlock } from '@/components/ui/SkeletonBlock';
import { workflowStatus, workSurface } from '@/components/ui/work-surface';

import { canCreateOrphans } from '@/lib/adminPermissions';
import { fetchApiData } from '@/lib/apiFetcher';
import type { OrphanListSummary } from '@/lib/orphans';
import type { PaginatedResult } from '@/lib/pagination';
import { useDebouncedValue } from '@/lib/useDebouncedValue';
import { cn } from '@/lib/utils';

import type { OrphanProfile, OrphanProfileStatus, OrphanVerificationStatus } from '@/types/orphans';

const statusLabels: Record<OrphanProfileStatus, string> = {
  approved: 'Approved',
  archived: 'Archived',
  draft: 'Draft',
  matched: 'Matched',
  under_review: 'Under Review',
};

type StatusTone = keyof typeof workflowStatus;

const profileStatusTones: Record<OrphanProfileStatus, StatusTone> = {
  approved: 'blue',
  archived: 'neutral',
  draft: 'neutral',
  matched: 'green',
  under_review: 'amber',
};

const verificationStatusTones: Record<OrphanVerificationStatus, StatusTone> = {
  documents_received: 'blue',
  field_verified: 'green',
  needs_more_information: 'amber',
  rejected: 'red',
  unverified: 'neutral',
};

const verificationLabels: Record<OrphanVerificationStatus, string> = {
  documents_received: 'Documents Received',
  field_verified: 'Field Verified',
  needs_more_information: 'Needs More Information',
  rejected: 'Rejected',
  unverified: 'Unverified',
};

const initialUrl = '/api/admin/orphans';
const summaryUrl = '/api/admin/orphans/summary';

export function OrphansDashboard({
  initialPage,
  initialSummary,
}: {
  initialPage?: PaginatedResult<OrphanProfile>;
  initialSummary: OrphanListSummary;
}) {
  const {
    searchValue: search,
    setSearchValue: setSearch,
    teamMember: currentTeamMember,
  } = useAdminAccount();
  const canCreate = canCreateOrphans(currentTeamMember);
  const debouncedSearch = useDebouncedValue(search);
  const [statusFilter, setStatusFilter] = useState<OrphanProfileStatus | 'all'>('all');
  const [verificationFilter, setVerificationFilter] = useState<OrphanVerificationStatus | 'all'>(
    'all',
  );
  const params = new URLSearchParams();
  if (debouncedSearch.trim()) params.set('search', debouncedSearch.trim());
  if (statusFilter !== 'all') params.set('profileStatus', statusFilter);
  if (verificationFilter !== 'all') params.set('verificationStatus', verificationFilter);
  const url = params.size > 0 ? `${initialUrl}?${params.toString()}` : initialUrl;
  const {
    error: orphansError,
    hasMore,
    isLoading,
    isLoadingMore,
    isValidating,
    items: orphans,
    loadMore,
  } = useInfiniteAdminList({ initialPage, initialUrl, url });
  const { data: summary = initialSummary } = useSWR<OrphanListSummary>(summaryUrl, fetchApiData, {
    dedupingInterval: 15_000,
    fallbackData: initialSummary,
    revalidateOnFocus: true,
    revalidateOnMount: false,
  });
  const showListSkeleton = isLoading && orphans.length === 0 && !orphansError;

  const stats = [
    { icon: UsersRound, label: 'Matching Profiles', value: summary.total },
    {
      icon: FileText,
      label: 'Drafts',
      value: summary.drafts,
    },
    {
      icon: Clock3,
      label: 'Under Review',
      value: summary.underReview,
    },
    {
      icon: CheckCircle2,
      label: 'Approved',
      value: summary.approved,
    },
  ];

  return (
    <>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="font-display text-[1.7rem] font-semibold leading-tight text-emerald-deep">
              Orphan Profiles
            </h2>
            {isValidating && !showListSkeleton ? (
              <span className="rounded-full border border-gold/24 bg-gold/10 px-3 py-1 text-xs font-bold text-gold-deep">
                Syncing
              </span>
            ) : null}
          </div>
          <p className="mt-1 text-[0.95rem] font-medium text-ink/70">
            Prepare verified orphan profiles for future donor matching.
          </p>
          {orphansError && !showListSkeleton ? (
            <p className="mt-2 text-sm font-bold text-red-600">
              Could not refresh orphan profiles. Showing cached data.
            </p>
          ) : null}
        </div>
        {canCreate ? (
          <Link
            className={cn(workSurface.primaryButton, 'h-11 px-5 text-sm font-bold')}
            href="/admin/orphans/new"
          >
            <NavLinkIcon className="h-4 w-4" icon={Plus} />
            Add Orphan
          </Link>
        ) : null}
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <article
            className="rounded-lg border border-gold/16 bg-offwhite px-4 py-3.5 shadow-[0_16px_36px_-30px_rgba(7,39,29,0.6)]"
            key={stat.label}
          >
            <div className="flex items-start gap-3">
              <div className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-deepest text-gold-soft">
                <stat.icon className="h-4.5 w-4.5" />
              </div>
              <div>
                <p className="text-sm font-semibold leading-4 text-ink/78">{stat.label}</p>
                {showListSkeleton ? (
                  <SkeletonBlock className="mt-2 h-9 w-14" />
                ) : (
                  <p className="mt-2 font-sans text-[2.25rem] font-semibold leading-none text-emerald-deep tabular-nums">
                    {stat.value}
                  </p>
                )}
              </div>
            </div>
          </article>
        ))}
      </div>

      <section className="mt-5 min-w-0 overflow-hidden rounded-xl border border-gold/16 bg-offwhite shadow-soft">
        <div className="grid gap-3 border-b border-emerald/10 px-4 py-3 md:grid-cols-[minmax(14rem,1fr)_13rem_13rem]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/60" />
            <input
              className="h-10 w-full rounded-lg border border-emerald/10 bg-white pl-10 pr-3 text-sm font-semibold outline-none transition focus:border-gold focus:ring-4 focus:ring-gold/15"
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by code, name, guardian..."
              value={search}
            />
          </div>
          <CustomSelect
            ariaLabel="All Statuses"
            onChange={(event) => setStatusFilter(event as OrphanProfileStatus | 'all')}
            triggerClassName="text-emerald-deep"
            value={statusFilter}
          >
            <option value="all">All Statuses</option>
            {(Object.keys(statusLabels) as OrphanProfileStatus[]).map((status) => (
              <option key={status} value={status}>
                {statusLabels[status]}
              </option>
            ))}
          </CustomSelect>
          <CustomSelect
            ariaLabel="All Verification"
            onChange={(event) => setVerificationFilter(event as OrphanVerificationStatus | 'all')}
            triggerClassName="text-emerald-deep"
            value={verificationFilter}
          >
            <option value="all">All Verification</option>
            {(Object.keys(verificationLabels) as OrphanVerificationStatus[]).map((status) => (
              <option key={status} value={status}>
                {verificationLabels[status]}
              </option>
            ))}
          </CustomSelect>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] border-collapse text-left text-sm">
            <thead>
              <tr className="text-xs font-semibold uppercase text-[#6b7280]">
                <th className="border-b border-[#e8ece8] px-4 py-3.5">Code</th>
                <th className="border-b border-[#e8ece8] px-3 py-3.5">Orphan</th>
                <th className="border-b border-[#e8ece8] px-3 py-3.5">Guardian</th>
                <th className="border-b border-[#e8ece8] px-3 py-3.5">City/Area</th>
                <th className="border-b border-[#e8ece8] px-3 py-3.5">Added By</th>
                <th className="border-b border-[#e8ece8] px-3 py-3.5">Verification</th>
                <th className="border-b border-[#e8ece8] px-3 py-3.5">Status</th>
                <th className="border-b border-[#e8ece8] px-3 py-3.5">Updated</th>
              </tr>
            </thead>
            <tbody>
              {showListSkeleton ? <TableRowsSkeleton columns={8} /> : null}
              {orphans.map((orphan) => (
                <tr
                  className="border-t border-emerald/8 align-top transition hover:bg-cream/42"
                  key={orphan.id}
                >
                  <td className="px-4 py-3.5">
                    <span className="rounded-full bg-gold/16 px-3 py-1 text-xs font-medium text-gold-deep">
                      {orphan.orphanCode}
                    </span>
                  </td>
                  <td className="px-3 py-3.5">
                    <Link
                      className="flex items-center gap-3 text-left font-semibold text-[#111827] underline-offset-4 transition hover:text-[#006b4f] hover:underline"
                      href={`/admin/orphans/${orphan.id}`}
                    >
                      {orphan.profileImageUrl ? (
                        <img
                          alt=""
                          className="h-11 w-11 rounded-lg object-cover"
                          src={orphan.profileImageUrl}
                        />
                      ) : (
                        <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-emerald/10 text-emerald-deep">
                          <UserRound className="h-5 w-5" />
                        </span>
                      )}
                      <span>
                        <span className="flex items-center gap-1.5">
                          {orphan.fullName}
                          <NavLinkSpinner className="h-3.5 w-3.5" />
                        </span>
                        <span className="mt-1 block text-sm font-normal text-[#6b7280]">
                          {orphan.gender === 'male' ? 'Male' : 'Female'}
                        </span>
                      </span>
                    </Link>
                  </td>
                  <td className="px-3 py-3.5 font-medium text-[#111827]">
                    {orphan.guardian?.guardianName ?? 'Not added'}
                  </td>
                  <td className="px-3 py-3.5 font-medium text-[#111827]">
                    {orphan.cityArea ?? 'Not set'}
                  </td>
                  <td className="px-3 py-3.5 font-medium text-[#111827]">
                    {orphan.createdByTeamMember?.fullName ?? 'Not recorded'}
                  </td>
                  <td className="px-3 py-3.5">
                    <StatusPill tone={verificationStatusTones[orphan.verificationStatus]}>
                      {verificationLabels[orphan.verificationStatus]}
                    </StatusPill>
                  </td>
                  <td className="px-3 py-3.5">
                    <StatusPill tone={profileStatusTones[orphan.profileStatus]}>
                      {statusLabels[orphan.profileStatus]}
                    </StatusPill>
                  </td>
                  <td className="px-3 py-3.5 font-medium text-[#111827]">
                    {formatDate(orphan.updatedAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {!showListSkeleton && orphans.length === 0 ? (
          <div className="border-t border-emerald/8 px-6 py-10 text-center">
            <p className="font-display text-xl font-semibold text-emerald-deep">
              No orphan profiles found
            </p>
            <p className="mt-1 text-sm font-semibold text-ink/65">
              Adjust filters or add the first orphan profile.
            </p>
          </div>
        ) : null}
        {orphans.length > 0 ? (
          <InfiniteListLoader hasMore={hasMore} isLoadingMore={isLoadingMore} loadMore={loadMore} />
        ) : null}
      </section>
    </>
  );
}

function StatusPill({ children, tone }: { children: React.ReactNode; tone: StatusTone }) {
  return (
    <span
      className={cn(
        'inline-flex rounded-lg border px-2.5 py-1 text-xs font-semibold',
        workflowStatus[tone],
      )}
    >
      {children}
    </span>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('en', {
    dateStyle: 'medium',
  }).format(new Date(value));
}

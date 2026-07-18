'use client';

import { useState } from 'react';

import Link from 'next/link';

import { Clock3, Plus, Search, UserCheck, UserMinus, UsersRound } from 'lucide-react';
import useSWR from 'swr';

import { useAdminAccount } from '@/components/admin/AdminShell';
import { InfiniteListLoader, useInfiniteAdminList } from '@/components/admin/InfiniteListLoader';
import { TableRowsSkeleton } from '@/components/admin/TableRowsSkeleton';
import { CustomSelect } from '@/components/ui/CustomSelect';
import { NavigationSpinner, NavLinkIcon, NavLinkSpinner } from '@/components/ui/NavLinkIcon';
import { SkeletonBlock } from '@/components/ui/SkeletonBlock';
import { usePendingRowNavigation } from '@/components/ui/usePendingRowNavigation';
import { workflowStatus, workSurface } from '@/components/ui/work-surface';

import { canCreateDonors } from '@/lib/adminPermissions';
import { fetchApiData } from '@/lib/apiFetcher';
import type { DonorListSummary } from '@/lib/donors';
import type { PaginatedResult } from '@/lib/pagination';
import { useDebouncedValue } from '@/lib/useDebouncedValue';
import { cn } from '@/lib/utils';

import type { Donor, DonorPreferredContactMethod, DonorSource } from '@/types/accounts';

const donorSourceLabels: Record<DonorSource, string> = {
  admin_created: 'Admin Created',
  converted_request: 'Converted Request',
  email: 'Email',
  other: 'Other',
  phone: 'Phone',
  referral: 'Referral',
  whatsapp: 'WhatsApp',
};

const contactMethodLabels: Record<DonorPreferredContactMethod, string> = {
  email: 'Email',
  phone: 'Phone',
  whatsapp: 'WhatsApp',
};

function getInitials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('en', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

function isPendingFirstLogin(donor: Donor) {
  return donor.active && !donor.authUserId;
}

const initialUrl = '/api/admin/donors';
const summaryUrl = '/api/admin/donors/summary';

export function DonorsDashboard({
  initialPage,
  initialSummary,
}: {
  initialPage?: PaginatedResult<Donor>;
  initialSummary: DonorListSummary;
}) {
  const {
    searchValue: search,
    setSearchValue: setSearch,
    teamMember: currentTeamMember,
  } = useAdminAccount();
  const { navigateToRow, pendingRowId } = usePendingRowNavigation();
  const canCreate = canCreateDonors(currentTeamMember);
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'pending' | 'inactive'>(
    'all',
  );
  const [methodFilter, setMethodFilter] = useState<DonorPreferredContactMethod | 'all'>('all');
  const [sourceFilter, setSourceFilter] = useState<DonorSource | 'all'>('all');
  const debouncedSearch = useDebouncedValue(search);
  const params = new URLSearchParams();
  if (debouncedSearch.trim()) params.set('search', debouncedSearch.trim());
  if (statusFilter === 'active') {
    params.set('status', 'active');
    params.set('loginStatus', 'linked');
  } else if (statusFilter === 'pending') {
    params.set('status', 'active');
    params.set('loginStatus', 'pending');
  } else if (statusFilter === 'inactive') {
    params.set('status', 'inactive');
  }
  if (methodFilter !== 'all') params.set('preferredContactMethod', methodFilter);
  if (sourceFilter !== 'all') params.set('source', sourceFilter);
  const url = params.size > 0 ? `${initialUrl}?${params.toString()}` : initialUrl;
  const {
    error: donorsError,
    hasMore,
    isLoading,
    isLoadingMore,
    isValidating,
    items: donors,
    loadMore,
  } = useInfiniteAdminList({ initialPage, initialUrl, url });
  const { data: summary = initialSummary } = useSWR<DonorListSummary>(summaryUrl, fetchApiData, {
    dedupingInterval: 15_000,
    fallbackData: initialSummary,
    revalidateOnFocus: true,
    revalidateOnMount: false,
  });
  const showListSkeleton = isLoading && donors.length === 0 && !donorsError;

  const stats = [
    {
      icon: UsersRound,
      label: 'Matching Donors',
      value: summary.total,
    },
    {
      icon: UserCheck,
      label: 'Active Donors',
      value: summary.active,
    },
    {
      icon: Clock3,
      label: 'Pending First Login',
      value: summary.pendingFirstLogin,
    },
    {
      icon: UserMinus,
      label: 'Inactive',
      value: summary.inactive,
    },
  ];

  const openDonor = (donorId: string) => {
    navigateToRow(donorId, `/admin/donors/${donorId}`);
  };

  return (
    <>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="font-display text-[1.7rem] font-semibold leading-tight text-emerald-deep">
              Donors
            </h2>
            {isValidating && !showListSkeleton ? (
              <span className="rounded-full border border-gold/24 bg-gold/10 px-3 py-1 text-xs font-bold text-gold-deep">
                Syncing
              </span>
            ) : null}
          </div>
          <p className="mt-1 text-[0.95rem] font-medium text-ink/70">
            Manage donor profiles, contact preferences, and account access.
          </p>
          {donorsError && !showListSkeleton ? (
            <p className="mt-2 text-sm font-bold text-red-600">
              Could not refresh donors. Showing cached data.
            </p>
          ) : null}
        </div>
        {canCreate ? (
          <Link
            className={cn(workSurface.primaryButton, 'h-11 px-5 text-sm font-bold')}
            href="/admin/donors/new"
          >
            <NavLinkIcon className="h-4 w-4" icon={Plus} />
            Add Donor
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
        <div className="grid gap-3 border-b border-emerald/10 px-4 py-3 md:grid-cols-[minmax(14rem,1fr)_11rem_11rem_11rem]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/60" />
            <input
              className="h-10 w-full rounded-lg border border-emerald/10 bg-white pl-10 pr-3 text-sm font-semibold outline-none transition focus:border-gold focus:ring-4 focus:ring-gold/15"
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by name, email or phone..."
              value={search}
            />
          </div>
          <SelectField
            label="All Status"
            onChange={(value) => setStatusFilter(value as typeof statusFilter)}
            value={statusFilter}
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="pending">Pending Login</option>
            <option value="inactive">Inactive</option>
          </SelectField>
          <SelectField
            label="All Sources"
            onChange={(value) => setSourceFilter(value as DonorSource | 'all')}
            value={sourceFilter}
          >
            <option value="all">All Sources</option>
            {(Object.keys(donorSourceLabels) as DonorSource[]).map((source) => (
              <option key={source} value={source}>
                {donorSourceLabels[source]}
              </option>
            ))}
          </SelectField>
          <SelectField
            label="All Methods"
            onChange={(value) => setMethodFilter(value as DonorPreferredContactMethod | 'all')}
            value={methodFilter}
          >
            <option value="all">All Methods</option>
            {(Object.keys(contactMethodLabels) as DonorPreferredContactMethod[]).map((method) => (
              <option key={method} value={method}>
                {contactMethodLabels[method]}
              </option>
            ))}
          </SelectField>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] border-collapse text-left text-sm">
            <thead>
              <tr className="text-xs font-semibold uppercase text-[#6b7280]">
                <th className="border-b border-[#e8ece8] px-4 py-3.5">Donor</th>
                <th className="border-b border-[#e8ece8] px-3 py-3.5">Contact</th>
                <th className="border-b border-[#e8ece8] px-3 py-3.5">City/Country</th>
                <th className="border-b border-[#e8ece8] px-3 py-3.5">Method</th>
                <th className="border-b border-[#e8ece8] px-3 py-3.5">Source</th>
                <th className="border-b border-[#e8ece8] px-3 py-3.5">Login</th>
                <th className="border-b border-[#e8ece8] px-3 py-3.5">Created</th>
              </tr>
            </thead>
            <tbody>
              {showListSkeleton ? <TableRowsSkeleton columns={7} /> : null}
              {donors.map((donor) => (
                <tr
                  aria-busy={pendingRowId === donor.id}
                  className={cn(
                    'cursor-pointer border-t border-emerald/8 align-top transition hover:bg-cream/42',
                    pendingRowId === donor.id && 'cursor-wait',
                  )}
                  key={donor.id}
                  onClick={() => openDonor(donor.id)}
                >
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-3">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-deepest text-xs font-black text-gold-soft">
                        {pendingRowId === donor.id ? (
                          <NavigationSpinner className="h-4 w-4" />
                        ) : (
                          getInitials(donor.fullName)
                        )}
                      </span>
                      <span>
                        <Link
                          className="block text-left font-semibold text-[#111827] underline-offset-4 transition hover:text-[#006b4f] hover:underline"
                          href={`/admin/donors/${donor.id}`}
                          onClick={(event) => event.stopPropagation()}
                        >
                          {donor.fullName}
                          <NavLinkSpinner className="ml-1 h-3.5 w-3.5" />
                        </Link>
                        <span className="mt-1 block text-sm font-normal text-[#6b7280]">
                          {donor.email || 'No email'}
                        </span>
                      </span>
                    </div>
                  </td>
                  <td className="px-3 py-3.5">
                    <span className="block font-semibold text-[#111827]">
                      {donor.phone || 'No phone'}
                    </span>
                    <span className="mt-1 block text-sm font-normal text-[#6b7280]">
                      {contactMethodLabels[donor.preferredContactMethod]}
                    </span>
                  </td>
                  <td className="px-3 py-3.5 font-medium text-[#111827]">
                    {donor.cityCountry || 'Not added'}
                  </td>
                  <td className="px-3 py-3.5">
                    <ContactMethodBadge method={donor.preferredContactMethod} />
                  </td>
                  <td className="px-3 py-3.5 font-medium text-[#111827]">
                    {donorSourceLabels[donor.donorSource]}
                  </td>
                  <td className="px-3 py-3.5">
                    <DonorStatusBadge donor={donor} />
                  </td>
                  <td className="px-3 py-3.5 font-medium text-[#111827]">
                    {formatDate(donor.createdAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {!showListSkeleton && donors.length === 0 ? (
            <div className="px-4 py-16 text-center text-base font-semibold text-ink/70">
              No donors match the current filters.
            </div>
          ) : null}
        </div>

        {donors.length > 0 ? (
          <InfiniteListLoader hasMore={hasMore} isLoadingMore={isLoadingMore} loadMore={loadMore} />
        ) : null}
      </section>
    </>
  );
}

function DonorStatusBadge({ donor }: { donor: Donor }) {
  if (!donor.active) {
    return (
      <span
        className={cn(
          'inline-flex rounded-lg border px-2.5 py-1 text-xs font-semibold',
          workflowStatus.red,
        )}
      >
        Inactive
      </span>
    );
  }

  if (isPendingFirstLogin(donor)) {
    return (
      <span
        className={cn(
          'inline-flex rounded-lg border px-2.5 py-1 text-xs font-semibold',
          workflowStatus.amber,
        )}
      >
        Pending Login
      </span>
    );
  }

  return (
    <span
      className={cn(
        'inline-flex rounded-lg border px-2.5 py-1 text-xs font-semibold',
        workflowStatus.green,
      )}
    >
      Linked
    </span>
  );
}

function ContactMethodBadge({ method }: { method: DonorPreferredContactMethod }) {
  return (
    <span
      className={cn(
        'inline-flex rounded-lg border px-2.5 py-1 text-xs font-semibold',
        method === 'email' && workflowStatus.blue,
        method === 'phone' && workflowStatus.neutral,
        method === 'whatsapp' && workflowStatus.green,
      )}
    >
      {contactMethodLabels[method]}
    </span>
  );
}

function SelectField({
  children,
  label,
  onChange,
  value,
}: {
  children: React.ReactNode;
  label: string;
  onChange: (value: string) => void;
  value: string;
}) {
  return (
    <div className="relative block">
      <span className="sr-only">{label}</span>
      <CustomSelect
        ariaLabel={label}
        onChange={onChange}
        triggerClassName="h-10 text-ink/76"
        value={value}
      >
        {children}
      </CustomSelect>
    </div>
  );
}

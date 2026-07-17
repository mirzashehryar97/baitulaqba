'use client';

import { useState } from 'react';

import Link from 'next/link';

import {
  Clock3,
  Filter,
  MoreVertical,
  Plus,
  Search,
  ShieldCheck,
  UserMinus,
  UsersRound,
} from 'lucide-react';
import useSWR from 'swr';

import { useAdminAccount } from '@/components/admin/AdminShell';
import { InfiniteListLoader, useInfiniteAdminList } from '@/components/admin/InfiniteListLoader';
import { TableRowsSkeleton } from '@/components/admin/TableRowsSkeleton';
import { CustomSelect } from '@/components/ui/CustomSelect';
import { NavigationSpinner, NavLinkIcon, NavLinkSpinner } from '@/components/ui/NavLinkIcon';
import { SkeletonBlock } from '@/components/ui/SkeletonBlock';
import { usePendingRowNavigation } from '@/components/ui/usePendingRowNavigation';
import { workflowStatus, workSurface } from '@/components/ui/work-surface';

import { fetchApiData } from '@/lib/apiFetcher';
import type { PaginatedResult } from '@/lib/pagination';
import { isAdminRole, TEAM_MEMBER_ROLE_LABELS } from '@/lib/teamMemberRoles';
import type { TeamMemberListSummary } from '@/lib/teamMembers';
import { useDebouncedValue } from '@/lib/useDebouncedValue';
import { cn } from '@/lib/utils';

import { TEAM_MEMBER_ROLES, type TeamMember, type TeamMemberRole } from '@/types/accounts';

const roleTabs: Array<{ label: string; value: TeamMemberRole | 'all' }> = [
  { label: 'All', value: 'all' },
  { label: 'Super Admin', value: 'super_admin' },
  { label: 'Admin', value: 'admin' },
  { label: 'Sponsorship Manager', value: 'sponsorship_manager' },
  { label: 'Orphan Coordinator', value: 'orphan_coordinator' },
  { label: 'Finance Manager', value: 'finance_manager' },
  { label: 'Support', value: 'support_coordinator' },
  { label: 'Viewer', value: 'viewer' },
];

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

function isPendingFirstLogin(member: TeamMember) {
  return member.active && !member.authUserId;
}

const initialUrl = '/api/admin/team-members';
const summaryUrl = '/api/admin/team-members/summary';

export function TeamMembersDashboard({
  initialPage,
  initialSummary,
}: {
  initialPage?: PaginatedResult<TeamMember>;
  initialSummary: TeamMemberListSummary;
}) {
  const { searchValue: search, setSearchValue: setSearch } = useAdminAccount();
  const { navigateToRow, pendingRowId } = usePendingRowNavigation();
  const [roleFilter, setRoleFilter] = useState<TeamMemberRole | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'pending' | 'inactive'>(
    'all',
  );
  const debouncedSearch = useDebouncedValue(search);
  const params = new URLSearchParams();
  if (debouncedSearch.trim()) params.set('search', debouncedSearch.trim());
  if (roleFilter !== 'all') params.set('role', roleFilter);
  if (statusFilter !== 'all') params.set('status', statusFilter);
  const url = params.size > 0 ? `${initialUrl}?${params.toString()}` : initialUrl;
  const {
    error: membersError,
    hasMore,
    isLoading,
    isLoadingMore,
    isValidating,
    items: members,
    loadMore,
  } = useInfiniteAdminList({ initialPage, initialUrl, url });
  const { data: summary = initialSummary } = useSWR<TeamMemberListSummary>(
    summaryUrl,
    fetchApiData,
    {
      dedupingInterval: 15_000,
      fallbackData: initialSummary,
      revalidateOnFocus: true,
      revalidateOnMount: false,
    },
  );
  const showListSkeleton = isLoading && members.length === 0 && !membersError;

  const stats = [
    {
      helper: 'Can access admin',
      icon: UsersRound,
      label: 'Matching Members',
      value: summary.total,
    },
    {
      helper: 'Full access',
      icon: ShieldCheck,
      label: 'Admins',
      value: summary.admins,
    },
    {
      helper: 'Waiting for Google login',
      icon: Clock3,
      label: 'Pending First Login',
      value: summary.pendingFirstLogin,
    },
    {
      helper: 'Access paused',
      icon: UserMinus,
      label: 'Inactive',
      value: summary.inactive,
    },
  ];

  const openMember = (memberId: string) => {
    navigateToRow(memberId, `/admin/team/${memberId}`);
  };

  return (
    <>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="font-display text-[1.7rem] font-semibold leading-tight text-emerald-deep">
              Team Members
            </h2>
            {isValidating && !showListSkeleton ? (
              <span className="rounded-full border border-gold/24 bg-gold/10 px-3 py-1 text-xs font-bold text-gold-deep">
                Syncing
              </span>
            ) : null}
          </div>
          <p className="mt-1 text-[0.95rem] font-medium text-ink/70">
            Manage staff access, roles, and account status.
          </p>
          {membersError && !showListSkeleton ? (
            <p className="mt-2 text-sm font-bold text-red-600">
              Could not refresh team members. Showing cached data.
            </p>
          ) : null}
        </div>
        <Link
          className={cn(workSurface.primaryButton, 'h-11 px-5 text-sm font-bold')}
          href="/admin/team/new"
        >
          <NavLinkIcon className="h-4 w-4" icon={Plus} />
          Add Team Member
        </Link>
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

      <div className="mt-5">
        <section className="min-w-0 overflow-hidden rounded-xl border border-gold/16 bg-offwhite shadow-soft">
          <div className="flex flex-wrap items-center gap-2 border-b border-emerald/10 px-4 py-3">
            {roleTabs.map((tab) => (
              <button
                className={cn(
                  'h-9 rounded-full px-3.5 text-sm font-bold transition',
                  roleFilter === tab.value
                    ? 'bg-gold text-emerald-deepest shadow-sm'
                    : 'border border-emerald/10 bg-white text-ink/72 hover:border-gold/35 hover:text-emerald-deep',
                )}
                key={tab.value}
                onClick={() => setRoleFilter(tab.value)}
                type="button"
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="grid gap-3 border-b border-emerald/10 px-4 py-3 md:grid-cols-[minmax(14rem,1fr)_11rem_11rem_auto]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/60" />
              <input
                className="h-10 w-full rounded-lg border border-emerald/10 bg-white pl-10 pr-3 text-sm font-semibold outline-none transition focus:border-gold focus:ring-4 focus:ring-gold/15"
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search by name or email..."
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
              <option value="pending">Pending First Login</option>
              <option value="inactive">Inactive</option>
            </SelectField>
            <SelectField
              label="All Roles"
              onChange={(value) => setRoleFilter(value as TeamMemberRole | 'all')}
              value={roleFilter}
            >
              <option value="all">All Roles</option>
              {TEAM_MEMBER_ROLES.map((role) => (
                <option key={role} value={role}>
                  {TEAM_MEMBER_ROLE_LABELS[role]}
                </option>
              ))}
            </SelectField>
            <button
              className="flex h-10 items-center justify-center gap-2 rounded-lg border border-emerald/10 bg-white px-4 text-sm font-bold text-emerald-deep transition hover:border-gold/45"
              type="button"
            >
              <Filter className="h-4 w-4" />
              Filters
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] border-collapse text-left text-sm">
              <thead className="bg-offwhite text-[0.82rem] uppercase tracking-[0.16em] text-emerald-deep/70">
                <tr>
                  <th className="px-4 py-3.5 font-bold">Name</th>
                  <th className="px-3 py-3.5 font-bold">Email</th>
                  <th className="px-3 py-3.5 font-bold">Phone</th>
                  <th className="px-3 py-3.5 font-bold">Role</th>
                  <th className="px-3 py-3.5 font-bold">Status</th>
                  <th className="px-3 py-3.5 font-bold">Last Login</th>
                  <th className="w-12 px-3 py-3.5" />
                </tr>
              </thead>
              <tbody>
                {showListSkeleton ? <TableRowsSkeleton columns={7} /> : null}
                {members.map((member) => (
                  <tr
                    aria-busy={pendingRowId === member.id}
                    className={cn(
                      'cursor-pointer border-t border-emerald/8 transition hover:bg-cream/42',
                      pendingRowId === member.id && 'cursor-wait',
                    )}
                    key={member.id}
                    onClick={() => openMember(member.id)}
                  >
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-3">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-deepest text-xs font-black text-gold-soft">
                          {getInitials(member.fullName)}
                        </span>
                        <span>
                          <Link
                            className="block text-left text-base font-bold text-emerald-deep transition hover:text-gold-deep hover:underline"
                            href={`/admin/team/${member.id}`}
                            onClick={(event) => event.stopPropagation()}
                          >
                            {member.fullName}
                            <NavLinkSpinner className="ml-1 h-3.5 w-3.5" />
                          </Link>
                          {isAdminRole(member.role) ? (
                            <span className="mt-1 inline-flex items-center gap-1 text-[0.68rem] font-bold text-gold-deep">
                              <ShieldCheck className="h-3 w-3" />
                              {member.role === 'super_admin'
                                ? 'Super admin access'
                                : 'Admin access'}
                            </span>
                          ) : null}
                        </span>
                      </div>
                    </td>
                    <td className="px-3 py-3.5 text-ink/78">{member.email}</td>
                    <td className="px-3 py-3.5 text-ink/78">{member.phone || 'No phone'}</td>
                    <td className="px-3 py-3.5 text-ink/72">
                      {TEAM_MEMBER_ROLE_LABELS[member.role]}
                    </td>
                    <td className="px-3 py-3.5">
                      <MemberStatusBadge member={member} />
                    </td>
                    <td className="px-3 py-3.5 text-sm font-semibold text-ink/70">
                      {member.authUserId ? (
                        formatDate(member.updatedAt)
                      ) : (
                        <>
                          <span className="block">-</span>
                          <span className="block font-medium">Never logged in</span>
                        </>
                      )}
                    </td>
                    <td className="px-3 py-3.5">
                      <Link
                        aria-label={`Edit ${member.fullName}`}
                        className="flex h-9 w-9 items-center justify-center rounded-lg text-ink/65 transition hover:bg-cream hover:text-emerald-deep"
                        href={`/admin/team/${member.id}`}
                        onClick={(event) => event.stopPropagation()}
                      >
                        {pendingRowId === member.id ? (
                          <NavigationSpinner className="h-4 w-4" />
                        ) : (
                          <NavLinkIcon className="h-4 w-4" icon={MoreVertical} />
                        )}
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {!showListSkeleton && members.length === 0 ? (
              <div className="px-4 py-16 text-center text-base font-semibold text-ink/70">
                No team members match the current filters.
              </div>
            ) : null}
          </div>

          {members.length > 0 ? (
            <InfiniteListLoader
              hasMore={hasMore}
              isLoadingMore={isLoadingMore}
              loadMore={loadMore}
            />
          ) : null}
        </section>
      </div>
    </>
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

function MemberStatusBadge({ member }: { member: TeamMember }) {
  if (!member.active) {
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

  if (isPendingFirstLogin(member)) {
    return (
      <span
        className={cn(
          'inline-flex rounded-lg border px-2.5 py-1 text-xs font-semibold',
          workflowStatus.amber,
        )}
      >
        Pending
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
      Active
    </span>
  );
}

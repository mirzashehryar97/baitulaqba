'use client';

import { useEffect, useMemo, useState } from 'react';

import {
  CheckCircle2,
  Clock3,
  MessageCircle,
  MoreVertical,
  Phone,
  Plus,
  Search,
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
import { NavigationSpinner } from '@/components/ui/NavLinkIcon';
import { useToast } from '@/components/ui/ToastProvider';
import { usePendingRowNavigation } from '@/components/ui/usePendingRowNavigation';
import { workflowStatus, workSurface } from '@/components/ui/work-surface';

import {
  canAssignSponsorshipRequests,
  canCreateSponsorshipRequests,
  isAssignedOnlySponsorshipRole,
} from '@/lib/adminPermissions';
import { fetchApiData } from '@/lib/apiFetcher';
import type { PaginatedResult } from '@/lib/pagination';
import type { SponsorshipRequestListSummary } from '@/lib/sponsorshipRequests';
import { useDebouncedValue } from '@/lib/useDebouncedValue';
import { cn } from '@/lib/utils';

import type {
  PreferredContactMethod,
  RequestSource,
  SponsorshipRequest,
  SponsorshipRequestCreateInput,
  SponsorshipRequestStatus,
  TeamMemberSummary,
} from '@/types/sponsorship';

const statusOptions: Array<{ value: SponsorshipRequestStatus; label: string }> = [
  { value: 'new', label: 'New request' },
  { value: 'contacted', label: 'Contacted' },
  { value: 'profiles_prepared', label: 'Profiles prepared' },
  { value: 'profiles_shared', label: 'Profiles shared' },
  { value: 'converted_to_donor', label: 'Converted to donor' },
  { value: 'closed', label: 'Closed' },
];

const methodOptions: Array<{ value: PreferredContactMethod; label: string }> = [
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'phone', label: 'Phone Call' },
  { value: 'email', label: 'Email' },
];

const requestSourceOptions: Array<{ value: RequestSource; label: string }> = [
  { value: 'admin_created', label: 'Admin Created' },
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'phone', label: 'Phone Call' },
  { value: 'email', label: 'Email' },
  { value: 'referral', label: 'Referral' },
  { value: 'walk_in', label: 'Walk-in' },
  { value: 'other', label: 'Other' },
];

const statusStyles: Record<SponsorshipRequestStatus, string> = {
  closed: workflowStatus.neutral,
  contacted: workflowStatus.amber,
  converted_to_donor: workflowStatus.green,
  new: workflowStatus.blue,
  profiles_prepared: workflowStatus.amber,
  profiles_shared: workflowStatus.blue,
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat('en', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

function getStatusLabel(status: SponsorshipRequestStatus, convertedDonorId?: string | null) {
  if (status === 'closed' && convertedDonorId) {
    return 'Matched & Closed';
  }

  return statusOptions.find((option) => option.value === status)?.label ?? status;
}

function getMethodLabel(method: PreferredContactMethod) {
  return methodOptions.find((option) => option.value === method)?.label ?? method;
}

function formatOptionalDate(value: string | null) {
  return value ? formatDate(value) : '-';
}

function fromDateTimeInputValue(value: string) {
  return value ? new Date(value).toISOString() : null;
}

const requestsInitialUrl = '/api/admin/sponsorship-requests';
const requestsSummaryUrl = '/api/admin/sponsorship-requests/summary';

export function AdminDashboard({
  initialPage,
  initialSummary,
}: {
  initialPage?: PaginatedResult<SponsorshipRequest>;
  initialSummary: SponsorshipRequestListSummary;
}) {
  const { navigateToRow, pendingRowId } = usePendingRowNavigation();
  const initialRequests = initialPage?.items ?? [];
  const { searchValue: search, setSearchValue: setSearch, teamMember } = useAdminAccount();
  const toast = useToast();
  const confirm = useConfirmation();
  const canAssignRequests = canAssignSponsorshipRequests(teamMember);
  const canCreateRequests = canCreateSponsorshipRequests(teamMember);
  const assignedOnly = isAssignedOnlySponsorshipRole(teamMember.role);
  const { data: assignees = [] } = useSWR<TeamMemberSummary[]>(
    canAssignRequests ? '/api/admin/sponsorship-requests/assignees' : null,
    fetchApiData,
    {
      dedupingInterval: 60_000,
      revalidateOnFocus: true,
    },
  );
  const [selectedId, setSelectedId] = useState(initialRequests[0]?.id ?? '');
  const [statusFilter, setStatusFilter] = useState<SponsorshipRequestStatus | 'all'>('all');
  const [cityFilter, setCityFilter] = useState('all');
  const [methodFilter, setMethodFilter] = useState<PreferredContactMethod | 'all'>('all');
  const [assignmentFilter, setAssignmentFilter] = useState('all');
  const [conversionFilter, setConversionFilter] = useState<'all' | 'yes' | 'no'>('all');
  const [followUpFilter, setFollowUpFilter] = useState<'all' | 'due' | 'my_due'>('all');
  const [newRequestOpen, setNewRequestOpen] = useState(false);

  const debouncedSearch = useDebouncedValue(search);
  const requestParams = new URLSearchParams();
  if (debouncedSearch.trim()) requestParams.set('search', debouncedSearch.trim());
  if (statusFilter !== 'all') requestParams.set('status', statusFilter);
  if (cityFilter !== 'all') requestParams.set('city', cityFilter);
  if (methodFilter !== 'all') requestParams.set('method', methodFilter);
  if (assignmentFilter !== 'all') requestParams.set('assignedTo', assignmentFilter);
  if (conversionFilter !== 'all') requestParams.set('converted', conversionFilter);
  if (followUpFilter !== 'all') requestParams.set('followUp', 'due');
  if (followUpFilter === 'my_due') requestParams.set('assignedTo', 'me');
  const requestsUrl =
    requestParams.size > 0
      ? `${requestsInitialUrl}?${requestParams.toString()}`
      : requestsInitialUrl;
  const {
    error: requestsError,
    hasMore,
    isLoading,
    isLoadingMore,
    isValidating,
    items: requests,
    loadMore,
    mutate: mutateRequests,
  } = useInfiniteAdminList({ initialPage, initialUrl: requestsInitialUrl, url: requestsUrl });
  const { data: summary = initialSummary, mutate: mutateSummary } =
    useSWR<SponsorshipRequestListSummary>(requestsSummaryUrl, fetchApiData, {
      dedupingInterval: 15_000,
      fallbackData: initialSummary,
      revalidateOnFocus: true,
      revalidateOnMount: false,
    });
  const showListSkeleton = isLoading && requests.length === 0 && !requestsError;

  const selectedRequest =
    requests.find((request) => request.id === selectedId) ?? requests[0] ?? null;

  useEffect(() => {
    if (!requests.length) {
      setSelectedId('');
      return;
    }

    if (!selectedId || !requests.some((request) => request.id === selectedId)) {
      setSelectedId(requests[0].id);
    }
  }, [requests, selectedId]);

  const cityOptions = useMemo(() => {
    return Array.from(
      new Set(requests.map((request) => request.cityCountry).filter(Boolean)),
    ).sort();
  }, [requests]);

  const filteredRequests = requests;

  const kpis = [
    {
      helper: 'Ready for review',
      icon: UsersRound,
      label: 'New Requests',
      value: summary.newRequests,
    },
    {
      helper: assignedOnly ? 'Your queue' : 'Owned by you',
      icon: UserRound,
      label: 'Assigned To Me',
      value: summary.assignedToMe,
    },
    {
      helper: 'Needs attention',
      icon: Clock3,
      label: 'Follow-ups Due',
      value: summary.followUpsDue,
    },
    {
      helper: 'Ready for donor profile',
      icon: CheckCircle2,
      label: 'Converted Donors',
      value: summary.convertedDonors,
    },
  ];

  const selectRequest = (request: SponsorshipRequest) => {
    setSelectedId(request.id);
    navigateToRow(request.id, `/admin/sponsorship-requests/${request.id}`);
  };

  const createRequest = async (payload: SponsorshipRequestCreateInput) => {
    const confirmed = await confirm({
      confirmLabel: 'Create Request',
      description: `Create a sponsorship request for ${payload.fullName}.`,
      title: 'Create sponsorship request?',
    });

    if (!confirmed) {
      throw new Error('Request creation cancelled.');
    }

    const response = await fetch('/api/admin/sponsorship-requests', {
      body: JSON.stringify(payload),
      headers: { 'Content-Type': 'application/json' },
      method: 'POST',
    });
    const body = (await response.json().catch(() => null)) as {
      data?: SponsorshipRequest;
      error?: string;
      errors?: Partial<Record<keyof SponsorshipRequestCreateInput, string>>;
    } | null;

    if (!response.ok || !body?.data) {
      const error = new Error(body?.error ?? 'Could not create sponsorship request.') as Error & {
        errors?: Partial<Record<keyof SponsorshipRequestCreateInput, string>>;
      };
      error.errors = body?.errors;
      toast({
        description: body?.error ?? 'Please review the highlighted fields and try again.',
        title: 'Request creation failed',
        type: 'error',
      });
      throw error;
    }

    await Promise.all([mutateRequests(), mutateSummary()]);
    setSelectedId(body.data.id);
    toast({
      description: `${body.data.fullName}'s request was added.`,
      title: 'Request created',
      type: 'success',
    });
    void mutateRequests();
  };

  return (
    <>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="font-display text-[1.7rem] font-semibold leading-tight text-emerald-deep">
              Sponsorship Requests
            </h2>
            {isValidating && !showListSkeleton ? (
              <span className="rounded-full border border-gold/24 bg-gold/10 px-3 py-1 text-xs font-bold text-gold-deep">
                Syncing
              </span>
            ) : null}
          </div>
          <p className="mt-1 text-[0.95rem] font-medium text-ink/70">
            Manage and follow up on orphan sponsorship requests.
          </p>
          {requestsError && !showListSkeleton ? (
            <p className="mt-2 text-sm font-bold text-red-600">
              Could not refresh requests. Showing cached data.
            </p>
          ) : null}
        </div>
        {canCreateRequests ? (
          <button
            className={cn(workSurface.primaryButton, 'h-11 px-5 text-sm font-bold')}
            onClick={() => setNewRequestOpen(true)}
            type="button"
          >
            <Plus className="h-4 w-4" />
            New Request
          </button>
        ) : null}
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((kpi) => (
          <article
            className="rounded-lg border border-gold/16 bg-offwhite px-4 py-3.5 shadow-[0_16px_36px_-30px_rgba(7,39,29,0.6)]"
            key={kpi.label}
          >
            <div className="flex items-start gap-3">
              <div className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-deepest text-gold-soft shadow-[0_14px_26px_-18px_rgba(0,0,0,0.85)]">
                <kpi.icon className="h-4.5 w-4.5" />
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold leading-4 text-ink/78">{kpi.label}</p>
                {showListSkeleton ? (
                  <SkeletonBlock className="mt-2 h-9 w-14" />
                ) : (
                  <p className="mt-2 font-sans text-[2.25rem] font-semibold leading-none text-emerald-deep tabular-nums">
                    {kpi.value}
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
            <TabButton
              active={statusFilter === 'all'}
              count={summary.total}
              label="All Requests"
              onClick={() => setStatusFilter('all')}
            />
            {statusOptions.map((status) => (
              <TabButton
                active={statusFilter === status.value}
                count={summary.statusCounts[status.value]}
                key={status.value}
                label={status.label}
                onClick={() => setStatusFilter(status.value)}
              />
            ))}
          </div>

          <div className="flex flex-wrap gap-3 border-b border-emerald/10 px-4 py-3">
            <div className="relative min-w-[min(100%,18rem)] flex-[1_1_20rem]">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/60" />
              <input
                className="h-10 w-full rounded-lg border border-emerald/10 bg-white pl-10 pr-3 text-sm font-semibold outline-none transition focus:border-gold focus:ring-4 focus:ring-gold/15"
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search by name, email or phone..."
                value={search}
              />
            </div>
            <FilterSelect
              className="min-w-[min(100%,10.5rem)] flex-[1_1_10.5rem]"
              label="All Status"
              onChange={(value) => setStatusFilter(value as SponsorshipRequestStatus | 'all')}
              value={statusFilter}
            >
              <option value="all">All Status</option>
              {statusOptions.map((status) => (
                <option key={status.value} value={status.value}>
                  {status.label}
                </option>
              ))}
            </FilterSelect>
            <FilterSelect
              className="min-w-[min(100%,10.5rem)] flex-[1_1_10.5rem]"
              label="All Cities"
              onChange={setCityFilter}
              value={cityFilter}
            >
              <option value="all">All Cities</option>
              {cityOptions.map((city) => (
                <option key={city} value={city}>
                  {city}
                </option>
              ))}
            </FilterSelect>
            <FilterSelect
              className="min-w-[min(100%,10.5rem)] flex-[1_1_10.5rem]"
              label="All Methods"
              onChange={(value) => setMethodFilter(value as PreferredContactMethod | 'all')}
              value={methodFilter}
            >
              <option value="all">All Methods</option>
              {methodOptions.map((method) => (
                <option key={method.value} value={method.value}>
                  {method.label}
                </option>
              ))}
            </FilterSelect>
            <FilterSelect
              className="min-w-[min(100%,11.5rem)] flex-[1_1_11.5rem]"
              label="Assignment"
              onChange={setAssignmentFilter}
              value={assignmentFilter}
            >
              <option value="all">All Assignees</option>
              <option value="me">Assigned to Me</option>
              <option value="unassigned">Unassigned</option>
              {canAssignRequests
                ? assignees.map((assignee) => (
                    <option key={assignee.id} value={assignee.id}>
                      {assignee.fullName}
                    </option>
                  ))
                : null}
            </FilterSelect>
            <FilterSelect
              className="min-w-[min(100%,11.5rem)] flex-[1_1_11.5rem]"
              label="Conversion"
              onChange={(value) => setConversionFilter(value as 'all' | 'yes' | 'no')}
              value={conversionFilter}
            >
              <option value="all">All Conversion</option>
              <option value="yes">Converted</option>
              <option value="no">Not Converted</option>
            </FilterSelect>
            <FilterSelect
              className="min-w-[min(100%,11rem)] flex-[1_1_11rem]"
              label="Follow-up"
              onChange={(value) => setFollowUpFilter(value as 'all' | 'due' | 'my_due')}
              value={followUpFilter}
            >
              <option value="all">All Follow-ups</option>
              <option value="due">Due Now</option>
              <option value="my_due">My Follow-ups</option>
            </FilterSelect>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] border-collapse text-left text-sm">
              <thead>
                <tr className="text-xs font-semibold uppercase text-[#6b7280]">
                  <th className="w-11 border-b border-[#e8ece8] px-4 py-3.5">
                    <span className="block h-4 w-4 rounded border border-emerald/15" />
                  </th>
                  <th className="border-b border-[#e8ece8] px-3 py-3.5">Name</th>
                  <th className="border-b border-[#e8ece8] px-3 py-3.5">Contact</th>
                  <th className="border-b border-[#e8ece8] px-3 py-3.5">City</th>
                  <th className="border-b border-[#e8ece8] px-3 py-3.5">Assignee</th>
                  <th className="border-b border-[#e8ece8] px-3 py-3.5">Status</th>
                  <th className="border-b border-[#e8ece8] px-3 py-3.5">Last Contact</th>
                  <th className="border-b border-[#e8ece8] px-3 py-3.5">Next Follow-up</th>
                  <th className="border-b border-[#e8ece8] px-3 py-3.5">Submitted</th>
                  <th className="w-10 border-b border-[#e8ece8] px-3 py-3.5" />
                </tr>
              </thead>
              <tbody>
                {showListSkeleton ? <TableRowsSkeleton columns={10} /> : null}
                {filteredRequests.map((request) => (
                  <tr
                    aria-busy={pendingRowId === request.id}
                    className={cn(
                      'cursor-pointer border-t border-emerald/8 align-top transition hover:bg-cream/42',
                      selectedRequest?.id === request.id && 'bg-cream/55',
                      pendingRowId === request.id && 'cursor-wait',
                    )}
                    key={request.id}
                    onClick={() => selectRequest(request)}
                  >
                    <td className="px-4 py-3">
                      <button
                        aria-label={`Select ${request.fullName}`}
                        className={cn(
                          'flex h-4 w-4 items-center justify-center rounded border',
                          selectedRequest?.id === request.id
                            ? 'border-emerald-deepest bg-emerald-deepest text-cream-soft'
                            : 'border-emerald/20 bg-white',
                        )}
                        onClick={(event) => {
                          event.stopPropagation();
                          selectRequest(request);
                        }}
                        type="button"
                      >
                        {selectedRequest?.id === request.id ? (
                          <CheckCircle2 className="h-3 w-3" />
                        ) : null}
                      </button>
                    </td>
                    <td className="px-3 py-3.5">
                      <button
                        className="text-left transition"
                        onClick={(event) => {
                          event.stopPropagation();
                          selectRequest(request);
                        }}
                        type="button"
                      >
                        <span className="block font-semibold text-[#111827] underline-offset-4 transition hover:text-[#006b4f] hover:underline">
                          {request.fullName}
                        </span>
                        <span className="mt-1 block text-sm font-normal text-[#6b7280]">
                          {request.email}
                        </span>
                      </button>
                    </td>
                    <td className="px-3 py-3.5">
                      <div className="flex items-center gap-2 font-semibold text-[#111827]">
                        <Phone className="h-3.5 w-3.5 text-[#6b7280]" />
                        {request.phone}
                      </div>
                      <div className="mt-1 flex items-center gap-2 text-sm font-normal capitalize text-[#6b7280]">
                        <MessageCircle className="h-3.5 w-3.5 text-[#6b7280]" />
                        {getMethodLabel(request.preferredContactMethod)}
                      </div>
                    </td>
                    <td className="px-3 py-3.5 font-medium text-[#111827]">
                      {request.cityCountry || 'No city'}
                    </td>
                    <td className="px-3 py-3.5 font-medium text-[#111827]">
                      {request.assignedTeamMember?.fullName ?? request.assignedTo ?? 'Unassigned'}
                    </td>
                    <td className="px-3 py-3.5">
                      <span
                        className={cn(
                          'inline-flex rounded-lg border px-2.5 py-1 text-xs font-medium',
                          statusStyles[request.status],
                        )}
                      >
                        {getStatusLabel(request.status, request.convertedDonorId)}
                      </span>
                    </td>
                    <td className="px-3 py-3.5 font-medium text-[#111827]">
                      {formatOptionalDate(request.lastContactedAt)}
                    </td>
                    <td className="px-3 py-3.5 font-medium text-[#111827]">
                      {formatOptionalDate(request.nextFollowUpAt)}
                    </td>
                    <td className="px-3 py-3.5 font-medium text-[#111827]">
                      {formatDate(request.createdAt)}
                    </td>
                    <td className="px-3 py-3.5">
                      <button
                        aria-label="More request actions"
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-ink/65 transition hover:bg-cream hover:text-emerald-deep"
                        onClick={(event) => {
                          event.stopPropagation();
                          selectRequest(request);
                        }}
                        type="button"
                      >
                        {pendingRowId === request.id ? (
                          <NavigationSpinner className="h-4 w-4" />
                        ) : (
                          <MoreVertical className="h-4 w-4" />
                        )}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {!showListSkeleton && filteredRequests.length === 0 ? (
              <div className="px-4 py-16 text-center text-base font-semibold text-ink/70">
                No requests match the current filters.
              </div>
            ) : null}
            {filteredRequests.length > 0 ? (
              <InfiniteListLoader
                hasMore={hasMore}
                isLoadingMore={isLoadingMore}
                loadMore={loadMore}
              />
            ) : null}
          </div>
        </section>
      </div>
      <NewRequestDrawer
        assignees={assignees}
        canAssignRequest={canAssignRequests}
        currentTeamMember={teamMember}
        onClose={() => setNewRequestOpen(false)}
        onCreate={createRequest}
        open={newRequestOpen}
      />
    </>
  );
}

function SkeletonBlock({ className }: { className?: string }) {
  return <div className={cn('animate-pulse rounded bg-emerald-deep/10', className)} />;
}

function TabButton({
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
      className={cn(
        'flex h-9 items-center gap-2 rounded-full px-3.5 text-sm font-bold transition',
        active ? 'bg-gold/15 text-gold-deep' : 'text-ink/72 hover:bg-cream hover:text-emerald-deep',
      )}
      onClick={onClick}
      type="button"
    >
      {label}
      <span
        className={cn(
          'rounded-full px-2 py-0.5 text-[0.65rem]',
          active ? 'bg-gold text-emerald-deepest' : 'bg-ink/10 text-ink/70',
        )}
      >
        {count}
      </span>
    </button>
  );
}

function FilterSelect({
  children,
  className,
  label,
  onChange,
  value,
}: {
  children: React.ReactNode;
  className?: string;
  label: string;
  onChange: (value: string) => void;
  value: string;
}) {
  return (
    <div className={cn('relative block', className)}>
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

function NewRequestDrawer({
  assignees,
  canAssignRequest,
  currentTeamMember,
  onClose,
  onCreate,
  open,
}: {
  assignees: TeamMemberSummary[];
  canAssignRequest: boolean;
  currentTeamMember: { fullName: string; id: string };
  onClose: () => void;
  onCreate: (payload: SponsorshipRequestCreateInput) => Promise<void>;
  open: boolean;
}) {
  const [form, setForm] = useState({
    adminNotes: '',
    assignedTeamMemberId: '',
    cityCountry: '',
    confirmedMinimumAmount: true,
    email: '',
    fullName: '',
    message: '',
    nextFollowUpAt: '',
    phone: '',
    preferredContactMethod: 'whatsapp' as PreferredContactMethod,
    requestSource: 'admin_created' as RequestSource,
    status: 'new' as SponsorshipRequestStatus,
  });
  const [errors, setErrors] = useState<
    Partial<Record<keyof SponsorshipRequestCreateInput, string>>
  >({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) {
      return;
    }

    setErrors({});
  }, [open]);

  if (!open) {
    return null;
  }

  const updateForm = <Key extends keyof typeof form>(key: Key, value: (typeof form)[Key]) => {
    setForm((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined }));
  };

  const submitRequest = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setErrors({});

    try {
      await onCreate({
        adminNotes: form.adminNotes.trim(),
        assignedTeamMemberId: canAssignRequest ? form.assignedTeamMemberId || null : null,
        cityCountry: form.cityCountry.trim(),
        confirmedMinimumAmount: form.confirmedMinimumAmount,
        email: form.email.trim(),
        fullName: form.fullName.trim(),
        message: form.message.trim(),
        nextFollowUpAt: fromDateTimeInputValue(form.nextFollowUpAt),
        phone: form.phone.trim(),
        preferredContactMethod: form.preferredContactMethod,
        requestSource: form.requestSource,
        status: 'new',
      });
      setForm({
        adminNotes: '',
        assignedTeamMemberId: '',
        cityCountry: '',
        confirmedMinimumAmount: true,
        email: '',
        fullName: '',
        message: '',
        nextFollowUpAt: '',
        phone: '',
        preferredContactMethod: 'whatsapp',
        requestSource: 'admin_created',
        status: 'new',
      });
      onClose();
    } catch (error) {
      if (error instanceof Error && 'errors' in error) {
        setErrors(
          (
            error as Error & {
              errors?: Partial<Record<keyof SponsorshipRequestCreateInput, string>>;
            }
          ).errors ?? {},
        );
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      aria-modal="true"
      className="fixed inset-0 z-[90] flex items-end justify-end bg-emerald-deepest/58 backdrop-blur-sm sm:items-stretch"
      role="dialog"
    >
      <button
        aria-label="Close new request"
        className="absolute inset-0"
        onClick={onClose}
        type="button"
      />
      <section className="relative flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-2xl border border-gold/20 bg-offwhite shadow-[0_30px_90px_-35px_rgba(0,0,0,0.75)] sm:h-full sm:max-h-none sm:max-w-xl sm:rounded-l-2xl sm:rounded-tr-none">
        <div className="flex items-start justify-between gap-4 border-b border-emerald/10 p-5">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-gold-deep">
              Admin Created
            </p>
            <h2 className="mt-2 font-display text-3xl font-semibold text-emerald-deep">
              New Sponsorship Request
            </h2>
            <p className="mt-1 text-sm font-semibold text-ink/68">
              Add a request received by phone, WhatsApp, referral, or your team.
            </p>
          </div>
          <button
            aria-label="Close new request"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-ink/64 transition hover:bg-cream hover:text-emerald-deep"
            onClick={onClose}
            type="button"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form className="flex-1 overflow-y-auto p-5" onSubmit={submitRequest}>
          <div className="grid gap-4 sm:grid-cols-2">
            <RequestFormField
              error={errors.fullName}
              label="Full Name"
              onChange={(value) => updateForm('fullName', value)}
              placeholder="Enter sponsor name"
              value={form.fullName}
            />
            <RequestFormField
              error={errors.email}
              label="Email Address"
              onChange={(value) => updateForm('email', value)}
              placeholder="name@example.com"
              type="email"
              value={form.email}
            />
            <RequestFormField
              error={errors.phone}
              label="Phone / WhatsApp"
              onChange={(value) => updateForm('phone', value)}
              placeholder="+92 300 0000000"
              value={form.phone}
            />
            <RequestFormField
              label="City / Country"
              onChange={(value) => updateForm('cityCountry', value)}
              placeholder="Karachi, Pakistan"
              value={form.cityCountry}
            />
            <RequestFormSelect
              label="Preferred Contact"
              onChange={(value) =>
                updateForm('preferredContactMethod', value as PreferredContactMethod)
              }
              value={form.preferredContactMethod}
            >
              {methodOptions.map((method) => (
                <option key={method.value} value={method.value}>
                  {method.label}
                </option>
              ))}
            </RequestFormSelect>
            <RequestFormSelect
              label="Request Source"
              onChange={(value) => updateForm('requestSource', value as RequestSource)}
              value={form.requestSource}
            >
              {requestSourceOptions.map((source) => (
                <option key={source.value} value={source.value}>
                  {source.label}
                </option>
              ))}
            </RequestFormSelect>
            <label className="block">
              <span className="text-sm font-bold text-ink/72">Next Follow-up</span>
              <input
                className="mt-2 h-11 w-full rounded-lg border border-emerald/10 bg-white px-3 text-sm font-bold text-emerald-deep outline-none focus:border-gold focus:ring-4 focus:ring-gold/15"
                onChange={(event) => updateForm('nextFollowUpAt', event.target.value)}
                type="datetime-local"
                value={form.nextFollowUpAt}
              />
              {errors.nextFollowUpAt ? (
                <p className="mt-1 text-xs font-bold text-red-600">{errors.nextFollowUpAt}</p>
              ) : null}
            </label>
          </div>

          {canAssignRequest ? (
            <RequestFormSelect
              className="mt-4"
              label="Assign Team Member"
              onChange={(value) => updateForm('assignedTeamMemberId', value)}
              value={form.assignedTeamMemberId}
            >
              <option value="">Unassigned</option>
              {assignees.map((assignee) => (
                <option key={assignee.id} value={assignee.id}>
                  {assignee.fullName}
                </option>
              ))}
            </RequestFormSelect>
          ) : (
            <p className="mt-4 rounded-lg border border-gold/18 bg-gold/8 p-3 text-sm font-bold text-gold-deep">
              This request will be assigned to {currentTeamMember.fullName}.
            </p>
          )}

          <label className="mt-4 block">
            <span className="text-sm font-bold text-ink/72">Message</span>
            <textarea
              className="mt-2 min-h-24 w-full rounded-lg border border-emerald/10 bg-white p-3 text-sm font-semibold leading-relaxed text-ink outline-none focus:border-gold focus:ring-4 focus:ring-gold/15"
              onChange={(event) => updateForm('message', event.target.value)}
              placeholder="What did the sponsor ask or share?"
              value={form.message}
            />
          </label>

          <label className="mt-4 block">
            <span className="text-sm font-bold text-ink/72">Admin Notes</span>
            <textarea
              className="mt-2 min-h-24 w-full rounded-lg border border-emerald/10 bg-white p-3 text-sm font-semibold leading-relaxed text-ink outline-none focus:border-gold focus:ring-4 focus:ring-gold/15"
              onChange={(event) => updateForm('adminNotes', event.target.value)}
              placeholder="Internal context for the team..."
              value={form.adminNotes}
            />
          </label>

          <label className="mt-4 flex items-start gap-3 rounded-lg border border-emerald/10 bg-white p-3">
            <input
              checked={form.confirmedMinimumAmount}
              className="mt-1 h-4 w-4 accent-emerald-deep"
              onChange={(event) => updateForm('confirmedMinimumAmount', event.target.checked)}
              type="checkbox"
            />
            <span className="text-sm font-semibold leading-relaxed text-ink/76">
              Minimum monthly sponsorship amount was communicated and accepted.
            </span>
          </label>
          {errors.confirmedMinimumAmount ? (
            <p className="mt-1 text-xs font-bold text-red-600">{errors.confirmedMinimumAmount}</p>
          ) : null}

          <div className="sticky bottom-0 -mx-5 mt-6 flex flex-col-reverse gap-3 border-t border-emerald/10 bg-offwhite p-5 sm:flex-row sm:justify-end">
            <button
              className="inline-flex h-11 items-center justify-center rounded-lg border border-emerald/10 bg-white px-5 text-sm font-bold text-emerald-deep transition hover:border-gold/45"
              onClick={onClose}
              type="button"
            >
              Cancel
            </button>
            <button
              className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-emerald-deepest px-5 text-sm font-bold text-cream-soft transition hover:bg-emerald-deep disabled:cursor-wait disabled:opacity-70"
              disabled={submitting}
              type="submit"
            >
              <Plus className="h-4 w-4" />
              {submitting ? 'Adding...' : 'Add Request'}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

function RequestFormField({
  error,
  label,
  onChange,
  placeholder,
  type = 'text',
  value,
}: {
  error?: string;
  label: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: 'email' | 'text';
  value: string;
}) {
  return (
    <label className="block">
      <span className="text-sm font-bold text-ink/72">{label}</span>
      <input
        className="mt-2 h-11 w-full rounded-lg border border-emerald/10 bg-white px-3 text-sm font-bold text-emerald-deep outline-none focus:border-gold focus:ring-4 focus:ring-gold/15"
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        type={type}
        value={value}
      />
      {error ? <p className="mt-1 text-xs font-bold text-red-600">{error}</p> : null}
    </label>
  );
}

function RequestFormSelect({
  children,
  className,
  label,
  onChange,
  value,
}: {
  children: React.ReactNode;
  className?: string;
  label: string;
  onChange: (value: string) => void;
  value: string;
}) {
  return (
    <div className={cn('block', className)}>
      <span className="text-sm font-bold text-ink/72">{label}</span>
      <div className="relative mt-2">
        <CustomSelect
          ariaLabel={label}
          onChange={onChange}
          triggerClassName="h-11 text-emerald-deep"
          value={value}
        >
          {children}
        </CustomSelect>
      </div>
    </div>
  );
}

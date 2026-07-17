'use client';

import { useMemo, useState } from 'react';

import Link from 'next/link';
import { useRouter } from 'next/navigation';

import {
  CalendarClock,
  CheckCircle2,
  Clock3,
  FileCheck2,
  FilePlus2,
  FileText,
  PackageCheck,
  Search,
  XCircle,
} from 'lucide-react';
import useSWR from 'swr';

import { AdminManualReceiptDialog } from '@/components/admin/AdminManualReceiptDialog';
import { useAdminAccount } from '@/components/admin/AdminShell';
import { InfiniteListLoader, useInfiniteAdminList } from '@/components/admin/InfiniteListLoader';
import { TableRowsSkeleton } from '@/components/admin/TableRowsSkeleton';
import { useConfirmation } from '@/components/ui/ConfirmationProvider';
import { CustomSelect } from '@/components/ui/CustomSelect';
import { NavigationSpinner, NavLinkIcon } from '@/components/ui/NavLinkIcon';
import { useToast } from '@/components/ui/ToastProvider';
import { usePendingRowNavigation } from '@/components/ui/usePendingRowNavigation';
import { workflowStatus, workSurface } from '@/components/ui/work-surface';

import {
  canBulkMarkReceiptsDelivered,
  canCreateFinanceReceipts,
  canMarkReceiptsDelivered,
  canRejectReceipts,
  canVerifyReceipts,
} from '@/lib/adminPermissions';
import { fetchApiData } from '@/lib/apiFetcher';
import { formatCurrency } from '@/lib/currency';
import { buildMonthOptions, currentMonthValue, monthValueToMonthStart } from '@/lib/months';
import type { PaginatedResult } from '@/lib/pagination';
import { useDebouncedValue } from '@/lib/useDebouncedValue';
import { cn } from '@/lib/utils';

import type {
  AdminBulkDeliveryResult,
  AdminFinanceSummary,
  AdminReceipt,
  AdminReceiptQueueStatus,
} from '@/types/finance';

const statusLabels: Record<AdminReceipt['status'], string> = {
  money_delivered: 'Money Delivered',
  ready_for_review: 'Ready For Review',
  rejected: 'Rejected',
  reviewed: 'Reviewed',
  submitted: 'Submitted',
  verified: 'Verified',
};

const statusTabs: Array<{ label: string; value: AdminReceiptQueueStatus }> = [
  { label: 'Needs Review', value: 'needs_review' },
  { label: 'Reviewed', value: 'reviewed' },
  { label: 'Verified', value: 'verified' },
  { label: 'Rejected', value: 'rejected' },
  { label: 'Delivered', value: 'money_delivered' },
  { label: 'All', value: 'all' },
];

function statusClassName(status: AdminReceipt['status']) {
  if (status === 'rejected') return workflowStatus.red;
  if (status === 'verified' || status === 'money_delivered') return workflowStatus.green;
  if (status === 'submitted' || status === 'ready_for_review' || status === 'reviewed') {
    return workflowStatus.amber;
  }
  return workflowStatus.neutral;
}

function formatDate(value: string | null) {
  if (!value) return 'Not set';
  return new Intl.DateTimeFormat('en', { dateStyle: 'medium' }).format(new Date(value));
}

function formatMonth(value: string) {
  const [year, month] = value.split('-').map(Number);
  return new Intl.DateTimeFormat('en', { month: 'short', year: 'numeric' }).format(
    new Date(year, month - 1, 1),
  );
}

function formatFullMonth(value: string) {
  const [year, month] = value.split('-').map(Number);
  return new Intl.DateTimeFormat('en', { month: 'long', year: 'numeric' }).format(
    new Date(year, month - 1, 1),
  );
}

function buildReceiptsUrl(
  status: AdminReceiptQueueStatus,
  search: string,
  underpaidOnly: boolean,
  month: string,
) {
  const params = new URLSearchParams();
  params.set('status', status);
  if (search.trim()) params.set('q', search.trim());
  if (underpaidOnly) params.set('underpaidOnly', 'true');
  const monthStart = monthValueToMonthStart(month);
  if (monthStart) {
    params.set('monthFrom', monthStart);
    params.set('monthTo', monthStart);
  }
  return `/api/admin/receipts?${params.toString()}`;
}

export function AdminReceiptsDashboard({
  initialMonth = currentMonthValue(),
  initialPage,
  initialSummary,
}: {
  initialMonth?: string;
  initialPage?: PaginatedResult<AdminReceipt>;
  initialSummary?: AdminFinanceSummary;
}) {
  const router = useRouter();
  const { navigateToRow, pendingRowId } = usePendingRowNavigation();
  const { searchValue: search, setSearchValue: setSearch, teamMember } = useAdminAccount();
  const toast = useToast();
  const confirm = useConfirmation();
  const [status, setStatus] = useState<AdminReceiptQueueStatus>('needs_review');
  const [underpaidOnly, setUnderpaidOnly] = useState(false);
  const [month, setMonth] = useState(initialMonth);
  const monthOptions = useMemo(() => buildMonthOptions({ includeAll: false }), []);
  const [working, setWorking] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [manualReceiptOpen, setManualReceiptOpen] = useState(false);
  const [bulkMode, setBulkMode] = useState<'explicit' | 'filtered'>('filtered');
  const [excludedIds, setExcludedIds] = useState<string[]>([]);
  const [deliveryReference, setDeliveryReference] = useState('');
  const canCreateReceipt = canCreateFinanceReceipts(teamMember);
  const canVerify = canVerifyReceipts(teamMember);
  const canReject = canRejectReceipts(teamMember);
  const canDeliver = canMarkReceiptsDelivered(teamMember);
  const canBulkDeliver = canBulkMarkReceiptsDelivered(teamMember);
  const debouncedSearch = useDebouncedValue(search);
  const receiptsUrl = buildReceiptsUrl(status, debouncedSearch, underpaidOnly, month);
  const receiptsInitialUrl = buildReceiptsUrl('needs_review', '', false, initialMonth);
  const selectedMonthStart = monthValueToMonthStart(month);
  const summaryUrl = `/api/admin/finance/summary?month=${selectedMonthStart}`;

  const {
    hasMore,
    isLoading,
    isLoadingMore,
    items: receipts,
    loadMore,
    mutate: mutateReceipts,
  } = useInfiniteAdminList({
    initialPage,
    initialUrl: receiptsInitialUrl,
    url: receiptsUrl,
  });
  const showListSkeleton = isLoading && receipts.length === 0;
  const { data: summary, mutate: mutateSummary } = useSWR<AdminFinanceSummary>(
    summaryUrl,
    fetchApiData,
    {
      dedupingInterval: 10_000,
      fallbackData: month === initialMonth ? initialSummary : undefined,
    },
  );

  const verifiedReceipts = useMemo(
    () => receipts.filter((receipt) => receipt.status === 'verified'),
    [receipts],
  );
  const selectedVerifiedReceipts = verifiedReceipts.filter((receipt) =>
    selectedIds.includes(receipt.id),
  );
  const bulkTargetReceipts =
    bulkMode === 'filtered'
      ? verifiedReceipts.filter((receipt) => !excludedIds.includes(receipt.id))
      : selectedVerifiedReceipts;
  const bulkTotal = bulkTargetReceipts.reduce((total, receipt) => total + receipt.amount, 0);
  const summaryMonth = formatFullMonth(summary?.month ?? selectedMonthStart);
  const summaryMonthName = summaryMonth.split(' ')[0];

  const summaryCards: Array<{
    description: string;
    href?: string;
    icon: typeof Clock3;
    label: string;
    tone: string;
    value: string | number;
  }> = [
    {
      description: `Receipts for ${summaryMonth} waiting for initial review.`,
      icon: Clock3,
      label: 'Ready For Review',
      tone: workSurface.amberIcon,
      value: summary?.readyForReview ?? 0,
    },
    {
      description: `Reviewed ${summaryMonth} receipts awaiting verification.`,
      icon: FileCheck2,
      label: 'Awaiting Verification',
      tone: workSurface.amberIcon,
      value: summary?.reviewedAwaitingVerification ?? 0,
    },
    {
      description: `Verified or delivered contributions for ${summaryMonth}.`,
      icon: CheckCircle2,
      label: 'Verified Contributions',
      tone: workSurface.greenIcon,
      value: formatCurrency(summary?.verifiedCurrentMonthTotal ?? 0),
    },
    {
      description: `Expected sponsorship receipts still missing after 10 ${summaryMonthName}.`,
      href: `/admin/unpaid-donors?month=${month}`,
      icon: CalendarClock,
      label: 'Overdue Sponsorship Receipts',
      tone: workSurface.dangerIcon,
      value: summary?.overdueSponsorships ?? 0,
    },
  ];

  const mutateAll = async () => {
    await Promise.all([mutateReceipts(), mutateSummary()]);
    setSelectedIds([]);
  };

  const handleManualReceiptCreated = async (receipt: AdminReceipt) => {
    setStatus('needs_review');
    setUnderpaidOnly(false);
    setMonth(receipt.donationMonth.slice(0, 7));
    await mutateAll();
    router.refresh();
  };

  const patchReceipt = async (receipt: AdminReceipt, action: 'verify' | 'reject' | 'delivered') => {
    const confirmed = await confirm({
      confirmLabel:
        action === 'verify'
          ? 'Verify Receipt'
          : action === 'delivered'
            ? 'Mark Delivered'
            : 'Reject Receipt',
      description:
        action === 'verify'
          ? `Verify ${receipt.donor?.fullName ?? 'this donor'}'s receipt for ${formatCurrency(
              receipt.amount,
            )}.`
          : action === 'delivered'
            ? `Mark this verified receipt as money delivered.`
            : `Reject this receipt. The donor-visible reason is required before this can be saved.`,
      title:
        action === 'verify'
          ? 'Verify receipt?'
          : action === 'delivered'
            ? 'Mark receipt delivered?'
            : 'Reject receipt?',
      variant: action === 'reject' ? 'destructive' : 'default',
    });

    if (!confirmed) return;

    const route =
      action === 'delivered' ? 'money-delivered' : action === 'verify' ? 'verify' : 'reject';

    if (action === 'reject') {
      toast({
        description: 'Open the receipt detail page to add the donor-visible rejection reason.',
        title: 'Open receipt detail',
        type: 'info',
      });
      return;
    }

    setWorking(true);
    try {
      const response = await fetch(`/api/admin/receipts/${receipt.id}/${route}`, {
        body: JSON.stringify({
          deliveryReference: action === 'delivered' ? deliveryReference : undefined,
        }),
        headers: { 'Content-Type': 'application/json' },
        method: 'PATCH',
      });
      const body = (await response.json().catch(() => null)) as { error?: string } | null;

      if (!response.ok) {
        throw new Error(body?.error ?? 'Receipt action failed.');
      }

      toast({
        type: 'success',
        description: `${receipt.donor?.fullName ?? 'Receipt'} was updated.`,
        title: 'Receipt updated',
      });
      await mutateAll();
    } catch (error) {
      toast({
        type: 'error',
        description: error instanceof Error ? error.message : 'Please try again.',
        title: 'Action failed',
      });
    } finally {
      setWorking(false);
    }
  };

  const openBulk = (mode: 'explicit' | 'filtered') => {
    setBulkMode(mode);
    setExcludedIds([]);
    setDeliveryReference('');
    setBulkOpen(true);
  };

  const submitBulkDelivered = async () => {
    const confirmed = await confirm({
      confirmLabel: 'Mark Delivered',
      description: `Mark ${bulkTargetReceipts.length} verified receipt(s), totaling ${formatCurrency(
        bulkTotal,
      )}, as money delivered. Excluded receipts will not be changed.`,
      title: 'Confirm bulk delivery?',
    });

    if (!confirmed) return;

    setWorking(true);
    try {
      const response = await fetch('/api/admin/receipts/bulk-money-delivered', {
        body: JSON.stringify({
          deliveryReference,
          excludeReceiptIds: bulkMode === 'filtered' ? excludedIds : [],
          filters: bulkMode === 'filtered' ? { search, status: 'verified', underpaidOnly } : {},
          receiptIds: bulkMode === 'explicit' ? selectedIds : [],
          selectionMode: bulkMode,
        }),
        headers: { 'Content-Type': 'application/json' },
        method: 'PATCH',
      });
      const body = (await response.json().catch(() => null)) as {
        data?: AdminBulkDeliveryResult;
        error?: string;
      } | null;

      if (!response.ok || !body?.data) {
        throw new Error(body?.error ?? 'Bulk delivery failed.');
      }

      toast({
        type: 'success',
        description: `${body.data.updated} receipt(s) marked delivered. ${body.data.skippedNotVerified} skipped.`,
        title: 'Delivery batch updated',
      });
      setBulkOpen(false);
      await mutateAll();
    } catch (error) {
      toast({
        type: 'error',
        description: error instanceof Error ? error.message : 'Please try again.',
        title: 'Bulk action failed',
      });
    } finally {
      setWorking(false);
    }
  };

  return (
    <div className={workSurface.page}>
      <section className="space-y-3">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-normal text-[#6b7280]">Finance Summary</p>
            <h1 className="mt-1 text-2xl font-semibold tracking-[-0.02em] text-[#111827]">
              {summaryMonth} Receipt Summary
            </h1>
          </div>
          <p className="text-sm font-medium text-[#6b7280]">
            Due by 10 {summaryMonthName}; missing receipts become overdue on the 11th.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {summaryCards.map((card) => {
            const body = (
              <>
                <div className="flex items-start justify-between gap-3">
                  <p className="text-sm font-medium text-[#4b5563]">{card.label}</p>
                  <span
                    className={cn(
                      'flex h-10 w-10 shrink-0 items-center justify-center rounded-full',
                      card.tone,
                    )}
                  >
                    {card.href ? (
                      <NavLinkIcon className="h-5 w-5" icon={card.icon} />
                    ) : (
                      <card.icon className="h-5 w-5" />
                    )}
                  </span>
                </div>
                <p className="mt-3 text-2xl font-semibold tracking-[-0.02em] text-[#064e3b]">
                  {card.value}
                </p>
                <p className="mt-2 text-xs leading-5 text-[#6b7280]">{card.description}</p>
              </>
            );

            return card.href ? (
              <Link
                className={cn(
                  workSurface.card,
                  'block p-4 transition hover:border-[#c8d0c7] hover:shadow-md',
                )}
                href={card.href}
                key={card.label}
              >
                {body}
              </Link>
            ) : (
              <div className={cn(workSurface.card, 'p-4')} key={card.label}>
                {body}
              </div>
            );
          })}
        </div>
      </section>

      <section className={workSurface.card}>
        <div className="flex flex-col gap-4 border-b border-[#e8ece8] p-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-normal text-[#6b7280]">Finance Workflow</p>
            <h2 className="mt-1 text-2xl font-semibold tracking-[-0.02em] text-[#111827]">
              Receipts
            </h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {canCreateReceipt ? (
              <button
                className={cn(workSurface.primaryButton, 'h-10 px-4 text-sm')}
                onClick={() => setManualReceiptOpen(true)}
                type="button"
              >
                <FilePlus2 className="h-4 w-4" />
                Enter Receipt
              </button>
            ) : null}
            {canBulkDeliver && selectedVerifiedReceipts.length > 0 ? (
              <button
                className={cn(workSurface.secondaryButton, 'h-10 px-4 text-sm')}
                onClick={() => openBulk('explicit')}
                type="button"
              >
                <PackageCheck className="h-4 w-4" />
                Mark Selected Delivered
              </button>
            ) : null}
            {canBulkDeliver && status === 'verified' && verifiedReceipts.length > 0 ? (
              <button
                className={cn(workSurface.secondaryButton, 'h-10 px-4 text-sm')}
                onClick={() => openBulk('filtered')}
                type="button"
              >
                <PackageCheck className="h-4 w-4" />
                Mark All Filtered Delivered
              </button>
            ) : null}
          </div>
        </div>

        <div className="space-y-4 p-4">
          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap gap-2">
              {statusTabs.map((tab) => (
                <button
                  className={cn(
                    'h-9 rounded-lg px-3 text-sm font-bold transition',
                    status === tab.value
                      ? 'bg-[#006b4f] text-white shadow-sm'
                      : 'border border-[#d9ded8] bg-white text-[#1f2937] hover:border-[#c8d0c7] hover:bg-[#f8faf8]',
                  )}
                  key={tab.value}
                  onClick={() => setStatus(tab.value)}
                  type="button"
                >
                  {tab.label}
                </button>
              ))}
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <label className="relative block w-full sm:flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6b7280]" />
                <input
                  className={cn(workSurface.field, 'h-10 w-full pl-10 pr-3')}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search donor, orphan, reference..."
                  value={search}
                />
              </label>
              <CustomSelect
                ariaLabel="Filter by donation month"
                className="w-full shrink-0 sm:w-52"
                onChange={setMonth}
                options={monthOptions}
                triggerClassName="h-10 border-[#d9ded8] font-medium text-[#1f2937]"
                value={month}
              />
              <label className="inline-flex h-10 shrink-0 items-center gap-2 whitespace-nowrap rounded-lg border border-[#d9ded8] bg-white px-3 text-sm font-medium text-[#1f2937]">
                <input
                  checked={underpaidOnly}
                  onChange={(event) => setUnderpaidOnly(event.target.checked)}
                  type="checkbox"
                />
                Underpaid only
              </label>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full border-separate border-spacing-0 text-left text-sm">
              <thead>
                <tr className="text-xs font-semibold uppercase text-[#6b7280]">
                  <th className="w-10 border-b border-[#e8ece8] px-3 py-3" />
                  <th className="border-b border-[#e8ece8] px-3 py-3">Receipt</th>
                  <th className="border-b border-[#e8ece8] px-3 py-3">Donor</th>
                  <th className="border-b border-[#e8ece8] px-3 py-3">Sponsorship</th>
                  <th className="border-b border-[#e8ece8] px-3 py-3">Amount</th>
                  <th className="border-b border-[#e8ece8] px-3 py-3">Status</th>
                  <th className="border-b border-[#e8ece8] px-3 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {showListSkeleton ? <TableRowsSkeleton columns={7} /> : null}
                {receipts.map((receipt) => {
                  const isSelected = selectedIds.includes(receipt.id);
                  const canSelect = receipt.status === 'verified';
                  const receiptHref = `/admin/receipts/${receipt.id}`;

                  return (
                    <tr
                      aria-busy={pendingRowId === receipt.id}
                      className={cn(
                        'cursor-pointer align-top transition hover:bg-[#f8faf8] focus-within:bg-[#f8faf8]',
                        pendingRowId === receipt.id && 'cursor-wait',
                      )}
                      key={receipt.id}
                      onClick={() => navigateToRow(receipt.id, receiptHref)}
                      onKeyDown={(event) => {
                        if (event.target !== event.currentTarget) return;
                        if (event.key === 'Enter' || event.key === ' ') {
                          event.preventDefault();
                          navigateToRow(receipt.id, receiptHref);
                        }
                      }}
                      tabIndex={0}
                    >
                      <td className="border-b border-[#e8ece8] px-3 py-4">
                        <input
                          checked={isSelected}
                          disabled={!canSelect}
                          onClick={(event) => event.stopPropagation()}
                          onChange={(event) => {
                            setSelectedIds((current) =>
                              event.target.checked
                                ? [...current, receipt.id]
                                : current.filter((id) => id !== receipt.id),
                            );
                          }}
                          type="checkbox"
                        />
                      </td>
                      <td className="border-b border-[#e8ece8] px-3 py-4">
                        <p className="font-semibold text-[#111827]">
                          {formatMonth(receipt.donationMonth)}
                        </p>
                        <p className="mt-1 text-xs font-normal text-[#6b7280]">
                          Submitted {formatDate(receipt.submittedAt)}
                        </p>
                        {receipt.submittedLate ? (
                          <span className="mt-2 inline-flex rounded bg-amber-100 px-2 py-1 text-[0.7rem] font-bold text-amber-800">
                            Late
                          </span>
                        ) : null}
                      </td>
                      <td className="border-b border-[#e8ece8] px-3 py-4">
                        <p className="font-semibold text-[#111827]">
                          {receipt.donor?.fullName ?? 'Unknown donor'}
                        </p>
                        <p className="mt-1 text-xs font-normal text-[#6b7280]">
                          {receipt.donor?.email}
                        </p>
                      </td>
                      <td className="border-b border-[#e8ece8] px-3 py-4">
                        <p className="font-semibold text-[#111827]">
                          {receipt.orphan?.orphanCode ?? 'No code'}
                        </p>
                        <p className="mt-1 text-xs font-normal text-[#6b7280]">
                          {receipt.orphan?.fullName ?? 'Unknown orphan'}
                        </p>
                      </td>
                      <td className="border-b border-[#e8ece8] px-3 py-4">
                        <p className="font-semibold text-[#064e3b]">
                          {formatCurrency(receipt.amount)}
                        </p>
                        <p
                          className={cn(
                            'mt-1 text-xs font-semibold',
                            receipt.amountVariance < 0 ? 'text-red-600' : 'text-[#6b7280]',
                          )}
                        >
                          Expected {formatCurrency(receipt.expectedAmount)}
                        </p>
                      </td>
                      <td className="border-b border-[#e8ece8] px-3 py-4">
                        <span
                          className={cn(
                            'inline-flex rounded-lg border px-2.5 py-1 text-xs font-medium',
                            statusClassName(receipt.status),
                          )}
                        >
                          {statusLabels[receipt.status]}
                        </span>
                      </td>
                      <td className="border-b border-[#e8ece8] px-3 py-4">
                        <div className="flex flex-wrap gap-2">
                          {pendingRowId === receipt.id ? (
                            <NavigationSpinner className="h-4 w-4" />
                          ) : (
                            <>
                              {canVerify &&
                              ['ready_for_review', 'reviewed'].includes(receipt.status) ? (
                                <button
                                  className={cn(workSurface.primaryButton, 'h-9 px-3 text-xs')}
                                  disabled={working}
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    patchReceipt(receipt, 'verify');
                                  }}
                                  type="button"
                                >
                                  <CheckCircle2 className="h-3.5 w-3.5" />
                                  Verify
                                </button>
                              ) : null}
                              {canReject &&
                              ['ready_for_review', 'reviewed'].includes(receipt.status) ? (
                                <button
                                  className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-red-300 bg-white px-3 text-xs font-semibold text-red-600 transition hover:border-red-400 hover:bg-red-50"
                                  disabled={working}
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    patchReceipt(receipt, 'reject');
                                  }}
                                  type="button"
                                >
                                  <XCircle className="h-3.5 w-3.5" />
                                  Reject
                                </button>
                              ) : null}
                              {canDeliver && receipt.status === 'verified' ? (
                                <button
                                  className={cn(workSurface.secondaryButton, 'h-9 px-3 text-xs')}
                                  disabled={working}
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    patchReceipt(receipt, 'delivered');
                                  }}
                                  type="button"
                                >
                                  <PackageCheck className="h-3.5 w-3.5" />
                                  Delivered
                                </button>
                              ) : null}
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {!showListSkeleton && receipts.length === 0 ? (
              <div className="flex flex-col items-center justify-center px-4 py-16 text-center">
                <FileText className="h-10 w-10 text-gold-deep" />
                <p className="mt-3 font-bold text-emerald-deep">No receipts found</p>
                <p className="mt-1 max-w-md text-sm font-medium text-ink/62">
                  Receipt uploads from the donor portal will appear here for finance review.
                </p>
              </div>
            ) : null}
            {receipts.length > 0 ? (
              <InfiniteListLoader
                hasMore={hasMore}
                isLoadingMore={isLoadingMore}
                loadMore={loadMore}
              />
            ) : null}
          </div>
        </div>
      </section>

      <AdminManualReceiptDialog
        onClose={() => setManualReceiptOpen(false)}
        onCreated={handleManualReceiptCreated}
        open={manualReceiptOpen}
      />

      {bulkOpen ? (
        <div
          aria-modal="true"
          className="fixed inset-0 z-[95] flex items-center justify-center bg-emerald-deepest/62 p-4 backdrop-blur-sm"
          role="dialog"
        >
          <button
            aria-label="Close bulk delivery"
            className="absolute inset-0 cursor-default"
            disabled={working}
            onClick={() => setBulkOpen(false)}
            type="button"
          />
          <section className="relative w-full max-w-lg rounded-xl border border-gold/22 bg-offwhite p-5 shadow-[0_30px_90px_-35px_rgba(0,0,0,0.75)]">
            <h2 className="font-display text-2xl font-semibold text-emerald-deep">Bulk Delivery</h2>
            <p className="mt-2 text-sm font-semibold text-ink/70">
              Review the delivery reference and optionally exclude receipts before confirming.
            </p>
            <div className="mt-4 space-y-3">
              <label className="block">
                <span className="text-xs font-bold uppercase text-ink/55">Delivery reference</span>
                <input
                  className="mt-1 h-10 w-full rounded-lg border border-emerald/10 bg-white px-3 text-sm font-semibold outline-none focus:border-gold"
                  onChange={(event) => setDeliveryReference(event.target.value)}
                  placeholder="Optional batch/reference note"
                  value={deliveryReference}
                />
              </label>
              {bulkMode === 'filtered' ? (
                <div className="max-h-52 space-y-2 overflow-auto rounded-lg border border-emerald/10 bg-white p-3">
                  <p className="text-xs font-bold uppercase text-ink/55">
                    Exclude from this delivery batch
                  </p>
                  {verifiedReceipts.map((receipt) => (
                    <label
                      className="flex items-start gap-2 text-sm font-semibold text-emerald-deep"
                      key={receipt.id}
                    >
                      <input
                        checked={excludedIds.includes(receipt.id)}
                        onChange={(event) => {
                          setExcludedIds((current) =>
                            event.target.checked
                              ? [...current, receipt.id]
                              : current.filter((id) => id !== receipt.id),
                          );
                        }}
                        type="checkbox"
                      />
                      <span>
                        {receipt.donor?.fullName ?? 'Unknown donor'} ·{' '}
                        {receipt.orphan?.orphanCode ?? 'No code'} · {formatCurrency(receipt.amount)}
                      </span>
                    </label>
                  ))}
                </div>
              ) : null}
            </div>
            <div className="mt-5 flex justify-end gap-3 border-t border-emerald/10 pt-4">
              <button
                className="h-10 rounded-lg border border-emerald/10 bg-white px-4 text-sm font-bold text-emerald-deep"
                onClick={() => setBulkOpen(false)}
                type="button"
              >
                Cancel
              </button>
              <button
                className="h-10 rounded-lg bg-emerald-deepest px-4 text-sm font-bold text-white"
                disabled={working || bulkTargetReceipts.length === 0}
                onClick={submitBulkDelivered}
                type="button"
              >
                Continue
              </button>
            </div>
          </section>
        </div>
      ) : null}
    </div>
  );
}

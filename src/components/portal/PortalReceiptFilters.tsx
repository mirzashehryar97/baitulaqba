'use client';

import { type ReactNode, useTransition } from 'react';

import { useRouter } from 'next/navigation';

import { RotateCcw, SlidersHorizontal } from 'lucide-react';

import { SkeletonBlock } from '@/components/portal/PortalLoadingShell';
import { CustomSelect } from '@/components/ui/CustomSelect';

type FilterOption = {
  label: string;
  value: string;
};

export function PortalReceiptFilters({
  children,
  orphanOptions,
  resultCount,
  selectedMatchId,
  selectedStatus,
  statusOptions,
}: {
  children: ReactNode;
  orphanOptions: FilterOption[];
  resultCount: number;
  selectedMatchId: string;
  selectedStatus: string;
  statusOptions: FilterOption[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const hasFilters = Boolean(selectedMatchId || selectedStatus);

  const updateFilters = (nextMatchId: string, nextStatus: string) => {
    const params = new URLSearchParams();

    if (nextMatchId) params.set('matchId', nextMatchId);
    if (nextStatus) params.set('status', nextStatus);

    const query = params.toString();

    startTransition(() => {
      router.replace(query ? `/portal/receipts?${query}` : '/portal/receipts', {
        scroll: false,
      });
    });
  };

  return (
    <>
      <div className="mt-5 flex flex-col gap-3 rounded-lg border border-[#dfe5df] bg-[#f8faf8] p-3 sm:p-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-2 text-sm font-semibold text-[#4b5563]">
          <SlidersHorizontal className="h-4 w-4 text-[#075d46]" />
          <span>Filters</span>
          <span className="font-normal text-[#8a938e]">
            · {resultCount} {resultCount === 1 ? 'receipt' : 'receipts'}
          </span>
        </div>

        <div className="grid min-w-0 gap-2 sm:grid-cols-2 lg:flex lg:items-center">
          <CustomSelect
            ariaLabel="Filter receipts by orphan"
            className="w-full sm:min-w-56 lg:w-64"
            disabled={isPending}
            onChange={(value) => updateFilters(value, selectedStatus)}
            options={[{ label: 'All orphans', value: '' }, ...orphanOptions]}
            triggerClassName="h-10 border-[#d9ded8] bg-white font-medium text-[#374151]"
            value={selectedMatchId}
          />
          <CustomSelect
            ariaLabel="Filter receipts by status"
            className="w-full lg:w-48"
            disabled={isPending}
            onChange={(value) => updateFilters(selectedMatchId, value)}
            options={[{ label: 'All statuses', value: '' }, ...statusOptions]}
            triggerClassName="h-10 border-[#d9ded8] bg-white font-medium text-[#374151]"
            value={selectedStatus}
          />
          {hasFilters ? (
            <button
              className="inline-flex h-10 items-center justify-center gap-2 rounded-lg px-3 text-sm font-semibold text-[#075d46] transition hover:bg-white disabled:cursor-wait disabled:opacity-60 sm:col-span-2 lg:col-span-1"
              disabled={isPending}
              onClick={() => updateFilters('', '')}
              type="button"
            >
              <RotateCcw className="h-4 w-4" />
              Clear
            </button>
          ) : null}
        </div>
      </div>

      {isPending ? <ReceiptListSkeleton /> : children}
    </>
  );
}

function ReceiptListSkeleton() {
  return (
    <div aria-live="polite" className="mt-5 overflow-x-auto">
      <span className="sr-only">Loading filtered receipts.</span>
      <div className="min-w-[680px] sm:min-w-[760px]">
        <div className="grid grid-cols-[1.05fr_1.45fr_0.8fr_1.15fr_1fr_0.85fr_0.65fr] gap-4 border-b border-[#e8ece8] px-3 py-3">
          {['month', 'sponsorship', 'amount', 'bank', 'status', 'submitted', 'receipt'].map(
            (column) => (
              <SkeletonBlock className="h-3" key={column} />
            ),
          )}
        </div>
        {['one', 'two', 'three', 'four', 'five'].map((row) => (
          <div
            className="grid grid-cols-[1.05fr_1.45fr_0.8fr_1.15fr_1fr_0.85fr_0.65fr] gap-4 border-b border-[#e8ece8] px-3 py-3"
            key={row}
          >
            {['month', 'sponsorship', 'amount', 'bank', 'status', 'submitted', 'receipt'].map(
              (column) => (
                <SkeletonBlock
                  className={column === 'status' || column === 'receipt' ? 'h-8 rounded-md' : 'h-4'}
                  key={`${row}-${column}`}
                />
              ),
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

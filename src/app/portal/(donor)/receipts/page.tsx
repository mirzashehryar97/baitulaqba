import Link from 'next/link';
import { redirect } from 'next/navigation';

import { ExternalLink } from 'lucide-react';

import { PortalReceiptFilters } from '@/components/portal/PortalReceiptFilters';
import { NavLinkSpinner } from '@/components/ui/NavLinkIcon';
import { workflowStatus, workSurface } from '@/components/ui/work-surface';

import { requireDonor } from '@/lib/adminAuth';
import { formatCurrency } from '@/lib/currency';
import { listPortalReceipts, parseReceiptStatus } from '@/lib/portal';
import { cn } from '@/lib/utils';

import type { DonorPortalReceiptStatus } from '@/types/portal';

export const dynamic = 'force-dynamic';

const receiptStatusOptions: Array<{ label: string; value: DonorPortalReceiptStatus }> = [
  { label: 'Submitted', value: 'submitted' },
  { label: 'Ready for review', value: 'ready_for_review' },
  { label: 'Reviewed', value: 'reviewed' },
  { label: 'Verified', value: 'verified' },
  { label: 'Needs correction', value: 'rejected' },
  { label: 'Money delivered', value: 'money_delivered' },
];

function statusClassName(status: string) {
  if (status === 'rejected') return workflowStatus.red;
  if (status === 'verified' || status === 'money_delivered') return workflowStatus.green;
  if (status === 'submitted' || status === 'ready_for_review' || status === 'reviewed') {
    return workflowStatus.amber;
  }
  return workflowStatus.neutral;
}

export default async function PortalReceiptsPage({
  searchParams,
}: {
  searchParams: Promise<{ matchId?: string | string[]; status?: string | string[] }>;
}) {
  const donor = await requireDonor().catch(() => null);
  if (!donor) redirect('/portal/login?error=not_allowed');

  const params = await searchParams;
  const allReceipts = await listPortalReceipts(donor.id);
  const orphanOptions = Array.from(
    new Map(
      allReceipts.map((receipt) => [
        receipt.matchId,
        {
          label:
            [receipt.orphanCode, receipt.orphanName].filter(Boolean).join(' · ') || 'Sponsorship',
          value: receipt.matchId,
        },
      ]),
    ).values(),
  ).sort((first, second) => first.label.localeCompare(second.label));
  const requestedMatchId = firstSearchParam(params.matchId);
  const selectedMatchId = orphanOptions.some((option) => option.value === requestedMatchId)
    ? requestedMatchId
    : '';
  const selectedStatus = parseReceiptStatus(firstSearchParam(params.status) || null);
  const receipts = allReceipts.filter(
    (receipt) =>
      (!selectedMatchId || receipt.matchId === selectedMatchId) &&
      (!selectedStatus || receipt.status === selectedStatus),
  );
  const hasFilters = Boolean(selectedMatchId || selectedStatus);

  return (
    <section className={cn(workSurface.card, 'max-w-full p-4 font-sans text-[#111827] sm:p-5')}>
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className={workSurface.title}>Receipts</h1>
          <p className="mt-2 text-sm font-normal text-[#6b7280]">
            Review monthly transfer receipts and finance status.
          </p>
        </div>
        <Link
          className={cn(workSurface.primaryButton, 'h-11 px-5 text-sm')}
          href="/portal/receipts/upload"
        >
          Upload Receipt
          <NavLinkSpinner className="h-4 w-4" />
        </Link>
      </div>

      <PortalReceiptFilters
        orphanOptions={orphanOptions}
        resultCount={receipts.length}
        selectedMatchId={selectedMatchId}
        selectedStatus={selectedStatus ?? ''}
        statusOptions={receiptStatusOptions}
      >
        <div className="mt-5">
          {receipts.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[680px] border-collapse text-left text-sm sm:min-w-[760px]">
                <thead className="text-xs font-semibold uppercase text-[#6b7280]">
                  <tr>
                    <th className="border-b border-[#e8ece8] px-3 py-3">Month</th>
                    <th className="border-b border-[#e8ece8] px-3 py-3">Sponsorship</th>
                    <th className="border-b border-[#e8ece8] px-3 py-3">Amount</th>
                    <th className="border-b border-[#e8ece8] px-3 py-3">Bank</th>
                    <th className="border-b border-[#e8ece8] px-3 py-3">Status</th>
                    <th className="border-b border-[#e8ece8] px-3 py-3">Submitted</th>
                    <th className="border-b border-[#e8ece8] px-3 py-3">Receipt</th>
                  </tr>
                </thead>
                <tbody>
                  {receipts.map((receipt) => (
                    <tr className="border-b border-[#e8ece8]" key={receipt.id}>
                      <td className="px-3 py-3 font-semibold text-[#111827]">
                        {new Date(receipt.donationMonth).toLocaleString('en', {
                          month: 'long',
                          year: 'numeric',
                        })}
                      </td>
                      <td className="px-3 py-3 font-normal text-[#4b5563]">
                        {receipt.orphanCode ?? 'Sponsorship'} · {receipt.orphanName ?? ''}
                      </td>
                      <td className="px-3 py-3 font-semibold text-[#064e3b]">
                        {formatCurrency(receipt.amount)}
                      </td>
                      <td className="px-3 py-3 font-normal text-[#4b5563]">
                        {receipt.bankAccount?.accountLabel ?? 'Not recorded'}
                      </td>
                      <td className="px-3 py-3">
                        <span
                          className={cn(
                            'inline-flex rounded-lg border px-2.5 py-1 text-xs font-medium capitalize',
                            statusClassName(receipt.status),
                          )}
                        >
                          {receipt.status.replaceAll('_', ' ')}
                        </span>
                        {receipt.submittedLate ? (
                          <span className="ml-2 text-xs font-bold text-red-600">Late</span>
                        ) : null}
                      </td>
                      <td className="px-3 py-3 font-normal text-[#6b7280]">
                        {new Date(receipt.submittedAt).toLocaleDateString('en')}
                      </td>
                      <td className="px-3 py-3">
                        <a
                          className={cn(workSurface.secondaryButton, 'h-9 px-3 text-xs')}
                          href={`/api/portal/receipts/${receipt.id}/file`}
                          rel="noreferrer"
                          target="_blank"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                          View
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-[#cfd7d1] bg-[#fafbf9] px-5 py-10 text-center">
              <p className="text-sm font-medium text-[#6b7280]">
                {hasFilters
                  ? 'No receipts match the selected filters.'
                  : 'No receipts uploaded yet.'}
              </p>
              {hasFilters ? (
                <Link
                  className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-[#075d46] underline underline-offset-4"
                  href="/portal/receipts"
                >
                  Clear filters
                  <NavLinkSpinner className="h-3.5 w-3.5" />
                </Link>
              ) : null}
            </div>
          )}
        </div>
      </PortalReceiptFilters>
    </section>
  );
}

function firstSearchParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? (value[0] ?? '') : (value ?? '');
}

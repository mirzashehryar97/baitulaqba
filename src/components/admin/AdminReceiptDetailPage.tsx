'use client';

import type React from 'react';
import { useState } from 'react';

import Image from 'next/image';
import { useRouter } from 'next/navigation';

import {
  Banknote,
  Building2,
  CalendarDays,
  Check,
  CheckCircle2,
  Circle,
  ClipboardCheck,
  Download,
  ExternalLink,
  FileText,
  Hash,
  PackageCheck,
  ReceiptText,
  UserRound,
  X,
} from 'lucide-react';
import useSWR from 'swr';

import { useAdminAccount } from '@/components/admin/AdminShell';
import BackLink from '@/components/ui/BackLink';
import { useConfirmation } from '@/components/ui/ConfirmationProvider';
import { useToast } from '@/components/ui/ToastProvider';

import {
  canMarkReceiptReviewed,
  canMarkReceiptsDelivered,
  canRejectReceipts,
  canVerifyReceipts,
} from '@/lib/adminPermissions';
import { fetchApiData } from '@/lib/apiFetcher';
import { formatCurrency } from '@/lib/currency';
import { cn } from '@/lib/utils';

import type { AdminReceipt } from '@/types/finance';

const MANUAL_RECEIPT_FILE_TYPE = 'application/x-admin-manual-entry';
const EXTERNAL_RECEIPT_FILE_TYPE = 'text/uri-list';

function formatDate(value: string | null) {
  if (!value) return 'Not set';
  return new Intl.DateTimeFormat('en', { dateStyle: 'medium', timeStyle: 'short' }).format(
    new Date(value),
  );
}

function formatMonth(value: string | null) {
  if (!value) return 'Not set';
  return new Intl.DateTimeFormat('en', { month: 'long', year: 'numeric' }).format(new Date(value));
}

function formatStatus(value: AdminReceipt['status']) {
  return value
    .split('_')
    .map((part) => part[0].toUpperCase() + part.slice(1))
    .join(' ');
}

const statusStyles: Record<
  AdminReceipt['status'],
  {
    dot: string;
    label: string;
  }
> = {
  money_delivered: {
    dot: 'bg-emerald-600',
    label: 'border-emerald-200 bg-emerald-50 text-emerald-800',
  },
  ready_for_review: {
    dot: 'bg-[#c99210]',
    label: 'border-[#f1d894] bg-[#fff4d8] text-[#7a4b00]',
  },
  rejected: {
    dot: 'bg-red-500',
    label: 'border-red-200 bg-red-50 text-red-700',
  },
  reviewed: {
    dot: 'bg-[#c99210]',
    label: 'border-[#f1d894] bg-[#fff4d8] text-[#7a4b00]',
  },
  submitted: {
    dot: 'bg-[#c99210]',
    label: 'border-[#f1d894] bg-[#fff4d8] text-[#7a4b00]',
  },
  verified: {
    dot: 'bg-emerald-600',
    label: 'border-emerald-200 bg-emerald-50 text-emerald-800',
  },
};

async function fetchReceiptFileUrl(url: string) {
  const response = await fetch(url);
  const body = (await response.json().catch(() => null)) as {
    data?: { signedUrl: string };
    error?: string;
  } | null;

  if (!response.ok || !body?.data?.signedUrl) {
    throw new Error(body?.error ?? 'Could not load receipt file.');
  }

  return body.data.signedUrl;
}

export function AdminReceiptDetailPage({ initialReceipt }: { initialReceipt: AdminReceipt }) {
  const { teamMember } = useAdminAccount();
  const router = useRouter();
  const toast = useToast();
  const confirm = useConfirmation();
  const [working, setWorking] = useState(false);
  const [financeNotes, setFinanceNotes] = useState(initialReceipt.financeNotes ?? '');
  const [rejectionReason, setRejectionReason] = useState(initialReceipt.rejectionReason ?? '');
  const [deliveryReference, setDeliveryReference] = useState(
    initialReceipt.deliveryReference ?? '',
  );
  const { data: receipt = initialReceipt, mutate } = useSWR<AdminReceipt>(
    `/api/admin/receipts/${initialReceipt.id}`,
    fetchApiData,
    { fallbackData: initialReceipt },
  );
  const isManualReceipt = receipt.receiptFileType === MANUAL_RECEIPT_FILE_TYPE;
  const receiptFileUrl = isManualReceipt ? null : `/api/admin/receipts/${receipt.id}/file`;
  const {
    data: signedReceiptUrl,
    error: receiptPreviewError,
    isLoading: receiptPreviewLoading,
  } = useSWR<string>(receiptFileUrl, fetchReceiptFileUrl, {
    dedupingInterval: 45_000,
    revalidateOnFocus: false,
  });
  const canReview = canMarkReceiptReviewed(teamMember);
  const canVerify = canVerifyReceipts(teamMember);
  const canReject = canRejectReceipts(teamMember);
  const canDeliver = canMarkReceiptsDelivered(teamMember);

  const openReceiptFile = async () => {
    if (!receiptFileUrl) {
      toast({
        type: 'info',
        description: 'This receipt was entered manually without an attached file.',
        title: 'No file attached',
      });
      return;
    }

    try {
      const signedUrl = signedReceiptUrl ?? (await fetchReceiptFileUrl(receiptFileUrl));
      window.open(signedUrl, '_blank', 'noopener,noreferrer');
    } catch (error) {
      toast({
        type: 'error',
        description: error instanceof Error ? error.message : 'Please try again.',
        title: 'File unavailable',
      });
    }
  };

  const downloadReceiptFile = async () => {
    if (!receiptFileUrl) {
      toast({
        type: 'info',
        description: 'This receipt was entered manually without an attached file.',
        title: 'No file attached',
      });
      return;
    }

    try {
      const signedUrl = signedReceiptUrl ?? (await fetchReceiptFileUrl(receiptFileUrl));
      const fileName = receipt.receiptFileName ?? 'receipt';

      try {
        const response = await fetch(signedUrl);
        if (!response.ok) throw new Error('Could not download receipt file.');
        const blob = await response.blob();
        const objectUrl = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = objectUrl;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        link.remove();
        URL.revokeObjectURL(objectUrl);
      } catch {
        const link = document.createElement('a');
        link.href = signedUrl;
        link.download = fileName;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        document.body.appendChild(link);
        link.click();
        link.remove();
      }
    } catch (error) {
      toast({
        type: 'error',
        description: error instanceof Error ? error.message : 'Please try again.',
        title: 'Download unavailable',
      });
    }
  };

  const submitDecision = async (decision: 'review' | 'verify' | 'reject' | 'delivered') => {
    const confirmed = await confirm({
      confirmLabel:
        decision === 'review'
          ? 'Mark Reviewed'
          : decision === 'verify'
            ? 'Verify Receipt'
            : decision === 'delivered'
              ? 'Mark Delivered'
              : 'Reject Receipt',
      description:
        decision === 'reject'
          ? 'This will reject the receipt and show the rejection reason to the donor.'
          : 'This will update the finance status for this receipt.',
      title:
        decision === 'review'
          ? 'Mark receipt reviewed?'
          : decision === 'verify'
            ? 'Verify receipt?'
            : decision === 'delivered'
              ? 'Mark money delivered?'
              : 'Reject receipt?',
      variant: decision === 'reject' ? 'destructive' : 'default',
    });

    if (!confirmed) return;

    const route =
      decision === 'delivered'
        ? 'money-delivered'
        : decision === 'review'
          ? 'review'
          : decision === 'verify'
            ? 'verify'
            : 'reject';

    setWorking(true);
    try {
      const response = await fetch(`/api/admin/receipts/${receipt.id}/${route}`, {
        body: JSON.stringify({
          deliveryReference,
          financeNotes,
          rejectionReason,
        }),
        headers: { 'Content-Type': 'application/json' },
        method: 'PATCH',
      });
      const body = (await response.json().catch(() => null)) as {
        data?: AdminReceipt;
        error?: string;
        errors?: Record<string, string>;
      } | null;

      if (!response.ok || !body?.data) {
        throw new Error(body?.error ?? Object.values(body?.errors ?? {})[0] ?? 'Action failed.');
      }

      toast({
        type: 'success',
        description: 'The finance status has been updated.',
        title: 'Receipt updated',
      });
      await mutate(body.data, { revalidate: false });
      router.refresh();
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

  const canReviewNow = canReview && ['submitted', 'ready_for_review'].includes(receipt.status);
  const canVerifyNow = canVerify && ['ready_for_review', 'reviewed'].includes(receipt.status);
  const canRejectNow = canReject && ['ready_for_review', 'reviewed'].includes(receipt.status);
  const canDeliverNow = canDeliver && receipt.status === 'verified';
  const currentStatus = statusStyles[receipt.status];

  return (
    <div className="space-y-6 font-sans text-[#111827]">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div className="min-w-0">
          <BackLink href="/admin/receipts" label="Back to Receipts" />
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <h2 className="text-3xl font-semibold tracking-[-0.02em] text-[#111827]">
              Receipt Review
            </h2>
            <span
              className={cn(
                'inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm font-medium',
                currentStatus.label,
              )}
            >
              <span className={cn('h-2 w-2 rounded-full', currentStatus.dot)} />
              {formatStatus(receipt.status)}
            </span>
          </div>
          <p className="mt-2 text-sm font-normal text-[#6b7280]">
            Review the uploaded receipt and payment details before taking action.
          </p>
        </div>
        {!isManualReceipt ? (
          <div className="flex flex-wrap items-center gap-2">
            <button
              className="inline-flex h-10 w-fit items-center justify-center gap-2 rounded-lg border border-[#d9ded8] bg-white px-4 text-sm font-medium text-[#1f2937] shadow-sm transition hover:border-[#c8d0c7] hover:bg-[#f8faf8]"
              onClick={downloadReceiptFile}
              type="button"
            >
              <Download className="h-4 w-4" />
              Download
            </button>
            <button
              className="inline-flex h-10 w-fit items-center justify-center gap-2 rounded-lg border border-[#d9ded8] bg-white px-4 text-sm font-medium text-[#1f2937] shadow-sm transition hover:border-[#c8d0c7] hover:bg-[#f8faf8]"
              onClick={openReceiptFile}
              type="button"
            >
              <ExternalLink className="h-4 w-4" />
              Open File
            </button>
          </div>
        ) : null}
      </div>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_28rem]">
        <div className="space-y-4">
          <div className="rounded-lg border border-[#dfe5df] bg-white p-4 shadow-[0_14px_40px_-34px_rgba(17,24,39,0.45)] sm:p-5">
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <h3 className="text-base font-semibold text-[#111827]">Receipt Source</h3>
              {!isManualReceipt ? (
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    className="inline-flex h-9 w-fit items-center justify-center gap-2 rounded-lg border border-[#d9ded8] bg-white px-3 text-sm font-medium text-[#1f2937] transition hover:bg-[#f8faf8]"
                    onClick={downloadReceiptFile}
                    type="button"
                  >
                    <Download className="h-4 w-4" />
                    Download
                  </button>
                  <button
                    className="inline-flex h-9 w-fit items-center justify-center gap-2 rounded-lg border border-[#d9ded8] bg-white px-3 text-sm font-medium text-[#1f2937] transition hover:bg-[#f8faf8]"
                    onClick={openReceiptFile}
                    type="button"
                  >
                    <ExternalLink className="h-4 w-4" />
                    Open File
                  </button>
                </div>
              ) : null}
            </div>
            <ReceiptPreview
              error={receiptPreviewError}
              loading={receiptPreviewLoading}
              receipt={receipt}
              signedUrl={signedReceiptUrl}
            />
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            <AmountCard
              icon={ReceiptText}
              label="Submitted"
              tone="green"
              value={formatCurrency(receipt.amount)}
            />
            <AmountCard
              icon={Banknote}
              label="Expected"
              tone="amber"
              value={formatCurrency(receipt.expectedAmount)}
            />
            <AmountCard
              danger={receipt.amountVariance < 0}
              icon={CheckCircle2}
              label="Variance"
              tone="green"
              value={formatCurrency(receipt.amountVariance)}
            />
          </div>

          <dl className="overflow-hidden rounded-lg border border-[#dfe5df] bg-white shadow-[0_14px_40px_-34px_rgba(17,24,39,0.45)]">
            <DetailRow
              detail={receipt.donor?.email ?? receipt.donor?.phone ?? 'No contact on file'}
              icon={UserRound}
              label="Donor"
              value={receipt.donor?.fullName ?? 'Unknown donor'}
            />
            <DetailRow
              detail={formatMonth(receipt.donationMonth)}
              icon={UserRound}
              label="Orphan"
              value={receipt.orphan?.fullName ?? 'Unknown orphan'}
            />
            <DetailRow
              detail={
                receipt.bankAccount?.accountTitle ?? receipt.bankAccount?.bankName ?? 'Not set'
              }
              icon={Building2}
              label="Bank Account"
              value={receipt.bankAccount?.accountLabel ?? 'Not set'}
            />
            <DetailRow
              detail="Provided by donor"
              icon={Hash}
              label="Transfer Reference"
              value={receipt.transferReference ?? 'Not provided'}
            />
            <DetailRow
              detail={`Submitted ${formatDate(receipt.submittedAt)}`}
              icon={CalendarDays}
              label="Payment Date"
              value={formatDate(receipt.transferDate)}
            />
          </dl>
        </div>

        <aside className="space-y-5">
          <div className="rounded-lg border border-[#dfe5df] bg-white p-5 shadow-[0_14px_40px_-34px_rgba(17,24,39,0.45)]">
            <h3 className="text-lg font-semibold tracking-[-0.01em] text-[#111827]">
              Finance Decision
            </h3>
            <div className="mt-5 space-y-4">
              <label className="block">
                <span className="text-sm font-medium text-[#111827]">Internal Notes</span>
                <textarea
                  className="mt-2 min-h-24 w-full resize-y rounded-lg border border-[#d8ded8] bg-white px-3 py-2.5 text-sm font-normal text-[#111827] outline-none transition placeholder:text-[#9ca3af] focus:border-[#0d6b50] focus:ring-4 focus:ring-emerald-700/10"
                  onChange={(event) => setFinanceNotes(event.target.value)}
                  placeholder="Add internal notes (optional)..."
                  value={financeNotes}
                />
              </label>
              <label className="block">
                <span className="text-sm font-medium text-[#111827]">Delivery Reference</span>
                <input
                  className="mt-2 h-11 w-full rounded-lg border border-[#d8ded8] bg-white px-3 text-sm font-normal text-[#111827] outline-none transition placeholder:text-[#9ca3af] focus:border-[#0d6b50] focus:ring-4 focus:ring-emerald-700/10"
                  onChange={(event) => setDeliveryReference(event.target.value)}
                  placeholder="Enter delivery/reference ID (optional)..."
                  value={deliveryReference}
                />
              </label>
              <label className="block">
                <span className="text-sm font-medium text-[#111827]">Rejection Reason</span>
                <textarea
                  className="mt-2 min-h-20 w-full resize-y rounded-lg border border-[#d8ded8] bg-white px-3 py-2.5 text-sm font-normal text-[#111827] outline-none transition placeholder:text-[#9ca3af] focus:border-[#0d6b50] focus:ring-4 focus:ring-emerald-700/10"
                  onChange={(event) => setRejectionReason(event.target.value)}
                  placeholder="Select or enter rejection reason..."
                  value={rejectionReason}
                />
              </label>
            </div>
            <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-2">
              {canReviewNow ? (
                <DecisionButton
                  disabled={working}
                  icon={Check}
                  label="Mark Reviewed"
                  onClick={() => submitDecision('review')}
                />
              ) : null}
              {canVerifyNow ? (
                <DecisionButton
                  disabled={working}
                  icon={Check}
                  label="Verify Receipt"
                  onClick={() => submitDecision('verify')}
                />
              ) : null}
              {canRejectNow ? (
                <DecisionButton
                  destructive
                  disabled={working}
                  icon={X}
                  label="Reject Receipt"
                  onClick={() => submitDecision('reject')}
                />
              ) : null}
              {canDeliverNow ? (
                <DecisionButton
                  disabled={working}
                  icon={PackageCheck}
                  label="Mark Delivered"
                  onClick={() => submitDecision('delivered')}
                />
              ) : null}
            </div>
          </div>

          <div className="rounded-lg border border-[#dfe5df] bg-white p-5 shadow-[0_14px_40px_-34px_rgba(17,24,39,0.45)]">
            <h3 className="text-lg font-semibold tracking-[-0.01em] text-[#111827]">Timeline</h3>
            <ol className="mt-5">
              <TimelineItem
                active
                description={
                  isManualReceipt
                    ? 'Receipt entered by admin'
                    : `Receipt uploaded by ${receipt.donor?.fullName ?? 'donor'}`
                }
                icon={ReceiptText}
                label="Submitted"
                time={formatDate(receipt.submittedAt)}
                tone="amber"
              />
              <TimelineItem
                active={Boolean(
                  receipt.reviewedAt || receipt.verifiedAt || receipt.moneyDeliveredAt,
                )}
                description={
                  receipt.reviewedAt ? 'Finance review completed' : 'Waiting for finance review'
                }
                icon={ClipboardCheck}
                label={receipt.reviewedAt ? 'Reviewed' : 'Ready for Review'}
                time={formatDate(receipt.reviewedAt ?? receipt.statusChangedAt)}
                tone={receipt.reviewedAt ? 'green' : 'amber'}
              />
              <TimelineItem
                active={Boolean(receipt.verifiedAt || receipt.moneyDeliveredAt)}
                description={
                  receipt.verifiedAt ? 'Amount matched expected' : 'Pending verification'
                }
                icon={CheckCircle2}
                label="Verified"
                time={formatDate(receipt.verifiedAt)}
                tone="green"
              />
              <TimelineItem
                active={Boolean(receipt.moneyDeliveredAt)}
                description={
                  receipt.moneyDeliveredAt ? 'Money delivery confirmed' : 'Waiting for delivery'
                }
                icon={PackageCheck}
                label="Money Delivered"
                last
                time={formatDate(receipt.moneyDeliveredAt)}
                tone="green"
              />
            </ol>
          </div>
        </aside>
      </section>
    </div>
  );
}

function ReceiptPreview({
  error,
  loading,
  receipt,
  signedUrl,
}: {
  error?: Error;
  loading: boolean;
  receipt: AdminReceipt;
  signedUrl?: string;
}) {
  const fileType = receipt.receiptFileType?.toLowerCase() ?? '';
  const fileName = receipt.receiptFileName ?? 'Uploaded receipt';
  const isImage = fileType.startsWith('image/');

  return (
    <div className="flex min-h-[32rem] items-center justify-center overflow-hidden rounded-md border border-[#e3e7e3] bg-[#f7f8f6]">
      {fileType === MANUAL_RECEIPT_FILE_TYPE ? (
        <ReceiptPreviewState
          label="Manual receipt entry"
          sublabel="No file is attached. Review the transfer details and internal notes."
        />
      ) : fileType === EXTERNAL_RECEIPT_FILE_TYPE ? (
        <ReceiptPreviewState
          label="External receipt link"
          sublabel="Use Open File to view the receipt on the external submission site."
        />
      ) : loading ? (
        <ReceiptPreviewState label="Loading receipt..." />
      ) : error || !signedUrl ? (
        <ReceiptPreviewState
          label={error?.message ?? 'Receipt file unavailable.'}
          sublabel="Use Open File to try loading it in a new window."
        />
      ) : isImage || !fileType ? (
        <div className="flex h-full w-full justify-center overflow-auto bg-[#f7f8f6] p-4">
          <div className="relative h-[48rem] w-full max-w-[42rem]">
            <Image
              fill
              unoptimized
              alt={fileName}
              className="rounded-sm object-contain shadow-[0_20px_60px_-42px_rgba(17,24,39,0.75)]"
              sizes="(min-width: 1280px) 48vw, 100vw"
              src={signedUrl}
            />
          </div>
        </div>
      ) : (
        <ReceiptPreviewState
          label="Receipt image unavailable."
          sublabel="Ask the donor to upload a JPG, PNG, or WebP receipt image."
        />
      )}
    </div>
  );
}

function ReceiptPreviewState({ label, sublabel }: { label: string; sublabel?: string }) {
  return (
    <div className="flex max-w-sm flex-col items-center px-6 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
        <FileText className="h-5 w-5" />
      </span>
      <p className="mt-3 text-sm font-semibold text-[#111827]">{label}</p>
      {sublabel ? <p className="mt-1 text-sm font-normal text-[#6b7280]">{sublabel}</p> : null}
    </div>
  );
}

function AmountCard({
  danger = false,
  icon: Icon,
  label,
  tone,
  value,
}: {
  danger?: boolean;
  icon: React.ElementType;
  label: string;
  tone: 'amber' | 'green';
  value: string;
}) {
  const toneClass =
    tone === 'amber'
      ? 'bg-[#f8e7b5] text-[#a26a00]'
      : danger
        ? 'bg-red-100 text-red-700'
        : 'bg-emerald-100 text-emerald-700';

  return (
    <div className="flex min-h-[5rem] items-center justify-between gap-4 rounded-lg border border-[#dfe5df] bg-white p-4 shadow-[0_14px_40px_-34px_rgba(17,24,39,0.45)]">
      <div className="min-w-0">
        <dt className="text-sm font-medium text-[#4b5563]">{label}</dt>
        <dd
          className={cn(
            'mt-1 break-words text-xl font-semibold tracking-[-0.02em]',
            danger ? 'text-red-700' : 'text-[#064e3b]',
          )}
        >
          {value}
        </dd>
      </div>
      <div
        className={cn(
          'flex h-10 w-10 shrink-0 items-center justify-center rounded-full',
          toneClass,
        )}
      >
        <Icon className="h-5 w-5" />
      </div>
    </div>
  );
}

function DetailRow({
  detail,
  icon: Icon,
  label,
  value,
}: {
  detail: string;
  icon: React.ElementType;
  label: string;
  value: string;
}) {
  return (
    <div className="grid gap-3 border-b border-[#e8ece8] px-4 py-3 last:border-b-0 sm:grid-cols-[10rem_1fr] sm:items-center">
      <div className="flex min-w-0 items-center gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
          <Icon className="h-4.5 w-4.5" />
        </span>
        <dt className="text-sm font-semibold text-[#111827]">{label}</dt>
      </div>
      <dd className="min-w-0">
        <p className="break-words text-sm font-medium text-[#1f2937]">{value}</p>
        <p className="mt-0.5 break-words text-xs font-normal text-[#6b7280]">{detail}</p>
      </dd>
    </div>
  );
}

function TimelineItem({
  active,
  description,
  icon: Icon,
  label,
  last = false,
  time,
  tone,
}: {
  active: boolean;
  description: string;
  icon: React.ElementType;
  label: string;
  last?: boolean;
  time: string;
  tone: 'amber' | 'green';
}) {
  const color = !active
    ? 'border-[#d1d5db] bg-white text-[#9ca3af]'
    : tone === 'amber'
      ? 'border-[#c99210] bg-[#c99210] text-white'
      : 'border-[#087455] bg-[#087455] text-white';

  return (
    <li className="relative grid grid-cols-[2.25rem_1fr] gap-3 pb-6 last:pb-0">
      {!last ? (
        <span className="absolute left-[1.0625rem] top-9 h-[calc(100%-2.25rem)] w-px bg-[#d7ded7]" />
      ) : null}
      <span
        className={cn(
          'relative z-10 flex h-9 w-9 items-center justify-center rounded-full border text-xs',
          color,
        )}
      >
        {active ? <Icon className="h-4 w-4" /> : <Circle className="h-3 w-3" />}
      </span>
      <div className="min-w-0 pt-0.5">
        <div className="flex items-start justify-between gap-3">
          <p className="text-sm font-semibold text-[#111827]">{label}</p>
          <time className="shrink-0 text-right text-xs font-medium text-[#6b7280]">{time}</time>
        </div>
        <p className="mt-1 text-sm font-normal text-[#6b7280]">{description}</p>
      </div>
    </li>
  );
}

function DecisionButton({
  destructive = false,
  disabled = false,
  icon: Icon,
  label,
  onClick,
}: {
  destructive?: boolean;
  disabled?: boolean;
  icon: React.ElementType;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      className={cn(
        'inline-flex h-11 items-center justify-center gap-2 rounded-lg border px-4 text-sm font-semibold transition disabled:cursor-wait disabled:opacity-60',
        destructive
          ? 'border-red-300 bg-white text-red-600 hover:border-red-400 hover:bg-red-50'
          : 'border-[#006b4f] bg-[#006b4f] text-white shadow-sm hover:border-[#07543f] hover:bg-[#07543f]',
      )}
      disabled={disabled}
      onClick={onClick}
      type="button"
    >
      <Icon className="h-4 w-4" />
      {label}
    </button>
  );
}

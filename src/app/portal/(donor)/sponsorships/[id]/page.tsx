import Image from 'next/image';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';

import {
  BookOpen,
  CalendarDays,
  CheckCircle2,
  ExternalLink,
  Gift,
  HandHeart,
  MapPin,
  ShieldCheck,
} from 'lucide-react';

import { SponsorshipCertificateButton } from '@/components/portal/SponsorshipCertificateButton';
import BackLink from '@/components/ui/BackLink';
import { NavLinkSpinner } from '@/components/ui/NavLinkIcon';

import { requireDonor } from '@/lib/adminAuth';
import { formatCurrency } from '@/lib/currency';
import { getPortalSponsorshipByMatchId, listPortalReceipts } from '@/lib/portal';
import { cn } from '@/lib/utils';

import type {
  DonorMonthlyPaymentStatus,
  DonorPortalReceipt,
  DonorPortalReceiptStatus,
} from '@/types/portal';

export const dynamic = 'force-dynamic';

const paymentStatusLabels: Record<DonorMonthlyPaymentStatus, string> = {
  due_soon: 'Receipt Due',
  money_delivered: 'Delivered',
  overdue: 'Overdue',
  pending: 'Receipt Due',
  ready_for_review: 'Ready for Review',
  rejected: 'Needs Correction',
  reviewed: 'Reviewed',
  submitted: 'Submitted',
  verified: 'Verified',
};

const receiptStatusLabels: Record<DonorPortalReceiptStatus, string> = {
  money_delivered: 'Delivered',
  ready_for_review: 'Ready for Review',
  rejected: 'Needs Correction',
  reviewed: 'Reviewed',
  submitted: 'Submitted',
  verified: 'Verified',
};

export default async function PortalSponsorshipDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const donor = await requireDonor().catch(() => null);
  if (!donor) redirect('/portal/login?error=not_allowed');

  const { id } = await params;
  const [sponsorship, receipts] = await Promise.all([
    getPortalSponsorshipByMatchId(donor.id, id),
    listPortalReceipts(donor.id, { matchId: id }),
  ]);

  if (!sponsorship) notFound();

  const currentReceipt = sponsorship.currentMonthReceipt;
  const canUploadReceipt =
    sponsorship.matchStatus === 'active' &&
    (!currentReceipt || sponsorship.currentMonthStatus === 'rejected');
  const latestDeliveredReceipt = receipts.find((receipt) => receipt.status === 'money_delivered');
  const orphanMeta = [
    sponsorship.orphan.ageEstimate
      ? `${sponsorship.orphan.ageEstimate} ${sponsorship.orphan.ageEstimate === 1 ? 'year' : 'years'}`
      : null,
    sponsorship.orphan.cityArea,
    sponsorship.orphan.educationStatus,
  ].filter(Boolean) as string[];

  return (
    <div className="space-y-4 pb-3 font-sans text-[#17211d] sm:space-y-5">
      <header className="space-y-3">
        <BackLink href="/portal/sponsorships" label="Back to My Sponsorships" />
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-3xl font-semibold tracking-[-0.025em] text-[#111827] sm:text-[2.1rem]">
            Sponsorship Details
          </h1>
          <MatchStatusPill status={sponsorship.matchStatus} />
        </div>
      </header>

      <section className="grid min-w-0 gap-5 rounded-xl border border-[#dfe5df] bg-white p-3 shadow-[0_14px_40px_-34px_rgba(17,24,39,0.45)] sm:p-4 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="flex min-w-0 flex-col gap-5 sm:flex-row sm:items-center">
          <div className="relative h-64 w-full shrink-0 overflow-hidden rounded-lg bg-[#f2f3ef] sm:h-56 sm:w-56 xl:h-60 xl:w-60">
            <Image
              alt={`${sponsorship.orphan.fullName} profile`}
              className={cn(
                'h-full w-full',
                sponsorship.orphan.profileImageUrl ? 'object-cover' : 'object-contain p-10',
              )}
              fill
              sizes="(min-width: 640px) 240px, calc(100vw - 3rem)"
              src={sponsorship.orphan.profileImageUrl || '/images/ornaments/sponsor-lamp.svg'}
              unoptimized
            />
          </div>

          <div className="min-w-0 py-1">
            <p className="text-sm font-bold uppercase tracking-[0.12em] text-[#075d46]">
              {sponsorship.orphan.orphanCode}
            </p>
            <h2 className="mt-2 break-words text-3xl font-semibold leading-tight tracking-[-0.025em] text-[#111827] sm:text-4xl">
              {sponsorship.orphan.fullName}
            </h2>

            {orphanMeta.length > 0 ? (
              <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm font-medium text-[#4b5563]">
                {sponsorship.orphan.ageEstimate ? (
                  <span className="inline-flex items-center gap-1.5">
                    <HandHeart className="h-4 w-4 text-[#075d46]" />
                    {sponsorship.orphan.ageEstimate}{' '}
                    {sponsorship.orphan.ageEstimate === 1 ? 'year' : 'years'}
                  </span>
                ) : null}
                {sponsorship.orphan.cityArea ? (
                  <span className="inline-flex items-center gap-1.5">
                    <MapPin className="h-4 w-4 text-[#075d46]" />
                    {sponsorship.orphan.cityArea}
                  </span>
                ) : null}
                {sponsorship.orphan.educationStatus ? (
                  <span className="inline-flex items-center gap-1.5">
                    <BookOpen className="h-4 w-4 text-[#075d46]" />
                    {sponsorship.orphan.educationStatus}
                  </span>
                ) : null}
              </div>
            ) : null}

            <p className="mt-5 max-w-2xl text-sm font-medium leading-6 text-[#5f6b65] sm:text-[0.95rem]">
              {sponsorship.orphan.backgroundSummary ||
                'More background information about this orphan will be shared here when available.'}
            </p>
          </div>
        </div>

        <div
          className={cn(
            'flex min-h-60 flex-col items-center justify-center rounded-lg border p-5 text-center',
            currentMonthPanelClassName(sponsorship.currentMonthStatus),
          )}
        >
          <p className="text-sm font-bold uppercase tracking-[0.06em] text-[#075d46]">
            {formatMonth(sponsorship.currentMonth)}
          </p>
          <CurrentPaymentStatusPill status={sponsorship.currentMonthStatus} />
          <p className="mt-3 text-3xl font-semibold tracking-[-0.02em] text-[#111827]">
            {formatCurrency(sponsorship.monthlyAmount)}
          </p>
          <p className="mt-1 text-sm font-medium text-[#4b5563]">Monthly sponsorship</p>

          {canUploadReceipt ? (
            <Link
              className="mt-5 inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg border border-[#006b4f] bg-[#006b4f] px-5 text-sm font-semibold text-white shadow-sm transition hover:border-[#07543f] hover:bg-[#07543f]"
              href={`/portal/receipts/upload?matchId=${sponsorship.matchId}`}
            >
              Upload Receipt
              <NavLinkSpinner className="h-4 w-4" />
            </Link>
          ) : currentReceipt ? (
            <a
              className="mt-5 inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg border border-[#006b4f] bg-[#006b4f] px-5 text-sm font-semibold text-white shadow-sm transition hover:border-[#07543f] hover:bg-[#07543f]"
              href={`/api/portal/receipts/${currentReceipt.id}/file`}
              rel="noreferrer"
              target="_blank"
            >
              <ExternalLink className="h-4 w-4" />
              View Current Receipt
            </a>
          ) : null}

          <div className="mt-1">
            <SponsorshipCertificateButton matchId={sponsorship.matchId} />
          </div>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 2xl:grid-cols-4">
        <SummaryCard
          icon={HandHeart}
          label="Monthly Support"
          value={formatCurrency(sponsorship.monthlyAmount)}
        />
        <SummaryCard
          icon={CalendarDays}
          label="Sponsoring Since"
          value={formatDate(sponsorship.startedAt)}
        />
        <SummaryCard
          icon={ShieldCheck}
          label="Total Verified"
          value={formatCurrency(sponsorship.totalVerifiedContributed)}
        />
        <SummaryCard
          icon={Gift}
          label="Total Delivered"
          value={formatCurrency(sponsorship.totalDeliveredContributed)}
        />
      </section>

      <section className="grid min-w-0 gap-5 xl:grid-cols-[minmax(0,1.8fr)_minmax(18rem,0.9fr)]">
        <div className="min-w-0 space-y-3">
          {latestDeliveredReceipt ? (
            <div className="flex items-start gap-3 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-900">
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-700" />
              <p>
                Your {formatMonth(latestDeliveredReceipt.donationMonth)} contribution has been
                delivered to the orphan&apos;s guardian.
              </p>
            </div>
          ) : null}

          <div className="min-w-0 overflow-hidden rounded-xl border border-[#dfe5df] bg-white shadow-[0_14px_40px_-34px_rgba(17,24,39,0.45)]">
            <div className="px-4 pb-3 pt-4 sm:px-5 sm:pt-5">
              <h2 className="text-xl font-semibold tracking-[-0.015em] text-[#111827]">
                Payment History
              </h2>
              <p className="mt-1 text-sm font-medium text-[#6b7280]">
                All receipts for this sponsorship
              </p>
            </div>

            {receipts.length > 0 ? (
              <>
                <div className="hidden overflow-x-auto border-y border-[#e5e9e4] md:block">
                  <table className="w-full min-w-[47rem] border-collapse text-left">
                    <thead className="bg-[#fafbf9] text-[0.68rem] font-bold uppercase tracking-[0.05em] text-[#6b7280]">
                      <tr>
                        <th className="px-4 py-3">Month</th>
                        <th className="px-4 py-3">Transfer Date</th>
                        <th className="px-4 py-3">Reference</th>
                        <th className="px-4 py-3">Amount</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-4 py-3 text-right">Receipt</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#e5e9e4]">
                      {receipts.map((receipt) => (
                        <ReceiptTableRow key={receipt.id} receipt={receipt} />
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="divide-y divide-[#e5e9e4] border-y border-[#e5e9e4] md:hidden">
                  {receipts.map((receipt) => (
                    <ReceiptMobileCard key={receipt.id} receipt={receipt} />
                  ))}
                </div>

                <div className="flex justify-center px-4 py-3.5">
                  <Link
                    className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#075d46] underline underline-offset-4 transition hover:text-[#053f31]"
                    href="/portal/receipts"
                  >
                    View all receipts
                    <NavLinkSpinner className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </>
            ) : (
              <div className="border-t border-[#e5e9e4] px-5 py-10 text-center">
                <p className="text-sm font-medium text-[#6b7280]">
                  No receipts have been uploaded for this sponsorship yet.
                </p>
                {canUploadReceipt ? (
                  <Link
                    className="mt-4 inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-[#006b4f] bg-[#006b4f] px-4 text-sm font-semibold text-white transition hover:bg-[#07543f]"
                    href={`/portal/receipts/upload?matchId=${sponsorship.matchId}`}
                  >
                    Upload First Receipt
                    <NavLinkSpinner className="h-4 w-4" />
                  </Link>
                ) : null}
              </div>
            )}
          </div>
        </div>

        <aside className="self-start rounded-xl border border-[#dfe5df] bg-white p-4 shadow-[0_14px_40px_-34px_rgba(17,24,39,0.45)] sm:p-5 xl:sticky xl:top-24">
          <h2 className="text-xl font-semibold tracking-[-0.015em] text-[#111827]">
            Sponsorship Overview
          </h2>
          <dl className="mt-3 divide-y divide-[#e5e9e4]">
            <OverviewRow
              label="Status"
              value={<MatchStatusPill compact status={sponsorship.matchStatus} />}
            />
            <OverviewRow label="Orphan ID" value={sponsorship.orphan.orphanCode || '—'} />
            <OverviewRow label="Started" value={formatDate(sponsorship.startedAt)} />
            <OverviewRow
              label="Education"
              value={sponsorship.orphan.educationStatus || 'Not provided'}
            />
            <OverviewRow label="Location" value={sponsorship.orphan.cityArea || 'Not provided'} />
            <OverviewRow
              label="Next payment"
              value={
                sponsorship.matchStatus === 'active'
                  ? formatDonationDeadline(sponsorship.currentMonth)
                  : 'Not scheduled'
              }
            />
          </dl>
        </aside>
      </section>
    </div>
  );
}

function SummaryCard({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
}) {
  return (
    <article className="flex min-w-0 items-center gap-4 rounded-xl border border-[#dfe5df] bg-white p-4 shadow-[0_14px_40px_-34px_rgba(17,24,39,0.45)]">
      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#f7f3e8] text-[#075d46]">
        <Icon className="h-5 w-5" strokeWidth={1.8} />
      </span>
      <div className="min-w-0">
        <p className="text-[0.68rem] font-bold uppercase tracking-[0.05em] text-[#6b7280]">
          {label}
        </p>
        <p className="mt-1 break-words text-xl font-semibold tracking-[-0.015em] text-[#111827]">
          {value}
        </p>
      </div>
    </article>
  );
}

function ReceiptTableRow({ receipt }: { receipt: DonorPortalReceipt }) {
  return (
    <tr className="text-sm font-medium text-[#374151] transition hover:bg-[#fafbf9]">
      <td className="whitespace-nowrap px-4 py-3.5 font-semibold text-[#1f2937]">
        {formatMonth(receipt.donationMonth)}
      </td>
      <td className="whitespace-nowrap px-4 py-3.5">{formatOptionalDate(receipt.transferDate)}</td>
      <td className="max-w-36 truncate px-4 py-3.5" title={receipt.transferReference ?? undefined}>
        {receipt.transferReference || '—'}
      </td>
      <td className="whitespace-nowrap px-4 py-3.5 font-semibold text-[#1f2937]">
        {formatCurrency(receipt.amount)}
      </td>
      <td className="px-4 py-3.5">
        <ReceiptStatusPill status={receipt.status} />
      </td>
      <td className="px-4 py-3.5 text-right">
        <ReceiptLink id={receipt.id} />
      </td>
    </tr>
  );
}

function ReceiptMobileCard({ receipt }: { receipt: DonorPortalReceipt }) {
  return (
    <article className="p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-semibold text-[#1f2937]">{formatMonth(receipt.donationMonth)}</p>
          <p className="mt-1 text-sm font-semibold text-[#075d46]">
            {formatCurrency(receipt.amount)}
          </p>
        </div>
        <ReceiptStatusPill status={receipt.status} />
      </div>
      <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
        <div>
          <dt className="text-xs font-semibold uppercase tracking-[0.04em] text-[#858d88]">
            Transfer date
          </dt>
          <dd className="mt-1 font-medium text-[#4b5563]">
            {formatOptionalDate(receipt.transferDate)}
          </dd>
        </div>
        <div>
          <dt className="text-xs font-semibold uppercase tracking-[0.04em] text-[#858d88]">
            Reference
          </dt>
          <dd className="mt-1 break-all font-medium text-[#4b5563]">
            {receipt.transferReference || '—'}
          </dd>
        </div>
      </dl>
      <div className="mt-4">
        <ReceiptLink id={receipt.id} />
      </div>
    </article>
  );
}

function ReceiptLink({ id }: { id: string }) {
  return (
    <a
      className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#075d46] underline underline-offset-4 transition hover:text-[#053f31]"
      href={`/api/portal/receipts/${id}/file`}
      rel="noreferrer"
      target="_blank"
    >
      View
      <ExternalLink className="h-3.5 w-3.5" />
    </a>
  );
}

function OverviewRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex min-w-0 items-center justify-between gap-4 py-3 text-sm">
      <dt className="shrink-0 font-medium text-[#6b7280]">{label}</dt>
      <dd className="min-w-0 break-words text-right font-semibold text-[#29332f]">{value}</dd>
    </div>
  );
}

function MatchStatusPill({
  compact = false,
  status,
}: {
  compact?: boolean;
  status: 'active' | 'ended' | 'paused' | 'voided';
}) {
  const styles = {
    active: 'border-emerald-200 bg-emerald-50 text-emerald-800',
    ended: 'border-slate-200 bg-slate-100 text-slate-700',
    paused: 'border-[#e7c36d] bg-[#fff4d8] text-[#825200]',
    voided: 'border-red-200 bg-red-50 text-red-700',
  }[status];

  return (
    <span
      className={cn(
        'inline-flex rounded-md border font-semibold uppercase tracking-[0.035em]',
        compact ? 'px-2 py-0.5 text-[0.65rem]' : 'px-3 py-1.5 text-xs',
        styles,
      )}
    >
      {status}
    </span>
  );
}

function CurrentPaymentStatusPill({ status }: { status: DonorMonthlyPaymentStatus }) {
  return (
    <span
      className={cn(
        'mt-3 inline-flex rounded-md border px-3 py-1 text-xs font-semibold uppercase tracking-[0.035em]',
        paymentStatusClassName(status),
      )}
    >
      {paymentStatusLabels[status]}
    </span>
  );
}

function ReceiptStatusPill({ status }: { status: DonorPortalReceiptStatus }) {
  return (
    <span
      className={cn(
        'inline-flex whitespace-nowrap rounded-md border px-2.5 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.035em]',
        paymentStatusClassName(status),
      )}
    >
      {receiptStatusLabels[status]}
    </span>
  );
}

function paymentStatusClassName(status: DonorMonthlyPaymentStatus) {
  if (status === 'overdue' || status === 'rejected') {
    return 'border-red-200 bg-red-50 text-red-700';
  }

  if (status === 'due_soon' || status === 'pending') {
    return 'border-[#e7c36d] bg-[#fff4d8] text-[#825200]';
  }

  if (status === 'money_delivered' || status === 'verified') {
    return 'border-emerald-200 bg-emerald-50 text-emerald-800';
  }

  return 'border-slate-200 bg-slate-100 text-slate-700';
}

function currentMonthPanelClassName(status: DonorMonthlyPaymentStatus) {
  if (status === 'overdue' || status === 'rejected') {
    return 'border-red-200 bg-red-50/70';
  }

  if (status === 'due_soon' || status === 'pending') {
    return 'border-[#ecd28f] bg-[#fff8e7]';
  }

  if (status === 'money_delivered' || status === 'verified') {
    return 'border-emerald-200 bg-emerald-50/70';
  }

  return 'border-slate-200 bg-slate-50';
}

function formatMonth(value: string) {
  return new Intl.DateTimeFormat('en', { month: 'long', year: 'numeric' }).format(new Date(value));
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('en', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value));
}

function formatOptionalDate(value: string | null) {
  if (!value) return '—';

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '—' : formatDate(value);
}

function formatDonationDeadline(value: string) {
  const [year, month] = value.split('-').map(Number);
  const deadline = new Date(year, month - 1, 10);

  return new Intl.DateTimeFormat('en', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(deadline);
}

'use client';

import { useMemo, useState } from 'react';

import Link from 'next/link';

import { AlertTriangle, CalendarClock, Mail, Phone, UsersRound, Wallet } from 'lucide-react';
import useSWR from 'swr';

import { useAdminAccount } from '@/components/admin/AdminShell';
import { InfiniteListLoader, useInfiniteAdminList } from '@/components/admin/InfiniteListLoader';
import { TableRowsSkeleton } from '@/components/admin/TableRowsSkeleton';
import { CustomSelect } from '@/components/ui/CustomSelect';
import { NavLinkSpinner } from '@/components/ui/NavLinkIcon';
import { workSurface } from '@/components/ui/work-surface';

import { fetchApiData } from '@/lib/apiFetcher';
import { formatCurrency } from '@/lib/currency';
import { buildMonthOptions, currentMonthValue, monthValueToMonthStart } from '@/lib/months';
import type { PaginatedResult } from '@/lib/pagination';
import { useDebouncedValue } from '@/lib/useDebouncedValue';
import { cn } from '@/lib/utils';

import type { AdminFinanceSummary, AdminOverdueSponsorship } from '@/types/finance';

function monthLabel(value: string) {
  const [year, month] = value.split('-').map(Number);
  return new Intl.DateTimeFormat('en', { month: 'long', year: 'numeric' }).format(
    new Date(year, month - 1, 1),
  );
}

function isReceiptDeadlinePassed(value: string, now = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    day: '2-digit',
    month: '2-digit',
    timeZone: 'Asia/Karachi',
    year: 'numeric',
  }).formatToParts(now);
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((item) => item.type === type)?.value ?? '';
  const currentMonth = `${part('year')}-${part('month')}`;

  return value < currentMonth || (value === currentMonth && Number(part('day')) > 10);
}

export function AdminUnpaidDonorsDashboard({
  initialMonth = currentMonthValue(),
  initialPage,
  initialSummary,
}: {
  initialMonth?: string;
  initialPage?: PaginatedResult<AdminOverdueSponsorship>;
  initialSummary: AdminFinanceSummary;
}) {
  const { searchValue: search, setSearchValue: setSearch } = useAdminAccount();
  const debouncedSearch = useDebouncedValue(search);
  const [month, setMonth] = useState(initialMonth);
  const monthOptions = useMemo(() => buildMonthOptions({ includeAll: false }), []);

  const initialUrl = `/api/admin/finance/overdue?month=${monthValueToMonthStart(initialMonth)}`;
  const params = new URLSearchParams({ month: monthValueToMonthStart(month) });
  if (debouncedSearch.trim()) params.set('search', debouncedSearch.trim());
  const overdueUrl = `/api/admin/finance/overdue?${params.toString()}`;
  const {
    hasMore,
    isLoading,
    isLoadingMore,
    items: filtered,
    loadMore,
  } = useInfiniteAdminList({ initialPage, initialUrl, url: overdueUrl });
  const selectedMonthStart = monthValueToMonthStart(month);
  const { data: summary } = useSWR<AdminFinanceSummary>(
    `/api/admin/finance/summary?month=${selectedMonthStart}`,
    fetchApiData,
    {
      dedupingInterval: 15_000,
      fallbackData: month === initialMonth ? initialSummary : undefined,
      revalidateOnFocus: true,
    },
  );
  const showListSkeleton = isLoading && filtered.length === 0;
  const deadlinePassed = isReceiptDeadlinePassed(month);

  const summaryCards = [
    {
      icon: UsersRound,
      label: 'Overdue Sponsorship Receipts',
      tone: workSurface.dangerIcon,
      value: summary?.overdueSponsorships ?? 0,
    },
    {
      icon: Wallet,
      label: 'Expected Amount',
      tone: workSurface.amberIcon,
      value: formatCurrency(summary?.expectedCurrentMonthTotal ?? 0),
    },
    {
      icon: CalendarClock,
      label: 'For Month',
      tone: workSurface.greenIcon,
      value: monthLabel(month),
    },
  ];

  return (
    <div className={workSurface.page}>
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {summaryCards.map((card) => (
          <div className={cn(workSurface.card, 'p-4')} key={card.label}>
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-medium text-[#4b5563]">{card.label}</p>
              <span
                className={cn('flex h-10 w-10 items-center justify-center rounded-full', card.tone)}
              >
                <card.icon className="h-5 w-5" />
              </span>
            </div>
            <p className="mt-3 text-2xl font-semibold tracking-[-0.02em] text-[#064e3b]">
              {card.value}
            </p>
          </div>
        ))}
      </section>

      <section className={workSurface.card}>
        <div className="flex flex-col gap-4 border-b border-[#e8ece8] p-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-normal text-[#6b7280]">Finance Workflow</p>
            <h2 className="mt-1 text-2xl font-semibold tracking-[-0.02em] text-[#111827]">
              Overdue Sponsorship Receipts
            </h2>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <input
              className={cn(workSurface.field, 'h-10 w-full pl-3 pr-3 sm:flex-1 sm:min-w-[16rem]')}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search donor, orphan..."
              value={search}
            />
            <CustomSelect
              ariaLabel="Select month"
              className="w-full shrink-0 sm:w-52"
              onChange={setMonth}
              options={monthOptions}
              triggerClassName="h-10 border-[#d9ded8] font-medium text-[#1f2937]"
              value={month}
            />
          </div>
        </div>

        <div className="p-4">
          <p className="mb-3 text-sm font-medium text-[#6b7280]">
            Sponsorships expected for {monthLabel(month)} with no receipt after the 10th. One donor
            can appear more than once when sponsoring multiple orphans. A sponsorship leaves this
            list when a non-rejected receipt is submitted and returns if that receipt is rejected.
          </p>
          <div className="overflow-x-auto">
            <table className="min-w-full border-separate border-spacing-0 text-left text-sm">
              <thead>
                <tr className="text-xs font-semibold uppercase text-[#6b7280]">
                  <th className="border-b border-[#e8ece8] px-3 py-3">Donor</th>
                  <th className="border-b border-[#e8ece8] px-3 py-3">Sponsorship</th>
                  <th className="border-b border-[#e8ece8] px-3 py-3">Expected</th>
                  <th className="border-b border-[#e8ece8] px-3 py-3">Contact</th>
                </tr>
              </thead>
              <tbody>
                {showListSkeleton ? <TableRowsSkeleton columns={4} /> : null}
                {filtered.map((item) => (
                  <tr className="align-top" key={item.matchId}>
                    <td className="border-b border-[#e8ece8] px-3 py-4">
                      <Link
                        className="font-semibold text-[#111827] hover:text-[#006b4f] hover:underline"
                        href={`/admin/donors/${item.donorId}`}
                      >
                        {item.donorName}
                        <NavLinkSpinner className="ml-1 h-3.5 w-3.5" />
                      </Link>
                      <p className="mt-1 text-xs font-normal text-[#6b7280]">{item.donorEmail}</p>
                      {item.donorPhone ? (
                        <p className="mt-1 text-xs font-normal text-[#6b7280]">{item.donorPhone}</p>
                      ) : null}
                    </td>
                    <td className="border-b border-[#e8ece8] px-3 py-4">
                      <p className="font-semibold text-[#111827]">{item.orphanCode || 'No code'}</p>
                      <p className="mt-1 text-xs font-normal text-[#6b7280]">{item.orphanName}</p>
                    </td>
                    <td className="border-b border-[#e8ece8] px-3 py-4">
                      <p className="font-semibold text-[#064e3b]">
                        {formatCurrency(item.expectedAmount)}
                      </p>
                    </td>
                    <td className="border-b border-[#e8ece8] px-3 py-4">
                      <div className="flex flex-wrap gap-2">
                        {item.donorEmail ? (
                          <a
                            className={cn(workSurface.secondaryButton, 'h-9 px-3 text-xs')}
                            href={`mailto:${item.donorEmail}`}
                          >
                            <Mail className="h-3.5 w-3.5" />
                            Email
                          </a>
                        ) : null}
                        {item.donorPhone ? (
                          <a
                            className={cn(workSurface.secondaryButton, 'h-9 px-3 text-xs')}
                            href={`tel:${item.donorPhone}`}
                          >
                            <Phone className="h-3.5 w-3.5" />
                            Call
                          </a>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {!showListSkeleton && filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center px-4 py-16 text-center">
                <AlertTriangle className="h-10 w-10 text-gold-deep" />
                <p className="mt-3 font-bold text-emerald-deep">
                  {debouncedSearch.trim()
                    ? 'No overdue sponsorship receipts match your search'
                    : deadlinePassed
                      ? `No overdue sponsorship receipts for ${monthLabel(month)}`
                      : `The ${monthLabel(month)} receipt deadline has not passed`}
                </p>
                <p className="mt-1 max-w-md text-sm font-medium text-ink/62">
                  {deadlinePassed
                    ? 'Expected sponsorships without a receipt appear here for follow-up.'
                    : `Receipts are due by 10 ${monthLabel(month).split(' ')[0]} and become overdue on the 11th.`}
                </p>
              </div>
            ) : null}
            {filtered.length > 0 ? (
              <InfiniteListLoader
                hasMore={hasMore}
                isLoadingMore={isLoadingMore}
                loadMore={loadMore}
              />
            ) : null}
          </div>
        </div>
      </section>
    </div>
  );
}

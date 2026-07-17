import type { Metadata } from 'next';

import { AdminUnpaidDonorsDashboard } from '@/components/admin/AdminUnpaidDonorsDashboard';

import { getAdminPageContext } from '@/lib/adminPageAccess';
import { getAdminFinanceSummary, listOverdueSponsorshipsPage } from '@/lib/finance';
import { currentMonthValue, monthValueToMonthStart } from '@/lib/months';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Unpaid Donors | Bait ul Aqba Admin',
};

export default async function UnpaidDonorsPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const { teamMember } = await getAdminPageContext('unpaid_donors');
  const params = await searchParams;
  const initialMonth = /^\d{4}-(0[1-9]|1[0-2])$/.test(params.month ?? '')
    ? (params.month as string)
    : currentMonthValue();
  const initialMonthStart = monthValueToMonthStart(initialMonth);
  const [overdue, summary] = await Promise.all([
    listOverdueSponsorshipsPage(teamMember, { month: initialMonthStart }),
    getAdminFinanceSummary(teamMember, initialMonthStart),
  ]);

  return (
    <AdminUnpaidDonorsDashboard
      initialMonth={initialMonth}
      initialPage={overdue}
      initialSummary={summary}
    />
  );
}

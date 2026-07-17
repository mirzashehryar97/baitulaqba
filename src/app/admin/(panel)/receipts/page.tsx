import type { Metadata } from 'next';

import { AdminReceiptsDashboard } from '@/components/admin/AdminReceiptsDashboard';

import { getAdminPageContext } from '@/lib/adminPageAccess';
import { getAdminFinanceSummary, listAdminReceipts } from '@/lib/finance';
import { currentMonthValue, monthValueToMonthStart } from '@/lib/months';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Receipts | Bait ul Aqba Admin',
};

export default async function ReceiptsPage() {
  const { teamMember } = await getAdminPageContext('receipts');
  const initialMonth = currentMonthValue();
  const initialMonthStart = monthValueToMonthStart(initialMonth);
  const [receipts, summary] = await Promise.all([
    listAdminReceipts(teamMember, {
      monthFrom: initialMonthStart,
      monthTo: initialMonthStart,
      status: 'needs_review',
    }),
    getAdminFinanceSummary(teamMember, initialMonthStart),
  ]);

  return (
    <AdminReceiptsDashboard
      initialMonth={initialMonth}
      initialPage={receipts}
      initialSummary={summary}
    />
  );
}

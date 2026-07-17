import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { AdminReceiptDetailPage } from '@/components/admin/AdminReceiptDetailPage';

import { getAdminPageContext } from '@/lib/adminPageAccess';
import { getAdminReceiptDetail } from '@/lib/finance';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Receipt Review | Bait ul Aqba Admin',
};

export default async function ReceiptDetailRoute({ params }: { params: Promise<{ id: string }> }) {
  const { teamMember } = await getAdminPageContext('receipts');
  const { id } = await params;
  const receipt = await getAdminReceiptDetail(teamMember, id);

  if (!receipt) {
    notFound();
  }

  return <AdminReceiptDetailPage initialReceipt={receipt} />;
}

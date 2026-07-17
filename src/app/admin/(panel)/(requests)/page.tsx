import type { Metadata } from 'next';

import { AdminOverviewDashboard } from '@/components/admin/AdminOverviewDashboard';

import { getAdminDashboardSummary } from '@/lib/adminDashboard';
import { getAdminPageContext } from '@/lib/adminPageAccess';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Dashboard | Bait ul Aqba Admin',
};

export default async function AdminDashboardPage() {
  const { teamMember } = await getAdminPageContext('dashboard');
  const summary = await getAdminDashboardSummary(teamMember);

  return <AdminOverviewDashboard initialSummary={summary} />;
}

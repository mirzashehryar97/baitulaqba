import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

import { PortalDashboardView } from '@/components/portal/PortalDashboard';

import { requireDonor } from '@/lib/adminAuth';
import { getPortalDashboard } from '@/lib/portal';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Donor Portal | Bait ul Aqba',
};

export default async function DonorPortalPage() {
  const donor = await requireDonor().catch(() => null);

  if (!donor) {
    redirect('/portal/login?error=not_allowed');
  }

  const dashboard = await getPortalDashboard(donor.id);

  return <PortalDashboardView donorName={donor.fullName} initialDashboard={dashboard} />;
}

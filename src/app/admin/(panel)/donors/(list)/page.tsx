import type { Metadata } from 'next';

import { DonorsDashboard } from '@/components/admin/DonorsDashboard';

import { getAdminPageContext } from '@/lib/adminPageAccess';
import { canViewAssignedOnly } from '@/lib/adminPermissions';
import { getDonorListSummary, listDonors } from '@/lib/donors';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Donors | Bait ul Aqba Admin',
};

export default async function DonorsPage() {
  const { teamMember } = await getAdminPageContext('sponsors');
  const scopedToTeamMemberId = canViewAssignedOnly(teamMember.role, 'sponsors')
    ? teamMember.id
    : undefined;
  const [donors, summary] = await Promise.all([
    listDonors({ scopedToTeamMemberId }),
    getDonorListSummary({ scopedToTeamMemberId }),
  ]);

  return <DonorsDashboard initialPage={donors} initialSummary={summary} />;
}

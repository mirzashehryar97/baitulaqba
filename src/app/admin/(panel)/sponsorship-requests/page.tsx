import type { Metadata } from 'next';

import { AdminDashboard } from '@/components/admin/AdminDashboard';

import { getAdminPageContext } from '@/lib/adminPageAccess';
import { isAssignedOnlySponsorshipRole } from '@/lib/adminPermissions';
import {
  getSponsorshipRequestListSummary,
  listSponsorshipRequests,
} from '@/lib/sponsorshipRequests';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Sponsorship Requests | Bait ul Aqba Admin',
};

export default async function SponsorshipRequestsPage() {
  const { teamMember } = await getAdminPageContext('sponsorship_requests');
  const scopedToTeamMemberId = isAssignedOnlySponsorshipRole(teamMember.role)
    ? teamMember.id
    : undefined;
  const [requests, summary] = await Promise.all([
    listSponsorshipRequests({ assignedTeamMemberId: scopedToTeamMemberId }),
    getSponsorshipRequestListSummary({
      currentTeamMemberId: teamMember.id,
      scopedToTeamMemberId,
    }),
  ]);

  return <AdminDashboard initialPage={requests} initialSummary={summary} />;
}

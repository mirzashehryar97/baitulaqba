import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';

import { SponsorshipRequestDetailPage } from '@/components/admin/SponsorshipRequestDetailPage';

import { getAdminPageContext } from '@/lib/adminPageAccess';
import {
  canAssignSponsorshipRequests,
  isAssignedOnlySponsorshipRole,
} from '@/lib/adminPermissions';
import {
  getSponsorshipRequestById,
  listAssignableTeamMembers,
  listContactLogsForRequest,
} from '@/lib/sponsorshipRequests';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Sponsorship Request Details | Bait ul Aqba Admin',
};

export default async function SponsorshipRequestDetailRoute({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { teamMember } = await getAdminPageContext('sponsorship_requests');
  const sponsorshipRequest = await getSponsorshipRequestById(id);

  if (!sponsorshipRequest) {
    notFound();
  }

  if (
    isAssignedOnlySponsorshipRole(teamMember.role) &&
    sponsorshipRequest.assignedTeamMemberId !== teamMember.id
  ) {
    redirect('/admin/forbidden');
  }

  const [contactLogs, assignees] = await Promise.all([
    listContactLogsForRequest(id),
    canAssignSponsorshipRequests(teamMember) ? listAssignableTeamMembers() : Promise.resolve([]),
  ]);

  return (
    <SponsorshipRequestDetailPage
      initialAssignees={assignees}
      initialContactLogs={contactLogs}
      initialRequest={sponsorshipRequest}
    />
  );
}

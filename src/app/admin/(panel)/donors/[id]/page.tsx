import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { DonorDetailPage } from '@/components/admin/DonorDetailPage';

import { getAdminPageContext } from '@/lib/adminPageAccess';
import { canViewAssignedOnly, canViewMatchFinancialAmount } from '@/lib/adminPermissions';
import { getDonorById, listConvertedRequestsForDonor, listDonorContactLogs } from '@/lib/donors';
import { getDonorPaymentOverview } from '@/lib/finance';
import { listMatchesForDonor } from '@/lib/sponsorshipMatches';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Edit Donor | Bait ul Aqba Admin',
};

export default async function EditDonorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { teamMember } = await getAdminPageContext('sponsors');
  const scopedToTeamMemberId = canViewAssignedOnly(teamMember.role, 'sponsors')
    ? teamMember.id
    : undefined;
  const donor = await getDonorById(id, { scopedToTeamMemberId });

  if (!donor) {
    notFound();
  }

  const [convertedRequests, contactLogs, matches] = await Promise.all([
    listConvertedRequestsForDonor(id, { scopedToTeamMemberId }),
    listDonorContactLogs(id),
    listMatchesForDonor(id),
  ]);
  const paymentOverview = canViewMatchFinancialAmount(teamMember)
    ? await getDonorPaymentOverview(id, matches)
    : null;

  return (
    <DonorDetailPage
      initialPayload={{ contactLogs, convertedRequests, donor, matches, paymentOverview }}
    />
  );
}

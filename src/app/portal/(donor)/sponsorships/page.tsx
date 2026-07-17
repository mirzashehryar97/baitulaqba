import { redirect } from 'next/navigation';

import { PortalSponsorshipsView } from '@/components/portal/PortalSponsorshipsView';

import { requireDonor } from '@/lib/adminAuth';
import { listPortalSponsorshipsForDonor } from '@/lib/portal';

export const dynamic = 'force-dynamic';

export default async function PortalSponsorshipsPage() {
  const donor = await requireDonor().catch(() => null);
  if (!donor) redirect('/portal/login?error=not_allowed');

  const sponsorships = await listPortalSponsorshipsForDonor(donor.id, { includeHistory: true });

  return <PortalSponsorshipsView sponsorships={sponsorships} />;
}

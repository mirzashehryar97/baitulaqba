import { redirect } from 'next/navigation';

import { ProfileForm } from '@/components/portal/ProfileForm';

import { requireDonor } from '@/lib/adminAuth';
import { getDonorPortalSession } from '@/lib/portal';

export const dynamic = 'force-dynamic';

export default async function PortalProfilePage() {
  const donor = await requireDonor().catch(() => null);
  if (!donor) redirect('/portal/login?error=not_allowed');

  const session = await getDonorPortalSession(donor);

  return <ProfileForm initialProfile={session.donor} />;
}

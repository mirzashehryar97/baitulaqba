import { redirect } from 'next/navigation';

import { PortalShell } from '@/components/portal/PortalShell';

import { getCurrentAuthUser, requireDonor } from '@/lib/adminAuth';
import { getDonorPortalSession } from '@/lib/portal';

export const dynamic = 'force-dynamic';

export default async function DonorPortalLayout({ children }: { children: React.ReactNode }) {
  if (!(await getCurrentAuthUser())) {
    redirect('/portal/login');
  }

  const donor = await requireDonor().catch(() => null);

  if (!donor) {
    redirect('/portal/login?error=not_allowed');
  }

  const session = await getDonorPortalSession(donor);

  return <PortalShell session={session}>{children}</PortalShell>;
}

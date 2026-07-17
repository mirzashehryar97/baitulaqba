import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

import { DonorLogin } from '@/components/portal/DonorLogin';

import { getCurrentDonor } from '@/lib/adminAuth';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Donor Login | Bait ul Aqba',
};

export default async function DonorLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const donor = await getCurrentDonor();

  if (donor) {
    redirect('/portal');
  }

  const params = await searchParams;

  return <DonorLogin errorCode={params.error} />;
}

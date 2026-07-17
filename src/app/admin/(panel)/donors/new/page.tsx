import type { Metadata } from 'next';

import { DonorFormPage } from '@/components/admin/DonorFormPage';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Add Donor | Bait ul Aqba Admin',
};

export default function AddDonorPage() {
  return <DonorFormPage />;
}

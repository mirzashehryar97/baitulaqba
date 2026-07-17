import type { Metadata } from 'next';

import { OrphanFormPage } from '@/components/admin/OrphanFormPage';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Add Orphan Profile | Bait ul Aqba Admin',
};

export default function AddOrphanPage() {
  return <OrphanFormPage />;
}

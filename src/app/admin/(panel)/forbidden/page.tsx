import type { Metadata } from 'next';

import { AdminForbiddenPage } from '@/components/admin/AdminForbiddenPage';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Access Restricted | Bait ul Aqba Admin',
};

export default function ForbiddenPage() {
  return <AdminForbiddenPage />;
}

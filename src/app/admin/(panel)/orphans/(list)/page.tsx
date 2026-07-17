import type { Metadata } from 'next';

import { OrphansDashboard } from '@/components/admin/OrphansDashboard';

import { getAdminPageContext } from '@/lib/adminPageAccess';
import { getOrphanListSummary, listOrphanProfiles } from '@/lib/orphans';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Orphan Profiles | Bait ul Aqba Admin',
};

export default async function OrphansPage() {
  await getAdminPageContext('orphan_profiles');
  const [orphans, summary] = await Promise.all([listOrphanProfiles(), getOrphanListSummary()]);

  return <OrphansDashboard initialPage={orphans} initialSummary={summary} />;
}

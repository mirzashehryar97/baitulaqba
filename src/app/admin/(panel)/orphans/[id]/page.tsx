import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { OrphanDetailPage } from '@/components/admin/OrphanDetailPage';

import { getAdminPageContext } from '@/lib/adminPageAccess';
import { getOrphanSponsorshipOverview } from '@/lib/orphanSponsorships';
import { getOrphanProfileById } from '@/lib/orphans';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Edit Orphan Profile | Bait ul Aqba Admin',
};

export default async function EditOrphanPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { teamMember } = await getAdminPageContext('orphan_profiles');
  const orphan = await getOrphanProfileById(id);

  if (!orphan) {
    notFound();
  }

  const sponsorship = await getOrphanSponsorshipOverview(teamMember, id);

  return <OrphanDetailPage initialOrphan={orphan} initialSponsorship={sponsorship} />;
}

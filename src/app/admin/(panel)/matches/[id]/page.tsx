import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { MatchDetailPage } from '@/components/admin/MatchDetailPage';

import { getAdminPageContext } from '@/lib/adminPageAccess';
import { getMatchDetailOverview } from '@/lib/matchDetails';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Match Details | Bait ul Aqba Admin',
};

export default async function MatchDetailRoute({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { teamMember } = await getAdminPageContext('matches');
  const overview = await getMatchDetailOverview(teamMember, id);

  if (!overview) {
    notFound();
  }

  return <MatchDetailPage initialOverview={overview} />;
}

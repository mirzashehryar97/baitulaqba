import type { Metadata } from 'next';

import { MatchesDashboard } from '@/components/admin/MatchesDashboard';

import { getAdminPageContext } from '@/lib/adminPageAccess';
import {
  getSponsorshipMatchListSummary,
  listMatchableDonors,
  listMatchableOrphans,
  listSponsorshipMatchesPage,
} from '@/lib/sponsorshipMatches';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Matches | Bait ul Aqba Admin',
};

export default async function MatchesPage() {
  await getAdminPageContext('matches');
  const [matches, matchableDonors, matchableOrphans, summary] = await Promise.all([
    listSponsorshipMatchesPage(),
    listMatchableDonors(),
    listMatchableOrphans(),
    getSponsorshipMatchListSummary(),
  ]);

  return (
    <MatchesDashboard
      initialMatchableDonors={matchableDonors}
      initialMatchableOrphans={matchableOrphans}
      initialPage={matches}
      initialSummary={summary}
    />
  );
}

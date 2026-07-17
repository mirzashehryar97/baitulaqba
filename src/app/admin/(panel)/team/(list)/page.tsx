import type { Metadata } from 'next';

import { TeamMembersDashboard } from '@/components/admin/TeamMembersDashboard';

import { getAdminPageContext } from '@/lib/adminPageAccess';
import { getTeamMemberListSummary, listTeamMembers } from '@/lib/teamMembers';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Team Members | Bait ul Aqba Admin',
};

export default async function TeamPage() {
  await getAdminPageContext('team_members');
  const [members, summary] = await Promise.all([listTeamMembers(), getTeamMemberListSummary()]);

  return <TeamMembersDashboard initialPage={members} initialSummary={summary} />;
}

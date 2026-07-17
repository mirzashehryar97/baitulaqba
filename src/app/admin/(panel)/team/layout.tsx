import { getAdminPageContext } from '@/lib/adminPageAccess';

export const dynamic = 'force-dynamic';

export default async function AdminTeamLayout({ children }: { children: React.ReactNode }) {
  await getAdminPageContext('team_members');

  return children;
}

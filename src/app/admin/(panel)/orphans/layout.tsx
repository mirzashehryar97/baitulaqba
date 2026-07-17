import { getAdminPageContext } from '@/lib/adminPageAccess';

export const dynamic = 'force-dynamic';

export default async function AdminOrphansLayout({ children }: { children: React.ReactNode }) {
  await getAdminPageContext('orphan_profiles');

  return children;
}

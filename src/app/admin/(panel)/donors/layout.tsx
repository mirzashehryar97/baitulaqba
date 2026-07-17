import { getAdminPageContext } from '@/lib/adminPageAccess';

export const dynamic = 'force-dynamic';

export default async function AdminDonorsLayout({ children }: { children: React.ReactNode }) {
  await getAdminPageContext('sponsors');

  return children;
}

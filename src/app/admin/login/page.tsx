import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

import { AdminLogin } from '@/components/admin/AdminLogin';

import { getCurrentTeamMember } from '@/lib/adminAuth';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Admin Login | Bait ul Aqba',
};

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const teamMember = await getCurrentTeamMember();

  if (teamMember) {
    redirect('/admin');
  }

  const params = await searchParams;

  return <AdminLogin errorCode={params.error} />;
}

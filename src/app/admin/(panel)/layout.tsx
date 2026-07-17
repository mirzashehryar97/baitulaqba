import { AdminSetupNotice } from '@/components/admin/AdminSetupNotice';
import { AdminShell } from '@/components/admin/AdminShell';

import { getAdminPageContext, getMissingAdminSetup } from '@/lib/adminPageAccess';
import { MissingSupabaseAuthConfigError, MissingSupabaseConfigError } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export default async function AdminPanelLayout({ children }: { children: React.ReactNode }) {
  const missing = getMissingAdminSetup();

  if (missing.length > 0) {
    return <AdminSetupNotice missing={missing} />;
  }

  try {
    const { donorProfile, teamMember } = await getAdminPageContext();

    return (
      <AdminShell donorProfile={donorProfile} teamMember={teamMember}>
        {children}
      </AdminShell>
    );
  } catch (error) {
    if (error instanceof MissingSupabaseConfigError) {
      return <AdminSetupNotice missing={['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY']} />;
    }

    if (error instanceof MissingSupabaseAuthConfigError) {
      return (
        <AdminSetupNotice missing={['NEXT_PUBLIC_SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_ANON_KEY']} />
      );
    }

    throw error;
  }
}

import { redirect } from 'next/navigation';

import { getCurrentAuthUser, getDonorForAuthUser, getTeamMemberForAuthUser } from '@/lib/adminAuth';
import { type AdminPageKey, canAccessAdminPage } from '@/lib/adminPermissions';

import type { TeamMemberRole } from '@/types/accounts';

export function getMissingAdminSetup() {
  const missing: string[] = [];

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    missing.push('NEXT_PUBLIC_SUPABASE_URL');
  }

  if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    missing.push('NEXT_PUBLIC_SUPABASE_ANON_KEY');
  }

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    missing.push('SUPABASE_SERVICE_ROLE_KEY');
  }

  return missing;
}

export async function getAdminPageContext(pageKeyOrAllowedRoles?: AdminPageKey | TeamMemberRole[]) {
  const authUser = await getCurrentAuthUser();

  if (!authUser) {
    redirect('/admin/login');
  }

  const [teamMember, donorProfile] = await Promise.all([
    getTeamMemberForAuthUser(authUser),
    getDonorForAuthUser(authUser),
  ]);

  if (!teamMember) {
    redirect('/admin/login?error=not_allowed');
  }

  if (Array.isArray(pageKeyOrAllowedRoles) && !pageKeyOrAllowedRoles.includes(teamMember.role)) {
    redirect('/admin/forbidden');
  }

  if (
    typeof pageKeyOrAllowedRoles === 'string' &&
    !canAccessAdminPage(teamMember, pageKeyOrAllowedRoles)
  ) {
    redirect('/admin/forbidden');
  }

  return { donorProfile, teamMember };
}

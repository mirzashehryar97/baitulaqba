import type { Metadata } from 'next';

import { RolesAccessPage } from '@/components/admin/RolesAccessPage';

import { getAdminPageContext } from '@/lib/adminPageAccess';
import { canManagePermissions } from '@/lib/adminPermissions';
import { resolveAllRoleFeatureAccess } from '@/lib/permissions';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Roles & Access | Bait ul Aqba Admin',
};

export default async function AdminRolesAccessPage() {
  const { teamMember } = await getAdminPageContext('roles_access');
  const initialAccess = await resolveAllRoleFeatureAccess();

  return (
    <RolesAccessPage canEdit={canManagePermissions(teamMember)} initialAccess={initialAccess} />
  );
}

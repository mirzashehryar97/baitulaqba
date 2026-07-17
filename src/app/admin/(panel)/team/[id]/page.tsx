import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { TeamMemberDetailPage } from '@/components/admin/TeamMemberDetailPage';

import { resolveAllRoleFeatureAccess, resolveMemberFeatureAccess } from '@/lib/permissions';
import { getTeamMemberById } from '@/lib/teamMembers';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Edit Team Member | Bait ul Aqba Admin',
};

export default async function EditTeamMemberPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const member = await getTeamMemberById(id);

  if (!member) {
    notFound();
  }

  const [featureAccess, roleFeatureAccess] = await Promise.all([
    resolveMemberFeatureAccess(member),
    resolveAllRoleFeatureAccess(),
  ]);

  return (
    <TeamMemberDetailPage
      initialFeatureAccess={featureAccess}
      member={member}
      roleFeatureAccess={roleFeatureAccess}
    />
  );
}

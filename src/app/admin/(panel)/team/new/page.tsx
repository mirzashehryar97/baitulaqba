import type { Metadata } from 'next';

import { TeamMemberFormPage } from '@/components/admin/TeamMemberFormPage';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Add Team Member | Bait ul Aqba Admin',
};

export default function AddTeamMemberPage() {
  return <TeamMemberFormPage />;
}

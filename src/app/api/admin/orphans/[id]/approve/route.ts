import { NextResponse } from 'next/server';

import { ForbiddenError, requireTeamMember } from '@/lib/adminAuth';
import { canApproveOrphans } from '@/lib/adminPermissions';
import { handleOrphanApiError } from '@/lib/orphanApiErrors';
import { approveOrphanProfile } from '@/lib/orphans';

export async function POST(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;

  try {
    const currentTeamMember = await requireTeamMember();

    if (!canApproveOrphans(currentTeamMember)) {
      throw new ForbiddenError('You do not have permission to approve orphan profiles.');
    }

    const orphan = await approveOrphanProfile(id, currentTeamMember.id);

    if (!orphan) {
      return NextResponse.json({ error: 'Orphan profile not found.' }, { status: 404 });
    }

    return NextResponse.json({ data: orphan });
  } catch (error) {
    return handleOrphanApiError(error, 'Could not approve orphan profile.');
  }
}

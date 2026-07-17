import { NextResponse } from 'next/server';

import { ForbiddenError, requireTeamMember } from '@/lib/adminAuth';
import { canViewOrphans } from '@/lib/adminPermissions';
import { handleOrphanApiError } from '@/lib/orphanApiErrors';
import { getOrphanListSummary } from '@/lib/orphans';

export async function GET() {
  try {
    const currentTeamMember = await requireTeamMember();

    if (!canViewOrphans(currentTeamMember)) {
      throw new ForbiddenError('You do not have permission to view orphan profiles.');
    }

    return NextResponse.json({ data: await getOrphanListSummary() });
  } catch (error) {
    return handleOrphanApiError(error, 'Could not load orphan profile totals.');
  }
}

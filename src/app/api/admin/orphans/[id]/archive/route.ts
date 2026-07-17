import { NextResponse } from 'next/server';

import { ForbiddenError, requireTeamMember } from '@/lib/adminAuth';
import { canArchiveOrphans } from '@/lib/adminPermissions';
import { handleOrphanApiError } from '@/lib/orphanApiErrors';
import { archiveOrphanProfile } from '@/lib/orphans';

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const body = (await request.json().catch(() => null)) as { archiveReason?: string } | null;

  if (!body?.archiveReason?.trim()) {
    return NextResponse.json({ error: 'Archive reason is required.' }, { status: 400 });
  }

  try {
    const currentTeamMember = await requireTeamMember();

    if (!canArchiveOrphans(currentTeamMember)) {
      throw new ForbiddenError('You do not have permission to archive orphan profiles.');
    }

    const orphan = await archiveOrphanProfile(id, currentTeamMember.id, body.archiveReason);
    return NextResponse.json({ data: orphan });
  } catch (error) {
    return handleOrphanApiError(error, 'Could not archive orphan profile.');
  }
}

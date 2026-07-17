import { NextResponse } from 'next/server';

import { ForbiddenError, requireTeamMember } from '@/lib/adminAuth';
import { canCreateMatches, canViewMatches } from '@/lib/adminPermissions';
import { handleMatchApiError } from '@/lib/matchApiErrors';
import { listMatchableOrphans } from '@/lib/sponsorshipMatches';

export async function GET(request: Request) {
  try {
    const currentTeamMember = await requireTeamMember();

    if (!canViewMatches(currentTeamMember) && !canCreateMatches(currentTeamMember)) {
      throw new ForbiddenError('You do not have permission to view matchable orphan profiles.');
    }

    const url = new URL(request.url);
    const orphans = await listMatchableOrphans({
      search: url.searchParams.get('search') ?? undefined,
    });

    return NextResponse.json({ data: orphans });
  } catch (error) {
    return handleMatchApiError(error, 'Could not load matchable orphan profiles.');
  }
}

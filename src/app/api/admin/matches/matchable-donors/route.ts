import { NextResponse } from 'next/server';

import { ForbiddenError, requireTeamMember } from '@/lib/adminAuth';
import { canCreateMatches, canViewMatches } from '@/lib/adminPermissions';
import { handleMatchApiError } from '@/lib/matchApiErrors';
import { listMatchableDonors } from '@/lib/sponsorshipMatches';

export async function GET(request: Request) {
  try {
    const currentTeamMember = await requireTeamMember();

    if (!canViewMatches(currentTeamMember) && !canCreateMatches(currentTeamMember)) {
      throw new ForbiddenError('You do not have permission to view matchable donors.');
    }

    const url = new URL(request.url);
    const donors = await listMatchableDonors({
      search: url.searchParams.get('search') ?? undefined,
    });

    return NextResponse.json({ data: donors });
  } catch (error) {
    return handleMatchApiError(error, 'Could not load matchable donors.');
  }
}

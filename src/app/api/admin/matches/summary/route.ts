import { NextResponse } from 'next/server';

import { ForbiddenError, requireTeamMember } from '@/lib/adminAuth';
import { canViewMatches } from '@/lib/adminPermissions';
import { handleMatchApiError } from '@/lib/matchApiErrors';
import { getSponsorshipMatchListSummary } from '@/lib/sponsorshipMatches';

export async function GET() {
  try {
    const currentTeamMember = await requireTeamMember();

    if (!canViewMatches(currentTeamMember)) {
      throw new ForbiddenError('You do not have permission to view sponsorship matches.');
    }

    return NextResponse.json({ data: await getSponsorshipMatchListSummary() });
  } catch (error) {
    return handleMatchApiError(error, 'Could not load sponsorship match totals.');
  }
}

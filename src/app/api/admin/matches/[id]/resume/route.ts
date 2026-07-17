import { NextResponse } from 'next/server';

import { ForbiddenError, requireTeamMember } from '@/lib/adminAuth';
import { canResumeMatches } from '@/lib/adminPermissions';
import { handleMatchApiError } from '@/lib/matchApiErrors';
import { resumeSponsorshipMatch } from '@/lib/sponsorshipMatches';

export async function POST(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;

  try {
    const currentTeamMember = await requireTeamMember();

    if (!canResumeMatches(currentTeamMember)) {
      throw new ForbiddenError('You do not have permission to resume sponsorship matches.');
    }

    const match = await resumeSponsorshipMatch(id, currentTeamMember.id);

    if (!match) {
      return NextResponse.json({ error: 'Sponsorship match not found.' }, { status: 404 });
    }

    return NextResponse.json({ data: { id: match.id, status: match.status } });
  } catch (error) {
    return handleMatchApiError(error, 'Could not resume sponsorship match.');
  }
}

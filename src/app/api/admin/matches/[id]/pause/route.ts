import { NextResponse } from 'next/server';

import { ForbiddenError, requireTeamMember } from '@/lib/adminAuth';
import { canPauseMatches } from '@/lib/adminPermissions';
import { handleMatchApiError } from '@/lib/matchApiErrors';
import {
  pauseSponsorshipMatch,
  validateSponsorshipMatchStatusInput,
} from '@/lib/sponsorshipMatches';

import type { SponsorshipMatchStatusInput } from '@/types/matches';

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const body = (await request.json().catch(() => null)) as SponsorshipMatchStatusInput | null;
  const errors = validateSponsorshipMatchStatusInput(body);

  if (!body || Object.keys(errors).length > 0) {
    return NextResponse.json({ errors }, { status: 400 });
  }

  try {
    const currentTeamMember = await requireTeamMember();

    if (!canPauseMatches(currentTeamMember)) {
      throw new ForbiddenError('You do not have permission to pause sponsorship matches.');
    }

    const match = await pauseSponsorshipMatch(id, body.reason, currentTeamMember.id);

    if (!match) {
      return NextResponse.json({ error: 'Sponsorship match not found.' }, { status: 404 });
    }

    return NextResponse.json({ data: { id: match.id, status: match.status } });
  } catch (error) {
    return handleMatchApiError(error, 'Could not pause sponsorship match.');
  }
}

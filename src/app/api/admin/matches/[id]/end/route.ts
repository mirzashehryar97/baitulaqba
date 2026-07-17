import { NextResponse } from 'next/server';

import { ForbiddenError, requireTeamMember } from '@/lib/adminAuth';
import { canEndMatches } from '@/lib/adminPermissions';
import { handleMatchApiError } from '@/lib/matchApiErrors';
import { endSponsorshipMatch, validateSponsorshipMatchStatusInput } from '@/lib/sponsorshipMatches';

import type { SponsorshipMatchStatusInput } from '@/types/matches';

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const body = (await request.json().catch(() => null)) as SponsorshipMatchStatusInput | null;
  const errors = validateSponsorshipMatchStatusInput(body, { requireEndedAt: true });

  if (!body || Object.keys(errors).length > 0) {
    return NextResponse.json({ errors }, { status: 400 });
  }

  try {
    const currentTeamMember = await requireTeamMember();

    if (!canEndMatches(currentTeamMember)) {
      throw new ForbiddenError('You do not have permission to end sponsorship matches.');
    }

    const match = await endSponsorshipMatch(id, body, currentTeamMember.id);

    if (!match) {
      return NextResponse.json({ error: 'Sponsorship match not found.' }, { status: 404 });
    }

    return NextResponse.json({ data: { id: match.id, status: match.status } });
  } catch (error) {
    return handleMatchApiError(error, 'Could not end sponsorship match.');
  }
}

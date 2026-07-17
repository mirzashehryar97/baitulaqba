import { NextResponse } from 'next/server';

import { ForbiddenError, requireTeamMember } from '@/lib/adminAuth';
import { canUpdateMatches, canViewMatches } from '@/lib/adminPermissions';
import { handleMatchApiError } from '@/lib/matchApiErrors';
import { getMatchDetailOverview } from '@/lib/matchDetails';
import {
  getSponsorshipMatchById,
  updateSponsorshipMatch,
  validateSponsorshipMatchUpdate,
} from '@/lib/sponsorshipMatches';

import type { SponsorshipMatchUpdate } from '@/types/matches';

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;

  try {
    const currentTeamMember = await requireTeamMember();

    if (!canViewMatches(currentTeamMember)) {
      throw new ForbiddenError('You do not have permission to view sponsorship matches.');
    }

    const overview = await getMatchDetailOverview(currentTeamMember, id);

    if (!overview) {
      return NextResponse.json({ error: 'Sponsorship match not found.' }, { status: 404 });
    }

    return NextResponse.json({ data: overview });
  } catch (error) {
    return handleMatchApiError(error, 'Could not load sponsorship match.');
  }
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const body = (await request.json().catch(() => null)) as SponsorshipMatchUpdate | null;

  if (!body) {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  const errors = validateSponsorshipMatchUpdate(body);
  if (Object.keys(errors).length > 0) {
    return NextResponse.json({ errors }, { status: 400 });
  }

  try {
    const currentTeamMember = await requireTeamMember();

    if (!canUpdateMatches(currentTeamMember)) {
      throw new ForbiddenError('You do not have permission to update sponsorship matches.');
    }

    const existing = await getSponsorshipMatchById(id);

    if (!existing) {
      return NextResponse.json({ error: 'Sponsorship match not found.' }, { status: 404 });
    }

    const match = await updateSponsorshipMatch(id, body, currentTeamMember.id);
    return NextResponse.json({ data: { id: match.id, status: match.status } });
  } catch (error) {
    return handleMatchApiError(error, 'Could not update sponsorship match.');
  }
}

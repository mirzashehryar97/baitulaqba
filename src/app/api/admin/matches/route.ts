import { NextResponse } from 'next/server';

import { ForbiddenError, requireTeamMember } from '@/lib/adminAuth';
import { canCreateMatches, canViewMatches } from '@/lib/adminPermissions';
import { handleMatchApiError } from '@/lib/matchApiErrors';
import { getPaginationOptions } from '@/lib/pagination';
import {
  createSponsorshipMatch,
  listSponsorshipMatchesPage,
  SPONSORSHIP_MATCH_STATUSES,
  validateSponsorshipMatchInput,
} from '@/lib/sponsorshipMatches';

import type { SponsorshipMatchInput, SponsorshipMatchStatus } from '@/types/matches';

export async function GET(request: Request) {
  try {
    const currentTeamMember = await requireTeamMember();

    if (!canViewMatches(currentTeamMember)) {
      throw new ForbiddenError('You do not have permission to view sponsorship matches.');
    }

    const url = new URL(request.url);
    const matches = await listSponsorshipMatchesPage(
      {
        createdBy: url.searchParams.get('createdBy') ?? undefined,
        donorId: url.searchParams.get('donorId') ?? undefined,
        orphanId: url.searchParams.get('orphanId') ?? undefined,
        search: url.searchParams.get('search') ?? undefined,
        startedFrom: url.searchParams.get('startedFrom') ?? undefined,
        startedTo: url.searchParams.get('startedTo') ?? undefined,
        status: parseMatchStatus(url.searchParams.get('status')),
      },
      getPaginationOptions(url),
    );

    return NextResponse.json({ data: matches });
  } catch (error) {
    return handleMatchApiError(error, 'Could not load sponsorship matches.');
  }
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as SponsorshipMatchInput | null;
  const errors = validateSponsorshipMatchInput(body);

  if (!body || Object.keys(errors).length > 0) {
    return NextResponse.json({ errors }, { status: 400 });
  }

  try {
    const currentTeamMember = await requireTeamMember();

    if (!canCreateMatches(currentTeamMember)) {
      throw new ForbiddenError('You do not have permission to create sponsorship matches.');
    }

    const match = await createSponsorshipMatch(body, currentTeamMember.id);
    return NextResponse.json({ data: match }, { status: 201 });
  } catch (error) {
    return handleMatchApiError(error, 'Could not create sponsorship match.');
  }
}

function parseMatchStatus(value: string | null) {
  return value && SPONSORSHIP_MATCH_STATUSES.includes(value as SponsorshipMatchStatus)
    ? (value as SponsorshipMatchStatus)
    : undefined;
}

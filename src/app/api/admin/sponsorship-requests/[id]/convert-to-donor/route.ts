import { NextResponse } from 'next/server';

import { ForbiddenError, requireTeamMember, UnauthorizedError } from '@/lib/adminAuth';
import { canConvertSponsorshipRequestsToDonor } from '@/lib/adminPermissions';
import { convertSponsorshipRequestToDonor } from '@/lib/sponsorshipRequests';
import { MissingSupabaseAuthConfigError, MissingSupabaseConfigError } from '@/lib/supabase/server';

export async function POST(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;

  try {
    const currentTeamMember = await requireTeamMember();

    if (!canConvertSponsorshipRequestsToDonor(currentTeamMember)) {
      throw new ForbiddenError('You do not have permission to convert requests to donors.');
    }

    const result = await convertSponsorshipRequestToDonor(id, currentTeamMember.id);
    return NextResponse.json({ data: result });
  } catch (error) {
    return handleApiError(error, 'Could not convert request to donor.');
  }
}

function handleApiError(error: unknown, fallbackMessage: string) {
  if (error instanceof UnauthorizedError) {
    return NextResponse.json({ error: error.message }, { status: 401 });
  }

  if (error instanceof ForbiddenError) {
    return NextResponse.json({ error: error.message }, { status: 403 });
  }

  if (error instanceof MissingSupabaseConfigError) {
    return NextResponse.json({ error: error.message }, { status: 503 });
  }

  if (error instanceof MissingSupabaseAuthConfigError) {
    return NextResponse.json({ error: error.message }, { status: 503 });
  }

  if (error instanceof Error && error.message.includes('inactive')) {
    return NextResponse.json({ error: error.message }, { status: 409 });
  }

  if (error instanceof Error && error.message.includes('Profiles must be shared')) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ error: fallbackMessage }, { status: 500 });
}

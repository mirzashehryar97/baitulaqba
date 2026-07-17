import { NextResponse } from 'next/server';

import { ForbiddenError, requireTeamMember, UnauthorizedError } from '@/lib/adminAuth';
import { canAssignSponsorshipRequests } from '@/lib/adminPermissions';
import { listAssignableTeamMembers } from '@/lib/sponsorshipRequests';
import { MissingSupabaseAuthConfigError, MissingSupabaseConfigError } from '@/lib/supabase/server';

export async function GET() {
  try {
    const currentTeamMember = await requireTeamMember();

    if (!canAssignSponsorshipRequests(currentTeamMember)) {
      throw new ForbiddenError('You do not have permission to view request assignees.');
    }

    const assignees = await listAssignableTeamMembers();
    return NextResponse.json({ data: assignees });
  } catch (error) {
    return handleApiError(error, 'Could not load request assignees.');
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

  return NextResponse.json({ error: fallbackMessage }, { status: 500 });
}

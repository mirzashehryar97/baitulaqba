import { NextResponse } from 'next/server';

import { ForbiddenError, requireTeamMember, UnauthorizedError } from '@/lib/adminAuth';
import { canViewSponsorshipRequests, isAssignedOnlySponsorshipRole } from '@/lib/adminPermissions';
import { getSponsorshipRequestListSummary } from '@/lib/sponsorshipRequests';
import { MissingSupabaseAuthConfigError, MissingSupabaseConfigError } from '@/lib/supabase/server';

export async function GET() {
  try {
    const currentTeamMember = await requireTeamMember();

    if (!canViewSponsorshipRequests(currentTeamMember)) {
      throw new ForbiddenError('You do not have permission to view sponsorship requests.');
    }

    const summary = await getSponsorshipRequestListSummary({
      currentTeamMemberId: currentTeamMember.id,
      scopedToTeamMemberId: isAssignedOnlySponsorshipRole(currentTeamMember.role)
        ? currentTeamMember.id
        : undefined,
    });

    return NextResponse.json({ data: summary });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }

    if (error instanceof ForbiddenError) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }

    if (
      error instanceof MissingSupabaseConfigError ||
      error instanceof MissingSupabaseAuthConfigError
    ) {
      return NextResponse.json({ error: error.message }, { status: 503 });
    }

    return NextResponse.json(
      { error: 'Could not load sponsorship request totals.' },
      { status: 500 },
    );
  }
}

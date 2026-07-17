import { NextResponse } from 'next/server';

import { ForbiddenError, requireTeamMember, UnauthorizedError } from '@/lib/adminAuth';
import { canViewAssignedOnly, canViewDonors } from '@/lib/adminPermissions';
import { getDonorListSummary } from '@/lib/donors';
import { MissingSupabaseAuthConfigError, MissingSupabaseConfigError } from '@/lib/supabase/server';

export async function GET() {
  try {
    const currentTeamMember = await requireTeamMember();

    if (!canViewDonors(currentTeamMember)) {
      throw new ForbiddenError('You do not have permission to view donors.');
    }

    const summary = await getDonorListSummary({
      scopedToTeamMemberId: canViewAssignedOnly(currentTeamMember.role, 'sponsors')
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

    return NextResponse.json({ error: 'Could not load donor totals.' }, { status: 500 });
  }
}

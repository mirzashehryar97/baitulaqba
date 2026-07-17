import { NextResponse } from 'next/server';

import { ForbiddenError, requireTeamMember, UnauthorizedError } from '@/lib/adminAuth';
import { canManageTeamMembers } from '@/lib/adminPermissions';
import { MissingSupabaseAuthConfigError, MissingSupabaseConfigError } from '@/lib/supabase/server';
import { getTeamMemberListSummary } from '@/lib/teamMembers';

export async function GET() {
  try {
    const currentTeamMember = await requireTeamMember();

    if (!canManageTeamMembers(currentTeamMember)) {
      throw new ForbiddenError('You do not have permission to view team members.');
    }

    return NextResponse.json({ data: await getTeamMemberListSummary() });
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

    return NextResponse.json({ error: 'Could not load team member totals.' }, { status: 500 });
  }
}

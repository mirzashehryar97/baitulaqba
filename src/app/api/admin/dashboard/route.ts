import { NextResponse } from 'next/server';

import { ForbiddenError, requireTeamMember, UnauthorizedError } from '@/lib/adminAuth';
import { getAdminDashboardSummary } from '@/lib/adminDashboard';
import { canAccessAdminPage } from '@/lib/adminPermissions';
import { MissingSupabaseAuthConfigError, MissingSupabaseConfigError } from '@/lib/supabase/server';

export async function GET(request: Request) {
  try {
    const teamMember = await requireTeamMember();
    if (!canAccessAdminPage(teamMember, 'dashboard')) {
      throw new ForbiddenError('You do not have permission to view the admin dashboard.');
    }
    const month = new URL(request.url).searchParams.get('month');
    const summary = await getAdminDashboardSummary(teamMember, month);

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
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.error(error);
    return NextResponse.json({ error: 'Could not load the admin dashboard.' }, { status: 500 });
  }
}

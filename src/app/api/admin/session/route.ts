import { NextResponse } from 'next/server';

import { getCurrentDonor, requireTeamMember, UnauthorizedError } from '@/lib/adminAuth';
import {
  createSupabaseServerClient,
  MissingSupabaseAuthConfigError,
  MissingSupabaseConfigError,
} from '@/lib/supabase/server';

export async function GET() {
  try {
    const [teamMember, donorProfile] = await Promise.all([requireTeamMember(), getCurrentDonor()]);

    return NextResponse.json({
      data: {
        donorProfile,
        teamMember,
      },
    });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }

    if (error instanceof MissingSupabaseConfigError) {
      return NextResponse.json({ error: error.message }, { status: 503 });
    }

    if (error instanceof MissingSupabaseAuthConfigError) {
      return NextResponse.json({ error: error.message }, { status: 503 });
    }

    return NextResponse.json({ error: 'Could not load admin session.' }, { status: 500 });
  }
}

export async function DELETE() {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();

  return NextResponse.json({ ok: true });
}

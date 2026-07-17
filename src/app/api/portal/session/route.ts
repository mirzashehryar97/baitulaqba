import { NextResponse } from 'next/server';

import { requireDonor } from '@/lib/adminAuth';
import { getDonorPortalSession } from '@/lib/portal';
import { handlePortalApiError } from '@/lib/portalApi';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const donor = await requireDonor();
    const session = await getDonorPortalSession(donor);

    return NextResponse.json({ data: session });
  } catch (error) {
    return handlePortalApiError(error, 'Could not load donor session.');
  }
}

export async function DELETE() {
  try {
    const supabase = await createSupabaseServerClient();
    await supabase.auth.signOut();

    return NextResponse.json({ ok: true });
  } catch (error) {
    return handlePortalApiError(error, 'Could not sign out.');
  }
}

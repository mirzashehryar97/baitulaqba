import { NextResponse } from 'next/server';

import { requireDonor } from '@/lib/adminAuth';
import { createAvailableOrphanInterest } from '@/lib/portal';
import { handlePortalApiError } from '@/lib/portalApi';

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const donor = await requireDonor();
    const { id } = await params;
    const interest = await createAvailableOrphanInterest(donor, id);

    return NextResponse.json({ data: interest }, { status: 201 });
  } catch (error) {
    return handlePortalApiError(error, 'Could not submit interest.');
  }
}

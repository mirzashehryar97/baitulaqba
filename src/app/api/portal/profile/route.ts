import { NextResponse } from 'next/server';

import { requireDonor } from '@/lib/adminAuth';
import { getDonorPortalSession, updateDonorPortalProfile } from '@/lib/portal';
import { handlePortalApiError } from '@/lib/portalApi';

export async function GET() {
  try {
    const donor = await requireDonor();
    const session = await getDonorPortalSession(donor);

    return NextResponse.json({ data: session.donor });
  } catch (error) {
    return handlePortalApiError(error, 'Could not load donor profile.');
  }
}

export async function PATCH(request: Request) {
  try {
    const donor = await requireDonor();
    const body = (await request.json().catch(() => null)) as {
      cityCountry?: string;
      fullName?: string;
      phone?: string;
      preferredContactMethod?: typeof donor.preferredContactMethod;
    } | null;

    if (!body) {
      return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
    }

    const updated = await updateDonorPortalProfile(donor, body);
    const session = await getDonorPortalSession(updated);

    return NextResponse.json({ data: session.donor });
  } catch (error) {
    return handlePortalApiError(error, 'Could not update donor profile.');
  }
}

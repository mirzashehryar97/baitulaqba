import { NextResponse } from 'next/server';

import { requireDonor } from '@/lib/adminAuth';
import { listPortalSponsorshipsForDonor } from '@/lib/portal';
import { handlePortalApiError } from '@/lib/portalApi';

export async function GET(request: Request) {
  try {
    const donor = await requireDonor();
    const url = new URL(request.url);
    const sponsorships = await listPortalSponsorshipsForDonor(donor.id, {
      includeHistory: url.searchParams.get('history') === '1',
    });

    return NextResponse.json({ data: sponsorships });
  } catch (error) {
    return handlePortalApiError(error, 'Could not load sponsorships.');
  }
}

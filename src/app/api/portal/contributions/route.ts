import { NextResponse } from 'next/server';

import { requireDonor } from '@/lib/adminAuth';
import { getContributionSummaryForDonor } from '@/lib/portal';
import { handlePortalApiError } from '@/lib/portalApi';

export async function GET() {
  try {
    const donor = await requireDonor();
    const summary = await getContributionSummaryForDonor(donor.id);

    return NextResponse.json({ data: summary });
  } catch (error) {
    return handlePortalApiError(error, 'Could not load contributions.');
  }
}

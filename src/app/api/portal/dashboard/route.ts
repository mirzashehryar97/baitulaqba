import { NextResponse } from 'next/server';

import { requireDonor } from '@/lib/adminAuth';
import { getPortalDashboard } from '@/lib/portal';
import { handlePortalApiError } from '@/lib/portalApi';

export async function GET() {
  try {
    const donor = await requireDonor();
    const dashboard = await getPortalDashboard(donor.id);

    return NextResponse.json({ data: dashboard });
  } catch (error) {
    return handlePortalApiError(error, 'Could not load donor dashboard.');
  }
}

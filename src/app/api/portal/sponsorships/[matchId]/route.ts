import { NextResponse } from 'next/server';

import { requireDonor } from '@/lib/adminAuth';
import { getPortalSponsorshipByMatchId, PortalValidationError } from '@/lib/portal';
import { handlePortalApiError } from '@/lib/portalApi';

export async function GET(_request: Request, { params }: { params: Promise<{ matchId: string }> }) {
  try {
    const donor = await requireDonor();
    const { matchId } = await params;
    const sponsorship = await getPortalSponsorshipByMatchId(donor.id, matchId);

    if (!sponsorship) {
      throw new PortalValidationError({ matchId: 'Sponsorship not found.' });
    }

    return NextResponse.json({ data: sponsorship });
  } catch (error) {
    return handlePortalApiError(error, 'Could not load sponsorship.');
  }
}

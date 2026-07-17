import { NextResponse } from 'next/server';

import { requireDonor } from '@/lib/adminAuth';
import { getPortalReceiptFileSignedUrl } from '@/lib/portal';
import { handlePortalApiError } from '@/lib/portalApi';

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const donor = await requireDonor();
    const { id } = await params;
    const signedUrl = await getPortalReceiptFileSignedUrl(donor.id, id);

    if (!signedUrl) {
      return NextResponse.json({ error: 'Receipt file not found.' }, { status: 404 });
    }

    return NextResponse.redirect(signedUrl);
  } catch (error) {
    return handlePortalApiError(error, 'Could not load receipt file.');
  }
}

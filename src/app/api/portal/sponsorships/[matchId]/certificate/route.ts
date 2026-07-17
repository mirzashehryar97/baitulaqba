import { NextResponse } from 'next/server';

import { requireDonor } from '@/lib/adminAuth';
import {
  collectMissingMatchCertificateFields,
  formatCertificateNumber,
  generateMatchCertificatePdf,
} from '@/lib/matchCertificate';
import { getOrphanProfileById } from '@/lib/orphans';
import { getPortalSponsorshipByMatchId } from '@/lib/portal';
import { handlePortalApiError } from '@/lib/portalApi';
import { getSponsorshipMatchById } from '@/lib/sponsorshipMatches';

export const runtime = 'nodejs';

export async function GET(_request: Request, { params }: { params: Promise<{ matchId: string }> }) {
  try {
    const donor = await requireDonor();
    const { matchId } = await params;
    const sponsorship = await getPortalSponsorshipByMatchId(donor.id, matchId);

    if (!sponsorship) {
      return NextResponse.json({ error: 'Sponsorship not found.' }, { status: 404 });
    }

    const match = await getSponsorshipMatchById(matchId);

    if (!match || match.donorId !== donor.id) {
      return NextResponse.json({ error: 'Sponsorship not found.' }, { status: 404 });
    }

    const orphan = await getOrphanProfileById(match.orphanId, { includeDocuments: false });

    if (!orphan) {
      return NextResponse.json(
        { error: 'The orphan profile could not be found.' },
        { status: 404 },
      );
    }

    const missing = collectMissingMatchCertificateFields({ donor, orphan });

    if (missing.length > 0) {
      return NextResponse.json(
        {
          error: 'The certificate is being prepared. Please contact the team if you need it now.',
        },
        { status: 422 },
      );
    }

    const pdf = await generateMatchCertificatePdf({ donor, match, orphan });

    return new NextResponse(new Uint8Array(pdf), {
      headers: {
        'Content-Disposition': `attachment; filename="${formatCertificateNumber(match)}.pdf"`,
        'Content-Type': 'application/pdf',
      },
    });
  } catch (error) {
    return handlePortalApiError(error, 'Could not download the sponsorship certificate.');
  }
}

import { NextResponse } from 'next/server';

import { ForbiddenError, requireTeamMember } from '@/lib/adminAuth';
import { canDownloadMatchCertificate } from '@/lib/adminPermissions';
import { getDonorById } from '@/lib/donors';
import { handleMatchApiError } from '@/lib/matchApiErrors';
import {
  collectMissingMatchCertificateFields,
  formatCertificateNumber,
  generateMatchCertificatePdf,
} from '@/lib/matchCertificate';
import { getOrphanProfileById } from '@/lib/orphans';
import { getSponsorshipMatchById } from '@/lib/sponsorshipMatches';

export const runtime = 'nodejs';

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;

  try {
    const currentTeamMember = await requireTeamMember();

    if (!canDownloadMatchCertificate(currentTeamMember)) {
      throw new ForbiddenError('You do not have permission to download match certificates.');
    }

    const match = await getSponsorshipMatchById(id);

    if (!match) {
      return NextResponse.json({ error: 'Sponsorship match not found.' }, { status: 404 });
    }

    const [orphan, donor] = await Promise.all([
      getOrphanProfileById(match.orphanId, { includeDocuments: false }),
      getDonorById(match.donorId),
    ]);

    if (!orphan || !donor) {
      return NextResponse.json(
        { error: 'The orphan or donor for this match could not be found.' },
        { status: 404 },
      );
    }

    // Every value printed on the certificate must be present. This mirrors the
    // required-field enforcement in the forms/schema, so a stale row can never
    // produce a certificate with blank fields.
    const missing = collectMissingMatchCertificateFields({ donor, orphan });

    if (missing.length > 0) {
      return NextResponse.json(
        {
          error: `Complete these details before generating the certificate: ${missing.join(', ')}.`,
          missing,
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
    return handleMatchApiError(error, 'Could not download the match certificate.');
  }
}

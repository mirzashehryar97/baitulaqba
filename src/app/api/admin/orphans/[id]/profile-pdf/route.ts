import { NextResponse } from 'next/server';

import { ForbiddenError, requireTeamMember } from '@/lib/adminAuth';
import { canDownloadOrphanProfilePdf } from '@/lib/adminPermissions';
import { handleOrphanApiError } from '@/lib/orphanApiErrors';
import { generateOrphanProfilePdf, getOrphanProfileById } from '@/lib/orphans';

export const runtime = 'nodejs';

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;

  try {
    const currentTeamMember = await requireTeamMember();

    if (!canDownloadOrphanProfilePdf(currentTeamMember)) {
      throw new ForbiddenError('You do not have permission to download orphan profiles.');
    }

    const orphan = await getOrphanProfileById(id, { includeDocuments: false });

    if (!orphan) {
      return NextResponse.json({ error: 'Orphan profile not found.' }, { status: 404 });
    }

    const pdf = await generateOrphanProfilePdf(orphan);
    const safeName = orphan.fullName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

    return new NextResponse(new Uint8Array(pdf), {
      headers: {
        'Content-Disposition': `attachment; filename="${orphan.orphanCode}-${safeName || 'profile'}.pdf"`,
        'Content-Type': 'application/pdf',
      },
    });
  } catch (error) {
    return handleOrphanApiError(error, 'Could not download orphan profile.');
  }
}

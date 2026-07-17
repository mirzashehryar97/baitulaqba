import { NextResponse } from 'next/server';

import { ForbiddenError, requireTeamMember } from '@/lib/adminAuth';
import { canViewOrphanDocuments } from '@/lib/adminPermissions';
import { handleOrphanApiError } from '@/lib/orphanApiErrors';
import { createOrphanDocumentSignedUrl, getOrphanDocument } from '@/lib/orphans';

export async function GET(
  _request: Request,
  context: { params: Promise<{ documentId: string; id: string }> },
) {
  const { documentId, id } = await context.params;

  try {
    const currentTeamMember = await requireTeamMember();

    if (!canViewOrphanDocuments(currentTeamMember)) {
      throw new ForbiddenError('You do not have permission to view orphan documents.');
    }

    const document = await getOrphanDocument(id, documentId);

    if (!document) {
      return NextResponse.json({ error: 'Document not found.' }, { status: 404 });
    }

    if (/^https?:\/\//.test(document.fileUrl)) {
      return NextResponse.redirect(document.fileUrl);
    }

    const signedUrl = await createOrphanDocumentSignedUrl(document.fileUrl);
    return NextResponse.redirect(signedUrl);
  } catch (error) {
    return handleOrphanApiError(error, 'Could not load orphan document.');
  }
}

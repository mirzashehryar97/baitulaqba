import { NextResponse } from 'next/server';

import { ForbiddenError, requireTeamMember } from '@/lib/adminAuth';
import { canUploadOrphanDocuments, canViewOrphanDocuments } from '@/lib/adminPermissions';
import { handleOrphanApiError } from '@/lib/orphanApiErrors';
import {
  createOrphanDocument,
  getOrphanProfileById,
  listOrphanDocuments,
  removeOrphanDocumentFile,
  uploadOrphanDocumentFile,
  validateDocumentInput,
} from '@/lib/orphans';

import type { DocumentInput } from '@/types/orphans';

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;

  try {
    const currentTeamMember = await requireTeamMember();

    if (!canViewOrphanDocuments(currentTeamMember)) {
      throw new ForbiddenError('You do not have permission to view orphan documents.');
    }

    const documents = await listOrphanDocuments(id);
    return NextResponse.json({ data: documents });
  } catch (error) {
    return handleOrphanApiError(error, 'Could not load orphan documents.');
  }
}

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;

  try {
    const currentTeamMember = await requireTeamMember();

    if (!canUploadOrphanDocuments(currentTeamMember)) {
      throw new ForbiddenError('You do not have permission to upload orphan documents.');
    }

    const orphan = await getOrphanProfileById(id);

    if (!orphan) {
      return NextResponse.json({ error: 'Orphan profile not found.' }, { status: 404 });
    }

    const contentType = request.headers.get('content-type') ?? '';
    const body = contentType.includes('multipart/form-data')
      ? await getDocumentInputFromFormData(request, id)
      : ((await request.json().catch(() => null)) as DocumentInput | null);
    const errors = validateDocumentInput(body);

    if (!body || Object.keys(errors).length > 0) {
      if (body?.fileUrl && contentType.includes('multipart/form-data')) {
        await removeOrphanDocumentFile(body.fileUrl);
      }

      return NextResponse.json({ errors }, { status: 400 });
    }

    const document = await createOrphanDocument(id, body, currentTeamMember.id).catch(
      async (error) => {
        if (contentType.includes('multipart/form-data')) {
          await removeOrphanDocumentFile(body.fileUrl);
        }

        throw error;
      },
    );
    return NextResponse.json({ data: document }, { status: 201 });
  } catch (error) {
    return handleOrphanApiError(error, 'Could not save orphan document.');
  }
}

async function getDocumentInputFromFormData(request: Request, orphanId: string) {
  const formData = await request.formData();
  const file = formData.get('file');

  if (!(file instanceof File)) {
    return null;
  }

  const upload = await uploadOrphanDocumentFile({ file, orphanId });
  const fileName = formData.get('fileName');
  const documentCategory = formData.get('documentCategory');

  return {
    documentCategory:
      typeof documentCategory === 'string'
        ? (documentCategory as DocumentInput['documentCategory'])
        : 'other',
    fileName: typeof fileName === 'string' && fileName.trim() ? fileName : upload.fileName,
    fileType: upload.fileType,
    fileUrl: upload.path,
  } satisfies DocumentInput;
}

import { NextResponse } from 'next/server';

import { ForbiddenError, requireTeamMember } from '@/lib/adminAuth';
import { canUploadOrphanProfileImage } from '@/lib/adminPermissions';
import { handleOrphanApiError } from '@/lib/orphanApiErrors';
import { getOrphanProfileById, uploadOrphanProfileImageFile } from '@/lib/orphans';

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;

  try {
    const currentTeamMember = await requireTeamMember();

    if (!canUploadOrphanProfileImage(currentTeamMember)) {
      throw new ForbiddenError('You do not have permission to upload orphan profile images.');
    }

    const orphan = await getOrphanProfileById(id);

    if (!orphan) {
      return NextResponse.json({ error: 'Orphan profile not found.' }, { status: 404 });
    }

    if (orphan.profileStatus === 'approved' && currentTeamMember.role === 'orphan_coordinator') {
      throw new ForbiddenError('Approved profiles can only be edited by admins.');
    }

    const formData = await request.formData();
    const file = formData.get('file');

    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'Profile image file is required.' }, { status: 400 });
    }

    const upload = await uploadOrphanProfileImageFile({
      file,
      orphanId: id,
      uploadedByTeamMemberId: currentTeamMember.id,
    });

    return NextResponse.json({ data: upload }, { status: 201 });
  } catch (error) {
    return handleOrphanApiError(error, 'Could not upload profile image.');
  }
}

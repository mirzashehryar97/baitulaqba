import { NextResponse } from 'next/server';

import { ForbiddenError, requireTeamMember } from '@/lib/adminAuth';
import { canUploadOrphanProfileImage } from '@/lib/adminPermissions';
import { handleOrphanApiError } from '@/lib/orphanApiErrors';
import { uploadOrphanProfileImageFile } from '@/lib/orphans';

export async function POST(request: Request) {
  try {
    const currentTeamMember = await requireTeamMember();

    if (!canUploadOrphanProfileImage(currentTeamMember)) {
      throw new ForbiddenError('You do not have permission to upload orphan profile images.');
    }

    const formData = await request.formData();
    const file = formData.get('file');

    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'Profile image file is required.' }, { status: 400 });
    }

    const upload = await uploadOrphanProfileImageFile({
      file,
      uploadedByTeamMemberId: currentTeamMember.id,
    });

    return NextResponse.json({ data: upload }, { status: 201 });
  } catch (error) {
    return handleOrphanApiError(error, 'Could not upload profile image.');
  }
}

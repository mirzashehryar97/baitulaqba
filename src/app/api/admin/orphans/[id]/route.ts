import { NextResponse } from 'next/server';

import { ForbiddenError, requireTeamMember } from '@/lib/adminAuth';
import { canUpdateOrphans, canViewOrphans } from '@/lib/adminPermissions';
import { handleOrphanApiError } from '@/lib/orphanApiErrors';
import { getOrphanProfileById, updateOrphanProfile, validateOrphanInput } from '@/lib/orphans';

import type { OrphanProfileInput, OrphanProfileUpdate } from '@/types/orphans';

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;

  try {
    const currentTeamMember = await requireTeamMember();

    if (!canViewOrphans(currentTeamMember)) {
      throw new ForbiddenError('You do not have permission to view orphan profiles.');
    }

    const orphan = await getOrphanProfileById(id);

    if (!orphan) {
      return NextResponse.json({ error: 'Orphan profile not found.' }, { status: 404 });
    }

    return NextResponse.json({ data: orphan });
  } catch (error) {
    return handleOrphanApiError(error, 'Could not load orphan profile.');
  }
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const body = (await request.json().catch(() => null)) as OrphanProfileUpdate | null;

  if (!body) {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  try {
    const currentTeamMember = await requireTeamMember();

    if (!canUpdateOrphans(currentTeamMember)) {
      throw new ForbiddenError('You do not have permission to update orphan profiles.');
    }

    const existing = await getOrphanProfileById(id);

    if (!existing) {
      return NextResponse.json({ error: 'Orphan profile not found.' }, { status: 404 });
    }

    if (existing.profileStatus === 'approved' && currentTeamMember.role === 'orphan_coordinator') {
      throw new ForbiddenError('Approved profiles can only be edited by admins.');
    }

    const merged: OrphanProfileInput = {
      ageEstimate: body.ageEstimate ?? existing.ageEstimate,
      backgroundSummary: body.backgroundSummary ?? existing.backgroundSummary ?? '',
      cityArea: body.cityArea ?? existing.cityArea ?? '',
      codeMode: 'manual',
      dateOfBirth: body.dateOfBirth ?? existing.dateOfBirth ?? '',
      educationStatus: body.educationStatus ?? existing.educationStatus ?? '',
      fullName: body.fullName ?? existing.fullName,
      gender: body.gender ?? existing.gender,
      guardian: {
        address: body.guardian?.address ?? existing.guardian?.address ?? '',
        guardianName: body.guardian?.guardianName ?? existing.guardian?.guardianName ?? '',
        notes: body.guardian?.notes ?? existing.guardian?.notes ?? '',
        phone: body.guardian?.phone ?? existing.guardian?.phone ?? '',
        relationship: body.guardian?.relationship ?? existing.guardian?.relationship ?? '',
        whatsapp: body.guardian?.whatsapp ?? existing.guardian?.whatsapp ?? '',
      },
      healthNotes: body.healthNotes ?? existing.healthNotes ?? '',
      orphanCode: body.orphanCode ?? existing.orphanCode,
      profileImageUrl: body.profileImageUrl ?? existing.profileImageUrl,
      verificationStatus: body.verificationStatus ?? existing.verificationStatus,
    };
    const errors = validateOrphanInput(merged);

    if (Object.keys(errors).length > 0) {
      return NextResponse.json({ errors }, { status: 400 });
    }

    const updated = await updateOrphanProfile(id, body, {
      changedByTeamMemberId: currentTeamMember.id,
    });
    return NextResponse.json({ data: updated });
  } catch (error) {
    return handleOrphanApiError(error, 'Could not update orphan profile.');
  }
}

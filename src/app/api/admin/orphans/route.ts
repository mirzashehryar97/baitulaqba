import { NextResponse } from 'next/server';

import { ForbiddenError, requireTeamMember } from '@/lib/adminAuth';
import { canCreateOrphans, canViewOrphans } from '@/lib/adminPermissions';
import { handleOrphanApiError } from '@/lib/orphanApiErrors';
import { createOrphanProfile, listOrphanProfiles, validateOrphanInput } from '@/lib/orphans';
import { getPaginationOptions } from '@/lib/pagination';

import type {
  OrphanGender,
  OrphanProfileInput,
  OrphanProfileStatus,
  OrphanVerificationStatus,
} from '@/types/orphans';

export async function GET(request: Request) {
  try {
    const currentTeamMember = await requireTeamMember();

    if (!canViewOrphans(currentTeamMember)) {
      throw new ForbiddenError('You do not have permission to view orphan profiles.');
    }

    const url = new URL(request.url);
    const orphans = await listOrphanProfiles(
      {
        cityArea: url.searchParams.get('cityArea') ?? undefined,
        gender: parseGender(url.searchParams.get('gender')),
        profileStatus: parseProfileStatus(url.searchParams.get('profileStatus')),
        search: url.searchParams.get('search') ?? undefined,
        verificationStatus: parseVerificationStatus(url.searchParams.get('verificationStatus')),
      },
      getPaginationOptions(url),
    );

    return NextResponse.json({ data: orphans });
  } catch (error) {
    return handleOrphanApiError(error, 'Could not load orphan profiles.');
  }
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as OrphanProfileInput | null;
  const errors = validateOrphanInput(body);

  if (!body || Object.keys(errors).length > 0) {
    return NextResponse.json({ errors }, { status: 400 });
  }

  try {
    const currentTeamMember = await requireTeamMember();

    if (!canCreateOrphans(currentTeamMember)) {
      throw new ForbiddenError('You do not have permission to create orphan profiles.');
    }

    const orphan = await createOrphanProfile(body, currentTeamMember.id);
    return NextResponse.json({ data: orphan }, { status: 201 });
  } catch (error) {
    return handleOrphanApiError(error, 'Could not create orphan profile.');
  }
}

function parseGender(value: string | null) {
  return value === 'male' || value === 'female' ? (value as OrphanGender) : undefined;
}

function parseProfileStatus(value: string | null) {
  return value && ['draft', 'under_review', 'approved', 'matched', 'archived'].includes(value)
    ? (value as OrphanProfileStatus)
    : undefined;
}

function parseVerificationStatus(value: string | null) {
  return value &&
    [
      'unverified',
      'documents_received',
      'field_verified',
      'needs_more_information',
      'rejected',
    ].includes(value)
    ? (value as OrphanVerificationStatus)
    : undefined;
}

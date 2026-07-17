import { NextResponse } from 'next/server';

import { ForbiddenError, requireTeamMember, UnauthorizedError } from '@/lib/adminAuth';
import {
  canCreateDonorContactLogs,
  canViewAssignedOnly,
  canViewDonorContactLogs,
  canViewDonors,
} from '@/lib/adminPermissions';
import {
  createDonorContactLog,
  getDonorById,
  listDonorContactLogs,
  validateDonorContactLogInput,
} from '@/lib/donors';
import { MissingSupabaseAuthConfigError, MissingSupabaseConfigError } from '@/lib/supabase/server';

import type { ContactLogInput } from '@/types/sponsorship';

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;

  try {
    const currentTeamMember = await requireTeamMember();

    if (!canViewDonors(currentTeamMember) || !canViewDonorContactLogs(currentTeamMember)) {
      throw new ForbiddenError('You do not have permission to view donor contact logs.');
    }

    const scopedToTeamMemberId = canViewAssignedOnly(currentTeamMember.role, 'sponsors')
      ? currentTeamMember.id
      : undefined;
    const donor = await getDonorById(id, { scopedToTeamMemberId });

    if (!donor) {
      return NextResponse.json({ error: 'Donor not found.' }, { status: 404 });
    }

    const logs = await listDonorContactLogs(id);
    return NextResponse.json({ data: logs });
  } catch (error) {
    return handleDonorContactLogApiError(error, 'Could not load donor contact logs.');
  }
}

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const body = (await request.json().catch(() => null)) as ContactLogInput | null;
  const errors = validateDonorContactLogInput(body);

  if (!body || Object.keys(errors).length > 0) {
    return NextResponse.json({ errors }, { status: 400 });
  }

  try {
    const currentTeamMember = await requireTeamMember();

    if (!canCreateDonorContactLogs(currentTeamMember)) {
      throw new ForbiddenError('You do not have permission to create donor contact logs.');
    }

    const scopedToTeamMemberId = canViewAssignedOnly(currentTeamMember.role, 'sponsors')
      ? currentTeamMember.id
      : undefined;
    const donor = await getDonorById(id, { scopedToTeamMemberId });

    if (!donor) {
      return NextResponse.json({ error: 'Donor not found.' }, { status: 404 });
    }

    const log = await createDonorContactLog(id, body, currentTeamMember.id);
    return NextResponse.json({ data: log }, { status: 201 });
  } catch (error) {
    return handleDonorContactLogApiError(error, 'Could not create donor contact log.');
  }
}

function handleDonorContactLogApiError(error: unknown, fallbackMessage: string) {
  if (error instanceof UnauthorizedError) {
    return NextResponse.json({ error: error.message }, { status: 401 });
  }

  if (error instanceof ForbiddenError) {
    return NextResponse.json({ error: error.message }, { status: 403 });
  }

  if (error instanceof MissingSupabaseConfigError) {
    return NextResponse.json({ error: error.message }, { status: 503 });
  }

  if (error instanceof MissingSupabaseAuthConfigError) {
    return NextResponse.json({ error: error.message }, { status: 503 });
  }

  return NextResponse.json({ error: fallbackMessage }, { status: 500 });
}

import { NextResponse } from 'next/server';

import { ForbiddenError, requireTeamMember, UnauthorizedError } from '@/lib/adminAuth';
import {
  canCreateContactLogs,
  canViewContactLogs,
  isAssignedOnlySponsorshipRole,
} from '@/lib/adminPermissions';
import {
  createContactLog,
  getSponsorshipRequestById,
  listContactLogsForRequest,
  validateContactLogInput,
} from '@/lib/sponsorshipRequests';
import { MissingSupabaseAuthConfigError, MissingSupabaseConfigError } from '@/lib/supabase/server';

import type { ContactLogInput } from '@/types/sponsorship';

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;

  try {
    const currentTeamMember = await requireTeamMember();

    if (!canViewContactLogs(currentTeamMember)) {
      throw new ForbiddenError('You do not have permission to view contact logs.');
    }

    await assertRequestAccess(id, currentTeamMember);

    const logs = await listContactLogsForRequest(id);
    return NextResponse.json({ data: logs });
  } catch (error) {
    return handleApiError(error, 'Could not load contact logs.');
  }
}

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const body = (await request.json().catch(() => null)) as ContactLogInput | null;
  const errors = validateContactLogInput(body);

  if (!body || Object.keys(errors).length > 0) {
    return NextResponse.json({ error: 'Validation failed.', errors }, { status: 400 });
  }

  try {
    const currentTeamMember = await requireTeamMember();

    if (!canCreateContactLogs(currentTeamMember)) {
      throw new ForbiddenError('You do not have permission to create contact logs.');
    }

    await assertRequestAccess(id, currentTeamMember);

    const contactLog = await createContactLog(id, body, currentTeamMember.id);
    return NextResponse.json({ data: contactLog }, { status: 201 });
  } catch (error) {
    return handleApiError(error, 'Could not create contact log.');
  }
}

async function assertRequestAccess(
  id: string,
  teamMember: Awaited<ReturnType<typeof requireTeamMember>>,
) {
  const currentRequest = await getSponsorshipRequestById(id);

  if (!currentRequest) {
    throw new ForbiddenError('Sponsorship request not found.');
  }

  if (
    isAssignedOnlySponsorshipRole(teamMember.role) &&
    currentRequest.assignedTeamMemberId !== teamMember.id
  ) {
    throw new ForbiddenError('You do not have permission to access this sponsorship request.');
  }
}

function handleApiError(error: unknown, fallbackMessage: string) {
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

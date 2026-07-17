import { NextResponse } from 'next/server';

import { ForbiddenError, requireTeamMember, UnauthorizedError } from '@/lib/adminAuth';
import {
  canAssignSponsorshipRequests,
  canUpdateSponsorshipRequests,
  canViewSponsorshipRequests,
  isAssignedOnlySponsorshipRole,
} from '@/lib/adminPermissions';
import {
  getSponsorshipRequestById,
  isAllowedSponsorshipRequestStatusTransition,
  isPostConversionSponsorshipRequestStatus,
  SPONSORSHIP_REQUEST_STATUSES,
  updateSponsorshipRequest,
} from '@/lib/sponsorshipRequests';
import { MissingSupabaseAuthConfigError, MissingSupabaseConfigError } from '@/lib/supabase/server';

import type { SponsorshipRequestUpdate } from '@/types/sponsorship';

const REQUIRED_SPONSORSHIP_REQUEST_SCHEMA_COLUMNS = [
  'contacted_at',
  'profiles_prepared_at',
  'profiles_shared_at',
  'closed_at',
  'converted_donor_id',
  'converted_by_team_member_id',
  'converted_at',
  'created_by_team_member_id',
  'request_source',
  'last_contacted_at',
  'next_follow_up_at',
  'assigned_team_member_id',
];

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;

  try {
    const currentTeamMember = await requireTeamMember();

    if (!canViewSponsorshipRequests(currentTeamMember)) {
      throw new ForbiddenError('You do not have permission to view sponsorship requests.');
    }

    const sponsorshipRequest = await getSponsorshipRequestById(id);

    if (!sponsorshipRequest) {
      return NextResponse.json({ error: 'Sponsorship request not found.' }, { status: 404 });
    }

    if (
      isAssignedOnlySponsorshipRole(currentTeamMember.role) &&
      sponsorshipRequest.assignedTeamMemberId !== currentTeamMember.id
    ) {
      throw new ForbiddenError('You do not have permission to access this sponsorship request.');
    }

    return NextResponse.json({ data: sponsorshipRequest });
  } catch (error) {
    return handleSponsorshipRequestApiError(error, 'Could not load sponsorship request.');
  }
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const body = (await request.json().catch(() => null)) as SponsorshipRequestUpdate | null;

  if (!body) {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  if (body.status && !SPONSORSHIP_REQUEST_STATUSES.includes(body.status)) {
    return NextResponse.json({ error: 'Invalid request status.' }, { status: 400 });
  }

  try {
    const currentTeamMember = await requireTeamMember();
    const currentRequest = await getSponsorshipRequestById(id);

    if (!currentRequest) {
      return NextResponse.json({ error: 'Sponsorship request not found.' }, { status: 404 });
    }

    if (
      isAssignedOnlySponsorshipRole(currentTeamMember.role) &&
      currentRequest.assignedTeamMemberId !== currentTeamMember.id
    ) {
      throw new ForbiddenError('You do not have permission to update this sponsorship request.');
    }

    const assignmentChanging = body.assignedTeamMemberId !== undefined;
    const statusChanging = body.status !== undefined;
    const notesChanging = body.adminNotes !== undefined || body.nextFollowUpAt !== undefined;

    if (body.status === 'converted_to_donor' && !currentRequest.convertedDonorId) {
      return NextResponse.json(
        { error: 'Use Convert to Donor before marking a request as converted.' },
        { status: 400 },
      );
    }

    if (
      body.status &&
      currentRequest.convertedDonorId &&
      !isPostConversionSponsorshipRequestStatus(body.status)
    ) {
      return NextResponse.json(
        { error: 'Converted requests can only be marked as Converted or Closed.' },
        { status: 400 },
      );
    }

    if (
      body.status &&
      !isAllowedSponsorshipRequestStatusTransition({
        convertedDonorId: currentRequest.convertedDonorId,
        currentStatus: currentRequest.status,
        nextStatus: body.status,
      })
    ) {
      return NextResponse.json(
        { error: 'Status must move one workflow step at a time.' },
        { status: 400 },
      );
    }

    if (assignmentChanging && !canAssignSponsorshipRequests(currentTeamMember)) {
      throw new ForbiddenError('You do not have permission to assign sponsorship requests.');
    }

    if ((statusChanging || notesChanging) && !canUpdateSponsorshipRequests(currentTeamMember)) {
      throw new ForbiddenError('You do not have permission to update sponsorship requests.');
    }

    const updatedRequest = await updateSponsorshipRequest(id, body, currentRequest);
    return NextResponse.json({ data: updatedRequest });
  } catch (error) {
    return handleSponsorshipRequestApiError(error, 'Could not update sponsorship request.');
  }
}

function handleSponsorshipRequestApiError(error: unknown, fallbackMessage: string) {
  const schemaErrorMessage = getSponsorshipRequestSchemaErrorMessage(error);

  if (schemaErrorMessage) {
    return NextResponse.json({ error: schemaErrorMessage }, { status: 503 });
  }

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

  if (process.env.NODE_ENV !== 'production' && error instanceof Error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ error: fallbackMessage }, { status: 500 });
}

function getSponsorshipRequestSchemaErrorMessage(error: unknown) {
  if (!(error instanceof Error)) {
    return null;
  }

  const lowerMessage = error.message.toLowerCase();
  const missingColumn = REQUIRED_SPONSORSHIP_REQUEST_SCHEMA_COLUMNS.find((column) =>
    lowerMessage.includes(column),
  );

  if (!missingColumn) {
    return null;
  }

  return `Database schema is missing or has not refreshed the ${missingColumn} sponsorship request field. Run the latest supabase/schema.sql in Supabase SQL Editor, then try again.`;
}

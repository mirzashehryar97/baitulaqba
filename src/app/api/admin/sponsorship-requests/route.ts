import { NextResponse } from 'next/server';

import { ForbiddenError, requireTeamMember, UnauthorizedError } from '@/lib/adminAuth';
import {
  canAssignSponsorshipRequests,
  canCreateSponsorshipRequests,
  canViewSponsorshipRequests,
  isAssignedOnlySponsorshipRole,
} from '@/lib/adminPermissions';
import { getPaginationOptions } from '@/lib/pagination';
import {
  createSponsorshipRequest,
  listSponsorshipRequests,
  PREFERRED_CONTACT_METHODS,
  SPONSORSHIP_REQUEST_STATUSES,
  validateSponsorshipRequestCreateInput,
} from '@/lib/sponsorshipRequests';
import { MissingSupabaseAuthConfigError, MissingSupabaseConfigError } from '@/lib/supabase/server';

import type {
  PreferredContactMethod,
  SponsorshipRequestCreateInput,
  SponsorshipRequestStatus,
} from '@/types/sponsorship';

export async function GET(request: Request) {
  try {
    const currentTeamMember = await requireTeamMember();

    if (!canViewSponsorshipRequests(currentTeamMember)) {
      throw new ForbiddenError('You do not have permission to view sponsorship requests.');
    }

    const url = new URL(request.url);
    const status = url.searchParams.get('status');
    const method = url.searchParams.get('method');
    const assignedTo = url.searchParams.get('assignedTo');
    const converted = url.searchParams.get('converted');
    const followUp = url.searchParams.get('followUp');
    const city = url.searchParams.get('city')?.trim() || undefined;
    const search = url.searchParams.get('search')?.trim() || undefined;

    const assignedTeamMemberId = isAssignedOnlySponsorshipRole(currentTeamMember.role)
      ? currentTeamMember.id
      : assignedTo === 'me'
        ? currentTeamMember.id
        : assignedTo === 'unassigned'
          ? 'unassigned'
          : assignedTo || undefined;

    const requests = await listSponsorshipRequests(
      {
        assignedTeamMemberId,
        city,
        converted: converted === 'yes' ? true : converted === 'no' ? false : undefined,
        followUpDue: followUp === 'due',
        method:
          method && PREFERRED_CONTACT_METHODS.includes(method as PreferredContactMethod)
            ? (method as PreferredContactMethod)
            : undefined,
        search,
        status:
          status && SPONSORSHIP_REQUEST_STATUSES.includes(status as SponsorshipRequestStatus)
            ? (status as SponsorshipRequestStatus)
            : undefined,
      },
      getPaginationOptions(url),
    );

    return NextResponse.json({ data: requests });
  } catch (error) {
    return handleSponsorshipRequestApiError(error, 'Could not load sponsorship requests.');
  }
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as SponsorshipRequestCreateInput | null;
  const errors = validateSponsorshipRequestCreateInput(body);

  if (!body || Object.keys(errors).length > 0) {
    return NextResponse.json({ error: 'Validation failed.', errors }, { status: 400 });
  }

  try {
    const currentTeamMember = await requireTeamMember();

    if (!canCreateSponsorshipRequests(currentTeamMember)) {
      throw new ForbiddenError('You do not have permission to create sponsorship requests.');
    }

    let assignedTeamMemberId = body.assignedTeamMemberId ?? null;

    if (isAssignedOnlySponsorshipRole(currentTeamMember.role)) {
      assignedTeamMemberId = currentTeamMember.id;
    } else if (assignedTeamMemberId && !canAssignSponsorshipRequests(currentTeamMember)) {
      throw new ForbiddenError('You do not have permission to assign sponsorship requests.');
    }

    const requestRecord = await createSponsorshipRequest(
      {
        ...body,
        assignedTeamMemberId,
        requestSource: body.requestSource ?? 'admin_created',
        status: body.status ?? 'new',
      },
      currentTeamMember.id,
    );

    return NextResponse.json({ data: requestRecord }, { status: 201 });
  } catch (error) {
    return handleSponsorshipRequestApiError(error, 'Could not create sponsorship request.');
  }
}

function handleSponsorshipRequestApiError(error: unknown, fallbackMessage: string) {
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

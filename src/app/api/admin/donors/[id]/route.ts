import { NextResponse } from 'next/server';

import { ForbiddenError, requireTeamMember, UnauthorizedError } from '@/lib/adminAuth';
import {
  canActivateDonors,
  canDeactivateDonors,
  canUpdateDonors,
  canViewAssignedOnly,
  canViewDonors,
  canViewMatchFinancialAmount,
} from '@/lib/adminPermissions';
import {
  getDonorById,
  listConvertedRequestsForDonor,
  listDonorContactLogs,
  updateDonor,
  validateDonorInput,
} from '@/lib/donors';
import { getDonorPaymentOverview } from '@/lib/finance';
import { listMatchesForDonor } from '@/lib/sponsorshipMatches';
import { MissingSupabaseAuthConfigError, MissingSupabaseConfigError } from '@/lib/supabase/server';

import type { DonorUpdate } from '@/types/accounts';

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;

  try {
    const currentTeamMember = await requireTeamMember();

    if (!canViewDonors(currentTeamMember)) {
      throw new ForbiddenError('You do not have permission to view donors.');
    }

    const scopedToTeamMemberId = canViewAssignedOnly(currentTeamMember.role, 'sponsors')
      ? currentTeamMember.id
      : undefined;
    const donor = await getDonorById(id, { scopedToTeamMemberId });

    if (!donor) {
      return NextResponse.json({ error: 'Donor not found.' }, { status: 404 });
    }

    const [convertedRequests, contactLogs, matches] = await Promise.all([
      listConvertedRequestsForDonor(id, { scopedToTeamMemberId }),
      listDonorContactLogs(id),
      listMatchesForDonor(id),
    ]);
    const paymentOverview = canViewMatchFinancialAmount(currentTeamMember)
      ? await getDonorPaymentOverview(id, matches)
      : null;

    return NextResponse.json({
      data: { contactLogs, convertedRequests, donor, matches, paymentOverview },
    });
  } catch (error) {
    return handleDonorApiError(error, 'Could not load donor.');
  }
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const body = (await request.json().catch(() => null)) as DonorUpdate | null;

  if (!body) {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  try {
    const currentTeamMember = await requireTeamMember();

    if (!canUpdateDonors(currentTeamMember)) {
      throw new ForbiddenError('You do not have permission to update donors.');
    }

    const donor = await getDonorById(id);

    if (!donor) {
      return NextResponse.json({ error: 'Donor not found.' }, { status: 404 });
    }

    if (donor.authUserId && body.email !== undefined && body.email !== donor.email) {
      return NextResponse.json(
        { error: 'This donor email is linked to Google login and cannot be changed.' },
        { status: 400 },
      );
    }

    if (body.active !== undefined && body.active !== donor.active) {
      if (body.active && !canActivateDonors(currentTeamMember)) {
        throw new ForbiddenError('You do not have permission to activate donors.');
      }

      if (!body.active && !canDeactivateDonors(currentTeamMember)) {
        throw new ForbiddenError('You do not have permission to deactivate donors.');
      }
    }

    const merged = {
      active: body.active ?? donor.active,
      address: body.address ?? donor.address ?? '',
      cityCountry: body.cityCountry ?? donor.cityCountry ?? '',
      donorSource: body.donorSource ?? donor.donorSource,
      email: body.email ?? donor.email ?? '',
      fullName: body.fullName ?? donor.fullName,
      notes: body.notes ?? donor.notes ?? '',
      phone: body.phone ?? donor.phone ?? '',
      preferredContactMethod: body.preferredContactMethod ?? donor.preferredContactMethod,
    };
    const errors = validateDonorInput(merged);

    if (Object.keys(errors).length > 0) {
      return NextResponse.json({ errors }, { status: 400 });
    }

    const updatedDonor = await updateDonor(id, body);
    return NextResponse.json({ data: updatedDonor });
  } catch (error) {
    return handleDonorApiError(error, 'Could not update donor.');
  }
}

function handleDonorApiError(error: unknown, fallbackMessage: string) {
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

  if (error instanceof Error) {
    const message = error.message.toLowerCase();

    if (message.includes('duplicate') || message.includes('donors_email_key')) {
      return NextResponse.json(
        { error: 'A donor with this email already exists.' },
        { status: 409 },
      );
    }

    if (message.includes('preferred_contact_method') || message.includes('donor_source')) {
      return NextResponse.json(
        {
          error:
            'Database schema is missing the latest donor management fields. Run the latest supabase/schema.sql in Supabase SQL Editor, then try again.',
        },
        { status: 503 },
      );
    }
  }

  return NextResponse.json({ error: fallbackMessage }, { status: 500 });
}

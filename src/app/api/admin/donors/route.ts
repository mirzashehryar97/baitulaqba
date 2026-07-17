import { NextResponse } from 'next/server';

import { ForbiddenError, requireTeamMember, UnauthorizedError } from '@/lib/adminAuth';
import { canCreateDonors, canViewAssignedOnly, canViewDonors } from '@/lib/adminPermissions';
import { createDonor, listDonors, validateDonorInput } from '@/lib/donors';
import { getPaginationOptions } from '@/lib/pagination';
import { MissingSupabaseAuthConfigError, MissingSupabaseConfigError } from '@/lib/supabase/server';

import type { DonorInput, DonorPreferredContactMethod, DonorSource } from '@/types/accounts';

export async function GET(request: Request) {
  try {
    const currentTeamMember = await requireTeamMember();

    if (!canViewDonors(currentTeamMember)) {
      throw new ForbiddenError('You do not have permission to view donors.');
    }

    const url = new URL(request.url);
    const donors = await listDonors(
      {
        loginStatus: parseLoginStatus(url.searchParams.get('loginStatus')),
        preferredContactMethod: parsePreferredContactMethod(
          url.searchParams.get('preferredContactMethod'),
        ),
        scopedToTeamMemberId: canViewAssignedOnly(currentTeamMember.role, 'sponsors')
          ? currentTeamMember.id
          : undefined,
        search: url.searchParams.get('search') ?? undefined,
        source: parseDonorSource(url.searchParams.get('source')),
        status: parseStatus(url.searchParams.get('status')),
      },
      getPaginationOptions(url),
    );

    return NextResponse.json({ data: donors });
  } catch (error) {
    return handleDonorApiError(error, 'Could not load donors.');
  }
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as DonorInput | null;
  const errors = validateDonorInput(body);

  if (!body || Object.keys(errors).length > 0) {
    return NextResponse.json({ errors }, { status: 400 });
  }

  try {
    const currentTeamMember = await requireTeamMember();

    if (!canCreateDonors(currentTeamMember)) {
      throw new ForbiddenError('You do not have permission to create donors.');
    }

    const donor = await createDonor(body, currentTeamMember.id);
    return NextResponse.json({ data: donor }, { status: 201 });
  } catch (error) {
    return handleDonorApiError(error, 'Could not create donor.');
  }
}

function parseStatus(value: string | null) {
  return value === 'active' || value === 'inactive' ? value : undefined;
}

function parseLoginStatus(value: string | null) {
  return value === 'linked' || value === 'pending' ? value : undefined;
}

function parsePreferredContactMethod(value: string | null) {
  return value === 'whatsapp' || value === 'phone' || value === 'email'
    ? (value as DonorPreferredContactMethod)
    : undefined;
}

function parseDonorSource(value: string | null) {
  return value &&
    [
      'converted_request',
      'admin_created',
      'whatsapp',
      'phone',
      'email',
      'referral',
      'other',
    ].includes(value)
    ? (value as DonorSource)
    : undefined;
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

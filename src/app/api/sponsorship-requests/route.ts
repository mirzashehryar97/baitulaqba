import { NextResponse } from 'next/server';

import {
  createSponsorshipRequest,
  validateSponsorshipRequestInput,
} from '@/lib/sponsorshipRequests';
import { MissingSupabaseConfigError } from '@/lib/supabase/server';

import type { SponsorshipRequestInput } from '@/types/sponsorship';

export async function POST(request: Request) {
  let payload: SponsorshipRequestInput;

  try {
    payload = (await request.json()) as SponsorshipRequestInput;
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  const errors = validateSponsorshipRequestInput(payload);

  if (Object.keys(errors).length > 0) {
    return NextResponse.json({ error: 'Validation failed.', errors }, { status: 400 });
  }

  try {
    const sponsorshipRequest = await createSponsorshipRequest(payload);
    return NextResponse.json({ data: sponsorshipRequest }, { status: 201 });
  } catch (error) {
    if (error instanceof MissingSupabaseConfigError) {
      return NextResponse.json({ error: error.message }, { status: 503 });
    }

    return NextResponse.json({ error: 'Could not save sponsorship request.' }, { status: 500 });
  }
}

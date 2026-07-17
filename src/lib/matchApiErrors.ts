import { NextResponse } from 'next/server';

import { ForbiddenError, UnauthorizedError } from '@/lib/adminAuth';
import { MissingSupabaseAuthConfigError, MissingSupabaseConfigError } from '@/lib/supabase/server';

export function handleMatchApiError(error: unknown, fallbackMessage: string) {
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

    if (
      message.includes('sponsorship_matches_one_active_orphan') ||
      message.includes('already has an active sponsor')
    ) {
      return NextResponse.json(
        { error: 'This orphan already has an active sponsor.' },
        { status: 409 },
      );
    }

    if (
      message.includes('inactive donors') ||
      message.includes('only approved') ||
      message.includes('field verified') ||
      message.includes('cannot be changed') ||
      message.includes('only active') ||
      message.includes('only paused') ||
      message.includes('only active or paused')
    ) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    const isMissingMatchSchema =
      message.includes('could not find the table') ||
      message.includes('does not exist') ||
      message.includes('schema cache') ||
      message.includes('relationship');

    if (isMissingMatchSchema && message.includes('sponsorship_matches')) {
      return NextResponse.json(
        {
          error:
            'Database schema is missing the sponsorship matches table. Run the latest supabase/schema.sql in Supabase SQL Editor, then try again.',
        },
        { status: 503 },
      );
    }
  }

  return NextResponse.json(
    {
      detail:
        process.env.NODE_ENV === 'development' && error instanceof Error
          ? error.message
          : undefined,
      error: fallbackMessage,
    },
    { status: 500 },
  );
}

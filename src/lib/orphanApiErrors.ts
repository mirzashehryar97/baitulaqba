import { NextResponse } from 'next/server';

import { ForbiddenError, UnauthorizedError } from '@/lib/adminAuth';
import { MissingSupabaseAuthConfigError, MissingSupabaseConfigError } from '@/lib/supabase/server';

export function handleOrphanApiError(error: unknown, fallbackMessage: string) {
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

    if (message.includes('duplicate') || message.includes('orphan_profiles_orphan_code')) {
      return NextResponse.json(
        { error: 'An orphan profile with this code already exists.' },
        { status: 409 },
      );
    }

    const isMissingOrphanSchema =
      message.includes('could not find the table') ||
      message.includes('does not exist') ||
      message.includes('schema cache') ||
      message.includes('relationship');

    if (
      isMissingOrphanSchema &&
      (message.includes('orphan_profiles') ||
        message.includes('orphan_guardians') ||
        message.includes('documents'))
    ) {
      return NextResponse.json(
        {
          error:
            'Database schema is missing the orphan profile tables. Run the latest supabase/schema.sql in Supabase SQL Editor, then try again.',
        },
        { status: 503 },
      );
    }

    if (message.startsWith('profile is incomplete')) {
      return NextResponse.json({ error: error.message }, { status: 400 });
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

import { NextResponse } from 'next/server';

import { ForbiddenError, UnauthorizedError } from '@/lib/adminAuth';
import { FinanceConflictError, FinanceValidationError } from '@/lib/finance';
import { MissingSupabaseAuthConfigError, MissingSupabaseConfigError } from '@/lib/supabase/server';

export function handleFinanceApiError(error: unknown, fallbackMessage: string) {
  if (error instanceof UnauthorizedError) {
    return NextResponse.json({ error: error.message }, { status: 401 });
  }

  if (error instanceof ForbiddenError) {
    return NextResponse.json({ error: error.message }, { status: 403 });
  }

  if (error instanceof FinanceValidationError) {
    return NextResponse.json({ error: error.message, errors: error.errors }, { status: 400 });
  }

  if (error instanceof FinanceConflictError) {
    return NextResponse.json({ error: error.message }, { status: 409 });
  }

  if (
    error instanceof MissingSupabaseConfigError ||
    error instanceof MissingSupabaseAuthConfigError
  ) {
    return NextResponse.json({ error: error.message }, { status: 503 });
  }

  if (error instanceof Error) {
    const message = error.message.toLowerCase();

    if (
      message.includes('donation_receipts') &&
      (message.includes('schema cache') ||
        message.includes('could not find') ||
        message.includes('does not exist'))
    ) {
      return NextResponse.json(
        {
          error:
            'Database schema is missing the finance receipt fields. Run the latest supabase/schema.sql in Supabase SQL Editor, then try again.',
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

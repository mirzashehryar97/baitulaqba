import { NextResponse } from 'next/server';

import { UnauthorizedError } from '@/lib/adminAuth';
import { PortalConflictError, PortalValidationError } from '@/lib/portal';
import { MissingSupabaseAuthConfigError, MissingSupabaseConfigError } from '@/lib/supabase/server';

export function handlePortalApiError(error: unknown, fallbackMessage: string) {
  if (error instanceof UnauthorizedError) {
    return NextResponse.json({ error: error.message }, { status: 401 });
  }

  if (error instanceof PortalValidationError) {
    return NextResponse.json({ error: error.message, errors: error.errors }, { status: 400 });
  }

  if (error instanceof PortalConflictError) {
    return NextResponse.json({ error: error.message }, { status: 409 });
  }

  if (
    error instanceof MissingSupabaseConfigError ||
    error instanceof MissingSupabaseAuthConfigError
  ) {
    return NextResponse.json({ error: error.message }, { status: 503 });
  }

  return NextResponse.json(
    { error: error instanceof Error ? error.message : fallbackMessage },
    { status: 500 },
  );
}

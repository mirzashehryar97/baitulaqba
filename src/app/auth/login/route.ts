import { NextResponse } from 'next/server';

import { getSafeNextPath } from '@/lib/authNextPath';
import { createSupabaseServerClient } from '@/lib/supabase/server';

// Initiates the Google OAuth flow server-side. Doing this here (rather than via
// a browser Supabase client) keeps `@supabase/*` out of the client bundle: the
// login pages ship no JS for this and just link to `/auth/login?next=...`.
// The server client writes the PKCE code-verifier cookie, which `/auth/callback`
// then reads via `exchangeCodeForSession` — mirroring the callback route's
// cookie + redirect pattern.
export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const next = getSafeNextPath(requestUrl.searchParams.get('next'));
  const loginPath = next.startsWith('/portal') ? '/portal/login' : '/admin/login';
  const redirectTo = `${requestUrl.origin}/auth/callback?next=${encodeURIComponent(next)}`;

  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo,
        skipBrowserRedirect: true,
      },
    });

    if (error || !data.url) {
      return NextResponse.redirect(new URL(`${loginPath}?error=auth_failed`, requestUrl.origin));
    }

    return NextResponse.redirect(data.url);
  } catch {
    return NextResponse.redirect(new URL(`${loginPath}?error=auth_failed`, requestUrl.origin));
  }
}

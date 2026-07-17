import { type NextRequest, NextResponse } from 'next/server';

import { createServerClient } from '@supabase/ssr';

export async function middleware(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  let response = NextResponse.next({ request });

  if (!supabaseUrl || !anonKey) {
    return response;
  }

  const supabase = createServerClient(supabaseUrl, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        for (const { name, value } of cookiesToSet) {
          request.cookies.set(name, value);
        }

        response = NextResponse.next({ request });

        for (const { name, options, value } of cookiesToSet) {
          response.cookies.set(name, value, options);
        }

        for (const [key, value] of Object.entries(headers)) {
          response.headers.set(key, value);
        }
      },
    },
  });

  await supabase.auth.getUser();

  return response;
}

export const config = {
  // Only refresh the Supabase session on the authenticated surfaces. Public
  // marketing pages, API routes, and auth routes don't need the middleware:
  // API/server handlers and the /auth/* routes manage their own session
  // cookies, and the marketing site has no session to refresh. Keeping this
  // matcher tight avoids burning an Edge Request (and a Supabase Auth call) on
  // every public page view.
  matcher: ['/admin', '/admin/:path*', '/portal', '/portal/:path*'],
};

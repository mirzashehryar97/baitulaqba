import { NextResponse } from 'next/server';

import { getSafeNextPath } from '@/lib/authNextPath';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const next = getSafeNextPath(requestUrl.searchParams.get('next'));
  const loginPath = next.startsWith('/portal') ? '/portal/login' : '/admin/login';

  if (!code) {
    return NextResponse.redirect(new URL(`${loginPath}?error=missing_code`, requestUrl.origin));
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(new URL(`${loginPath}?error=auth_failed`, requestUrl.origin));
  }

  return NextResponse.redirect(new URL(next, requestUrl.origin));
}

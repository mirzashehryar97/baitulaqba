import { cookies } from 'next/headers';

import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';

import { getSupabasePublicConfig, MissingSupabaseConfigError } from '@/lib/supabase/config';

export { MissingSupabaseAuthConfigError, MissingSupabaseConfigError } from '@/lib/supabase/config';

export function isMissingDatabaseFunctionError(
  error: { code?: string; message?: string } | null,
  functionName: string,
) {
  if (!error) return false;

  const message = error.message?.toLowerCase() ?? '';
  return (
    error.code === 'PGRST202' ||
    error.code === '42883' ||
    (message.includes(functionName.toLowerCase()) &&
      (message.includes('could not find') ||
        message.includes('does not exist') ||
        message.includes('schema cache')))
  );
}

export function createSupabaseAdminClient() {
  const supabaseUrl = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new MissingSupabaseConfigError();
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

export async function createSupabaseServerClient() {
  const { anonKey, supabaseUrl } = getSupabasePublicConfig();
  const cookieStore = await cookies();

  return createServerClient(supabaseUrl, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, options, value } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // Server components cannot always set cookies. Middleware and auth routes handle writes.
        }
      },
    },
  });
}

'use client';

import { createBrowserClient } from '@supabase/ssr';

import { getSupabasePublicConfig } from '@/lib/supabase/config';

export function createSupabaseBrowserClient() {
  const { anonKey, supabaseUrl } = getSupabasePublicConfig();

  return createBrowserClient(supabaseUrl, anonKey);
}

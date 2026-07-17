export class MissingSupabaseConfigError extends Error {
  constructor() {
    super(
      'Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.',
    );
    this.name = 'MissingSupabaseConfigError';
  }
}

export class MissingSupabaseAuthConfigError extends Error {
  constructor() {
    super(
      'Supabase Auth is not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.',
    );
    this.name = 'MissingSupabaseAuthConfigError';
  }
}

export function getSupabasePublicConfig() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !anonKey) {
    throw new MissingSupabaseAuthConfigError();
  }

  return { anonKey, supabaseUrl };
}

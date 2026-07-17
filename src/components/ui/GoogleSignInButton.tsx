'use client';

import { useState } from 'react';

import { LoaderCircle, LogIn } from 'lucide-react';

import { cn } from '@/lib/utils';

export function GoogleSignInButton({ href }: { href: string }) {
  const [loading, setLoading] = useState(false);

  return (
    <a
      aria-busy={loading}
      className={cn(
        'mt-7 flex h-13 w-full items-center justify-center gap-2 rounded-lg bg-emerald-deepest px-5 text-sm font-bold text-cream-soft transition hover:bg-emerald-deep',
        loading && 'pointer-events-none cursor-wait opacity-80',
      )}
      href={href}
      onClick={() => setLoading(true)}
    >
      {loading ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <LogIn className="h-4 w-4" />}
      {loading ? 'Signing in...' : 'Continue with Google'}
    </a>
  );
}

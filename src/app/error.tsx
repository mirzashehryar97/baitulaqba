'use client';

import { useEffect } from 'react';

import { Button } from '@/components/ui/Button';

// Route error boundary for the public site. Must be a Client Component per the
// App Router contract; `reset()` re-attempts rendering the failed segment.
export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Surface the error for local debugging and server logs.
    console.error(error);
  }, [error]);

  return (
    <main className="flex min-h-[100svh] flex-col items-center justify-center bg-emerald-deepest px-6 py-24 text-center text-cream">
      <p className="font-display text-6xl font-medium text-gold sm:text-7xl">Oops</p>
      <h1 className="mt-6 font-display text-3xl font-medium text-cream-soft sm:text-4xl">
        Something went wrong
      </h1>
      <p className="mt-4 max-w-md text-pretty text-base leading-relaxed text-cream/70">
        An unexpected error interrupted this page. Please try again — if it keeps happening, reach
        out and we will help.
      </p>
      <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
        <Button onClick={reset} size="lg">
          Try Again
        </Button>
        <Button href="/" size="lg" variant="outline">
          Back to Home
        </Button>
      </div>
    </main>
  );
}

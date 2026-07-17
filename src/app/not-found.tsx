import { Button } from '@/components/ui/Button';

// Rendered for any unmatched public route. Kept self-contained (no Header/Footer,
// which depend on the sponsor-form client context) so the 404 stays lightweight
// and renders as a server component. Next.js already returns a 404 status here,
// so the page is treated as noindex without extra metadata.
export default function NotFound() {
  return (
    <main className="flex min-h-[100svh] flex-col items-center justify-center bg-emerald-deepest px-6 py-24 text-center text-cream">
      <p className="font-display text-7xl font-medium text-gold sm:text-8xl">404</p>
      <h1 className="mt-6 font-display text-3xl font-medium text-cream-soft sm:text-4xl">
        This page could not be found
      </h1>
      <p className="mt-4 max-w-md text-pretty text-base leading-relaxed text-cream/70">
        The page you are looking for may have moved or no longer exists. Let us help you find your
        way back.
      </p>
      <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
        <Button href="/" size="lg">
          Back to Home
        </Button>
        <Button href="/#initiatives" size="lg" variant="outline">
          Explore Our Initiatives
        </Button>
      </div>
    </main>
  );
}

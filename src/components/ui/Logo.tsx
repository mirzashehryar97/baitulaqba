import { cn } from '@/lib/utils';

type LogoProps = {
  tone?: 'dark' | 'light';
  className?: string;
};

export function Logo({ tone = 'light', className }: LogoProps) {
  const isLight = tone === 'light';

  return (
    <a aria-label="Bait ul Aqba home" className={cn('flex items-center gap-3', className)} href="/">
      <span className="flex h-10 w-10 items-center justify-center rounded-lg border border-gold/50 bg-gold/10">
        <svg
          aria-hidden="true"
          className="h-6 w-6 text-gold"
          fill="none"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M12 2.5 3.5 8.2V21h5.5v-6.3h6V21h5.5V8.2L12 2.5Z"
            stroke="currentColor"
            strokeLinejoin="round"
            strokeWidth="1.5"
          />
          <path d="M12 2.5v4" stroke="currentColor" strokeLinecap="round" strokeWidth="1.5" />
        </svg>
      </span>
      <span className="flex flex-col leading-none">
        <span
          className={cn(
            'font-display text-lg font-semibold tracking-[0.14em]',
            isLight ? 'text-cream-soft' : 'text-emerald-deep',
          )}
        >
          BAIT UL AQBA
        </span>
        <span
          className={cn(
            'mt-1 text-[0.6rem] font-medium uppercase tracking-[0.3em]',
            isLight ? 'text-cream/60' : 'text-ink/55',
          )}
        >
          Orphans · Education · Hope
        </span>
      </span>
    </a>
  );
}

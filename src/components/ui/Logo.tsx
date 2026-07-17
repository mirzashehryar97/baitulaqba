import { BrandMark } from '@/components/ui/BrandMark';

import { cn } from '@/lib/utils';

type LogoProps = {
  tone?: 'dark' | 'light';
  className?: string;
};

export function Logo({ tone = 'light', className }: LogoProps) {
  const isLight = tone === 'light';

  return (
    <a aria-label="Bait ul Aqba home" className={cn('flex items-center gap-3', className)} href="/">
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-gold/35 bg-cream-soft p-1 shadow-sm">
        <BrandMark className="h-full w-full" priority />
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

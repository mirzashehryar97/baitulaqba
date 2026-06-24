'use client';

import { motion } from 'framer-motion';
import { Quote as QuoteIcon } from 'lucide-react';

import type { Quote } from '@/data/content';

import { fadeUp, viewportOnce } from '@/lib/motion';
import { cn } from '@/lib/utils';

type QuoteCardProps = {
  quote: Quote;
  variant?: 'cream' | 'dark' | 'glass' | 'outline';
  className?: string;
  showArabic?: boolean;
};

const VARIANT_STYLES: Record<NonNullable<QuoteCardProps['variant']>, string> = {
  cream: 'border-gold/25 bg-cream-soft text-emerald-deep shadow-soft',
  dark: 'border-white/10 bg-emerald-deepest/70 text-cream-soft',
  glass: 'border-white/15 bg-white/10 text-cream-soft backdrop-blur-md',
  outline: 'border-gold/35 bg-cream/40 text-emerald-deep',
};

export function QuoteCard({
  quote,
  variant = 'cream',
  className,
  showArabic = true,
}: QuoteCardProps) {
  const isDark = variant === 'dark' || variant === 'glass';

  return (
    <motion.figure
      className={cn(
        'relative overflow-hidden rounded-2xl border p-6 sm:p-7',
        VARIANT_STYLES[variant],
        className,
      )}
      initial="hidden"
      variants={fadeUp}
      viewport={viewportOnce}
      whileInView="visible"
    >
      <QuoteIcon
        aria-hidden="true"
        className={cn(
          'absolute right-5 top-5 h-8 w-8 opacity-15',
          isDark ? 'text-gold-soft' : 'text-gold',
        )}
      />
      {showArabic && quote.arabic ? (
        <p
          className={cn(
            'arabic mb-4 text-right text-xl leading-relaxed sm:text-2xl',
            isDark ? 'text-gold-soft' : 'text-gold-deep',
          )}
          lang="ar"
        >
          {quote.arabic}
        </p>
      ) : null}
      <blockquote
        className={cn(
          'font-display text-lg leading-snug sm:text-xl',
          isDark ? 'text-cream-soft' : 'text-emerald-deep',
        )}
      >
        “{quote.text}”
      </blockquote>
      <figcaption
        className={cn(
          'mt-4 flex items-center gap-2 text-xs font-medium uppercase tracking-[0.18em]',
          isDark ? 'text-gold-soft/90' : 'text-gold-deep',
        )}
      >
        <span className="h-px w-6 bg-current opacity-60" />
        {quote.source}
      </figcaption>
    </motion.figure>
  );
}

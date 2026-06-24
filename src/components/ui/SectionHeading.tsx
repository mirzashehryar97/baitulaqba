'use client';

import { motion } from 'framer-motion';

import { fadeUp, viewportOnce } from '@/lib/motion';
import { cn } from '@/lib/utils';

type SectionHeadingProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  align?: 'left' | 'center';
  tone?: 'dark' | 'light';
  className?: string;
};

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = 'left',
  tone = 'dark',
  className,
}: SectionHeadingProps) {
  const isLight = tone === 'light';

  return (
    <motion.div
      className={cn(
        'flex flex-col gap-3',
        align === 'center' && 'items-center text-center',
        className,
      )}
      initial="hidden"
      variants={fadeUp}
      viewport={viewportOnce}
      whileInView="visible"
    >
      {eyebrow ? (
        <span
          className={cn(
            'font-sans text-xs font-semibold uppercase tracking-[0.28em]',
            isLight ? 'text-gold-soft' : 'text-gold-deep',
          )}
        >
          {eyebrow}
        </span>
      ) : null}
      <h2
        className={cn(
          'font-display text-3xl leading-tight tracking-tight sm:text-4xl lg:text-[2.75rem]',
          isLight ? 'text-cream-soft' : 'text-emerald-deep',
        )}
      >
        {title}
      </h2>
      {description ? (
        <p
          className={cn(
            'max-w-2xl text-pretty text-sm leading-relaxed sm:text-base',
            isLight ? 'text-cream/75' : 'text-ink/65',
          )}
        >
          {description}
        </p>
      ) : null}
    </motion.div>
  );
}

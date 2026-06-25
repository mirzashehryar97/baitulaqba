'use client';

import { useEffect, useRef, useState } from 'react';

import { animate, motion, useInView } from 'framer-motion';

import { STATS, type Stat } from '@/data/content';

import { staggerContainer, viewportOnce } from '@/lib/motion';
import { cn } from '@/lib/utils';

function parseStat(value: string) {
  const numeric = Number.parseFloat(value.replace(/[^0-9.]/g, '')) || 0;
  const suffix = value.replace(/[0-9.,]/g, '');
  const hasComma = value.includes(',');
  return { numeric, suffix, hasComma };
}

function StatItem({ stat, play }: { stat: Stat; play: boolean }) {
  const { numeric, suffix, hasComma } = parseStat(stat.value);
  const [display, setDisplay] = useState('0');

  useEffect(() => {
    if (!play) {
      return;
    }
    const controls = animate(0, numeric, {
      duration: 1.6,
      ease: [0.22, 1, 0.36, 1],
      onUpdate(latest) {
        const rounded = Math.round(latest);
        setDisplay(hasComma ? rounded.toLocaleString('en-US') : String(rounded));
      },
    });
    return () => controls.stop();
  }, [play, numeric, hasComma]);

  return (
    <div className="flex flex-col items-center text-center">
      <span className="font-display text-3xl font-semibold text-gold-soft sm:text-4xl">
        {display}
        {suffix}
      </span>
      <span className="mt-1.5 text-xs font-medium uppercase tracking-[0.15em] text-cream/65">
        {stat.label}
      </span>
    </div>
  );
}

type StatsBarProps = {
  stats?: Stat[];
};

export function StatsBar({ stats = STATS }: StatsBarProps) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, viewportOnce);

  return (
    <section className="relative w-full bg-emerald-deep" id="stats">
      <div className="mx-auto w-full max-w-7xl px-5 py-12 sm:px-8 lg:px-12">
        <motion.div
          animate={inView ? 'visible' : 'hidden'}
          className={cn(
            'grid grid-cols-2 gap-x-6 gap-y-8 sm:grid-cols-3',
            stats.length === 4 ? 'lg:grid-cols-4' : 'lg:grid-cols-5',
          )}
          initial="hidden"
          ref={ref}
          variants={staggerContainer}
        >
          {stats.map((stat) => (
            <StatItem key={stat.label} play={inView} stat={stat} />
          ))}
        </motion.div>
      </div>
    </section>
  );
}

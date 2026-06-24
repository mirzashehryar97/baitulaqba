'use client';

import { useState } from 'react';

import Image from 'next/image';

import { AnimatePresence, motion } from 'framer-motion';

import { QuoteCard } from '@/components/ui/QuoteCard';

import { IMPACT_BENEFITS, IMPACT_DURATIONS, QUOTES } from '@/data/content';

import { fadeUp, staggerContainer, viewportOnce } from '@/lib/motion';
import { cn } from '@/lib/utils';

export function ImpactSection() {
  const [active, setActive] = useState<(typeof IMPACT_DURATIONS)[number]>('12 Months');

  return (
    <section className="relative w-full bg-emerald-deepest py-20 sm:py-24" id="impact">
      <div className="mx-auto w-full max-w-7xl px-5 sm:px-8 lg:px-12">
        <motion.div
          className="grid items-stretch gap-8 lg:grid-cols-12"
          initial="hidden"
          variants={staggerContainer}
          viewport={viewportOnce}
          whileInView="visible"
        >
          <motion.div className="lg:col-span-3" variants={fadeUp}>
            <span className="text-xs font-semibold uppercase tracking-[0.28em] text-gold-soft">
              Your Impact
            </span>
            <h2 className="mt-4 font-display text-3xl leading-tight text-cream-soft sm:text-4xl">
              See the difference your support makes
            </h2>
          </motion.div>

          <motion.div
            className="rounded-2xl border border-white/10 bg-emerald-deep/60 p-6 backdrop-blur-sm sm:p-7 lg:col-span-5"
            variants={fadeUp}
          >
            <div aria-label="Sponsorship duration" className="flex flex-wrap gap-2" role="tablist">
              {IMPACT_DURATIONS.map((duration) => (
                <button
                  aria-selected={active === duration}
                  className={cn(
                    'rounded-full px-4 py-2 text-xs font-semibold transition-all duration-300',
                    active === duration
                      ? 'bg-gold text-emerald-deepest'
                      : 'border border-white/15 text-cream/70 hover:border-gold/50 hover:text-gold-soft',
                  )}
                  key={duration}
                  onClick={() => setActive(duration)}
                  role="tab"
                  type="button"
                >
                  {duration}
                </button>
              ))}
            </div>

            <p className="mt-6 text-sm text-cream/75">
              With your support for{' '}
              <span className="font-semibold text-gold-soft">{active.toLowerCase()}</span>, a child
              receives:
            </p>

            <AnimatePresence mode="wait">
              <motion.ul
                animate={{ opacity: 1, y: 0 }}
                className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3"
                exit={{ opacity: 0, y: -8 }}
                initial={{ opacity: 0, y: 8 }}
                key={active}
                transition={{ duration: 0.3 }}
              >
                {IMPACT_BENEFITS.map((benefit) => (
                  <li
                    className="flex flex-col items-center gap-2 rounded-xl border border-white/10 bg-emerald-deepest/50 px-3 py-4 text-center"
                    key={benefit.title}
                  >
                    <benefit.icon className="h-5 w-5 text-gold-soft" />
                    <span className="text-[0.72rem] font-medium leading-tight text-cream/85">
                      {benefit.title}
                    </span>
                  </li>
                ))}
              </motion.ul>
            </AnimatePresence>
          </motion.div>

          <motion.div className="flex flex-col gap-4 lg:col-span-4" variants={fadeUp}>
            <figure className="relative h-40 overflow-hidden rounded-2xl border border-gold/20">
              <Image
                alt="A child smiling, hopeful for the future"
                className="object-cover object-top"
                fill
                sizes="(max-width: 1024px) 100vw, 33vw"
                src="/images/journey-future.jpg"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-emerald-deepest/80 to-transparent" />
            </figure>
            <QuoteCard
              className="flex-1"
              quote={QUOTES.impact}
              showArabic={false}
              variant="glass"
            />
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

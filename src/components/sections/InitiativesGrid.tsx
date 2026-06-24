'use client';

import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';

import { Button } from '@/components/ui/Button';

import { INITIATIVES } from '@/data/content';

import { fadeUp, staggerContainer, viewportOnce } from '@/lib/motion';
import { cn } from '@/lib/utils';

export function InitiativesGrid() {
  return (
    <section className="relative w-full bg-offwhite py-20 sm:py-24" id="initiatives">
      <div className="mx-auto w-full max-w-7xl px-5 sm:px-8 lg:px-12">
        <motion.div
          className="grid gap-8 lg:grid-cols-12 lg:gap-10"
          initial="hidden"
          variants={staggerContainer}
          viewport={viewportOnce}
          whileInView="visible"
        >
          <motion.div className="lg:col-span-3" variants={fadeUp}>
            <span className="text-xs font-semibold uppercase tracking-[0.28em] text-gold-deep">
              Our Initiatives
            </span>
            <h2 className="mt-4 font-display text-3xl leading-tight text-emerald-deep sm:text-4xl">
              Building a stronger Ummah
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-ink/65">
              Through compassion, education and relief — restoring dignity to families in Gaza.
            </p>
            <Button className="mt-6" href="#contact" size="md" variant="ghost">
              Explore All Initiatives
              <ArrowRight className="h-4 w-4" />
            </Button>
          </motion.div>

          <motion.div
            className="grid gap-4 sm:grid-cols-2 lg:col-span-9 lg:grid-cols-5"
            variants={staggerContainer}
          >
            {INITIATIVES.map((initiative) => (
              <motion.article
                className={cn(
                  'group flex flex-col rounded-2xl border p-6 transition-all duration-300 hover:-translate-y-1',
                  initiative.highlight
                    ? 'border-gold/30 bg-emerald-deep text-cream-soft shadow-card'
                    : 'border-emerald/10 bg-cream-soft text-emerald-deep shadow-soft hover:border-gold/40',
                )}
                key={initiative.title}
                variants={fadeUp}
              >
                <div
                  className={cn(
                    'flex h-11 w-11 items-center justify-center rounded-xl',
                    initiative.highlight
                      ? 'bg-gold/15 text-gold-soft'
                      : 'bg-emerald/5 text-emerald-soft',
                  )}
                >
                  <initiative.icon className="h-5 w-5" />
                </div>
                <h3 className="mt-4 font-display text-lg font-semibold leading-tight">
                  {initiative.title}
                </h3>
                <p
                  className={cn(
                    'mt-2 flex-1 text-xs leading-relaxed',
                    initiative.highlight ? 'text-cream/70' : 'text-ink/60',
                  )}
                >
                  {initiative.description}
                </p>
                <a
                  className={cn(
                    'mt-4 inline-flex items-center gap-1.5 text-xs font-semibold transition-colors',
                    initiative.highlight
                      ? 'text-gold-soft hover:text-gold'
                      : 'text-gold-deep hover:text-emerald-soft',
                  )}
                  href="#contact"
                >
                  Learn More
                  <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                </a>
              </motion.article>
            ))}
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

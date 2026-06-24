'use client';

import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';

import { QuoteCard } from '@/components/ui/QuoteCard';
import { SectionHeading } from '@/components/ui/SectionHeading';

import { PROCESS_STEPS, QUOTES } from '@/data/content';

import { fadeUp, staggerContainer, viewportOnce } from '@/lib/motion';

export function ProcessSteps() {
  return (
    <section className="relative w-full bg-offwhite py-20 sm:py-24" id="process">
      <div className="mx-auto w-full max-w-7xl px-5 sm:px-8 lg:px-12">
        <SectionHeading
          align="center"
          eyebrow="Simple & transparent"
          title="How Your Sponsorship Works"
        />

        <div className="mt-14 grid gap-10 lg:grid-cols-12 lg:gap-12">
          <motion.ol
            className="lg:col-span-8"
            initial="hidden"
            variants={staggerContainer}
            viewport={viewportOnce}
            whileInView="visible"
          >
            <div className="grid gap-x-4 gap-y-10 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
              {PROCESS_STEPS.map((step, index) => (
                <motion.li
                  className="relative flex flex-col items-center text-center"
                  key={step.title}
                  variants={fadeUp}
                >
                  {index < PROCESS_STEPS.length - 1 ? (
                    <ArrowRight
                      aria-hidden="true"
                      className="absolute -right-3 top-7 hidden h-5 w-5 text-gold/50 lg:block"
                    />
                  ) : null}
                  <div className="relative flex h-16 w-16 items-center justify-center rounded-full border border-gold/30 bg-emerald-deep text-cream-soft shadow-soft">
                    <step.icon className="h-7 w-7" />
                    <span className="absolute -bottom-2 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-gold text-xs font-bold text-emerald-deepest">
                      {index + 1}
                    </span>
                  </div>
                  <h3 className="mt-5 font-display text-base font-semibold text-emerald-deep">
                    {step.title}
                  </h3>
                  <p className="mt-2 text-xs leading-relaxed text-ink/60">{step.description}</p>
                </motion.li>
              ))}
            </div>
          </motion.ol>

          <div className="lg:col-span-4">
            <QuoteCard
              className="h-full"
              quote={QUOTES.process}
              showArabic={false}
              variant="cream"
            />
          </div>
        </div>
      </div>
    </section>
  );
}

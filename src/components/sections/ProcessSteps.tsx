'use client';

import { motion } from 'framer-motion';
import { ArrowRight, BookOpen, Quote } from 'lucide-react';

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

        <div className="mt-14 grid gap-10">
          <motion.ol
            initial="hidden"
            variants={staggerContainer}
            viewport={viewportOnce}
            whileInView="visible"
          >
            <div className="grid gap-x-8 gap-y-12 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5 xl:gap-x-10">
              {PROCESS_STEPS.map((step, index) => (
                <motion.li
                  className="relative flex flex-col items-center text-center"
                  key={step.title}
                  variants={fadeUp}
                >
                  {index < PROCESS_STEPS.length - 1 ? (
                    <ArrowRight
                      aria-hidden="true"
                      className="absolute -right-7 top-7 hidden h-5 w-5 text-gold/50 xl:block"
                    />
                  ) : null}
                  <div className="relative flex h-16 w-16 items-center justify-center rounded-full border border-gold/30 bg-emerald-deep text-cream-soft shadow-soft">
                    <step.icon className="h-8 w-8" />
                    <span className="absolute -bottom-2 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-gold text-sm font-bold text-emerald-deepest">
                      {index + 1}
                    </span>
                  </div>
                  <h3 className="mt-5 font-display text-xl font-semibold leading-snug text-emerald-deep">
                    {step.title}
                  </h3>
                  <p className="mt-3 text-base leading-relaxed text-ink/60">{step.description}</p>
                </motion.li>
              ))}
            </div>
          </motion.ol>

          <motion.figure
            className="relative mx-auto w-full max-w-4xl overflow-hidden rounded-2xl border border-gold/30 bg-cream-soft px-7 py-8 shadow-soft sm:px-10 sm:py-9"
            initial="hidden"
            variants={fadeUp}
            viewport={viewportOnce}
            whileInView="visible"
          >
            <svg
              aria-hidden="true"
              className="absolute -right-4 -top-8 h-32 w-32 text-gold opacity-10 sm:h-40 sm:w-40"
              fill="none"
              viewBox="0 0 120 120"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M60 4 72 20l20-4 4 20 20 4-4 20 16 12-16 12 4 20-20 4-4 20-20-4-12 16-12-16-20 4-4-20-20-4 4-20L-8 72 8 60 4 40l20-4 4-20 20 4L60 4Z"
                stroke="currentColor"
                strokeWidth="2"
              />
              <path
                d="m60 25 9 17 19-3-3 19 17 9-17 9 3 19-19-3-9 17-9-17-19 3 3-19-17-9 17-9-3-19 19 3 9-17Z"
                stroke="currentColor"
                strokeWidth="2"
              />
              <circle cx="60" cy="67" r="15" stroke="currentColor" strokeWidth="2" />
            </svg>

            <div className="relative grid items-end gap-6 sm:grid-cols-[auto_1fr_auto] sm:gap-8">
              <Quote
                aria-hidden="true"
                className="h-9 w-9 self-start text-gold-deep sm:h-11 sm:w-11"
                fill="currentColor"
              />
              <div>
                <blockquote className="max-w-3xl font-display text-xl font-semibold leading-snug text-emerald-deep sm:text-2xl">
                  {QUOTES.process.text}
                </blockquote>
                <figcaption className="mt-5 text-sm font-semibold uppercase tracking-[0.16em] text-gold-deep">
                  <span className="mr-2">—</span>
                  {QUOTES.process.source}
                </figcaption>
              </div>
              <BookOpen
                aria-hidden="true"
                className="h-11 w-11 justify-self-end stroke-[1.4] text-gold-deep sm:h-12 sm:w-12"
              />
            </div>
          </motion.figure>
        </div>
      </div>
    </section>
  );
}

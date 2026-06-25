'use client';

import { motion } from 'framer-motion';
import { BookOpen, Quote } from 'lucide-react';

import { Button } from '@/components/ui/Button';

import { QUOTES, TRANSPARENCY_STEPS } from '@/data/content';

import { fadeUp, staggerContainer, viewportOnce } from '@/lib/motion';

export function TransparencySection() {
  return (
    <section className="relative w-full bg-cream py-20 sm:py-24" id="about">
      <div className="mx-auto w-full max-w-7xl px-5 sm:px-8 lg:px-12">
        <motion.div
          className="grid items-start gap-12 lg:grid-cols-12 lg:gap-12"
          initial="hidden"
          variants={staggerContainer}
          viewport={viewportOnce}
          whileInView="visible"
        >
          <motion.div
            className="flex flex-col items-center text-center lg:col-span-3 lg:items-start lg:pt-8 lg:text-left"
            variants={fadeUp}
          >
            <h2 className="font-display text-3xl leading-tight text-emerald-deep sm:text-4xl">
              Transparency You Can Trust
            </h2>
            <p className="mt-4 max-w-2xl text-base leading-relaxed text-ink/65 lg:max-w-none">
              We follow a strict process to ensure every child and family is verified and that your
              donation reaches those who need it most.
            </p>
            <Button className="mt-6" href="#impact" size="md" variant="ghost">
              Our Verification Process
            </Button>
          </motion.div>

          <motion.div className="lg:col-span-9" variants={staggerContainer}>
            <motion.ol
              className="grid gap-x-12 gap-y-12 sm:grid-cols-2 xl:grid-cols-3"
              variants={staggerContainer}
            >
              {TRANSPARENCY_STEPS.map((step, index) => (
                <motion.li
                  className="flex min-h-52 flex-col items-center text-center lg:items-start lg:text-left"
                  key={step.title}
                  variants={fadeUp}
                >
                  <div className="flex h-14 w-14 items-center justify-center rounded-xl border border-gold/30 bg-cream-soft text-emerald-deep shadow-soft">
                    <step.icon className="h-6 w-6" />
                  </div>
                  <span className="mt-4 text-sm font-bold text-gold-deep">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <h3 className="mt-1 font-display text-xl font-semibold leading-tight text-emerald-deep">
                    {step.title}
                  </h3>
                  <p className="mt-3 max-w-sm text-base leading-relaxed text-ink/55">
                    {step.description}
                  </p>
                </motion.li>
              ))}
            </motion.ol>

            <motion.figure
              className="relative mt-4 overflow-hidden rounded-2xl border border-gold/30 bg-cream-soft px-7 py-8 shadow-soft sm:px-10 sm:py-9"
              variants={fadeUp}
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
                    {QUOTES.transparency.text}
                  </blockquote>
                  <figcaption className="mt-5 text-sm font-semibold text-gold-deep">
                    <span className="mr-2">—</span>
                    {QUOTES.transparency.source}
                  </figcaption>
                </div>
                <BookOpen
                  aria-hidden="true"
                  className="h-11 w-11 justify-self-end stroke-[1.4] text-gold-deep sm:h-12 sm:w-12"
                />
              </div>
            </motion.figure>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

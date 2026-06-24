'use client';

import Image from 'next/image';

import { motion } from 'framer-motion';
import { ShieldCheck } from 'lucide-react';

import { Button } from '@/components/ui/Button';

import { TRANSPARENCY_STEPS } from '@/data/content';

import { fadeUp, staggerContainer, viewportOnce } from '@/lib/motion';

export function TransparencySection() {
  return (
    <section className="relative w-full bg-cream py-20 sm:py-24" id="about">
      <div className="mx-auto w-full max-w-7xl px-5 sm:px-8 lg:px-12">
        <motion.div
          className="grid items-center gap-10 lg:grid-cols-12 lg:gap-8"
          initial="hidden"
          variants={staggerContainer}
          viewport={viewportOnce}
          whileInView="visible"
        >
          <motion.div className="lg:col-span-3" variants={fadeUp}>
            <h2 className="font-display text-3xl leading-tight text-emerald-deep sm:text-4xl">
              Transparency You Can Trust
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-ink/65">
              We follow a strict process to ensure every child and family is verified and that your
              donation reaches those who need it most.
            </p>
            <Button className="mt-6" href="#impact" size="md" variant="ghost">
              Our Verification Process
            </Button>
          </motion.div>

          <motion.ol
            className="grid gap-x-4 gap-y-8 sm:grid-cols-3 lg:col-span-6 lg:grid-cols-5"
            variants={staggerContainer}
          >
            {TRANSPARENCY_STEPS.map((step, index) => (
              <motion.li className="flex flex-col items-start" key={step.title} variants={fadeUp}>
                <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-gold/30 bg-cream-soft text-emerald-deep shadow-soft">
                  <step.icon className="h-5 w-5" />
                </div>
                <span className="mt-3 text-[0.7rem] font-bold text-gold-deep">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <h3 className="mt-1 font-display text-base font-semibold leading-tight text-emerald-deep">
                  {step.title}
                </h3>
                <p className="mt-1.5 text-[0.72rem] leading-relaxed text-ink/55">
                  {step.description}
                </p>
              </motion.li>
            ))}
          </motion.ol>

          <motion.div className="lg:col-span-3" variants={fadeUp}>
            <figure className="relative aspect-[4/5] overflow-hidden rounded-2xl border border-gold/20 shadow-card">
              <Image
                alt="A sponsored child studying and writing in a notebook"
                className="object-cover"
                fill
                sizes="(max-width: 1024px) 100vw, 25vw"
                src="/images/child-study.jpg"
              />
              <figcaption className="absolute bottom-3 left-3 right-3 flex items-center gap-2 rounded-xl border border-white/15 bg-emerald-deepest/70 px-3 py-2 text-xs font-medium text-cream-soft backdrop-blur-md">
                <ShieldCheck className="h-4 w-4 text-gold-soft" />
                Verified & monitored
              </figcaption>
            </figure>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

'use client';

import Image from 'next/image';

import { motion } from 'framer-motion';
import { ArrowRight, BookOpen, HeartHandshake, Home, Stethoscope } from 'lucide-react';

import { Button } from '@/components/ui/Button';

import { fadeUp, staggerContainer, viewportOnce } from '@/lib/motion';

const SUPPORT_PILLARS = [
  {
    icon: Home,
    title: 'Everyday Stability',
    description: 'Reliable support helps a child’s family plan for essential daily needs.',
  },
  {
    icon: BookOpen,
    title: 'Education Continuity',
    description: 'Children are better able to keep learning and hold onto future possibilities.',
  },
  {
    icon: Stethoscope,
    title: 'Essential Care',
    description: 'Support contributes toward food, clothing, healthcare, and other urgent needs.',
  },
  {
    icon: HeartHandshake,
    title: 'Dignity & Belonging',
    description: 'A child knows that someone has chosen to stand beside them consistently.',
  },
] as const;

export function ImpactSection() {
  return (
    <section
      className="relative w-full overflow-hidden bg-emerald-deepest py-20 sm:py-24"
      id="impact"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.05]"
        style={{
          backgroundImage:
            'radial-gradient(circle at 1px 1px, var(--color-gold) 1px, transparent 0)',
          backgroundSize: '32px 32px',
        }}
      />

      <motion.div
        className="relative mx-auto grid w-full max-w-7xl items-stretch gap-10 px-5 sm:px-8 lg:grid-cols-12 lg:px-12"
        initial="hidden"
        variants={staggerContainer}
        viewport={viewportOnce}
        whileInView="visible"
      >
        <motion.div className="flex flex-col justify-center lg:col-span-4" variants={fadeUp}>
          <span className="text-sm font-semibold uppercase tracking-[0.28em] text-gold-soft">
            The promise of sponsorship
          </span>
          <h2 className="mt-4 font-display text-4xl leading-tight text-cream-soft sm:text-5xl">
            What your support makes possible
          </h2>
          <p className="mt-5 max-w-md text-base leading-relaxed text-cream/70">
            Sponsorship is not a one-time intervention. It is a dependable commitment that helps a
            child face uncertainty with greater stability, care, and hope.
          </p>
          <Button className="mt-8 self-start" href="#adoption" size="lg">
            Sponsor a Child
            <ArrowRight className="h-4 w-4" />
          </Button>
        </motion.div>

        <motion.div className="grid gap-4 sm:grid-cols-2 lg:col-span-5" variants={staggerContainer}>
          {SUPPORT_PILLARS.map((pillar) => (
            <motion.article
              className="rounded-2xl border border-white/10 bg-emerald-deep/65 p-6 backdrop-blur-sm transition-colors hover:border-gold/35"
              key={pillar.title}
              variants={fadeUp}
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gold/10 text-gold-soft">
                <pillar.icon className="h-6 w-6 stroke-[1.6]" />
              </div>
              <h3 className="mt-5 font-display text-xl font-semibold text-cream-soft">
                {pillar.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-cream/65">{pillar.description}</p>
            </motion.article>
          ))}
        </motion.div>

        <motion.figure
          className="relative min-h-[420px] overflow-hidden rounded-2xl border border-gold/20 lg:col-span-3"
          variants={fadeUp}
        >
          <Image
            alt="A child looking ahead with hope"
            className="object-cover object-top"
            fill
            sizes="(max-width: 1024px) 100vw, 25vw"
            src="/images/journey-future.jpg"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-emerald-deepest via-emerald-deepest/15 to-transparent" />
          <figcaption className="absolute inset-x-0 bottom-0 p-6">
            <blockquote className="font-display text-2xl leading-snug text-cream-soft">
              “You are not simply meeting a need. You are helping protect a childhood.”
            </blockquote>
            <p className="mt-4 text-xs font-semibold uppercase tracking-[0.18em] text-gold-soft">
              Consistent care. Lasting hope.
            </p>
          </figcaption>
        </motion.figure>
      </motion.div>
    </section>
  );
}

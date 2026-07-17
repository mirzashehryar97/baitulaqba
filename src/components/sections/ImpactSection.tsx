'use client';

import Image from 'next/image';

import { motion } from 'framer-motion';
import { BookOpen, HeartHandshake, Home, MessageCircle } from 'lucide-react';

import { SponsorOrphanButton } from '@/components/ui/SponsorOrphanButton';

import { fadeUp, staggerContainer, viewportOnce } from '@/lib/motion';

const SUPPORT_PILLARS = [
  {
    icon: Home,
    title: 'Stability & Essential Aid',
    description:
      'Consistent support helps families meet priority needs with dignity and stability.',
  },
  {
    icon: BookOpen,
    title: 'Education & Emotional Support',
    description:
      'Sponsors provide educational and emotional support alongside practical assistance.',
  },
  {
    icon: MessageCircle,
    title: 'Direct Family Connection',
    description:
      'Sponsors can remain in contact with the child or guardian through video, audio, and messaging.',
  },
  {
    icon: HeartHandshake,
    title: 'Dignity, Stability & Hope',
    description:
      'Sustained care creates a meaningful bond and helps families face uncertainty with hope.',
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
            Virtual Child Adoption Program
          </span>
          <h2 className="mt-4 font-display text-4xl leading-tight text-cream-soft sm:text-5xl">
            What sustained sponsorship makes possible
          </h2>
          <p className="mt-5 max-w-md text-base leading-relaxed text-cream/70">
            Virtual adoption connects sponsoring families with orphaned and widowed families in
            Gaza, combining consistent support for essential needs with a meaningful bond of care
            and compassion.
          </p>
          <SponsorOrphanButton className="mt-8 self-start" size="lg" />
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
            alt="Children taking part in a wellbeing activity organised in Gaza"
            className="object-cover object-top"
            fill
            sizes="(max-width: 1024px) 100vw, 25vw"
            src="/images/official/bait-ul-aqba/child-joy-activity.png"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-emerald-deepest via-emerald-deepest/15 to-transparent" />
          <figcaption className="absolute inset-x-0 bottom-0 p-6">
            <blockquote className="font-display text-2xl leading-snug text-cream-soft">
              “Restoring dignity, stability, and hope through direct human connection and sustained
              care.”
            </blockquote>
            <p className="mt-4 text-xs font-semibold uppercase tracking-[0.18em] text-gold-soft">
              Bait ul Aqba Virtual Child Adoption Program
            </p>
          </figcaption>
        </motion.figure>
      </motion.div>
    </section>
  );
}

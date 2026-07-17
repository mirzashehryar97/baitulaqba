'use client';

import { motion } from 'framer-motion';

import { SponsorOrphanButton } from '@/components/ui/SponsorOrphanButton';

import { CONTEXT_ADOPTED_SHARE, CONTEXT_STATS } from '@/data/content';

import { fadeUp, staggerContainer, viewportOnce } from '@/lib/motion';

export function CrisisContext() {
  return (
    <section
      className="relative w-full overflow-hidden bg-emerald-deepest py-20 sm:py-24"
      id="crisis"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.09]"
        style={{
          backgroundImage: "url('/images/ornaments/crisis-pattern.svg')",
          backgroundSize: '120px 120px',
        }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(120% 90% at 15% 0%, transparent 30%, var(--color-emerald-deepest) 100%)',
        }}
      />

      <motion.div
        className="relative mx-auto w-full max-w-7xl px-5 sm:px-8 lg:px-12"
        initial="hidden"
        variants={staggerContainer}
        viewport={viewportOnce}
        whileInView="visible"
      >
        <motion.div className="max-w-3xl" variants={fadeUp}>
          <span className="text-sm font-semibold uppercase tracking-[0.28em] text-gold-soft">
            The scale of the crisis
          </span>
          <h2 className="mt-4 font-display text-4xl leading-tight text-cream-soft sm:text-5xl">
            The war in Gaza has left a generation of children without families.
          </h2>
        </motion.div>

        <motion.dl className="mt-12 grid gap-6 sm:grid-cols-3" variants={staggerContainer}>
          {CONTEXT_STATS.map((stat) => (
            <motion.div
              className="rounded-2xl border border-white/10 bg-emerald-deep/65 p-7 backdrop-blur-sm"
              key={stat.label}
              variants={fadeUp}
            >
              <dt className="font-display text-4xl font-semibold text-gold-soft sm:text-5xl">
                {stat.value}
              </dt>
              <dd className="mt-3 text-sm leading-relaxed text-cream/70">{stat.label}</dd>
            </motion.div>
          ))}
        </motion.dl>

        <motion.p
          className="mt-6 text-xs font-medium uppercase tracking-[0.18em] text-cream/45"
          variants={fadeUp}
        >
          Source: Ministry of Information, Gaza
        </motion.p>

        <motion.div
          className="mt-12 flex flex-col gap-6 rounded-2xl border border-gold/25 bg-emerald-deep/50 p-8 sm:flex-row sm:items-center sm:justify-between"
          variants={fadeUp}
        >
          <p className="max-w-xl text-lg leading-relaxed text-cream/85">
            So far, only{' '}
            <span className="font-semibold text-gold-soft">{CONTEXT_ADOPTED_SHARE}</span> of Gaza’s
            orphaned children have been sponsored. Far more support is still needed.
          </p>
          <SponsorOrphanButton className="shrink-0" size="lg">
            Sponsor a Child
          </SponsorOrphanButton>
        </motion.div>
      </motion.div>
    </section>
  );
}

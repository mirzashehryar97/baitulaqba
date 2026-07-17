'use client';

import Image from 'next/image';

import { motion } from 'framer-motion';

import { SponsorOrphanButton } from '@/components/ui/SponsorOrphanButton';

import { QUOTES } from '@/data/content';

import { fadeUp, staggerContainer, viewportOnce } from '@/lib/motion';

export function FinalCTA() {
  return (
    <section className="relative w-full overflow-hidden bg-emerald-deepest" id="contact">
      <div className="absolute inset-0">
        <Image
          alt="Children in Gaza gathered around food supplies provided through Bait ul Aqba"
          className="object-cover object-[center_20%]"
          fill
          sizes="100vw"
          src="/images/home/family-food-relief-wide.jpg"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-deepest via-emerald-deepest/85 to-emerald-deepest/55" />
        <div className="absolute inset-0 bg-gradient-to-t from-emerald-deepest via-transparent to-emerald-deepest/60" />
      </div>

      <motion.div
        className="relative mx-auto w-full max-w-7xl px-5 py-24 sm:px-8 lg:px-12 lg:py-32"
        initial="hidden"
        variants={staggerContainer}
        viewport={viewportOnce}
        whileInView="visible"
      >
        <div className="max-w-2xl">
          <motion.blockquote
            className="font-display text-3xl leading-snug text-cream-soft sm:text-4xl lg:text-[2.75rem]"
            variants={fadeUp}
          >
            “The best house among the Muslims is the house in which an orphan is treated well.”
          </motion.blockquote>
          <motion.p
            className="mt-4 flex items-center gap-2 text-xs font-medium uppercase tracking-[0.2em] text-gold-soft"
            variants={fadeUp}
          >
            <span className="h-px w-6 bg-current opacity-60" />
            {QUOTES.finalCta.source}
          </motion.p>

          <motion.p className="mt-8 font-display text-2xl text-gold sm:text-3xl" variants={fadeUp}>
            Tonight, you can become part of that house.
          </motion.p>

          <motion.div className="mt-9 flex flex-wrap items-center gap-3" variants={fadeUp}>
            <SponsorOrphanButton size="lg" />
          </motion.div>
        </div>
      </motion.div>
    </section>
  );
}

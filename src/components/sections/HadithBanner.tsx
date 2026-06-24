'use client';

import Image from 'next/image';

import { motion } from 'framer-motion';
import { Quote as QuoteIcon } from 'lucide-react';

import { QUOTES } from '@/data/content';

import { fadeUp, staggerContainer, viewportOnce } from '@/lib/motion';

// Matches the flat background baked into hadith-hand-panel.png
const PANEL_BG = '#fdf3e1';

export function HadithBanner() {
  return (
    <section className="relative w-full bg-cream px-4 py-12 sm:px-6 lg:px-8" id="orphan-status">
      <motion.div
        className="relative mx-auto w-full max-w-7xl overflow-hidden rounded-3xl border border-gold/20 shadow-[0_20px_60px_-30px_rgba(120,90,40,0.35)]"
        style={{ backgroundColor: PANEL_BG }}
        initial="hidden"
        variants={staggerContainer}
        viewport={viewportOnce}
        whileInView="visible"
      >
        <div className="relative h-56 w-full overflow-hidden sm:h-72 md:absolute md:inset-y-0 md:right-0 md:h-auto md:w-[44%] lg:w-[42%]">
          <Image
            alt="A hand raising two separated fingers in front of an ornate Islamic arch, symbolising closeness in Paradise"
            className="object-cover object-[center_40%] md:object-right"
            fill
            sizes="(max-width: 768px) 100vw, 600px"
            src="/images/hadith-hand-panel.png"
          />
          {/* Bottom fade blends the banner into the text area on small screens */}
          <div
            className="absolute inset-x-0 bottom-0 h-24 md:hidden"
            style={{ background: `linear-gradient(to top, ${PANEL_BG}, transparent)` }}
          />
          {/* Left fade blends the side image into the text area on larger screens */}
          <div
            className="absolute inset-y-0 left-0 hidden w-1/2 md:block"
            style={{ background: `linear-gradient(to right, ${PANEL_BG}, transparent)` }}
          />
        </div>

        <div className="relative grid items-center gap-6 px-6 pb-12 pt-6 sm:px-10 sm:pb-14 md:grid-cols-12 md:gap-8 md:px-12 md:py-14 lg:gap-10 lg:px-14 lg:py-16">
          <motion.div className="md:col-span-3" variants={fadeUp}>
            <h2 className="font-display text-2xl leading-snug text-emerald-deep sm:text-3xl">
              The Orphan’s Status in Islam
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-ink/60">
              Islam places a special emphasis on caring for orphans.
            </p>
          </motion.div>

          <motion.figure
            className="relative md:col-span-6 md:border-l md:border-gold/20 md:pl-8 lg:pl-12"
            variants={fadeUp}
          >
            <QuoteIcon
              aria-hidden="true"
              className="h-8 w-8 rotate-180 text-[#c87f4f]"
              fill="currentColor"
            />
            <blockquote className="mt-3 font-display text-2xl leading-snug text-emerald-deep sm:text-3xl lg:text-[2rem]">
              “The one who cares for an orphan and I will be together in Paradise like this.”
            </blockquote>
            <figcaption className="mt-4 flex items-center gap-2 text-xs font-medium uppercase tracking-[0.2em] text-gold-deep">
              <span className="h-px w-6 bg-current opacity-60" />
              {QUOTES.hadith.source}
            </figcaption>
          </motion.figure>

          <div aria-hidden="true" className="hidden md:col-span-3 md:block" />
        </div>
      </motion.div>
    </section>
  );
}

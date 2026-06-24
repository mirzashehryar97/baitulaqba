'use client';

import Image from 'next/image';

import { motion } from 'framer-motion';
import { ArrowRight, Heart, Play } from 'lucide-react';

import { Button } from '@/components/ui/Button';

import { HERO_BADGES, QUOTES } from '@/data/content';

import { EASE_OUT, fadeUp, staggerContainer } from '@/lib/motion';

export function Hero() {
  return (
    <section
      className="relative flex min-h-[100svh] w-full items-center overflow-hidden bg-emerald-deepest"
      id="home"
    >
      <div className="absolute inset-0">
        <Image
          alt="A young orphan looking up with hope in a Gaza-like setting"
          className="object-cover object-center"
          fill
          priority
          sizes="100vw"
          src="/images/hero-child.jpg"
        />
        {/* Green overlay on hero image — uncomment to restore the emerald tint and improve text contrast */}
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-deepest/95 via-emerald-deepest/70 to-emerald-deepest/40" /> 
        <div className="absolute inset-0 bg-gradient-to-t from-emerald-deepest via-transparent to-emerald-deepest/40" />
      </div>

      <div className="relative z-10 mx-auto w-full max-w-7xl px-5 pb-16 pt-28 sm:px-8 lg:px-12 lg:pt-24">
        <div className="grid items-center gap-10 lg:grid-cols-12">
          <motion.div
            animate="visible"
            className="lg:col-span-7"
            initial="hidden"
            variants={staggerContainer}
          >
            <motion.span
              className="inline-flex items-center gap-2 rounded-full border border-gold/30 bg-gold/10 px-4 py-1.5 text-xs font-medium uppercase tracking-[0.22em] text-gold-soft"
              variants={fadeUp}
            >
              <span className="h-1.5 w-1.5 rounded-full bg-gold" />
              Gaza Orphan Sponsorship
            </motion.span>

            <motion.h1
              className="mt-6 font-display text-5xl font-medium leading-[1.05] text-cream-soft sm:text-6xl lg:text-7xl"
              variants={fadeUp}
            >
              One child.
              <br />
              One future.
              <br />
              <span className="text-gold">You can protect.</span>
            </motion.h1>

            <motion.p
              className="mt-6 max-w-xl text-pretty text-base leading-relaxed text-cream/75 sm:text-lg"
              variants={fadeUp}
            >
              Thousands of orphans in Gaza have lost the people who protected them. Your sponsorship
              restores stability, education, and hope.
            </motion.p>

            <motion.div className="mt-8 flex flex-wrap items-center gap-3" variants={fadeUp}>
              <Button href="#adoption" size="lg">
                <Heart className="h-4 w-4" />
                Sponsor a Child
              </Button>
              <Button href="#process" size="lg" variant="outline">
                See How It Works
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-cream/15">
                  <Play className="h-3 w-3 fill-current" />
                </span>
              </Button>
            </motion.div>

            <motion.ul
              className="mt-10 flex flex-wrap items-center gap-x-7 gap-y-3"
              variants={fadeUp}
            >
              {HERO_BADGES.map((badge) => (
                <li className="flex items-center gap-2 text-sm text-cream/80" key={badge.label}>
                  <badge.icon className="h-4 w-4 text-gold-soft" />
                  {badge.label}
                </li>
              ))}
            </motion.ul>
          </motion.div>

          {/* <motion.div
            animate={{ opacity: 1, y: 0 }}
            className="lg:col-span-5 lg:flex lg:justify-end"
            initial={{ opacity: 0, y: 30 }}
            transition={{ duration: 0.9, delay: 0.4, ease: EASE_OUT }}
          >
            <figure className="relative max-w-sm overflow-hidden rounded-2xl border border-gold/25 bg-emerald-deepest/55 p-6 backdrop-blur-md sm:p-7">
              <p
                className="arabic text-right text-xl leading-relaxed text-gold-soft sm:text-2xl"
                lang="ar"
              >
                {QUOTES.hero.arabic}
              </p>
              <blockquote className="mt-4 font-display text-lg leading-snug text-cream-soft">
                “{QUOTES.hero.text}”
              </blockquote>
              <figcaption className="mt-4 flex items-center gap-2 text-xs font-medium uppercase tracking-[0.18em] text-gold-soft/90">
                <span className="h-px w-6 bg-current opacity-60" />
                {QUOTES.hero.source}
              </figcaption>
            </figure>
          </motion.div> */}
        </div>
      </div>

      <a
        className="absolute bottom-6 left-1/2 z-10 hidden -translate-x-1/2 lg:block"
        href="#orphan-status"
      >
        <span className="sr-only">Scroll to learn more</span>
        <motion.span
          animate={{ y: [0, 8, 0] }}
          aria-hidden="true"
          className="flex h-10 w-6 items-start justify-center rounded-full border border-cream/30 p-1.5"
          transition={{ duration: 1.8, repeat: Number.POSITIVE_INFINITY, ease: 'easeInOut' }}
        >
          <ArrowRight className="h-3 w-3 rotate-90 text-cream/60" />
        </motion.span>
      </a>
    </section>
  );
}

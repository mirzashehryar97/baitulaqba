'use client';

import Image from 'next/image';

import { motion } from 'framer-motion';
import { ArrowRight, HandHeart } from 'lucide-react';

import { Button } from '@/components/ui/Button';

import { JOURNEY_CARDS, type JourneyCard } from '@/data/content';

import { fadeUp, staggerContainer, viewportOnce } from '@/lib/motion';
import { cn } from '@/lib/utils';

function Card({ card }: { card: JourneyCard }) {
  return (
    <motion.article
      className={cn(
        'group relative flex h-72 w-full flex-col justify-end overflow-hidden rounded-2xl border p-5',
        card.highlight ? 'border-gold bg-emerald-soft' : 'border-gold/20 bg-emerald-deepest',
      )}
      variants={fadeUp}
    >
      {card.image ? (
        <>
          <Image
            alt=""
            className="object-cover transition-transform duration-700 group-hover:scale-105"
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
            src={card.image}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-emerald-deepest via-emerald-deepest/55 to-emerald-deepest/10" />
        </>
      ) : (
        <div className="absolute inset-0 flex items-center justify-center">
          <HandHeart aria-hidden="true" className="h-16 w-16 text-gold/70" />
        </div>
      )}

      <span className="relative flex h-8 w-8 items-center justify-center rounded-full border border-gold/40 bg-emerald-deepest/70 text-sm font-bold text-gold-soft">
        {card.step}
      </span>
      <p className="relative mt-3 font-display text-base leading-snug text-cream-soft lg:text-lg xl:text-base">
        {card.text}
      </p>
    </motion.article>
  );
}

export function JourneyCards() {
  return (
    <section
      className="relative w-full overflow-hidden bg-emerald-deep py-20 sm:py-24"
      id="adoption"
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
      <div className="relative mx-auto w-full max-w-7xl px-5 sm:px-8 lg:px-12">
        <motion.div
          className="grid items-center gap-8 xl:grid-cols-12"
          initial="hidden"
          variants={staggerContainer}
          viewport={viewportOnce}
          whileInView="visible"
        >
          <div className="xl:col-span-4">
            <motion.span
              className="text-xs font-semibold uppercase tracking-[0.28em] text-gold-soft"
              variants={fadeUp}
            >
              Virtual Adoption
            </motion.span>
            <motion.h2
              className="mt-4 font-display text-4xl leading-tight text-cream-soft sm:text-5xl"
              variants={fadeUp}
            >
              Walk through a child’s story
            </motion.h2>
            <motion.p className="mt-4 text-sm leading-relaxed text-cream/70" variants={fadeUp}>
              Every child has a story. Every story deserves a chance.
            </motion.p>
            <motion.div variants={fadeUp}>
              <Button className="mt-7" href="#process" size="lg">
                Start the Journey
                <ArrowRight className="h-4 w-4" />
              </Button>
            </motion.div>
          </div>

        <motion.div className="xl:col-span-8" variants={fadeUp}>
          <div className="grid grid-cols-1 gap-4 min-[400px]:grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
              {JOURNEY_CARDS.map((card) => (
                <Card card={card} key={card.step} />
              ))}
            </div>
          </motion.div>
        </motion.div>

        <motion.p
          className="mt-12 text-center font-display text-lg italic text-gold-soft sm:text-xl"
          initial="hidden"
          variants={fadeUp}
          viewport={viewportOnce}
          whileInView="visible"
        >
          “You are not just helping today. You are building their tomorrow.”
        </motion.p>
      </div>
    </section>
  );
}

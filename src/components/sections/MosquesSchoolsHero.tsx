'use client';

import Image from 'next/image';

import { motion } from 'framer-motion';
import { ArrowRight, Heart } from 'lucide-react';

import { Button } from '@/components/ui/Button';

import { EASE_OUT, fadeUp, staggerContainer } from '@/lib/motion';

export function MosquesSchoolsHero() {
  return (
    <section
      className="relative flex min-h-[760px] items-end overflow-hidden bg-emerald-deepest pt-24 lg:min-h-[780px]"
      id="home"
    >
      <motion.div
        animate={{ opacity: 1, scale: 1 }}
        className="absolute inset-0"
        initial={{ opacity: 0, scale: 1.04 }}
        transition={{ duration: 1.2, ease: EASE_OUT }}
      >
        <Image
          alt="A temporary mosque glowing at sunset as worshippers gather"
          className="object-cover object-[76%_center] sm:object-[82%_center] lg:object-right"
          fill
          priority
          sizes="100vw"
          src="/images/mosques-schools/hero-tent-mosque.png"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-deepest via-emerald-deepest/72 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-emerald-deepest/90 via-transparent to-emerald-deepest/40" />
      </motion.div>

      <div className="relative z-10 mx-auto grid w-full max-w-7xl items-end gap-10 px-5 pb-20 sm:px-8 lg:grid-cols-12 lg:px-12 lg:pb-24">
        <motion.div
          animate="visible"
          className="lg:col-span-7"
          initial="hidden"
          variants={staggerContainer}
        >
          <motion.div
            className="inline-flex items-center gap-2 rounded-full border border-gold/45 bg-emerald-deepest/45 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-gold-soft backdrop-blur"
            variants={fadeUp}
          >
            Our Initiatives
            <span className="text-cream/40">›</span>
            Mosques &amp; Schools
          </motion.div>

          <motion.h1
            className="mt-7 max-w-2xl font-display text-5xl font-medium leading-[1.05] text-cream-soft sm:text-6xl lg:text-7xl"
            variants={fadeUp}
          >
            Building places
            <br />
            of <span className="text-gold">worship.</span>
            <br />
            Nurturing hearts.
          </motion.h1>

          <motion.p
            className="mt-6 max-w-xl text-base leading-relaxed text-cream/80 sm:text-lg"
            variants={fadeUp}
          >
            In Gaza, we are establishing temporary mosques and learning spaces — safe places for
            worship, community, and hope.
          </motion.p>

          <motion.div className="mt-8 flex flex-wrap gap-3" variants={fadeUp}>
            <Button href="#support" size="lg">
              Support a Tent Mosque
              <Heart className="h-4 w-4" />
            </Button>
            <Button href="#journey" size="lg" variant="outline">
              See How It Works
              <ArrowRight className="h-4 w-4" />
            </Button>
          </motion.div>
        </motion.div>

        <motion.div
          animate={{ opacity: 1, y: 0 }}
          className="hidden self-end justify-self-end rounded-2xl border border-gold/40 bg-emerald-deepest/80 p-7 text-center backdrop-blur-md lg:col-span-4 lg:block lg:max-w-xs"
          initial={{ opacity: 0, y: 30 }}
          transition={{ duration: 0.9, delay: 0.45, ease: EASE_OUT }}
        >
          <p className="arabic text-2xl leading-relaxed text-gold-soft" lang="ar">
            مَنْ بَنَى مَسْجِدًا لِلَّهِ بَنَى اللَّهُ لَهُ فِي الْجَنَّةِ مِثْلَهُ
          </p>
          <p className="mt-5 text-sm leading-relaxed text-cream/85">
            “Whoever builds a mosque for Allah, Allah will build for him a house in Paradise.”
          </p>
          <p className="mt-4 text-xs text-gold-soft">— Sahih al-Bukhari (450)</p>
        </motion.div>
      </div>
    </section>
  );
}

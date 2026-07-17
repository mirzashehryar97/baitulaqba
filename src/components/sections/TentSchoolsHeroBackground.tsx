'use client';

import Image from 'next/image';

import { motion } from 'framer-motion';

import { EASE_OUT } from '@/lib/motion';

export function TentSchoolsHeroBackground() {
  return (
    <motion.div
      animate={{ opacity: 1, scale: 1 }}
      className="absolute inset-0"
      initial={{ opacity: 0, scale: 1.04 }}
      transition={{ duration: 1.2, ease: EASE_OUT }}
    >
      <Image
        alt="A Bait ul Aqba field worker beside a completed branded relief tent in Gaza"
        className="object-cover object-[70%_center] lg:object-center"
        fill
        priority
        sizes="100vw"
        src="/images/official/bait-ul-aqba/family-shelter-tent.png"
      />
    </motion.div>
  );
}

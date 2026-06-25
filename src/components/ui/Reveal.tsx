'use client';

import { motion } from 'framer-motion';

import { fadeUp, staggerContainer, viewportOnce } from '@/lib/motion';

type RevealProps = {
  children: React.ReactNode;
  className?: string;
  stagger?: boolean;
};

export function Reveal({ children, className, stagger = false }: RevealProps) {
  return (
    <motion.div
      className={className}
      initial="hidden"
      variants={stagger ? staggerContainer : fadeUp}
      viewport={viewportOnce}
      whileInView="visible"
    >
      {children}
    </motion.div>
  );
}

export function RevealItem({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <motion.div className={className} variants={fadeUp}>
      {children}
    </motion.div>
  );
}

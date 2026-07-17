'use client';

import { motion } from 'framer-motion';
import { Quote, Star } from 'lucide-react';

import { SectionHeading } from '@/components/ui/SectionHeading';

import { SPONSOR_TESTIMONIALS, type SponsorTestimonial } from '@/data/content';

import { fadeUp, staggerContainer, viewportOnce } from '@/lib/motion';

const STAR_RATING = [1, 2, 3, 4, 5] as const;

function getInitials(name: string) {
  return name
    .split(' ')
    .map((part) => part[0])
    .join('');
}

function TestimonialCard({ testimonial }: { testimonial: SponsorTestimonial }) {
  return (
    <motion.figure
      className="relative flex h-full flex-col overflow-hidden rounded-2xl border border-emerald/10 bg-cream-soft p-7 shadow-soft transition-transform duration-300 hover:-translate-y-1 sm:p-8"
      variants={fadeUp}
    >
      <div
        aria-hidden="true"
        className="absolute -right-10 -top-10 h-28 w-28 rounded-full border border-gold/15"
      />
      <div
        aria-hidden="true"
        className="absolute -right-5 -top-5 h-16 w-16 rounded-full border border-gold/10"
      />

      <div className="relative flex items-center justify-between gap-4">
        <Quote aria-hidden="true" className="h-9 w-9 fill-gold/15 text-gold-deep" />
        <div className="flex items-center gap-1 text-gold-deep">
          <span className="sr-only">5 out of 5 stars</span>
          {STAR_RATING.map((star) => (
            <Star aria-hidden="true" className="h-3.5 w-3.5 fill-current" key={star} />
          ))}
        </div>
      </div>

      <blockquote className="relative mt-6 flex-1 font-display text-xl font-medium leading-relaxed text-emerald-deep sm:text-[1.35rem]">
        “{testimonial.text}”
      </blockquote>

      <figcaption className="relative mt-8 flex items-center gap-3 border-t border-emerald/10 pt-5">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-gold/35 bg-emerald-deep text-sm font-bold text-gold-soft">
          {getInitials(testimonial.name)}
        </span>
        <span>
          <span className="block text-sm font-bold text-emerald-deep">{testimonial.name}</span>
          <span className="mt-0.5 block text-xs font-medium uppercase tracking-[0.14em] text-ink/50">
            {testimonial.location}
          </span>
        </span>
      </figcaption>
    </motion.figure>
  );
}

export function SponsorTestimonials() {
  return (
    <section className="relative w-full overflow-hidden bg-cream py-20 sm:py-24" id="testimonials">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.035]"
        style={{
          backgroundImage:
            'radial-gradient(circle at 1px 1px, var(--color-emerald-deep) 1px, transparent 0)',
          backgroundSize: '30px 30px',
        }}
      />

      <div className="relative mx-auto w-full max-w-7xl px-5 sm:px-8 lg:px-12">
        <SectionHeading
          align="center"
          description="Hear from sponsors about the relationships, updates, and hope made possible through this program."
          eyebrow="Real stories"
          title="What Our Sponsors Say"
        />

        <motion.div
          className="mt-12 grid items-stretch gap-5 lg:grid-cols-3"
          initial="hidden"
          variants={staggerContainer}
          viewport={viewportOnce}
          whileInView="visible"
        >
          {SPONSOR_TESTIMONIALS.map((testimonial) => (
            <TestimonialCard key={testimonial.name} testimonial={testimonial} />
          ))}
        </motion.div>
      </div>
    </section>
  );
}

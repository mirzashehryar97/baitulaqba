import type { Metadata } from 'next';
import Image from 'next/image';

import {
  ArrowRight,
  BadgeCheck,
  BookOpen,
  Box,
  ClipboardCheck,
  Droplets,
  GraduationCap,
  HandHeart,
  Heart,
  MapPin,
  Megaphone,
  PackageCheck,
  Search,
  ShieldCheck,
  Sprout,
  Target,
  Users,
} from 'lucide-react';

import { Footer } from '@/components/layout/Footer';
import { Header } from '@/components/layout/Header';
import { BreadcrumbJsonLd } from '@/components/seo/BreadcrumbJsonLd';
import { Button } from '@/components/ui/Button';
import { Reveal, RevealItem } from '@/components/ui/Reveal';
import { SponsorOrphanButton } from '@/components/ui/SponsorOrphanButton';
import { SponsorOrphanProvider } from '@/components/ui/SponsorOrphanModal';

import { CONTACT } from '@/data/content';

import { createMetadata } from '@/lib/seo';

export const metadata: Metadata = createMetadata({
  title: 'About Bait ul Aqba — Verified Support for Gaza',
  description:
    'Learn how Bait ul Aqba connects families in Pakistan with verified, dignity-first humanitarian support for Gaza.',
  path: '/about',
});

const differences = [
  {
    title: 'Verified Needs',
    copy: 'Aid is guided by authentic, current data so urgent needs can be prioritised responsibly.',
    icon: ShieldCheck,
  },
  {
    title: 'Direct Human Connection',
    copy: 'Families are connected through care, communication and meaningful long-term support.',
    icon: Users,
  },
  {
    title: 'Dignity-First Support',
    copy: 'Every person is treated with respect, privacy and compassion—not reduced to a number.',
    icon: HandHeart,
  },
  {
    title: 'Long-Term Upliftment',
    copy: 'Relief is paired with education, resilience and pathways toward a more stable future.',
    icon: Sprout,
  },
];

const programs = [
  {
    title: 'Orphan Sponsorship',
    copy: 'Consistent care for verified children in Gaza, supporting essentials, education and emotional wellbeing.',
    image: '/images/official/bait-ul-aqba/about/child-carrying-water.png',
    alt: 'A child carrying a water container during an official Bait ul Aqba water project in Gaza',
  },
  {
    title: 'Tent Schools',
    copy: 'Temporary learning spaces and basic resources that help children continue their education.',
    image: '/images/official/bait-ul-aqba/about/story-shelter-build.png',
    alt: 'A Bait ul Aqba relief worker helping construct a protective tent in Gaza',
  },
  {
    title: 'Food & Clean Water',
    copy: 'Essential food and safe drinking water delivered through verified projects on the ground.',
    image: '/images/official/bait-ul-aqba/about/program-clean-water.png',
    alt: 'Residents filling containers during an official Bait ul Aqba clean-water delivery in Gaza',
  },
  {
    title: 'Humanitarian Support',
    copy: 'Shelter, emergency relief and practical care delivered according to real, assessed needs.',
    image: '/images/official/bait-ul-aqba/about/program-food-relief.png',
    alt: 'A child receiving food during a relief distribution co-published by Bait ul Aqba',
  },
];

const stats = [
  { value: '700+', label: 'Orphans supported', icon: Users },
  { value: '300+', label: 'Donors engaged', icon: Heart },
  { value: '15,000+', label: 'Food beneficiaries', icon: PackageCheck },
  { value: '20,000+', label: 'Clean water beneficiaries', icon: Droplets },
  { value: '100+', label: 'Emergency relief cases', icon: Box },
];

const impactSteps = [
  {
    number: '01',
    title: 'Needs Identified',
    copy: 'Local partners help identify families and communities facing urgent hardship.',
    icon: Search,
  },
  {
    number: '02',
    title: 'Priority Confirmed',
    copy: 'Needs are assessed against current conditions and available verified information.',
    icon: ClipboardCheck,
  },
  {
    number: '03',
    title: 'Support Delivered',
    copy: 'Aid is provided through coordinated, trusted channels with dignity and care.',
    icon: PackageCheck,
  },
  {
    number: '04',
    title: 'Families Stay Connected',
    copy: 'Sponsors receive updates and long-term programs preserve meaningful human connection.',
    icon: Users,
  },
];

export default function AboutPage() {
  return (
    <SponsorOrphanProvider>
      <BreadcrumbJsonLd
        items={[
          { name: 'Home', path: '/' },
          { name: 'About', path: '/about' },
        ]}
      />
      <Header />
      <main>
        <section
          className="relative flex min-h-[720px] items-end overflow-hidden bg-emerald-deepest pt-24 lg:min-h-[760px]"
          id="about"
        >
          <div className="absolute inset-0 lg:left-[39%]">
            <Image
              alt="Families and local volunteers gathering for an official Bait ul Aqba clean-water distribution in Gaza"
              className="object-cover object-center"
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 65vw"
              src="/images/official/bait-ul-aqba/about/hero-water-distribution-cropped.png"
            />
          </div>
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-deepest via-emerald-deepest/95 to-emerald-deepest/10 lg:via-emerald-deepest/80" />
          <div className="absolute inset-0 bg-gradient-to-t from-emerald-deepest via-transparent to-emerald-deepest/40" />

          <Reveal className="relative z-10 mx-auto w-full max-w-7xl px-5 pb-16 sm:px-8 lg:px-12 lg:pb-20">
            <div className="max-w-2xl">
              <p className="inline-flex rounded-full border border-gold/45 bg-emerald-deepest/45 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-gold-soft backdrop-blur">
                About Bait ul Aqba
              </p>
              <h1 className="mt-7 text-balance font-display text-5xl font-medium leading-[0.98] text-cream-soft sm:text-6xl lg:text-7xl">
                A legacy of <span className="text-gold">unity.</span>
                <br />A promise of <span className="text-gold">care.</span>
              </h1>
              <p className="mt-6 max-w-xl text-base leading-relaxed text-cream/80 sm:text-lg">
                Rooted in Pakistan. Standing with Gaza. Building bonds of dignity, resilience and
                hope through verified, long-term support.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Button href="#mission" size="lg">
                  Our Mission
                  <ArrowRight className="h-4 w-4" />
                </Button>
                <Button href="#impact" size="lg" variant="outline">
                  See Our Impact
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="mt-12 flex justify-end lg:mt-0">
              <div className="max-w-xs rounded-2xl border border-gold/55 bg-emerald-deepest/80 px-6 py-5 text-center shadow-card backdrop-blur-md">
                <BadgeCheck className="mx-auto h-5 w-5 text-gold" />
                <p className="mt-2 font-display text-xl leading-snug text-gold-soft">
                  Unity · Sacrifice · Unwavering Loyalty
                </p>
              </div>
            </div>
          </Reveal>
        </section>

        <section className="bg-offwhite py-20 sm:py-24" id="story">
          <Reveal
            className="mx-auto grid max-w-6xl items-center gap-12 px-5 sm:px-8 lg:grid-cols-2 lg:px-12"
            stagger
          >
            <RevealItem>
              <div className="relative mx-auto aspect-[4/5] max-w-md overflow-hidden rounded-t-[10rem] rounded-b-3xl border border-gold/20 bg-cream shadow-card">
                <Image
                  alt="An official Bait ul Aqba relief worker helping build a tent shelter in Gaza"
                  className="object-cover object-center"
                  fill
                  sizes="(max-width: 1024px) 90vw, 40vw"
                  src="/images/official/bait-ul-aqba/about/story-shelter-build.png"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-emerald-deepest/25 via-transparent to-transparent" />
              </div>
            </RevealItem>

            <RevealItem>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-gold-deep">
                Our inspiration
              </p>
              <h2 className="mt-4 text-balance font-display text-4xl leading-tight text-emerald-deep sm:text-5xl">
                Inspired by the Pledge of Aqabah
              </h2>
              <p className="mt-6 text-base leading-relaxed text-ink/70">
                Inspired by the historic pledge of the Companions of Prophet Muhammad ﷺ, Bait ul
                Aqba works to unite the global Ummah, beginning from Pakistan, while serving
                humanity with sincerity and a long-term vision.
              </p>
              <p className="mt-4 text-base leading-relaxed text-ink/70">
                With Gaza as its primary focus, the organization goes beyond emergency relief to
                rebuild lives, restore dignity and strengthen communities by connecting Muslim
                families directly with those in need.
              </p>
              <div className="mt-7 flex items-start gap-3 rounded-2xl border border-emerald/10 bg-cream-soft p-5">
                <HandHeart className="mt-0.5 h-5 w-5 shrink-0 text-gold-deep" />
                <p className="text-sm leading-relaxed text-emerald-deep">
                  Faith-driven, independent and non-political—committed to humanitarian service with
                  sincerity, transparency and accountability.
                </p>
              </div>
            </RevealItem>
          </Reveal>
        </section>

        <section className="border-y border-emerald/10 bg-cream-soft py-20 sm:py-24" id="mission">
          <Reveal className="mx-auto max-w-6xl px-5 sm:px-8 lg:px-12" stagger>
            <RevealItem className="text-center">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-gold-deep">
                Vision &amp; Mission
              </p>
              <h2 className="mt-4 font-display text-4xl text-emerald-deep sm:text-5xl">
                A united Ummah, stronger together
              </h2>
            </RevealItem>

            <RevealItem className="mt-10 grid gap-6 lg:grid-cols-2">
              <article className="rounded-3xl border border-emerald/10 bg-offwhite p-7 shadow-soft sm:p-9">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gold/12 text-gold-deep">
                  <Megaphone className="h-7 w-7 stroke-[1.6]" />
                </div>
                <p className="mt-6 text-xs font-bold uppercase tracking-[0.18em] text-gold-deep">
                  Our Vision
                </p>
                <h3 className="mt-3 font-display text-3xl text-emerald-deep">Dignity and hope</h3>
                <p className="mt-4 leading-relaxed text-ink/65">
                  A united and empowered Muslim Ummah living by true faith and brotherhood, standing
                  together to restore dignity, resilience and hope—especially for the people of
                  Gaza.
                </p>
              </article>

              <article className="rounded-3xl border border-gold/25 bg-emerald-deep p-7 shadow-card sm:p-9">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-gold/45 bg-white/5 text-gold">
                  <Target className="h-7 w-7 stroke-[1.6]" />
                </div>
                <p className="mt-6 text-xs font-bold uppercase tracking-[0.18em] text-gold-soft">
                  Our Mission
                </p>
                <h3 className="mt-3 font-display text-3xl text-cream-soft">Connection into care</h3>
                <p className="mt-4 leading-relaxed text-cream/72">
                  To revive the spirit of Bait ul Aqba by uniting Muslims, reconnecting them with
                  oppressed communities and creating direct contact with families in Gaza—while
                  providing essential aid, caring for orphans and supporting long-term rebuilding.
                </p>
              </article>
            </RevealItem>
          </Reveal>
        </section>

        <section className="bg-offwhite py-20 sm:py-24">
          <Reveal className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-12" stagger>
            <RevealItem className="text-center">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-gold-deep">
                What makes us different
              </p>
              <h2 className="mt-4 font-display text-4xl text-emerald-deep sm:text-5xl">
                Verified aid, dignity-first support
              </h2>
            </RevealItem>

            <RevealItem className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
              {differences.map((item) => (
                <article className="text-center" key={item.title}>
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-emerald/10 bg-cream-soft text-emerald-deep shadow-sm">
                    <item.icon className="h-7 w-7 stroke-[1.5]" />
                  </div>
                  <h3 className="mt-5 font-display text-2xl text-emerald-deep">{item.title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-ink/60">{item.copy}</p>
                </article>
              ))}
            </RevealItem>

            <RevealItem className="mx-auto mt-10 flex w-fit flex-wrap items-center justify-center gap-4 rounded-full border border-gold/20 bg-cream-soft px-6 py-3 text-sm font-medium text-gold-deep shadow-sm">
              <span>Relief</span>
              <ArrowRight className="h-4 w-4" />
              <span>Rebuilding</span>
              <ArrowRight className="h-4 w-4" />
              <span>Resilience</span>
            </RevealItem>
          </Reveal>
        </section>

        <section
          className="border-y border-emerald/10 bg-cream-soft py-20 sm:py-24"
          id="initiatives"
        >
          <Reveal className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-12" stagger>
            <RevealItem className="text-center">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-gold-deep">
                Our focus areas
              </p>
              <h2 className="mt-4 font-display text-4xl text-emerald-deep sm:text-5xl">
                Care that meets today&apos;s needs—and protects tomorrow
              </h2>
            </RevealItem>

            <RevealItem className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {programs.map((program) => (
                <article
                  className="group overflow-hidden rounded-2xl border border-emerald/10 bg-offwhite shadow-soft"
                  key={program.title}
                >
                  <div className="relative aspect-[4/3] overflow-hidden bg-emerald-deepest">
                    <Image
                      alt={program.alt}
                      className="object-cover transition duration-700 group-hover:scale-105"
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                      src={program.image}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-emerald-deepest/50 via-transparent to-transparent" />
                  </div>
                  <div className="p-5">
                    <h3 className="font-display text-2xl text-emerald-deep">{program.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-ink/60">{program.copy}</p>
                  </div>
                </article>
              ))}
            </RevealItem>
          </Reveal>
        </section>

        <section className="bg-emerald-deep py-12" aria-label="Bait ul Aqba impact statistics">
          <Reveal
            className="mx-auto grid max-w-7xl grid-cols-2 gap-x-5 gap-y-9 px-5 sm:px-8 lg:grid-cols-5 lg:px-12"
            stagger
          >
            {stats.map((stat) => (
              <RevealItem className="text-center" key={stat.label}>
                <stat.icon className="mx-auto h-6 w-6 stroke-[1.5] text-gold" />
                <p className="mt-3 font-display text-3xl font-semibold text-gold sm:text-4xl">
                  {stat.value}
                </p>
                <p className="mt-1 text-xs leading-relaxed text-cream/65 sm:text-sm">
                  {stat.label}
                </p>
              </RevealItem>
            ))}
          </Reveal>
        </section>

        <section className="bg-offwhite py-20 sm:py-24" id="impact">
          <Reveal
            className="mx-auto grid max-w-7xl gap-12 px-5 sm:px-8 lg:grid-cols-12 lg:px-12"
            stagger
          >
            <RevealItem className="lg:col-span-3">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-gold-deep">
                Our process
              </p>
              <h2 className="mt-4 font-display text-4xl leading-tight text-emerald-deep">
                From a verified need to meaningful impact
              </h2>
              <p className="mt-5 text-base leading-relaxed text-ink/65">
                Our end-to-end approach helps support reach the right people, at the right time,
                while creating lasting change.
              </p>
            </RevealItem>

            <RevealItem className="relative grid gap-5 sm:grid-cols-2 lg:col-span-9 lg:grid-cols-4">
              <div className="absolute left-[12.5%] right-[12.5%] top-10 hidden border-t border-dashed border-gold/40 lg:block" />
              {impactSteps.map((step) => (
                <article
                  className="relative rounded-2xl border border-emerald/10 bg-cream-soft p-5 text-center shadow-sm"
                  key={step.number}
                >
                  <span className="absolute -top-3 left-1/2 flex h-7 w-7 -translate-x-1/2 items-center justify-center rounded-full bg-gold text-[11px] font-bold text-emerald-deepest">
                    {step.number}
                  </span>
                  <div className="mx-auto mt-2 flex h-12 w-12 items-center justify-center rounded-full bg-offwhite text-emerald-deep">
                    <step.icon className="h-5 w-5 stroke-[1.6]" />
                  </div>
                  <h3 className="mt-4 font-display text-xl text-emerald-deep">{step.title}</h3>
                  <p className="mt-2 text-xs leading-relaxed text-ink/60">{step.copy}</p>
                </article>
              ))}
            </RevealItem>
          </Reveal>
        </section>

        <section className="border-y border-emerald/10 bg-cream-soft">
          <Reveal className="mx-auto grid max-w-7xl lg:grid-cols-2" stagger>
            <RevealItem className="relative min-h-[440px] overflow-hidden lg:min-h-[560px]">
              <Image
                alt="Families walking through a Gaza camp to collect water from an official Bait ul Aqba project"
                className="object-cover object-center"
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                src="/images/official/bait-ul-aqba/about/community-water-queue.png"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-emerald-deepest/30 via-transparent to-transparent" />
            </RevealItem>

            <RevealItem className="flex items-center px-5 py-16 sm:px-10 lg:px-16">
              <div className="max-w-xl">
                <p className="font-display text-7xl leading-none text-gold/65">“</p>
                <blockquote className="-mt-6 text-balance font-display text-4xl leading-tight text-emerald-deep sm:text-5xl">
                  Dignity is not a detail. It is the way we serve.
                </blockquote>
                <p className="mt-6 leading-relaxed text-ink/65">
                  We serve every family as we would our own—because every life is honoured, and
                  every soul matters.
                </p>
                <div className="mt-9 grid grid-cols-3 gap-4 text-center">
                  {[
                    { label: 'Faith-Driven', icon: BookOpen },
                    { label: 'Independent', icon: ShieldCheck },
                    { label: 'Non-Political', icon: HandHeart },
                  ].map((item) => (
                    <div key={item.label}>
                      <item.icon className="mx-auto h-6 w-6 stroke-[1.5] text-gold-deep" />
                      <p className="mt-2 text-xs font-semibold text-emerald-deep sm:text-sm">
                        {item.label}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </RevealItem>
          </Reveal>
        </section>

        <section className="bg-offwhite py-20">
          <Reveal
            className="mx-auto grid max-w-7xl items-center gap-9 px-5 sm:px-8 lg:grid-cols-12 lg:px-12"
            stagger
          >
            <RevealItem className="lg:col-span-4">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-gold-deep">
                Where we work
              </p>
              <h2 className="mt-4 font-display text-4xl leading-tight text-emerald-deep">
                Rooted in Pakistan. Focused on Gaza.
              </h2>
              <p className="mt-5 leading-relaxed text-ink/65">
                Our Islamabad and Lahore teams mobilise support responsibly, while Gaza remains the
                primary focus of our humanitarian work.
              </p>
            </RevealItem>

            <RevealItem className="relative overflow-hidden rounded-3xl border border-gold/25 bg-emerald-deep p-7 shadow-card sm:p-10 lg:col-span-8">
              <div className="absolute inset-0 opacity-[0.08] [background-image:radial-gradient(circle_at_center,_#d8bd86_1px,_transparent_1px)] [background-size:18px_18px]" />
              <div className="relative grid gap-8 sm:grid-cols-3">
                {[
                  { city: 'Islamabad', label: 'Operations hub' },
                  { city: 'Lahore', label: 'Coordination office' },
                  { city: 'Gaza', label: 'Our primary focus' },
                ].map((location) => (
                  <div className="text-center" key={location.city}>
                    <MapPin className="mx-auto h-8 w-8 text-gold" />
                    <p className="mt-3 font-display text-2xl text-gold-soft">{location.city}</p>
                    <p className="mt-1 text-xs uppercase tracking-[0.14em] text-cream/55">
                      {location.label}
                    </p>
                  </div>
                ))}
              </div>
              <div className="relative mt-7 flex items-center justify-center gap-2 border-t border-cream/10 pt-6 text-xs text-cream/60">
                <GraduationCap className="h-4 w-4 text-gold-soft" />
                Pakistan-based coordination · Direct, verified humanitarian programs
              </div>
            </RevealItem>
          </Reveal>
        </section>

        <section className="relative overflow-hidden bg-emerald-deepest" id="contact">
          <Image
            alt="An official Bait ul Aqba clean-water distribution taking place in Gaza"
            className="object-cover object-center opacity-65"
            fill
            sizes="100vw"
            src="/images/official/bait-ul-aqba/about/verified-water-delivery-cropped.png"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-deepest via-emerald-deepest/88 to-emerald-deepest/35" />
          <Reveal className="relative mx-auto max-w-7xl px-5 py-20 sm:px-8 lg:px-12 lg:py-24">
            <div className="max-w-2xl">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-gold-soft">
                Stand with Gaza
              </p>
              <h2 className="mt-4 text-balance font-display text-4xl leading-tight text-cream-soft sm:text-5xl">
                Strengthen the Ummah. Become part of a legacy of compassion.
              </h2>
              <p className="mt-5 max-w-xl leading-relaxed text-cream/72">
                Your support can become verified relief, continuing education and a dependable bond
                of care for a family in Gaza.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <SponsorOrphanButton size="lg" />
                <Button href={CONTACT.whatsapp.href} size="lg" variant="outline">
                  Contact Our Team
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </Reveal>
        </section>
      </main>
      <Footer />
    </SponsorOrphanProvider>
  );
}

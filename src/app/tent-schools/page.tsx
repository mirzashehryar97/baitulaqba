import type { Metadata } from 'next';
import Image from 'next/image';

import {
  ArrowRight,
  BookOpen,
  HandHeart,
  Heart,
  MapPin,
  School,
  ShieldCheck,
  Sparkles,
  Sun,
  Users,
} from 'lucide-react';

import { Footer } from '@/components/layout/Footer';
import { Header } from '@/components/layout/Header';
import { InitiativesGrid } from '@/components/sections/InitiativesGrid';
import { TentSchoolsHeroBackground } from '@/components/sections/TentSchoolsHeroBackground';
import { BreadcrumbJsonLd } from '@/components/seo/BreadcrumbJsonLd';
import { Button } from '@/components/ui/Button';
import {
  InitiativeContactButton,
  InitiativeContactProvider,
} from '@/components/ui/InitiativeContactModal';
import { Reveal, RevealItem } from '@/components/ui/Reveal';
import { SponsorOrphanProvider } from '@/components/ui/SponsorOrphanModal';

import { createMetadata } from '@/lib/seo';

export const metadata: Metadata = createMetadata({
  title: 'Tent Schools in Gaza — Keep Children Learning',
  description:
    'Help establish safe, equipped tent classrooms so children in Gaza can continue learning with dignity.',
  path: '/tent-schools',
});

const impactStats = [
  { value: '8+', label: 'Learning spaces established', icon: School },
  { value: '7,000+', label: 'Education beneficiaries', icon: Users },
  { value: '5', label: 'Core learning essentials', icon: BookOpen },
];

const needCards = [
  {
    title: 'Disrupted Childhoods',
    copy: 'Repeated displacement leaves children without the safety, routine and connection they need to learn.',
    image: '/images/tent-schools/gaza-tent-classroom-students.webp',
    alt: 'Children seated together inside a temporary tent classroom in Gaza',
  },
  {
    title: 'Temporary Safe Spaces',
    copy: 'Bait ul Aqba’s existing shelter work shows how protected temporary spaces can be assembled on the ground.',
    image: '/images/official/bait-ul-aqba/family-shelter-tent.png',
    alt: 'A temporary family shelter erected by Bait ul Aqba workers in Gaza',
  },
  {
    title: 'Connection & Routine',
    copy: 'Structured group activities restore confidence, connection and the belief that a brighter future is possible.',
    image: '/images/tent-schools/gaza-tent-school-assembly.webp',
    alt: 'Children standing for a school assembly among temporary learning tents in Gaza',
  },
];

const journey = [
  {
    title: 'You Choose',
    copy: 'You choose to help establish a safe tent classroom.',
    icon: HandHeart,
  },
  {
    title: 'We Identify',
    copy: 'Local partners identify communities with the most urgent need.',
    icon: MapPin,
  },
  {
    title: 'We Build',
    copy: 'A weather-resistant classroom is equipped with essential materials.',
    icon: School,
  },
  {
    title: 'Learning Begins',
    copy: 'Teachers are supported and structured lessons can resume.',
    icon: BookOpen,
  },
  {
    title: 'Futures Grow',
    copy: 'Children regain routine, confidence and a path forward.',
    icon: Heart,
  },
];

const provisions = [
  {
    title: 'Classroom Tent',
    copy: 'A weather-resistant space with ventilation and protective flooring.',
    icon: School,
  },
  {
    title: 'Desks & Learning Kits',
    copy: 'Desks, notebooks, stationery and age-appropriate learning materials.',
    icon: BookOpen,
  },
  {
    title: 'Teacher Support',
    copy: 'Resources and ongoing support for dedicated local educators.',
    icon: Users,
  },
  {
    title: 'Solar Lighting',
    copy: 'Clean, dependable light so lessons can continue throughout the day.',
    icon: Sun,
  },
  {
    title: 'Safe Facilities',
    copy: 'Clean water, hygiene and safeguarding measures for every classroom.',
    icon: ShieldCheck,
  },
];

const projects = [
  {
    name: 'Child Wellbeing Activities',
    copy: 'Supervised group activities bring children together in a safer routine.',
    image: '/images/official/bait-ul-aqba/children-receiving-support.png',
    alt: 'Children receiving support during a Bait ul Aqba activity in Gaza',
  },
  {
    name: 'Winter Clothing Support',
    copy: 'Practical relief helps displaced children face harsh conditions with dignity.',
    image: '/images/official/bait-ul-aqba/child-winter-relief.png',
    alt: 'A displaced child after receiving winter clothing through Bait ul Aqba',
  },
  {
    name: 'Virtual Adoption Support',
    copy: 'Consistent sponsorship helps protect a child’s basic needs and stability.',
    image: '/images/official/bait-ul-aqba/gaza-child-adoption-packet.png',
    alt: 'A child receiving a support package through Bait ul Aqba’s Virtual Adoption Program',
  },
  {
    name: 'Community Support Gathering',
    copy: 'Families gather while programme support is organised and delivered.',
    image: '/images/official/bait-ul-aqba/community-support-gathering.png',
    alt: 'Families gathered inside a temporary hall during Bait ul Aqba support work',
  },
];

export default function TentSchoolsPage() {
  return (
    <SponsorOrphanProvider>
      <BreadcrumbJsonLd
        items={[
          { name: 'Home', path: '/' },
          { name: 'Tent Schools', path: '/tent-schools' },
        ]}
      />
      <InitiativeContactProvider>
        <Header />
        <main>
          <section
            className="relative flex min-h-[760px] items-end overflow-hidden bg-emerald-deepest pt-24 lg:min-h-[800px]"
            id="home"
          >
            <TentSchoolsHeroBackground />
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-deepest via-emerald-deepest/78 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-t from-emerald-deepest/90 via-transparent to-emerald-deepest/30" />

            <Reveal className="relative z-10 mx-auto w-full max-w-7xl px-5 pb-20 sm:px-8 lg:px-12 lg:pb-24">
              <div className="max-w-2xl">
                <div className="inline-flex items-center gap-2 rounded-full border border-gold/45 bg-emerald-deepest/55 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-gold-soft backdrop-blur">
                  Our Initiatives
                  <span className="text-cream/40">›</span>
                  Tent Schools
                </div>

                <h1 className="mt-7 text-balance font-display text-5xl font-medium leading-[1.02] text-cream-soft sm:text-6xl lg:text-7xl">
                  A classroom today.
                  <br />A <span className="text-gold">future tomorrow.</span>
                </h1>
                <p className="mt-6 max-w-xl text-base leading-relaxed text-cream/80 sm:text-lg">
                  Safe, structured learning inside tent schools gives Gaza&apos;s children the
                  space, support and routine to keep dreaming.
                </p>

                <div className="mt-8 flex flex-wrap gap-3">
                  <InitiativeContactButton
                    initiative="school"
                    label="Build a Tent School"
                    size="lg"
                  />
                  <Button href="#journey" size="lg" variant="outline">
                    See How It Works
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>

                <div className="mt-8 inline-flex items-center gap-2 text-xs font-medium text-cream/65 sm:text-sm">
                  <ShieldCheck className="h-4 w-4 text-gold-soft" />
                  Zero Admin Fees · Verified &amp; Transparent
                </div>
              </div>
            </Reveal>
          </section>

          <section className="bg-emerald-deep" aria-label="Tent school impact">
            <Reveal
              className="mx-auto grid max-w-7xl grid-cols-2 gap-x-6 gap-y-8 px-5 py-10 sm:px-8 lg:grid-cols-3 lg:px-12"
              stagger
            >
              {impactStats.map((stat) => (
                <RevealItem className="flex items-center gap-4" key={stat.label}>
                  <stat.icon className="h-9 w-9 shrink-0 stroke-[1.45] text-gold" />
                  <div>
                    <p className="font-display text-2xl font-semibold text-cream-soft sm:text-3xl">
                      {stat.value}
                    </p>
                    <p className="mt-0.5 text-xs leading-relaxed text-cream/60 sm:text-sm">
                      {stat.label}
                    </p>
                  </div>
                </RevealItem>
              ))}
            </Reveal>
          </section>

          <section className="bg-offwhite py-20 sm:py-24" id="about">
            <Reveal
              className="mx-auto grid max-w-7xl gap-12 px-5 sm:px-8 lg:grid-cols-12 lg:px-12"
              stagger
            >
              <RevealItem className="lg:col-span-3">
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-deep">
                  The need is real
                </p>
                <h2 className="mt-5 font-display text-4xl leading-tight text-emerald-deep">
                  Learning cannot wait.
                </h2>
                <p className="mt-5 text-base leading-relaxed text-ink/65">
                  Too many children in Gaza have had their education interrupted. A tent school
                  restores safety, consistency and hope to their day.
                </p>
                <a
                  className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-emerald-soft transition-colors hover:text-gold-deep"
                  href="#impact"
                >
                  See the full impact
                  <ArrowRight className="h-4 w-4" />
                </a>
              </RevealItem>

              <RevealItem className="grid gap-5 sm:grid-cols-3 lg:col-span-9">
                {needCards.map((item) => (
                  <article className="group" key={item.title}>
                    <div className="relative aspect-[4/3] overflow-hidden rounded-2xl">
                      <Image
                        alt={item.alt}
                        className="object-cover transition duration-700 group-hover:scale-105"
                        fill
                        sizes="(max-width: 768px) 100vw, 30vw"
                        src={item.image}
                      />
                    </div>
                    <h3 className="mt-4 text-base font-semibold text-emerald-deep sm:text-lg">
                      {item.title}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-ink/60">{item.copy}</p>
                  </article>
                ))}
              </RevealItem>
            </Reveal>
          </section>

          <section className="border-y border-emerald/10 bg-cream-soft py-20" id="journey">
            <Reveal className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-12" stagger>
              <RevealItem>
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-deep">
                  Our journey together
                </p>
                <h2 className="mt-4 max-w-xl font-display text-4xl leading-tight text-emerald-deep">
                  From your intention to their first lesson.
                </h2>
              </RevealItem>

              <RevealItem className="relative mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-5">
                <div className="absolute left-[10%] right-[10%] top-7 hidden border-t border-dashed border-gold/45 lg:block" />
                {journey.map((step, index) => (
                  <div className="relative text-center" key={step.title}>
                    <div className="relative mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-offwhite text-emerald-deep shadow-soft">
                      <step.icon className="h-6 w-6 stroke-[1.5]" />
                    </div>
                    <p className="mt-3 text-sm font-semibold text-gold-deep">{index + 1}</p>
                    <h3 className="mt-2 text-base font-semibold text-emerald-deep">{step.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-ink/60">{step.copy}</p>
                  </div>
                ))}
              </RevealItem>

              <RevealItem className="mt-16 border-t border-emerald/10 pt-10">
                <div id="support">
                  <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-deep">
                    What your support provides
                  </p>
                  <div className="mt-8 grid gap-9 sm:grid-cols-2 lg:grid-cols-5">
                    {provisions.map((item) => (
                      <div className="text-center" key={item.title}>
                        <item.icon className="mx-auto h-9 w-9 stroke-[1.4] text-emerald-deep" />
                        <h3 className="mt-4 text-base font-semibold text-emerald-deep sm:text-lg">
                          {item.title}
                        </h3>
                        <p className="mt-2 text-sm leading-relaxed text-ink/60">{item.copy}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </RevealItem>
            </Reveal>
          </section>

          <section
            className="relative overflow-hidden bg-emerald-deep py-16"
            id="impact"
            style={{
              backgroundImage:
                "linear-gradient(rgba(10,46,34,.92), rgba(10,46,34,.96)), url('/images/ornaments/crisis-pattern.svg')",
            }}
          >
            <Reveal
              className="mx-auto grid max-w-7xl gap-8 px-5 sm:px-8 lg:grid-cols-12 lg:px-12"
              stagger
            >
              <RevealItem className="lg:col-span-3">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">
                  Bait ul Aqba on the ground
                </p>
                <h2 className="mt-3 font-display text-4xl leading-tight text-cream-soft">
                  Care delivered with dignity.
                </h2>
                <p className="mt-4 text-sm leading-relaxed text-cream/65">
                  These organisation-published images document related child and family support in
                  Gaza while the Tent Schools initiative develops.
                </p>
                <Button className="mt-6" href="#initiatives" variant="outline">
                  View All Initiatives
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </RevealItem>

              <RevealItem className="grid gap-4 sm:grid-cols-2 lg:col-span-9 lg:grid-cols-4">
                {projects.map((project) => (
                  <article
                    className="group overflow-hidden rounded-2xl border border-gold/15 bg-emerald-deepest/55"
                    key={project.name}
                  >
                    <div className="relative aspect-[4/3] overflow-hidden">
                      <Image
                        alt={project.alt}
                        className="object-cover transition duration-700 group-hover:scale-105"
                        fill
                        sizes="(max-width: 768px) 50vw, 20vw"
                        src={project.image}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-emerald-deepest/70 to-transparent" />
                    </div>
                    <div className="p-4">
                      <h3 className="font-display text-xl font-semibold text-cream-soft">
                        {project.name}
                      </h3>
                      <p className="mt-2 text-xs leading-relaxed text-cream/60">{project.copy}</p>
                    </div>
                  </article>
                ))}
              </RevealItem>
            </Reveal>
          </section>

          <section className="overflow-hidden bg-cream-soft">
            <Reveal className="mx-auto grid max-w-7xl lg:grid-cols-12" stagger>
              <RevealItem className="relative min-h-80 lg:col-span-5 lg:min-h-[460px]">
                <Image
                  alt="A young child speaking into a microphone in front of a temporary school tent in Gaza"
                  className="object-cover object-[center_20%]"
                  fill
                  sizes="(max-width: 1024px) 100vw, 42vw"
                  src="/images/tent-schools/gaza-tent-school-student-speaking.webp"
                />
              </RevealItem>
              <RevealItem className="flex items-center px-8 py-14 lg:col-span-7 lg:px-16">
                <div className="max-w-2xl">
                  <Sparkles className="h-8 w-8 text-gold" />
                  <blockquote className="mt-5 text-balance font-display text-3xl leading-relaxed text-emerald-deep sm:text-4xl">
                    Education is the bridge from survival to possibility.
                  </blockquote>
                  <p className="mt-5 text-sm leading-relaxed text-ink/60">
                    A safe place to learn gives children more than lessons. It restores rhythm,
                    belonging and the confidence to imagine what comes next.
                  </p>
                </div>
              </RevealItem>
            </Reveal>
          </section>

          <InitiativesGrid highlightedTitle="Tent Schools" />

          <section className="relative overflow-hidden bg-emerald-deepest" id="contact">
            <Image
              alt="A male teacher leading a class inside a tent school in the warm evening light"
              className="object-cover object-center"
              fill
              sizes="100vw"
              src="/images/tent-schools/cta-classroom-wide.png"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-deepest via-emerald-deepest/82 to-transparent" />
            <Reveal className="relative mx-auto max-w-7xl px-5 py-24 sm:px-8 lg:px-12 lg:py-32">
              <div className="max-w-xl">
                <h2 className="text-balance font-display text-4xl leading-tight text-cream-soft sm:text-5xl">
                  Help Gaza&apos;s children keep learning.
                </h2>
                <p className="mt-5 text-base leading-relaxed text-cream/75">
                  Your support builds safe tent classrooms and gives children the chance to learn,
                  dream and build a better tomorrow.
                </p>
                <div className="mt-8 flex flex-wrap gap-3">
                  <InitiativeContactButton
                    initiative="school"
                    label="Fund a Tent School"
                    size="lg"
                  />
                </div>
              </div>
            </Reveal>
          </section>
        </main>
        <Footer />
      </InitiativeContactProvider>
    </SponsorOrphanProvider>
  );
}

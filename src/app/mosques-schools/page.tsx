import type { Metadata } from 'next';
import Image from 'next/image';

import {
  ArrowRight,
  BookOpen,
  CalendarDays,
  HandHeart,
  Heart,
  MapPin,
  MoonStar,
  Sparkles,
  Users,
  UsersRound,
} from 'lucide-react';

import { Footer } from '@/components/layout/Footer';
import { Header } from '@/components/layout/Header';
import { InitiativesGrid } from '@/components/sections/InitiativesGrid';
import { MosquesSchoolsHero } from '@/components/sections/MosquesSchoolsHero';
import { StatsBar } from '@/components/sections/StatsBar';
import { Button } from '@/components/ui/Button';
import { Reveal, RevealItem } from '@/components/ui/Reveal';

export const metadata: Metadata = {
  title: 'Mosques & Schools Initiative — Bait ul Aqba',
  description:
    'Help establish temporary mosques and learning spaces for communities rebuilding in Gaza.',
};

const stats = [
  { value: '25+', label: 'Tent Mosques Supported' },
  { value: '15,000+', label: 'Worshippers Benefiting' },
  { value: '8+', label: 'Learning Spaces Established' },
  { value: '7,000+', label: 'Education Beneficiaries' },
  { value: '100%', label: 'Donations to Gaza' },
];

const journey = [
  { label: 'You choose to support mosques and schools.', icon: HandHeart },
  { label: 'We identify urgent locations in Gaza.', icon: MapPin },
  { label: 'We build or set up safe learning spaces.', icon: MoonStar },
  { label: 'Communities gather for worship and support.', icon: UsersRound },
  { label: 'A lasting Sadaqah Jariyah continues.', icon: Heart },
];

const provisions = [
  { title: 'Prayer Space', copy: 'Clean, safe spaces for daily prayers.', icon: MoonStar },
  {
    title: 'Friday Prayers',
    copy: 'Facilities for Jumu’ah and community unity.',
    icon: CalendarDays,
  },
  { title: 'Islamic Education', copy: 'Quran classes and Islamic lessons.', icon: BookOpen },
  { title: 'Community Support', copy: 'A place for talks, support and bonds.', icon: Users },
  { title: 'Hope & Dignity', copy: 'Restoring hope through faith and knowledge.', icon: HandHeart },
];

const projects = [
  {
    name: 'Khan Younis',
    type: 'Tent Mosque',
    image: '/images/mosques-schools/hero-tent-mosque.png',
  },
  { name: 'Rafah', type: 'Tent Mosque', image: '/images/mosques-schools/final-mosque.png' },
  {
    name: 'Deir al-Balah',
    type: 'Learning Space',
    image: '/images/mosques-schools/learning-circle.png',
  },
  {
    name: 'Gaza City',
    type: 'Mosque Rebuilding',
    image: '/images/mosques-schools/damaged-mosque.png',
  },
];

export default function MosquesSchoolsPage() {
  return (
    <>
      <Header />
      <main>
        <MosquesSchoolsHero />

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
                Mosques bring people together.
              </h2>
              <p className="mt-5 text-base leading-relaxed text-ink/65">
                Many mosques in Gaza have been damaged. Families now pray in the open, without
                shelter or basic facilities. Your support rebuilds more than walls — it rebuilds
                faith, unity, and hope.
              </p>
            </RevealItem>

            <RevealItem className="grid gap-5 sm:grid-cols-3 lg:col-span-9">
              {[
                {
                  title: 'Damaged Masjids',
                  copy: 'Countless masjids have been damaged and need careful rebuilding.',
                  image: '/images/mosques-schools/damaged-mosque.png',
                },
                {
                  title: 'Interrupted Worship & Learning',
                  copy: 'People and teachers are deprived of safe spaces for worship and education.',
                  image: '/images/mosques-schools/learning-circle.png',
                },
                {
                  title: 'Temporary Solutions',
                  copy: 'Tent mosques provide an immediate, vital solution for the Ummah.',
                  image: '/images/mosques-schools/hero-tent-mosque.png',
                },
              ].map((item) => (
                <article key={item.title}>
                  <div className="relative aspect-[4/3] overflow-hidden rounded-2xl">
                    <Image
                      alt=""
                      className="object-cover transition duration-700 hover:scale-105"
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
            <div className="grid gap-10 lg:grid-cols-12">
              <RevealItem className="lg:col-span-3">
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-deep">
                  Our journey together
                </p>
                <h2 className="mt-4 font-display text-4xl leading-tight text-emerald-deep">
                  From your intention to lasting reward.
                </h2>
              </RevealItem>
              <RevealItem className="grid gap-7 sm:grid-cols-5 lg:col-span-9">
                {journey.map((step, index) => (
                  <div className="relative text-center" key={step.label}>
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-offwhite text-emerald-deep shadow-soft">
                      <step.icon className="h-6 w-6 stroke-[1.5]" />
                    </div>
                    <p className="mt-3 text-sm font-semibold text-gold-deep">{index + 1}</p>
                    <p className="mt-2 text-sm leading-relaxed text-ink/70">{step.label}</p>
                  </div>
                ))}
              </RevealItem>
            </div>

            <RevealItem className="mt-16 border-t border-emerald/10 pt-10">
              <div id="support">
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-deep">
                  What your support provides
                </p>
                <div className="mt-7 grid gap-8 sm:grid-cols-2 lg:grid-cols-5">
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

        <section className="bg-emerald-deep py-14" id="impact">
          <Reveal
            className="mx-auto grid max-w-7xl gap-8 px-5 sm:px-8 lg:grid-cols-12 lg:px-12"
            stagger
          >
            <RevealItem className="lg:col-span-3">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">
                Real places. Real impact.
              </p>
              <h2 className="mt-3 font-display text-3xl leading-tight text-cream-soft">
                See how your support creates change.
              </h2>
              <Button className="mt-6" href="#contact" variant="outline">
                View All Projects
                <ArrowRight className="h-4 w-4" />
              </Button>
            </RevealItem>
            <RevealItem className="grid gap-4 sm:grid-cols-2 lg:col-span-9 lg:grid-cols-4">
              {projects.map((project) => (
                <article
                  className="group relative aspect-[4/3] overflow-hidden rounded-xl"
                  key={project.name}
                >
                  <Image
                    alt=""
                    className="object-cover transition duration-700 group-hover:scale-105"
                    fill
                    sizes="(max-width: 768px) 50vw, 20vw"
                    src={project.image}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-emerald-deepest via-transparent to-transparent" />
                  <div className="absolute inset-x-0 bottom-0 p-4">
                    <h3 className="text-sm font-semibold text-cream-soft">{project.name}</h3>
                    <p className="text-xs text-cream/65">{project.type}</p>
                  </div>
                </article>
              ))}
            </RevealItem>
          </Reveal>
        </section>

        <section className="overflow-hidden bg-cream-soft">
          <Reveal className="mx-auto grid max-w-7xl lg:grid-cols-12" stagger>
            <RevealItem className="relative min-h-72 lg:col-span-4">
              <Image
                alt="A mosque being carefully rebuilt"
                className="object-cover"
                fill
                sizes="35vw"
                src="/images/mosques-schools/damaged-mosque.png"
              />
            </RevealItem>
            <RevealItem className="flex items-center px-8 py-14 lg:col-span-8 lg:px-16">
              <div className="max-w-2xl">
                <Sparkles className="h-8 w-8 text-gold" />
                <blockquote className="mt-4 font-display text-2xl leading-relaxed text-emerald-deep sm:text-3xl">
                  Whoever relieves a believer’s hardship in this world, Allah will relieve his
                  hardship on the Day of Resurrection.
                </blockquote>
                <p className="mt-4 text-sm text-ink/60">— Sahih Muslim</p>
              </div>
            </RevealItem>
          </Reveal>
        </section>

        <InitiativesGrid highlightedTitle="Mosques & Schools" />
        <StatsBar stats={stats} />

        <section className="relative overflow-hidden bg-emerald-deepest" id="contact">
          <Image
            alt="A worshipper approaching a temporary mosque at sunset"
            className="object-cover object-center"
            fill
            sizes="100vw"
            src="/images/mosques-schools/final-mosque.png"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-deepest via-emerald-deepest/85 to-emerald-deepest/20" />
          <Reveal className="relative mx-auto max-w-7xl px-5 py-24 sm:px-8 lg:px-12 lg:py-32">
            <div className="max-w-xl">
              <h2 className="font-display text-4xl leading-tight text-cream-soft sm:text-5xl">
                Be part of building the future of Islam in Gaza.
              </h2>
              <p className="mt-5 text-base leading-relaxed text-cream/75">
                Every temporary mosque is a step toward a stronger, connected Ummah.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Button href="#" size="lg">
                  Support a Tent Mosque
                  <Heart className="h-4 w-4" />
                </Button>
                <Button href="#" size="lg" variant="outline">
                  Donate Now
                </Button>
                <Button href="#about" size="lg" variant="outline">
                  Learn More
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </Reveal>
        </section>
      </main>
      <Footer />
    </>
  );
}

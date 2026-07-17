import Image from 'next/image';

import type { LucideIcon } from 'lucide-react';
import {
  ArrowRight,
  BadgeCheck,
  BookOpen,
  Box,
  CheckCircle2,
  ClipboardCheck,
  Droplets,
  HandHeart,
  Heart,
  HeartHandshake,
  Home,
  MapPin,
  PackageCheck,
  Salad,
  Search,
  ShieldCheck,
  Shirt,
  Sparkles,
  Truck,
  Users,
  UsersRound,
} from 'lucide-react';

import { Footer } from '@/components/layout/Footer';
import { Header } from '@/components/layout/Header';
import { InitiativesGrid } from '@/components/sections/InitiativesGrid';
import { Button } from '@/components/ui/Button';
import {
  InitiativeContactButton,
  InitiativeContactProvider,
  type SupportInitiative,
} from '@/components/ui/InitiativeContactModal';
import { Reveal, RevealItem } from '@/components/ui/Reveal';
import { SponsorOrphanProvider } from '@/components/ui/SponsorOrphanModal';

type ReliefInitiativeKind = 'food-water' | 'essential-relief' | 'humanitarian';

type Metric = {
  value: string;
  label: string;
  icon: LucideIcon;
};

type ContentCard = {
  title: string;
  copy: string;
  image: string;
  alt: string;
  objectPosition?: string;
  credit?: string;
};

type JourneyStep = {
  title: string;
  copy: string;
  icon: LucideIcon;
};

type Provision = {
  title: string;
  copy: string;
  icon: LucideIcon;
};

type InitiativePageConfig = {
  modalKind: SupportInitiative;
  highlightedTitle: string;
  breadcrumb: string;
  mobileBreadcrumb?: string;
  headline: React.ReactNode;
  heroCopy: string;
  primaryLabel: string;
  secondaryLabel: string;
  secondaryHref?: string;
  heroImage?: string;
  heroAlt?: string;
  heroObjectPosition?: string;
  heroCollage?: ContentCard[];
  metrics: Metric[];
  needEyebrow: string;
  needTitle: string;
  needCopy: string;
  needCards: ContentCard[];
  journeyEyebrow: string;
  journeyTitle: string;
  journey: JourneyStep[];
  provisionsEyebrow: string;
  provisions: Provision[];
  impactEyebrow: string;
  impactTitle: string;
  impactCopy: string;
  projects: ContentCard[];
  quoteImage: string;
  quoteImageAlt: string;
  quoteImageObjectPosition?: string;
  quote: string;
  quoteSource: string;
  quoteCopy: string;
  finalImage: string;
  finalImageAlt: string;
  finalImageObjectPosition?: string;
  finalImageFlipX?: boolean;
  finalEyebrow: string;
  finalTitle: string;
  finalCopy: string;
};

const foodWaterConfig: InitiativePageConfig = {
  modalKind: 'food-water',
  highlightedTitle: 'Food & Water Supply',
  breadcrumb: 'Food & Water Supply',
  headline: (
    <>
      Food for today.
      <br />
      <span className="text-gold">Clean water for tomorrow.</span>
    </>
  ),
  heroCopy:
    'Nutritious food and clean water protect health, restore daily stability and help families face crisis with dignity.',
  primaryLabel: 'Sponsor Food & Water',
  secondaryLabel: 'See How It Works',
  heroImage: '/images/official/bait-ul-aqba/about/hero-water-distribution-cropped.png',
  heroAlt: 'Bait ul Aqba clean-water distribution reaching families in Gaza',
  heroObjectPosition: 'center',
  metrics: [
    { value: '15,000+', label: 'Food beneficiaries', icon: Salad },
    { value: '20,000+', label: 'Water beneficiaries', icon: Droplets },
    { value: 'Verified', label: 'On-the-ground delivery', icon: BadgeCheck },
    { value: 'Gaza', label: 'Direct programme focus', icon: MapPin },
  ],
  needEyebrow: 'The need is immediate',
  needTitle: 'Families need nourishment and clean water — today.',
  needCopy:
    'When safe food and water become difficult to reach, the search for essentials consumes every day. Bait ul Aqba coordinates practical relief around verified needs, local access and dignified delivery.',
  needCards: [
    {
      title: 'Nourishing Food',
      copy: 'Food support is organised around verified family needs and delivered with respect.',
      image: '/images/official/bait-ul-aqba/food-basket-display.webp',
      alt: 'Food staples arranged for Bait ul Aqba and Pak Palestine Forum family food baskets',
      objectPosition: 'center',
      credit: 'Co-published with Pak Palestine Forum',
    },
    {
      title: 'Clean Water',
      copy: 'Water projects and tanker deliveries help communities reach this most essential resource.',
      image: '/images/official/bait-ul-aqba/about/program-clean-water.png',
      alt: 'A child collecting clean water from a Bait ul Aqba water project',
      objectPosition: 'center 38%',
    },
    {
      title: 'Dignified Access',
      copy: 'Locally coordinated distribution keeps care practical, orderly and rooted in local realities.',
      image: '/images/official/bait-ul-aqba/about/community-water-queue.png',
      alt: 'Families queueing for a Bait ul Aqba clean-water delivery in Gaza',
      objectPosition: 'center 38%',
    },
  ],
  journeyEyebrow: 'From your care to a family’s table',
  journeyTitle: 'A clear path from verified need to delivery.',
  journey: [
    {
      title: 'Need Confirmed',
      copy: 'Local partners identify communities facing the most urgent food and water needs.',
      icon: Search,
    },
    {
      title: 'Response Planned',
      copy: 'The right form of support is coordinated around access and local conditions.',
      icon: ClipboardCheck,
    },
    {
      title: 'Supplies Prepared',
      copy: 'Food or water support is sourced and prepared for safe distribution.',
      icon: Box,
    },
    {
      title: 'Delivered Locally',
      copy: 'Trusted teams organise delivery where families can reach it.',
      icon: Truck,
    },
    {
      title: 'Delivery Completed',
      copy: 'Practical relief completes the path that began with a confirmed need.',
      icon: CheckCircle2,
    },
  ],
  provisionsEyebrow: 'What your support provides',
  provisions: [
    { title: 'Food Support', copy: 'Practical nourishment for families in need.', icon: Salad },
    { title: 'Clean Water', copy: 'Safe water for drinking and daily use.', icon: Droplets },
    { title: 'Family Reach', copy: 'Support shaped around household needs.', icon: UsersRound },
    {
      title: 'Verified Delivery',
      copy: 'On-the-ground coordination and follow-through.',
      icon: ShieldCheck,
    },
    {
      title: 'Dignity & Care',
      copy: 'Respect at every point of the response.',
      icon: HeartHandshake,
    },
  ],
  impactEyebrow: 'Real delivery. Real relief.',
  impactTitle: 'On the ground in Gaza.',
  impactCopy:
    'Official field imagery shows water access, community distribution and food support reaching people where they are.',
  projects: [
    {
      title: 'Water Tanker Delivery',
      copy: 'Clean water brought closer to displaced communities.',
      image: '/images/official/bait-ul-aqba/about/verified-water-delivery-cropped.png',
      alt: 'Residents and field workers filling water containers beside a tanker in Gaza',
    },
    {
      title: 'Clean-Water Project',
      copy: 'A completed project helping families collect water locally.',
      image: '/images/official/bait-ul-aqba/about/child-carrying-water.png',
      alt: 'A child carrying water from a Bait ul Aqba clean-water point',
      objectPosition: 'center 42%',
    },
    {
      title: 'Community Access',
      copy: 'Water relief organised around the realities of camp life.',
      image: '/images/official/bait-ul-aqba/about/gaza-camp-water-relief.png',
      alt: 'A clean-water relief point serving a displacement camp in Gaza',
      objectPosition: 'center 38%',
    },
    {
      title: 'Food-Basket Preparation',
      copy: 'Local teams organise family food baskets for coordinated distribution.',
      image: '/images/official/bait-ul-aqba/food-basket-preparation.jpg',
      alt: 'Bait ul Aqba and Pak Palestine Forum teams preparing rows of food baskets in Gaza',
      objectPosition: 'center',
      credit: 'Co-published with Pak Palestine Forum',
    },
  ],
  quoteImage: '/images/official/bait-ul-aqba/about/program-clean-water.png',
  quoteImageAlt: 'A child using a Bait ul Aqba community clean-water project',
  quote: 'And We made from water every living thing.',
  quoteSource: 'Qur’an 21:30',
  quoteCopy:
    'Clean water is life, health and the possibility of an ordinary day. Meeting that need with care protects far more than thirst.',
  finalImage: '/images/official/bait-ul-aqba/about/verified-water-delivery-cropped.png',
  finalImageAlt: 'Residents and field workers filling water containers beside a tanker in Gaza',
  finalEyebrow: 'Together, we bring relief',
  finalTitle: 'Help nourishment and hope reach Gaza.',
  finalCopy:
    'Stand with families as they seek the food, clean water and daily stability every person deserves.',
};

const essentialReliefConfig: InitiativePageConfig = {
  modalKind: 'essential-relief',
  highlightedTitle: 'Essential Relief',
  breadcrumb: 'Essential Relief',
  headline: (
    <>
      Relief when
      <br />
      <span className="text-gold">every hour matters.</span>
    </>
  ),
  heroCopy:
    'Emergency shelter, winter protection and essential supplies help displaced families face each day with greater safety, warmth and dignity.',
  primaryLabel: 'Sponsor Essential Relief',
  secondaryLabel: 'See How It Works',
  heroImage: '/images/official/bait-ul-aqba/essential-supplies-distribution.webp',
  heroAlt:
    'Essential food supplies arranged for distribution in Gaza through Bait ul Aqba and Pak Palestine Forum',
  heroObjectPosition: 'center 52%',
  metrics: [
    { value: '100+', label: 'Emergency relief cases', icon: Home },
    { value: 'Verified', label: 'Needs and delivery', icon: ShieldCheck },
    { value: 'Dignity', label: 'At the heart of care', icon: HeartHandshake },
    { value: 'Gaza', label: 'Direct programme focus', icon: MapPin },
  ],
  needEyebrow: 'When the basics are gone',
  needTitle: 'Safety begins with the essentials.',
  needCopy:
    'Displacement can remove shelter, warmth and the familiar items that make daily life possible. Essential relief responds to those immediate needs while protecting privacy, choice and dignity.',
  needCards: [
    {
      title: 'Temporary Shelter',
      copy: 'Protective temporary spaces give displaced families a safer place to regroup.',
      image: '/images/official/bait-ul-aqba/dome-tent-construction.png',
      alt: 'Workers constructing a temporary dome shelter through Bait ul Aqba in Gaza',
      objectPosition: 'center 42%',
    },
    {
      title: 'Winter Protection',
      copy: 'Seasonal support helps children and families face cold conditions with greater comfort.',
      image: '/images/official/bait-ul-aqba/winter-coat-fitting.png',
      alt: 'A field worker fitting warm clothing onto a child during a Bait ul Aqba distribution',
      objectPosition: 'center 32%',
    },
    {
      title: 'Family Essentials',
      copy: 'Food staples and household basics are organised into practical family packs.',
      image: '/images/official/bait-ul-aqba/family-essentials-prepared.webp',
      alt: 'Food staples arranged beneath a Bait ul Aqba and Pak Palestine Forum banner',
      objectPosition: 'center',
      credit: 'Published by Pak Palestine Forum Relief',
    },
  ],
  journeyEyebrow: 'From an urgent need to safer ground',
  journeyTitle: 'Relief coordinated with care at every step.',
  journey: [
    {
      title: 'Need Assessed',
      copy: 'Local teams confirm what a household needs most urgently.',
      icon: Search,
    },
    {
      title: 'Priority Set',
      copy: 'The response is planned around safety, access and changing conditions.',
      icon: ClipboardCheck,
    },
    {
      title: 'Relief Prepared',
      copy: 'Appropriate shelter or essential support is sourced and organised.',
      icon: PackageCheck,
    },
    {
      title: 'Delivered Safely',
      copy: 'Trusted on-the-ground partners coordinate delivery to families.',
      icon: Truck,
    },
    {
      title: 'Followed Through',
      copy: 'Teams stay attentive as urgent needs and circumstances change.',
      icon: HeartHandshake,
    },
  ],
  provisionsEyebrow: 'What your support provides',
  provisions: [
    { title: 'Emergency Shelter', copy: 'Temporary protection from harsh conditions.', icon: Home },
    {
      title: 'Warm Clothing',
      copy: 'Seasonal clothing support for displaced children.',
      icon: Shirt,
    },
    {
      title: 'Family Essentials',
      copy: 'Practical basics shaped around verified needs.',
      icon: Box,
    },
    {
      title: 'Safe Delivery',
      copy: 'Careful local coordination from source to family.',
      icon: Truck,
    },
    {
      title: 'Dignity-First Support',
      copy: 'Support offered with privacy and respect.',
      icon: Heart,
    },
  ],
  impactEyebrow: 'Relief on the ground',
  impactTitle: 'Urgent needs met with practical care.',
  impactCopy:
    'From building shelter to seasonal protection, these official field moments show relief taking shape around real needs.',
  projects: [
    {
      title: 'Family Shelter',
      copy: 'A child beside temporary shelter within a Gaza displacement camp.',
      image: '/images/official/bait-ul-aqba/shelter-context-family.png',
      alt: 'A child standing beside a temporary family shelter during Bait ul Aqba field relief',
      objectPosition: 'center 12%',
    },
    {
      title: 'Shelter Construction',
      copy: 'Local teams assembling temporary protection on the ground.',
      image: '/images/official/bait-ul-aqba/about/story-shelter-build.png',
      alt: 'Bait ul Aqba and Pak Palestine Forum workers assembling a family shelter in Gaza',
      objectPosition: 'center 45%',
      credit: 'Co-published with Pak Palestine Forum',
    },
    {
      title: 'Winter Support',
      copy: 'Practical seasonal relief helping children face colder days.',
      image: '/images/official/bait-ul-aqba/winter-clothing-recipient.png',
      alt: 'A child wearing newly distributed winter clothing through Bait ul Aqba in Gaza',
      objectPosition: 'center 40%',
    },
    {
      title: 'Prepared Family Packs',
      copy: 'Essential food and household supplies packed for coordinated family distribution.',
      image: '/images/official/bait-ul-aqba/family-relief-packs.webp',
      alt: 'Blue bags packed with essential family supplies for distribution in Gaza',
      objectPosition: 'center',
      credit: 'Published by Pak Palestine Forum Relief',
    },
  ],
  quoteImage: '/images/official/bait-ul-aqba/frozen-meat-handover.png',
  quoteImageAlt:
    'A Bait ul Aqba field worker handing a frozen-meat package to a child beside displacement shelters',
  quoteImageObjectPosition: 'center 48%',
  quote:
    'Whoever relieves a believer’s hardship in this world, Allah will relieve his hardship on the Day of Resurrection.',
  quoteSource: 'Sahih Muslim 2699',
  quoteCopy:
    'Relief is more than an item delivered. It is a moment of protection, reassurance and the knowledge that a family has not been forgotten.',
  finalImage: '/images/official/bait-ul-aqba/essential-relief-packing.webp',
  finalImageAlt:
    'A field worker wearing a Bait ul Aqba vest packing essential food supplies for families in Gaza',
  finalImageObjectPosition: '58% 18%',
  finalEyebrow: 'Safety, warmth and dignity',
  finalTitle: 'Help a family face displacement with greater safety.',
  finalCopy:
    'One conversation can begin practical relief for families navigating displacement and uncertainty.',
};

const humanitarianConfig: InitiativePageConfig = {
  modalKind: 'humanitarian',
  highlightedTitle: 'General Humanitarian Support',
  breadcrumb: 'General Humanitarian Support',
  mobileBreadcrumb: 'Humanitarian',
  headline: (
    <>
      Care where it is
      <br />
      <span className="text-gold">needed most.</span>
    </>
  ),
  heroCopy:
    'Flexible, verified support helps Bait ul Aqba respond to urgent and special cases that do not fit a single programme.',
  primaryLabel: 'Sponsor Humanitarian Support',
  secondaryLabel: 'See Our Response',
  secondaryHref: '#impact',
  heroImage: '/images/official/bait-ul-aqba/humanitarian-field-support.webp',
  heroAlt:
    'A field worker delivering support beside displacement tents in Gaza through Bait ul Aqba and Pak Palestine Forum',
  heroObjectPosition: '30% 18%',
  metrics: [
    { value: 'Needs-led', label: 'Support shaped around assessed needs', icon: Search },
    { value: 'Verified', label: 'Needs checked on the ground', icon: ShieldCheck },
    { value: 'Dignity', label: 'Respect guides each decision', icon: HeartHandshake },
    { value: 'Gaza', label: 'Direct programme focus', icon: MapPin },
  ],
  needEyebrow: 'No two needs look the same',
  needTitle: 'Many situations. One promise of care.',
  needCopy:
    'Some needs are sudden. Others unfold over time. Flexible humanitarian support allows a verified response to follow the situation rather than forcing every family into the same solution.',
  needCards: [
    {
      title: 'Child Wellbeing',
      copy: 'Group activities create moments of connection, play and ordinary childhood.',
      image: '/images/official/bait-ul-aqba/children-community-activity.png',
      alt: 'Children taking part in a Bait ul Aqba community wellbeing activity',
      objectPosition: 'center 38%',
    },
    {
      title: 'Direct Family Relief',
      copy: 'Practical food support reaches families directly within displacement camps.',
      image: '/images/official/bait-ul-aqba/frozen-meat-family-delivery.png',
      alt: 'A Bait ul Aqba field worker delivering frozen meat to a family in a Gaza camp',
      objectPosition: 'center 46%',
    },
    {
      title: 'Orphan Support',
      copy: 'Programme records are checked carefully before sponsorship support reaches participating families.',
      image: '/images/official/bait-ul-aqba/adoption-record-verification.png',
      alt: 'A Bait ul Aqba field worker verifying Virtual Child Adoption programme records',
      objectPosition: 'center 40%',
    },
  ],
  journeyEyebrow: 'From a verified need to meaningful care',
  journeyTitle: 'A flexible response, grounded in accountability.',
  journey: [
    {
      title: 'Need Identified',
      copy: 'A family, partner or local team brings a situation forward.',
      icon: Search,
    },
    {
      title: 'Case Verified',
      copy: 'Details are checked so the response begins with clear context.',
      icon: ShieldCheck,
    },
    {
      title: 'Support Shaped',
      copy: 'The response is adapted to what will help most in that moment.',
      icon: HeartHandshake,
    },
    {
      title: 'Care Delivered',
      copy: 'Local partners coordinate support with sensitivity and respect.',
      icon: Users,
    },
    {
      title: 'Followed Through',
      copy: 'The team stays attentive to what changes after the response.',
      icon: CheckCircle2,
    },
  ],
  provisionsEyebrow: 'How flexible support helps',
  provisions: [
    {
      title: 'Child Wellbeing',
      copy: 'Group activities and moments of play.',
      icon: BookOpen,
    },
    { title: 'Family Essentials', copy: 'Practical support for changing daily needs.', icon: Box },
    { title: 'Community Care', copy: 'Shared spaces and collective support.', icon: UsersRound },
    { title: 'Urgent Cases', copy: 'Focused attention when a need cannot wait.', icon: HandHeart },
    {
      title: 'Follow-through',
      copy: 'Flexible support for changing needs.',
      icon: CheckCircle2,
    },
  ],
  impactEyebrow: 'Care in action',
  impactTitle: 'Human support, shaped around real life.',
  impactCopy:
    'These official programme moments reflect a broad response: listening, gathering, wellbeing and practical care delivered in community.',
  projects: [
    {
      title: 'Sponsorship Distribution',
      copy: 'A Virtual Adoption distribution bringing participating families together.',
      image: '/images/official/bait-ul-aqba/community-support-gathering.png',
      alt: 'Families gathered for a Bait ul Aqba Virtual Adoption distribution',
      objectPosition: 'center 42%',
    },
    {
      title: 'Programme Briefing',
      copy: 'Virtual Adoption information shared directly with participating families.',
      image: '/images/official/bait-ul-aqba/programme-representative-speaking.png',
      alt: 'A representative briefing families during a Virtual Adoption distribution',
      objectPosition: 'center 38%',
    },
    {
      title: 'Children’s Wellbeing',
      copy: 'A structured group activity bringing children together.',
      image: '/images/official/bait-ul-aqba/children-wellbeing-session.png',
      alt: 'Children engaged in a Bait ul Aqba wellbeing session',
      objectPosition: 'center 40%',
    },
    {
      title: 'Moments of Joy',
      copy: 'Care that makes space for connection and ordinary childhood.',
      image: '/images/official/bait-ul-aqba/children-ramadan-joy.png',
      alt: 'Three children laughing together beside displacement shelters in Gaza',
      objectPosition: 'center',
    },
  ],
  quoteImage: '/images/official/bait-ul-aqba/children-receiving-support.png',
  quoteImageAlt: 'Children receiving practical support during a Bait ul Aqba activity in Gaza',
  quoteImageObjectPosition: 'center 45%',
  quote: 'The most beloved people to Allah are those who are most beneficial to people.',
  quoteSource: 'Al-Mu‘jam al-Awsat 6192',
  quoteCopy:
    'Dignity guides every response: listening first, recognising individual circumstances and offering support that protects choice and privacy.',
  finalImage: '/images/official/bait-ul-aqba/humanitarian-relief-preparation.webp',
  finalImageAlt:
    'Bait ul Aqba and Pak Palestine Forum field workers coordinating food-basket support in Gaza',
  finalImageObjectPosition: 'center 10%',
  finalImageFlipX: true,
  finalEyebrow: 'Stand with families',
  finalTitle: 'Be there through urgent and changing needs.',
  finalCopy:
    'Flexible humanitarian care helps the team respond when a verified need is urgent, unusual or changing quickly.',
};

const configs: Record<ReliefInitiativeKind, InitiativePageConfig> = {
  'food-water': foodWaterConfig,
  'essential-relief': essentialReliefConfig,
  humanitarian: humanitarianConfig,
};

export function ReliefInitiativePage({ kind }: { kind: ReliefInitiativeKind }) {
  const config = configs[kind];

  return (
    <SponsorOrphanProvider>
      <InitiativeContactProvider>
        <Header />
        <main>
          {config.heroCollage ? (
            <CollageHero config={config} />
          ) : (
            <PhotographicHero config={config} />
          )}
          <MetricsStrip metrics={config.metrics} />

          <section className="bg-offwhite py-20 sm:py-24" id="about">
            <Reveal
              className="mx-auto grid max-w-7xl gap-12 px-5 sm:px-8 lg:grid-cols-12 lg:px-12"
              stagger
            >
              <RevealItem className="lg:col-span-3">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-gold-deep">
                  {config.needEyebrow}
                </p>
                <h2 className="mt-5 text-balance font-display text-4xl leading-tight text-emerald-deep">
                  {config.needTitle}
                </h2>
                <p className="mt-5 text-base leading-relaxed text-ink/65">{config.needCopy}</p>
              </RevealItem>

              <RevealItem className="grid gap-5 sm:grid-cols-3 lg:col-span-9">
                {config.needCards.map((item) => (
                  <article className="group" key={item.title}>
                    <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-cream">
                      <Image
                        alt={item.alt}
                        className="object-cover transition duration-700 group-hover:scale-105"
                        fill
                        sizes="(max-width: 768px) 100vw, 30vw"
                        src={item.image}
                        style={{ objectPosition: item.objectPosition }}
                      />
                    </div>
                    <h3 className="mt-4 text-lg font-semibold text-emerald-deep">{item.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-ink/60">{item.copy}</p>
                    {item.credit ? (
                      <p className="mt-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-gold-deep">
                        {item.credit}
                      </p>
                    ) : null}
                  </article>
                ))}
              </RevealItem>
            </Reveal>
          </section>

          <section className="border-y border-emerald/10 bg-cream-soft py-20" id="journey">
            <Reveal className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-12" stagger>
              <RevealItem className="text-center">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-gold-deep">
                  {config.journeyEyebrow}
                </p>
                <h2 className="mx-auto mt-4 max-w-2xl text-balance font-display text-4xl leading-tight text-emerald-deep">
                  {config.journeyTitle}
                </h2>
              </RevealItem>

              <RevealItem className="relative mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-5">
                <div className="absolute left-[10%] right-[10%] top-7 hidden border-t border-dashed border-gold/45 lg:block" />
                {config.journey.map((step, index) => (
                  <div className="relative text-center" key={step.title}>
                    <div className="relative mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-gold/20 bg-offwhite text-emerald-deep shadow-soft">
                      <step.icon className="h-6 w-6 stroke-[1.5]" />
                    </div>
                    <p className="mt-3 text-sm font-semibold text-gold-deep">
                      {String(index + 1).padStart(2, '0')}
                    </p>
                    <h3 className="mt-2 text-base font-semibold text-emerald-deep">{step.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-ink/60">{step.copy}</p>
                  </div>
                ))}
              </RevealItem>

              <RevealItem className="mt-16 rounded-3xl border border-gold/15 bg-offwhite px-6 py-9 shadow-soft sm:px-9">
                <p className="text-center text-xs font-semibold uppercase tracking-[0.22em] text-gold-deep">
                  {config.provisionsEyebrow}
                </p>
                <div className="mt-8 grid gap-9 sm:grid-cols-2 lg:grid-cols-5">
                  {config.provisions.map((item) => (
                    <div className="text-center" key={item.title}>
                      <item.icon className="mx-auto h-8 w-8 stroke-[1.4] text-emerald-deep" />
                      <h3 className="mt-4 text-base font-semibold text-emerald-deep">
                        {item.title}
                      </h3>
                      <p className="mt-2 text-sm leading-relaxed text-ink/55">{item.copy}</p>
                    </div>
                  ))}
                </div>
              </RevealItem>
            </Reveal>
          </section>

          <section className="relative overflow-hidden bg-emerald-deep py-20" id="impact">
            <div
              className="pointer-events-none absolute inset-0 bg-repeat opacity-[0.055]"
              style={{ backgroundImage: "url('/images/ornaments/crisis-pattern.svg')" }}
            />
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(200,163,91,0.12),transparent_26%),radial-gradient(circle_at_85%_70%,rgba(216,189,134,0.08),transparent_30%)]" />
            <Reveal className="relative mx-auto max-w-7xl px-5 sm:px-8 lg:px-12" stagger>
              <RevealItem className="grid gap-8 lg:grid-cols-12 lg:items-end">
                <div className="lg:col-span-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-gold">
                    {config.impactEyebrow}
                  </p>
                  <h2 className="mt-4 font-display text-4xl leading-tight text-cream-soft">
                    {config.impactTitle}
                  </h2>
                </div>
                <p className="max-w-2xl text-base leading-relaxed text-cream/65 lg:col-span-7 lg:justify-self-end">
                  {config.impactCopy}
                </p>
              </RevealItem>

              <RevealItem className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {config.projects.map((project) => (
                  <article
                    className="group relative aspect-[4/5] overflow-hidden rounded-2xl border border-gold/15 bg-emerald-deepest"
                    key={project.title}
                  >
                    <Image
                      alt={project.alt}
                      className="object-cover transition duration-700 group-hover:scale-105"
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 22vw"
                      src={project.image}
                      style={{ objectPosition: project.objectPosition }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-emerald-deepest via-emerald-deepest/15 to-transparent" />
                    <div className="absolute inset-x-0 bottom-0 p-5">
                      {project.credit ? (
                        <p className="mb-2 text-[9px] font-semibold uppercase tracking-[0.14em] text-gold-soft">
                          {project.credit}
                        </p>
                      ) : null}
                      <h3 className="font-display text-xl font-semibold text-cream-soft">
                        {project.title}
                      </h3>
                      <p className="mt-1 text-sm leading-relaxed text-cream/65">{project.copy}</p>
                    </div>
                  </article>
                ))}
              </RevealItem>
            </Reveal>
          </section>

          <section className="overflow-hidden bg-cream-soft">
            <Reveal className="mx-auto grid max-w-7xl lg:grid-cols-12" stagger>
              <RevealItem className="relative min-h-[24rem] lg:col-span-5 lg:min-h-[34rem]">
                <Image
                  alt={config.quoteImageAlt}
                  className="object-cover"
                  fill
                  sizes="(max-width: 1024px) 100vw, 42vw"
                  src={config.quoteImage}
                  style={{ objectPosition: config.quoteImageObjectPosition }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-emerald-deepest/25 to-transparent" />
              </RevealItem>
              <RevealItem className="flex items-center px-7 py-14 sm:px-10 lg:col-span-7 lg:px-16">
                <div className="max-w-2xl">
                  <Sparkles className="h-8 w-8 text-gold" />
                  <blockquote className="mt-5 text-balance font-display text-3xl leading-relaxed text-emerald-deep sm:text-4xl">
                    “{config.quote}”
                  </blockquote>
                  <p className="mt-5 text-sm font-semibold uppercase tracking-[0.18em] text-gold-deep">
                    — {config.quoteSource}
                  </p>
                  <p className="mt-7 max-w-xl border-t border-emerald/10 pt-6 text-base leading-relaxed text-ink/60">
                    {config.quoteCopy}
                  </p>
                </div>
              </RevealItem>
            </Reveal>
          </section>

          <InitiativesGrid highlightedTitle={config.highlightedTitle} />

          <section className="relative overflow-hidden bg-emerald-deepest" id="contact">
            <Image
              alt={config.finalImageAlt}
              className="object-cover"
              fill
              sizes="100vw"
              src={config.finalImage}
              style={{
                objectPosition: config.finalImageObjectPosition,
                transform: config.finalImageFlipX ? 'scaleX(-1)' : undefined,
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-deepest via-emerald-deepest/90 to-emerald-deepest/35" />
            <Reveal className="relative mx-auto max-w-7xl px-5 py-24 sm:px-8 lg:px-12 lg:py-32">
              <div className="max-w-2xl">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-gold">
                  {config.finalEyebrow}
                </p>
                <h2 className="mt-4 text-balance font-display text-4xl leading-tight text-cream-soft sm:text-5xl">
                  {config.finalTitle}
                </h2>
                <p className="mt-5 max-w-xl text-base leading-relaxed text-cream/72">
                  {config.finalCopy}
                </p>
                <div className="mt-8">
                  <InitiativeContactButton
                    initiative={config.modalKind}
                    label={config.primaryLabel}
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

function HeroActions({ config }: { config: InitiativePageConfig }) {
  return (
    <div className="mt-8 flex flex-wrap gap-3">
      <InitiativeContactButton
        initiative={config.modalKind}
        label={config.primaryLabel}
        size="lg"
      />
      <Button href={config.secondaryHref ?? '#journey'} size="lg" variant="outline">
        {config.secondaryLabel}
        <ArrowRight className="h-4 w-4" />
      </Button>
    </div>
  );
}

function HeroCopy({ config }: { config: InitiativePageConfig }) {
  return (
    <div className="max-w-3xl">
      <nav
        aria-label="Breadcrumb"
        className="inline-flex items-center gap-2 rounded-full border border-gold/45 bg-emerald-deepest/55 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-gold-soft backdrop-blur"
      >
        <a className="transition-colors hover:text-gold" href="#initiatives">
          Our Initiatives
        </a>
        <span className="text-cream/40">›</span>
        <span aria-current="page" className="hidden sm:inline">
          {config.breadcrumb}
        </span>
        <span aria-current="page" className="sm:hidden">
          {config.mobileBreadcrumb ?? config.breadcrumb}
        </span>
      </nav>
      <h1 className="mt-7 text-balance font-display text-5xl font-medium leading-[1.02] text-cream-soft sm:text-6xl lg:text-7xl">
        {config.headline}
      </h1>
      <p className="mt-6 max-w-xl text-base leading-relaxed text-cream/80 sm:text-lg">
        {config.heroCopy}
      </p>
      <HeroActions config={config} />
      <div className="mt-8 inline-flex items-center gap-2 text-xs font-medium text-cream/65 sm:text-sm">
        <ShieldCheck className="h-4 w-4 text-gold-soft" />
        Verified &amp; Transparent · Dignity First
      </div>
    </div>
  );
}

function PhotographicHero({ config }: { config: InitiativePageConfig }) {
  if (!config.heroImage || !config.heroAlt) return null;

  return (
    <section
      className="relative flex min-h-[760px] items-end overflow-hidden bg-emerald-deepest pt-24 lg:min-h-[800px]"
      id="home"
    >
      <Image
        alt={config.heroAlt}
        className="object-cover"
        fill
        priority
        sizes="100vw"
        src={config.heroImage}
        style={{ objectPosition: config.heroObjectPosition }}
      />
      <div className="absolute inset-0 bg-gradient-to-r from-emerald-deepest via-emerald-deepest/82 to-emerald-deepest/10" />
      <div className="absolute inset-0 bg-gradient-to-t from-emerald-deepest/90 via-transparent to-emerald-deepest/35" />
      <Reveal className="relative z-10 mx-auto w-full max-w-7xl px-5 pb-20 sm:px-8 lg:px-12 lg:pb-24">
        <HeroCopy config={config} />
      </Reveal>
    </section>
  );
}

function CollageHero({ config }: { config: InitiativePageConfig }) {
  return (
    <section className="relative overflow-hidden bg-emerald-deepest pt-20" id="home">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_12%_18%,rgba(200,163,91,0.13),transparent_27%),radial-gradient(circle_at_82%_60%,rgba(20,84,63,0.8),transparent_42%)]" />
      <Reveal
        className="relative mx-auto grid min-h-[680px] max-w-7xl items-center gap-12 px-5 py-16 sm:px-8 lg:grid-cols-12 lg:px-12 lg:py-20"
        stagger
      >
        <RevealItem className="lg:col-span-6">
          <HeroCopy config={config} />
        </RevealItem>
        <RevealItem className="grid grid-cols-2 gap-3 lg:col-span-6">
          {config.heroCollage?.map((item, index) => (
            <div
              className={`relative aspect-[4/3] overflow-hidden rounded-2xl border border-gold/20 bg-emerald ${
                index > 1 ? 'hidden sm:block' : ''
              } ${index === 0 || index === 3 ? 'sm:aspect-[5/4]' : 'sm:aspect-[4/5]'}`}
              key={item.title}
            >
              <Image
                alt={item.alt}
                className="object-cover"
                fill
                priority={index < 2}
                sizes="(max-width: 1024px) 45vw, 24vw"
                src={item.image}
                style={{ objectPosition: item.objectPosition }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-emerald-deepest/35 to-transparent" />
            </div>
          ))}
        </RevealItem>
      </Reveal>
    </section>
  );
}

function MetricsStrip({ metrics }: { metrics: Metric[] }) {
  return (
    <section
      aria-label="Initiative impact and trust indicators"
      className="border-y border-gold/15 bg-emerald-deep py-7"
    >
      <Reveal
        className="mx-auto grid max-w-7xl grid-cols-2 gap-y-7 px-5 sm:px-8 lg:grid-cols-4 lg:px-12"
        stagger
      >
        {metrics.map((metric, index) => (
          <RevealItem
            className={`flex items-center gap-4 px-2 sm:px-5 ${
              index > 0 ? 'lg:border-l lg:border-gold/20' : ''
            }`}
            key={`${metric.value}-${metric.label}`}
          >
            <metric.icon className="h-8 w-8 shrink-0 stroke-[1.5] text-gold" />
            <div>
              <p className="font-display text-2xl font-semibold leading-none text-gold-soft sm:text-3xl">
                {metric.value}
              </p>
              <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-cream/60 sm:text-xs">
                {metric.label}
              </p>
            </div>
          </RevealItem>
        ))}
      </Reveal>
    </section>
  );
}

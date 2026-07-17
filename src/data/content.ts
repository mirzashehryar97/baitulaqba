import type { LucideIcon } from 'lucide-react';
import {
  Award,
  Banknote,
  BookOpen,
  ClipboardCheck,
  HandHeart,
  Heart,
  Home,
  MessageCircle,
  MoonStar,
  MousePointerClick,
  Salad,
  School,
  Shield,
  ShieldCheck,
  Shirt,
  Smile,
  Stethoscope,
  TrendingUp,
  Users,
  UsersRound,
} from 'lucide-react';

export const NAV_LINKS = [
  { label: 'Home', href: '/' },
  { label: 'About Us', href: '/about' },
  { label: 'Our Initiatives', href: '#initiatives' },
  { label: 'Virtual Adoption', href: '#adoption' },
  { label: 'Impact', href: '#impact' },
  { label: 'Blog', href: '#blog' },
  { label: 'Contact', href: '#contact' },
] as const;

export const LANGUAGES = ['EN', 'AR', 'UR', 'FR'] as const;

export const CONTACT = {
  whatsapp: {
    label: '+92 318 7817987',
    href: 'https://wa.me/923187817987',
  },
  phones: ['0334 3175741'],
  offices: ['Islamabad', 'Lahore'],
} as const;

export const SOCIAL_LINKS = [
  { label: 'Facebook', href: 'https://facebook.com/baitulaqba', handle: '@baitulaqba' },
  { label: 'Instagram', href: 'https://instagram.com/baitulaqba', handle: '@baitulaqba' },
  {
    label: 'YouTube',
    href: 'https://youtube.com/@baitulaqbafoundation',
    handle: '@baitulaqbafoundation',
  },
] as const;

export const HERO_BADGES = [
  { icon: HandHeart, label: 'Zero Admin Fees' },
  { icon: ShieldCheck, label: 'Verified & Transparent' },
  { icon: Heart, label: 'Zakat Eligible' },
] as const;

export type ProcessStep = {
  icon: LucideIcon;
  title: string;
  description: string;
};

export const PROCESS_STEPS: ProcessStep[] = [
  {
    icon: MousePointerClick,
    title: 'You choose to sponsor',
    description: 'You take the first step toward changing a child’s life.',
  },
  {
    icon: UsersRound,
    title: 'We match you with an orphan',
    description: 'We identify & verify an orphan and share their profile with you.',
  },
  {
    icon: Award,
    title: 'You receive your adoption certificate',
    description: 'A virtual adoption certificate confirms your sponsorship of the child.',
  },
  {
    icon: BookOpen,
    title: 'Care, education & essentials reach them',
    description: 'Monthly support delivers food, healthcare, education and daily essentials.',
  },
  {
    icon: MessageCircle,
    title: 'You stay directly connected',
    description: 'Speak with your child and their guardian through video, audio and messaging.',
  },
];

export type JourneyCard = {
  step: number;
  text: string;
  image?: string;
  highlight?: boolean;
};

export const JOURNEY_CARDS: JourneyCard[] = [
  {
    step: 1,
    text: 'A child in Gaza faces the loss of stability and support.',
    image: '/images/official/bait-ul-aqba/gaza-child-adoption-packet.png',
  },
  {
    step: 2,
    text: 'Families carry the weight of essential daily needs.',
    image: '/images/official/bait-ul-aqba/children-receiving-support.png',
  },
  {
    step: 3,
    text: 'Consistent care creates moments of connection and support.',
    image: '/images/official/bait-ul-aqba/children-community-activity.png',
  },
  {
    step: 4,
    text: 'A safer, more hopeful childhood becomes possible again.',
    image: '/images/official/bait-ul-aqba/child-joy-activity.png',
  },
];

export type TransparencyStep = {
  icon: LucideIcon;
  title: string;
  description: string;
};

export const TRANSPARENCY_STEPS: TransparencyStep[] = [
  {
    icon: Users,
    title: 'Family Identified',
    description: 'We identify orphans in Gaza through our local partners.',
  },
  {
    icon: ShieldCheck,
    title: 'Verification Completed',
    description: 'Every case is verified through strict checks and documentation.',
  },
  {
    icon: ClipboardCheck,
    title: 'Need Assessed',
    description: 'We assess the child’s needs to provide the right support.',
  },
  {
    icon: HandHeart,
    title: 'Sponsorship Assigned',
    description: 'You are matched with a verified child and sponsorship begins.',
  },
  {
    icon: Banknote,
    title: 'Funds Transferred',
    description:
      'Support is sent through safe, verified financial channels, fully coordinated with local authorities in Palestine.',
  },
  {
    icon: TrendingUp,
    title: 'Delivered & Monitored',
    description:
      'Local partners deliver support and continue monitoring the child’s needs and well-being.',
  },
];

export type ImpactBenefit = {
  icon: LucideIcon;
  title: string;
};

export const IMPACT_BENEFITS: ImpactBenefit[] = [
  { icon: Salad, title: 'Nutritious Food' },
  { icon: School, title: 'School Education' },
  { icon: Stethoscope, title: 'Healthcare' },
  { icon: Shirt, title: 'Clothing & Essentials' },
  { icon: Smile, title: 'Emotional Support' },
];

export const IMPACT_DURATIONS = ['1 Month', '6 Months', '12 Months', '24 Months'] as const;

export type Initiative = {
  icon: LucideIcon;
  title: string;
  description: string;
  href?: string;
  highlight?: boolean;
};

export const INITIATIVES: Initiative[] = [
  {
    icon: HandHeart,
    title: 'Virtual Child Adoption Program',
    description: 'Long-term care for children in Gaza.',
    href: '/#home',
    highlight: true,
  },
  {
    icon: Salad,
    title: 'Food & Water Supply',
    description: 'Essential food and clean water for those in need.',
    href: '/food-water-supply',
  },
  {
    icon: Shield,
    title: 'Essential Relief',
    description: 'Urgent shelter, seasonal protection and basics during crises.',
    href: '/essential-relief',
  },
  {
    icon: MoonStar,
    title: 'Mosques',
    description: 'Restoring places of worship and Qur’an learning.',
    href: '/mosques',
  },
  {
    icon: BookOpen,
    title: 'Tent Schools',
    description: 'Safe temporary classrooms where children can keep learning.',
    href: '/tent-schools',
  },
  {
    icon: Home,
    title: 'General Humanitarian Support',
    description: 'Helping urgent and special cases.',
    href: '/general-humanitarian-support',
  },
];

export type Stat = {
  value: string;
  label: string;
};

export const STATS: Stat[] = [
  { value: '700+', label: 'Orphans Supported' },
  { value: '15,000+', label: 'Food Beneficiaries' },
  { value: '20,000+', label: 'Water Beneficiaries' },
  { value: '300+', label: 'Active Donors' },
];

export type ContextStat = {
  value: string;
  label: string;
};

// Source: Ministry of Information, Gaza (see program profile).
export const CONTEXT_STATS: ContextStat[] = [
  { value: '64,616', label: 'children in Gaza are now orphans' },
  { value: '3,209', label: 'children have lost both parents' },
  { value: '826', label: 'children have lost their entire family' },
];

export const CONTEXT_ADOPTED_SHARE = '1.06%';

export type SponsorTestimonial = {
  name: string;
  location: string;
  text: string;
};

export const SPONSOR_TESTIMONIALS: SponsorTestimonial[] = [
  {
    name: 'Ahmad Hassan',
    location: 'Pakistan',
    text: 'Being able to connect with my sponsored child through updates has been a truly moving experience. Watching their daily life moments in Gaza has touched my heart in ways I can’t describe.',
  },
  {
    name: 'Sarah Khan',
    location: 'Pakistan',
    text: 'Supporting an orphan through this program has been one of the most meaningful decisions of my life. The updates and photos remind me that even a small contribution can bring real hope.',
  },
  {
    name: 'Mohammed Ali',
    location: 'Pakistan',
    text: 'I never imagined how much joy I would feel from helping an orphan in Gaza. The letters and video messages make me feel like part of their family.',
  },
];

export type Quote = {
  arabic?: string;
  text: string;
  source: string;
};

export const QUOTES = {
  hero: {
    arabic: 'وَيُطْعِمُونَ الطَّعَامَ عَلَىٰ حُبِّهِ مِسْكِينًا وَيَتِيمًا وَأَسِيرًا',
    text: 'And they give food, despite loving it, to the needy, the orphan, and the captive.',
    source: 'Surah Al-Insan (76:8)',
  },
  hadith: {
    text: 'I and the person who looks after an orphan and provides for him will be in Paradise like this.',
    source: 'Sahih al-Bukhari 6005',
  },
  process: {
    text: 'The most beloved people to Allah are those who are most beneficial to people.',
    source: 'Al-Mu‘jam al-Awsat',
  },
  transparency: {
    text: 'Each of you is a shepherd, and each of you is responsible for those under your care.',
    source: 'Sahih al-Bukhari & Sahih Muslim',
  },
  impact: {
    text: 'Whoever relieves a believer’s hardship, Allah will relieve his hardship on the Day of Resurrection.',
    source: 'Sahih Muslim',
  },
  finalCta: {
    text: 'The best house among the Muslims is the house in which an orphan is treated well.',
    source: 'Sunan Ibn Majah',
  },
  orphanStatus: {
    text: 'Islam places a special emphasis on caring for orphans.',
    source: 'The Orphan’s Status in Islam',
  },
} satisfies Record<string, Quote>;

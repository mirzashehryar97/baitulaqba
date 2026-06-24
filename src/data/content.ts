import type { LucideIcon } from 'lucide-react';
import {
  BookOpen,
  ClipboardCheck,
  Gift,
  HandHeart,
  Heart,
  Home,
  Mail,
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
  { label: 'Home', href: '#home' },
  { label: 'About Us', href: '#about' },
  { label: 'Our Initiatives', href: '#initiatives' },
  { label: 'Virtual Adoption', href: '#adoption' },
  { label: 'Impact', href: '#impact' },
  { label: 'Blog', href: '#blog' },
  { label: 'Contact', href: '#contact' },
] as const;

export const LANGUAGES = ['EN', 'AR', 'UR', 'FR'] as const;

export const HERO_BADGES = [
  { icon: HandHeart, label: '100% Donations to Gaza' },
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
    description: 'We identify & verify an orphan who needs your support.',
  },
  {
    icon: Gift,
    title: 'Your support reaches them',
    description: 'Monthly support is delivered directly to the child and family.',
  },
  {
    icon: BookOpen,
    title: 'They receive care, education & more',
    description: 'Food, healthcare, education and daily essentials are provided.',
  },
  {
    icon: Mail,
    title: 'You receive updates & impact reports',
    description: 'You stay connected and see the difference you are making.',
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
    text: 'Ahmed lost the person who provided for his family.',
    image: '/images/journey-child.jpg',
  },
  {
    step: 2,
    text: 'His mother now struggles to cover essential expenses.',
    image: '/images/journey-mother.jpg',
  },
  {
    step: 3,
    text: 'Ahmed stays in school and receives the care he needs.',
    image: '/images/child-study.jpg',
  },
  {
    step: 4,
    text: 'His future becomes possible again.',
    image: '/images/journey-future.jpg',
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
    description: 'You are matched with a child and sponsorship begins.',
  },
  {
    icon: TrendingUp,
    title: 'Ongoing Monitoring',
    description: 'We continuously monitor and provide updates on impact & well-being.',
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
  highlight?: boolean;
};

export const INITIATIVES: Initiative[] = [
  {
    icon: HandHeart,
    title: 'Virtual Child Adoption Program',
    description: 'Long-term care for children in Gaza.',
    highlight: true,
  },
  {
    icon: Salad,
    title: 'Food & Water Supply',
    description: 'Essential food and clean water for those in need.',
  },
  {
    icon: Shield,
    title: 'Essential Relief',
    description: 'Urgent shelter, medical care and basics during crises.',
  },
  {
    icon: School,
    title: 'Mosques & Schools',
    description: 'Restoring places of worship and education.',
  },
  {
    icon: Home,
    title: 'General Humanitarian Support',
    description: 'Helping urgent and special cases.',
  },
];

export type Stat = {
  value: string;
  label: string;
};

export const STATS: Stat[] = [
  { value: '600+', label: 'Orphans Supported' },
  { value: '15,000+', label: 'Food Beneficiaries' },
  { value: '20,000+', label: 'Water Beneficiaries' },
  { value: '300+', label: 'Active Donors' },
  { value: '100%', label: 'Donations to Gaza' },
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
    text: 'The one who cares for an orphan and I will be together in Paradise like this.',
    source: 'Sahih al-Bukhari',
  },
  process: {
    text: 'The most beloved people to Allah are those who are most beneficial to people.',
    source: 'Al-Mu‘jam al-Awsat',
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

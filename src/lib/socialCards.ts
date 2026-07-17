export type SocialCardDefinition = {
  number: string;
  eyebrow: string;
  headline: readonly string[];
  accent: readonly string[];
  supporting: string;
  focus: string;
  alt: string;
};

/**
 * Route-specific copy for generated Open Graph and X/Twitter cards.
 *
 * Keep this content short enough to remain readable in compact link previews.
 * The cards deliberately use graphic treatments rather than beneficiary
 * photography so social sharing does not imply consent or programme ownership
 * beyond what is documented on the corresponding page.
 */
export const SOCIAL_CARDS = {
  home: {
    number: '01',
    eyebrow: 'GAZA ORPHAN SPONSORSHIP',
    headline: ['One child.', 'One future.'],
    accent: ['You can protect.'],
    supporting: 'Care, education and hope for orphans in Gaza.',
    focus: 'SPONSORSHIP',
    alt: 'Bait ul Aqba Gaza orphan sponsorship: One child. One future. You can protect.',
  },
  about: {
    number: '02',
    eyebrow: 'ABOUT BAIT UL AQBA',
    headline: ['A legacy of unity.'],
    accent: ['A promise of care.'],
    supporting: 'Rooted in Pakistan. Standing with Gaza.',
    focus: 'OUR MISSION',
    alt: 'About Bait ul Aqba: A legacy of unity and a promise of care.',
  },
  tentSchools: {
    number: '03',
    eyebrow: 'TENT SCHOOLS IN GAZA',
    headline: ['A classroom today.'],
    accent: ['A future tomorrow.'],
    supporting: 'Safe, structured learning for children in Gaza.',
    focus: 'EDUCATION',
    alt: 'Bait ul Aqba Tent Schools: A classroom today. A future tomorrow.',
  },
  mosques: {
    number: '04',
    eyebrow: 'MOSQUES IN GAZA',
    headline: ['Building places', 'of worship.'],
    accent: ['Nurturing hearts.'],
    supporting: 'Temporary spaces for prayer, Qur’an learning and community in Gaza.',
    focus: 'WORSHIP',
    alt: 'Bait ul Aqba Mosques: Building places of worship and nurturing hearts.',
  },
  foodWater: {
    number: '05',
    eyebrow: 'FOOD & WATER SUPPLY',
    headline: ['Food for today.'],
    accent: ['Clean water', 'for tomorrow.'],
    supporting: 'Food and clean-water support for families in Gaza.',
    focus: 'FOOD & WATER',
    alt: 'Bait ul Aqba Food and Water Supply: Food for today. Clean water for tomorrow.',
  },
  essentialRelief: {
    number: '06',
    eyebrow: 'ESSENTIAL RELIEF',
    headline: ['Relief when'],
    accent: ['every hour matters.'],
    supporting: 'Shelter, winter protection and essential support for Gaza.',
    focus: 'SHELTER & SUPPORT',
    alt: 'Bait ul Aqba Essential Relief: Relief when every hour matters.',
  },
  humanitarian: {
    number: '07',
    eyebrow: 'HUMANITARIAN SUPPORT',
    headline: ['Care where it is'],
    accent: ['needed most.'],
    supporting: 'Flexible support for urgent and special cases in Gaza.',
    focus: 'URGENT SUPPORT',
    alt: 'Bait ul Aqba Humanitarian Support: Care where it is needed most.',
  },
  faq: {
    number: '08',
    eyebrow: 'SPONSORSHIP FAQS',
    headline: ['Your questions,'],
    accent: ['answered clearly.'],
    supporting: 'Understand sponsorship, support and Zakat before you begin.',
    focus: 'YOUR QUESTIONS',
    alt: 'Bait ul Aqba sponsorship FAQs: Your questions, answered clearly.',
  },
} as const satisfies Record<string, SocialCardDefinition>;

export type SocialCardVariant = keyof typeof SOCIAL_CARDS;

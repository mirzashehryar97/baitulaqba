export type FaqItem = {
  question: string;
  /** One or more answer paragraphs, rendered in order. */
  answer: readonly string[];
};

/**
 * Single source of truth for the FAQ page. Consumed both by the visible
 * accordion in `/faq` and by the `FAQPage` structured data (`FaqJsonLd`), so the
 * page content and the schema can never drift apart. Keep answers factual and in
 * the charity's own voice.
 */
export const FAQ_ITEMS: readonly FaqItem[] = [
  {
    question: 'How does sponsoring an orphan with Bait ul Aqba work?',
    answer: [
      'You choose to support a child, and we match you with a verified orphan in Gaza whose needs have been confirmed on the ground. Your monthly or one-time contribution then funds their essentials — food, clean water, shelter, clothing, healthcare and education.',
      'Once your sponsorship begins you receive confirmation, and we share updates so you can see the difference your support is making.',
    ],
  },
  {
    question: 'How much does it cost to sponsor an orphan?',
    answer: [
      'Sponsorship is flexible — you can give monthly to provide ongoing care, or make a one-time contribution. You can start from the sponsorship form on this site or message us on WhatsApp, and we will walk you through the current amounts and options.',
      'Whatever you choose, your contribution goes directly toward the verified needs of the child and, where possible, their remaining family.',
    ],
  },
  {
    question: 'What does my sponsorship cover?',
    answer: [
      "Your sponsorship helps provide food and clean water, shelter and winter protection, clothing, medical care, and access to education. Where possible it also helps the child's remaining family stay together and maintain some stability in an extremely difficult environment.",
    ],
  },
  {
    question: 'Is sponsoring an orphan eligible for Zakat?',
    answer: [
      'Yes. Orphans in Gaza who are poor or in need fall within the categories of people eligible to receive Zakat (al-fuqara, the poor, and al-masakeen, the needy), so your sponsorship can be given from your Zakat.',
      'There is one point specific to Gaza we want you to be aware of. Because of the blockade, a portion of all aid entering Gaza is lost to charges levied at the crossings by the Israeli forces — in practice around 20% — so on average about 80% of your contribution reaches the child directly.',
      'For your Zakat to be counted precisely, we therefore recommend making your niyyah (intention) for Zakat on around 80% of your donation — the share that actually reaches an eligible recipient — and treating the remainder as general sadaqah. If you would like your full Zakat obligation fulfilled, you can simply give a little extra so that the amount reaching the child matches what you intend to pay.',
      'Zakat is a personal act of worship, so for your own circumstances you are always welcome to consult a scholar you trust.',
    ],
  },
  {
    question: 'Does 100% of my donation reach the child?',
    answer: [
      'We take no cut from your sponsorship for overheads — the full amount you give is sent toward verified aid for your sponsored child and their household.',
      'In practice, around 80% of the value reaches the child on the ground. This is because roughly 20% is taken as charges at the Gaza crossings by the Israeli forces, a cost that is outside our control. We are transparent about this so you always know where your support goes, and we keep proof of delivery wherever it is possible to obtain.',
    ],
  },
  {
    question: 'Will I receive updates about the child I sponsor?',
    answer: [
      "Yes. We confirm when your sponsorship begins and share periodic updates, including the child's profile and — where it is safe and possible to do so — news of their wellbeing and progress.",
    ],
  },
  {
    question: 'Can I speak with the child and their guardian directly?',
    answer: [
      "Yes. When your sponsorship begins we share the contact number of the child's guardian, so you are welcome to speak with the guardian and the child yourself. This lets you get to know them, check on their wellbeing, and hear directly from them that your support has reached them.",
      'Direct contact is one of the ways we keep everything transparent — you never have to take delivery on trust alone. Because connectivity in Gaza is often disrupted it can sometimes take time to reach them, and we simply ask that contact is kept respectful of the difficult circumstances the family is living through.',
    ],
  },
  {
    question: 'Can I choose or request a specific child?',
    answer: [
      'We match sponsors with children whose needs are current and verified. If you have a particular preference, let us know and we will do our best to accommodate it.',
    ],
  },
  {
    question: 'Who is considered an orphan in Islam?',
    answer: [
      "In Islam an orphan (yateem) is a child who has lost their father before reaching the age of puberty. Caring for orphans is among the most emphasised acts of charity in the Qur'an and the Sunnah, carrying immense reward.",
    ],
  },
  {
    question: 'Does sponsorship make me the child’s legal guardian?',
    answer: [
      "No. Sponsorship is a charitable partnership that funds a child's care and wellbeing. It does not create legal guardianship or any parental rights.",
    ],
  },
  {
    question: 'How do I know the orphans are real and the aid is delivered?',
    answer: [
      'Every case is verified on the ground before it is listed for sponsorship, and we keep records and proof of delivery. Transparency is central to how we work — you are welcome to ask us for details of how your contribution was used.',
      "We also share the guardian's contact number with you, so you can speak with the guardian and the child directly and confirm with them that your support has been received — you don't have to rely on our word alone.",
    ],
  },
  {
    question: 'Can I pause, change or cancel my sponsorship?',
    answer: [
      'Yes. Sponsorship is voluntary and flexible, so you can pause, change or stop your support at any time by contacting us. We will always let you know how a change affects the child so that alternative support can be arranged for them.',
    ],
  },
  {
    question: 'How do I start a sponsorship or donate?',
    answer: [
      'You can begin from the sponsorship form on this site, or contact us directly on WhatsApp. We will help you choose a child and set up your contribution in a few simple steps.',
    ],
  },
];

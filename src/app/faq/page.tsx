import type { Metadata } from 'next';
import Image from 'next/image';

import { ChevronDown } from 'lucide-react';

import { Footer } from '@/components/layout/Footer';
import { Header } from '@/components/layout/Header';
import { BreadcrumbJsonLd } from '@/components/seo/BreadcrumbJsonLd';
import { FaqJsonLd } from '@/components/seo/FaqJsonLd';
import { Button } from '@/components/ui/Button';
import { SponsorOrphanButton } from '@/components/ui/SponsorOrphanButton';
import { SponsorOrphanProvider } from '@/components/ui/SponsorOrphanModal';

import { CONTACT } from '@/data/content';
import { FAQ_ITEMS } from '@/data/faq';

import { createMetadata } from '@/lib/seo';

export const metadata: Metadata = createMetadata({
  title: 'Sponsor an Orphan in Gaza — FAQs | Bait ul Aqba',
  description:
    'Answers to common questions about sponsoring an orphan in Gaza — how it works, what it covers, Zakat eligibility, and how your donation is used.',
  path: '/faq',
});

export default function FaqPage() {
  return (
    <SponsorOrphanProvider>
      <BreadcrumbJsonLd
        items={[
          { name: 'Home', path: '/' },
          { name: 'FAQs', path: '/faq' },
        ]}
      />
      <FaqJsonLd />
      <Header />
      <main>
        <section className="relative overflow-hidden bg-emerald-deepest px-5 pb-16 pt-32 sm:px-8 lg:pt-36">
          <Image
            alt=""
            aria-hidden="true"
            className="object-cover object-center"
            fill
            priority
            sizes="100vw"
            src="/images/faq/faq-hero-background.png"
          />
          <div className="absolute inset-0 bg-emerald-deepest/55" />
          <div className="absolute inset-0 bg-gradient-to-b from-emerald-deepest/65 via-emerald-deepest/35 to-emerald-deepest/80" />

          <div className="relative z-10 mx-auto max-w-3xl text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-gold/30 bg-gold/10 px-4 py-1.5 text-xs font-medium uppercase tracking-[0.22em] text-gold-soft">
              <span className="h-1.5 w-1.5 rounded-full bg-gold" />
              Bait ul Aqba
            </span>
            <h1 className="mt-6 font-display text-4xl font-medium leading-tight text-cream-soft sm:text-5xl">
              Frequently Asked Questions
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-pretty text-base leading-relaxed text-cream/70 sm:text-lg">
              Everything you need to know about sponsoring an orphan in Gaza — how it works, what
              your support covers, how Zakat applies, and how your donation reaches the child.
            </p>
          </div>
        </section>

        <section className="bg-cream px-5 py-16 sm:px-8 sm:py-20">
          <ul className="mx-auto max-w-3xl space-y-4">
            {FAQ_ITEMS.map((item) => (
              <li key={item.question}>
                <details className="group rounded-2xl border border-emerald/10 bg-white p-5 shadow-[0_10px_30px_-24px_rgba(10,46,34,0.55)] transition-colors sm:p-6">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-sans text-base font-medium tracking-tight text-emerald-deep sm:text-lg">
                    {item.question}
                    <ChevronDown
                      aria-hidden="true"
                      className="h-5 w-5 flex-shrink-0 text-gold-deep transition-transform duration-300 group-open:rotate-180"
                    />
                  </summary>
                  <div className="mt-4 space-y-3 text-sm leading-relaxed text-emerald-muted sm:text-base">
                    {item.answer.map((paragraph) => (
                      <p key={paragraph}>{paragraph}</p>
                    ))}
                  </div>
                </details>
              </li>
            ))}
          </ul>
        </section>

        <section className="bg-emerald-deep px-5 py-16 text-center sm:px-8 sm:py-20">
          <div className="mx-auto max-w-2xl">
            <h2 className="font-display text-3xl font-medium text-cream-soft sm:text-4xl">
              Still have a question?
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-pretty text-base leading-relaxed text-cream/70">
              We are here to help. Reach out on WhatsApp, or start a sponsorship and protect a
              child&rsquo;s future today.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <SponsorOrphanButton size="lg">Sponsor a Child</SponsorOrphanButton>
              <Button href={CONTACT.whatsapp.href} size="lg" variant="outline">
                Message us on WhatsApp
              </Button>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </SponsorOrphanProvider>
  );
}

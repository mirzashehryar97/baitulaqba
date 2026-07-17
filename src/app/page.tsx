import type { Metadata } from 'next';

import { Footer } from '@/components/layout/Footer';
import { Header } from '@/components/layout/Header';
import { CrisisContext } from '@/components/sections/CrisisContext';
import { FinalCTA } from '@/components/sections/FinalCTA';
import { HadithBanner } from '@/components/sections/HadithBanner';
import { Hero } from '@/components/sections/Hero';
import { ImpactSection } from '@/components/sections/ImpactSection';
import { InitiativesGrid } from '@/components/sections/InitiativesGrid';
import { JourneyCards } from '@/components/sections/JourneyCards';
import { ProcessSteps } from '@/components/sections/ProcessSteps';
import { SponsorTestimonials } from '@/components/sections/SponsorTestimonials';
import { StatsBar } from '@/components/sections/StatsBar';
import { TransparencySection } from '@/components/sections/TransparencySection';
import { SponsorOrphanProvider } from '@/components/ui/SponsorOrphanModal';

import { createMetadata, SITE_DESCRIPTION } from '@/lib/seo';

export const metadata: Metadata = createMetadata({
  title: 'Sponsor a Gaza Orphan — Zakat-Eligible Care & Education',
  description: SITE_DESCRIPTION,
  path: '/',
  socialTitle: 'Sponsor a Gaza Orphan — Bait ul Aqba',
  socialDescription: 'One child. One future. You can protect. Sponsor an orphan in Gaza today.',
});

export default function HomePage() {
  return (
    <SponsorOrphanProvider>
      <Header />
      <main>
        <Hero />
        <HadithBanner />
        <CrisisContext />
        <ProcessSteps />
        <JourneyCards />
        <TransparencySection />
        <ImpactSection />
        <SponsorTestimonials />
        <InitiativesGrid />
        <StatsBar />
        <FinalCTA />
      </main>
      <Footer />
    </SponsorOrphanProvider>
  );
}

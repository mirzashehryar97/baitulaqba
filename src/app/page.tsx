import { Footer } from '@/components/layout/Footer';
import { Header } from '@/components/layout/Header';
import { FinalCTA } from '@/components/sections/FinalCTA';
import { HadithBanner } from '@/components/sections/HadithBanner';
import { Hero } from '@/components/sections/Hero';
import { ImpactSection } from '@/components/sections/ImpactSection';
import { InitiativesGrid } from '@/components/sections/InitiativesGrid';
import { JourneyCards } from '@/components/sections/JourneyCards';
import { ProcessSteps } from '@/components/sections/ProcessSteps';
import { StatsBar } from '@/components/sections/StatsBar';
import { TransparencySection } from '@/components/sections/TransparencySection';

export default function HomePage() {
  return (
    <>
      <Header />
      <main>
        <Hero />
        <HadithBanner />
        <ProcessSteps />
        <JourneyCards />
        <TransparencySection />
        <ImpactSection />
        <InitiativesGrid />
        <StatsBar />
        <FinalCTA />
      </main>
      <Footer />
    </>
  );
}

import type { Metadata } from 'next';

import { ReliefInitiativePage } from '@/components/initiatives/ReliefInitiativePage';
import { BreadcrumbJsonLd } from '@/components/seo/BreadcrumbJsonLd';

import { createMetadata } from '@/lib/seo';

export const metadata: Metadata = createMetadata({
  title: 'Food & Clean Water for Gaza | Bait ul Aqba',
  description: 'Support verified food and clean-water relief for families and communities in Gaza.',
  path: '/food-water-supply',
});

export default function FoodWaterSupplyPage() {
  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: 'Home', path: '/' },
          { name: 'Food & Clean Water', path: '/food-water-supply' },
        ]}
      />
      <ReliefInitiativePage kind="food-water" />
    </>
  );
}

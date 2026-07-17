import type { Metadata } from 'next';

import { ReliefInitiativePage } from '@/components/initiatives/ReliefInitiativePage';
import { BreadcrumbJsonLd } from '@/components/seo/BreadcrumbJsonLd';

import { createMetadata } from '@/lib/seo';

export const metadata: Metadata = createMetadata({
  title: 'Essential Relief for Gaza Families | Bait ul Aqba',
  description:
    'Help provide verified emergency shelter, winter protection and essential support for families in Gaza.',
  path: '/essential-relief',
});

export default function EssentialReliefPage() {
  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: 'Home', path: '/' },
          { name: 'Essential Relief', path: '/essential-relief' },
        ]}
      />
      <ReliefInitiativePage kind="essential-relief" />
    </>
  );
}

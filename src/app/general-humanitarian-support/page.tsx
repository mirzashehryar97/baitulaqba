import type { Metadata } from 'next';

import { ReliefInitiativePage } from '@/components/initiatives/ReliefInitiativePage';
import { BreadcrumbJsonLd } from '@/components/seo/BreadcrumbJsonLd';

import { createMetadata } from '@/lib/seo';

export const metadata: Metadata = createMetadata({
  title: 'Humanitarian Support for Gaza | Bait ul Aqba',
  description:
    'Stand with urgent and special humanitarian cases through flexible, verified support in Gaza.',
  path: '/general-humanitarian-support',
});

export default function GeneralHumanitarianSupportPage() {
  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: 'Home', path: '/' },
          { name: 'Humanitarian Support', path: '/general-humanitarian-support' },
        ]}
      />
      <ReliefInitiativePage kind="humanitarian" />
    </>
  );
}

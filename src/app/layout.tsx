import type { Metadata, Viewport } from 'next';
import { Cormorant_Garamond, Inter } from 'next/font/google';

import { OrganizationJsonLd } from '@/components/seo/OrganizationJsonLd';
import { ConfirmationProvider } from '@/components/ui/ConfirmationProvider';
import { ToastProvider } from '@/components/ui/ToastProvider';

import { SITE_DESCRIPTION, SITE_NAME, SITE_URL } from '@/lib/seo';

import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-cormorant',
  display: 'swap',
});

// Site-wide defaults only. Every route — including /admin and /portal —
// inherits what is declared here, so page-specific concerns (canonical URL,
// share cards) live on the pages themselves via `createMetadata`. Public page
// titles already carry the brand, so no `title.template` is applied.
export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: 'Bait ul Aqba — Sponsor a Gaza Orphan',
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  keywords: [
    'Gaza orphan sponsorship',
    'sponsor an orphan',
    'Islamic charity',
    'Zakat eligible',
    'Bait ul Aqba',
  ],
};

export const viewport: Viewport = {
  themeColor: '#0a2e22',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html className={`${inter.variable} ${cormorant.variable}`} lang="en">
      <body>
        <OrganizationJsonLd />
        <ToastProvider>
          <ConfirmationProvider>{children}</ConfirmationProvider>
        </ToastProvider>
      </body>
    </html>
  );
}

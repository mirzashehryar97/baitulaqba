import type { Metadata, Viewport } from 'next';
import { Cormorant_Garamond, Inter } from 'next/font/google';

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

export const metadata: Metadata = {
  title: 'Bait ul Aqba — Sponsor a Gaza Orphan | Education, Care & Hope',
  description:
    'Bait ul Aqba restores stability, education, and hope for orphans in Gaza. Sponsor a child with 100% of donations reaching Gaza — verified, transparent, and Zakat eligible.',
  keywords: [
    'Gaza orphan sponsorship',
    'sponsor an orphan',
    'Islamic charity',
    'Zakat eligible',
    'Bait ul Aqba',
  ],
  openGraph: {
    title: 'Bait ul Aqba — Sponsor a Gaza Orphan',
    description: 'One child. One future. You can protect. Sponsor an orphan in Gaza today.',
    type: 'website',
  },
};

export const viewport: Viewport = {
  themeColor: '#0a2e22',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html className={`${inter.variable} ${cormorant.variable}`} lang="en">
      <body>{children}</body>
    </html>
  );
}

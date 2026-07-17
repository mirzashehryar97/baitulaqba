import type { Metadata } from 'next';

/**
 * Origin this site is served from. Drives canonical URLs, sitemap entries and
 * robots.txt, so it is kept separate from any brand/contact URLs in
 * `@/data/content` (which are display content and need not point at this exact
 * host). A canonical must always match the host the page is actually served on.
 *
 * Must include the protocol and match the host exactly, including the `www.`
 * subdomain — `baitulaqba.org` and `www.baitulaqba.org` are distinct origins to
 * a search engine.
 */
const DEFAULT_SITE_URL = 'https://www.baitulaqba.org';

/**
 * Set NEXT_PUBLIC_SITE_URL (including the protocol) to point preview/staging
 * deployments at their own origin.
 */
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? DEFAULT_SITE_URL).replace(/\/+$/, '');

export const SITE_NAME = 'Bait ul Aqba';

export const SITE_LOCALE = 'en_US';

export const SITE_DESCRIPTION =
  'Sponsor an orphan in Gaza with Bait ul Aqba. Zakat-eligible, verified and transparent monthly support that restores stability, education and hope.';

/** Facebook/X/WhatsApp all render 1.91:1 social cards; 1200x630 is the safe canonical size. */
export const OG_IMAGE_SIZE = { width: 1200, height: 630 };

export const OG_IMAGE_CONTENT_TYPE = 'image/png';

/** Resolve a root-relative path (e.g. `/about`) against the canonical origin. */
export function absoluteUrl(path = '/'): string {
  return new URL(path, `${SITE_URL}/`).toString();
}

type CreateMetadataInput = {
  title: string;
  description: string;
  /** Root-relative canonical path, e.g. `/about`. Resolved against `metadataBase`. */
  path: string;
  /** Share-card title, when the social copy should differ from the page title. */
  socialTitle?: string;
  /** Share-card description, when the social copy should differ from the meta description. */
  socialDescription?: string;
};

/**
 * Build page metadata with a canonical URL and complete Open Graph / Twitter
 * cards.
 *
 * Next.js shallow-merges metadata across segments: a page that declares
 * `openGraph` replaces the root layout's object rather than merging into it, so
 * every textual field the social cards need is repeated here instead of being
 * inherited. Images and their alt text are owned by route-level
 * `opengraph-image` / `twitter-image` files. File-based metadata has higher
 * priority than this object and gives generated cards content-hashed URLs for
 * safe cache invalidation.
 *
 * Call this per public page rather than declaring a canonical on the root
 * layout: layout metadata is inherited by every descendant, so a canonical set
 * there would make the admin and donor portal routes claim to be duplicates of
 * the homepage.
 */
export function createMetadata({
  title,
  description,
  path,
  socialTitle,
  socialDescription,
}: CreateMetadataInput): Metadata {
  const shareTitle = socialTitle ?? title;
  const shareDescription = socialDescription ?? description;

  return {
    title,
    description,
    alternates: {
      canonical: path,
    },
    openGraph: {
      type: 'website',
      siteName: SITE_NAME,
      locale: SITE_LOCALE,
      url: path,
      title: shareTitle,
      description: shareDescription,
    },
    twitter: {
      card: 'summary_large_image',
      title: shareTitle,
      description: shareDescription,
    },
  };
}

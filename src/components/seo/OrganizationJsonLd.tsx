import { CONTACT, SOCIAL_LINKS } from '@/data/content';

import { absoluteUrl, SITE_DESCRIPTION, SITE_NAME, SITE_URL } from '@/lib/seo';

/**
 * Organization structured data for the public site. Rendered once from the root
 * layout so search engines can resolve the brand, its logo and its verified
 * social profiles. Contact details and social links are read from
 * `@/data/content` so this stays in step with what the site actually shows.
 */
export function OrganizationJsonLd() {
  const organization = {
    '@context': 'https://schema.org',
    '@type': 'NGO',
    '@id': absoluteUrl('/#organization'),
    name: SITE_NAME,
    url: SITE_URL,
    logo: absoluteUrl('/images/official/bait-ul-aqba/baitul-aqba-logo.png'),
    description: SITE_DESCRIPTION,
    sameAs: SOCIAL_LINKS.map((social) => social.href),
    areaServed: {
      '@type': 'Place',
      name: 'Gaza',
    },
    address: CONTACT.offices.map((office) => ({
      '@type': 'PostalAddress',
      addressLocality: office,
      addressCountry: 'PK',
    })),
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'customer support',
      telephone: CONTACT.whatsapp.label,
      url: CONTACT.whatsapp.href,
      availableLanguage: ['English', 'Arabic', 'Urdu'],
    },
  };

  return (
    <script
      // JSON-LD must reach the DOM as raw text; the payload is built from
      // in-repo constants only, so there is no untrusted input to escape.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(organization) }}
      type="application/ld+json"
    />
  );
}

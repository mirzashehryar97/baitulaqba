import type { MetadataRoute } from 'next';

import { absoluteUrl, SITE_URL } from '@/lib/seo';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        // Authenticated work surfaces and machine endpoints hold no public
        // content and must stay out of the index.
        disallow: ['/admin', '/portal', '/api', '/auth'],
      },
    ],
    sitemap: absoluteUrl('/sitemap.xml'),
    host: SITE_URL,
  };
}

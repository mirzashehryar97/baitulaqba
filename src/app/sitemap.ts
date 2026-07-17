import type { MetadataRoute } from 'next';

import { absoluteUrl } from '@/lib/seo';

/**
 * Every indexable public route. Admin (`/admin`), donor portal (`/portal`),
 * API and auth routes are intentionally absent — they are disallowed in
 * `robots.ts`. Add new public marketing/initiative pages here when they ship.
 */
const PUBLIC_ROUTES = [
  { path: '/', changeFrequency: 'weekly', priority: 1 },
  { path: '/about', changeFrequency: 'monthly', priority: 0.8 },
  { path: '/faq', changeFrequency: 'monthly', priority: 0.7 },
  { path: '/tent-schools', changeFrequency: 'monthly', priority: 0.8 },
  { path: '/mosques', changeFrequency: 'monthly', priority: 0.8 },
  { path: '/food-water-supply', changeFrequency: 'monthly', priority: 0.8 },
  { path: '/essential-relief', changeFrequency: 'monthly', priority: 0.8 },
  { path: '/general-humanitarian-support', changeFrequency: 'monthly', priority: 0.8 },
] as const;

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  return PUBLIC_ROUTES.map((route) => ({
    url: absoluteUrl(route.path),
    lastModified,
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));
}

import { absoluteUrl } from '@/lib/seo';

type BreadcrumbItem = {
  name: string;
  /** Root-relative path, e.g. `/about`. Resolved to an absolute URL. */
  path: string;
};

/**
 * `BreadcrumbList` structured data for an inner public page. Emit it once per
 * page with the trail from the homepage down to the current page (e.g.
 * `Home > About`) so search engines can render a breadcrumb in the result
 * snippet. Paths are resolved against the canonical origin via `absoluteUrl`.
 */
export function BreadcrumbJsonLd({ items }: { items: readonly BreadcrumbItem[] }) {
  const breadcrumbList = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };

  return (
    <script
      // JSON-LD must reach the DOM as raw text; the payload is built from
      // in-repo constants only, so there is no untrusted input to escape.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbList) }}
      type="application/ld+json"
    />
  );
}

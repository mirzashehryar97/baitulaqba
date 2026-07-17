import { FAQ_ITEMS } from '@/data/faq';

/**
 * `FAQPage` structured data for `/faq`. Built from the same `FAQ_ITEMS` source as
 * the visible page so the two stay in sync. Answer paragraphs are joined into a
 * single text value, which is the shape search engines expect for an Answer.
 */
export function FaqJsonLd() {
  const faqPage = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: FAQ_ITEMS.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer.join('\n\n'),
      },
    })),
  };

  return (
    <script
      // JSON-LD must reach the DOM as raw text; the payload is built from
      // in-repo constants only, so there is no untrusted input to escape.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(faqPage) }}
      type="application/ld+json"
    />
  );
}

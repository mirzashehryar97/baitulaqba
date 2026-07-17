import { Facebook, Instagram, MapPin, Phone, Youtube } from 'lucide-react';

import { Logo } from '@/components/ui/Logo';

import { CONTACT, NAV_LINKS, SOCIAL_LINKS } from '@/data/content';

const SOCIAL_ICONS = {
  Facebook,
  Instagram,
  YouTube: Youtube,
} as const;

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="currentColor"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.148-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.226 1.36.194 1.871.118.57-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.981.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884a9.821 9.821 0 0 1 7.021 2.91 9.825 9.825 0 0 1 2.9 7.025c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" />
    </svg>
  );
}

const FOOTER_COLUMNS = [
  {
    title: 'Programs',
    links: [
      { label: 'Orphan Sponsorship', href: '/#adoption' },
      { label: 'Food & Water Supply', href: '/food-water-supply' },
      { label: 'Essential Relief', href: '/essential-relief' },
      { label: 'Tent Schools', href: '/tent-schools' },
      { label: 'Mosques', href: '/mosques' },
      { label: 'Humanitarian Support', href: '/general-humanitarian-support' },
    ],
  },
  {
    title: 'Organisation',
    links: [
      { label: 'About Us', href: '/about' },
      { label: 'Our Mission', href: '/about#mission' },
      { label: 'Transparency', href: '/#impact' },
      { label: 'FAQs', href: '/faq' },
    ],
  },
];

export function Footer() {
  return (
    <footer className="w-full bg-emerald-deepest" id="blog">
      <div className="mx-auto w-full max-w-7xl px-5 py-16 sm:px-8 lg:px-12">
        <div className="grid gap-10 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <Logo tone="light" />
            <p className="mt-5 max-w-xs text-sm leading-relaxed text-cream/60">
              Restoring stability, education, and hope for orphans in Gaza — with zero admin fees
              and full transparency on where your donation goes.
            </p>
            <div className="mt-6 flex items-center gap-3">
              {SOCIAL_LINKS.map((social) => {
                const Icon = SOCIAL_ICONS[social.label as keyof typeof SOCIAL_ICONS];
                return (
                  <a
                    aria-label={social.label}
                    className="flex h-9 w-9 items-center justify-center rounded-full border border-cream/15 text-cream/70 transition-colors hover:border-gold/60 hover:text-gold-soft"
                    href={social.href}
                    key={social.label}
                    rel="noreferrer"
                    target="_blank"
                  >
                    <Icon className="h-4 w-4" />
                  </a>
                );
              })}
            </div>
          </div>

          {FOOTER_COLUMNS.map((column) => (
            <div className="lg:col-span-2" key={column.title}>
              <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-gold-soft">
                {column.title}
              </h3>
              <ul className="mt-4 flex flex-col gap-2.5">
                {column.links.map((link) => (
                  <li key={link.label}>
                    <a
                      className="text-sm text-cream/65 transition-colors hover:text-gold-soft"
                      href={link.href}
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <div className="lg:col-span-2">
            <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-gold-soft">
              Navigate
            </h3>
            <ul className="mt-4 flex flex-col gap-2.5">
              {NAV_LINKS.slice(0, 5).map((link) => (
                <li key={link.href}>
                  <a
                    className="text-sm text-cream/65 transition-colors hover:text-gold-soft"
                    href={link.href.startsWith('#') ? `/${link.href}` : link.href}
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div className="lg:col-span-2">
            <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-gold-soft">
              Contact
            </h3>
            <ul className="mt-4 flex flex-col gap-2.5 text-sm text-cream/65">
              <li>
                <a
                  aria-label={`Chat with us on WhatsApp at ${CONTACT.whatsapp.label}`}
                  className="flex items-center gap-2 transition-colors hover:text-gold-soft"
                  href={CONTACT.whatsapp.href}
                  rel="noreferrer"
                  target="_blank"
                >
                  <WhatsAppIcon className="h-4 w-4 shrink-0 text-gold-soft/80" />
                  {CONTACT.whatsapp.label}
                </a>
              </li>
              {CONTACT.phones.map((phone) => (
                <li key={phone}>
                  <a
                    className="flex items-center gap-2 transition-colors hover:text-gold-soft"
                    href={`tel:${phone.replace(/\s+/g, '')}`}
                  >
                    <Phone className="h-4 w-4 shrink-0 text-gold-soft/80" />
                    {phone}
                  </a>
                </li>
              ))}
              <li className="flex items-center gap-2">
                <MapPin className="h-4 w-4 shrink-0 text-gold-soft/80" />
                {CONTACT.offices.join(' & ')} offices
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-cream/10 pt-6 text-center sm:flex-row sm:text-left">
          <p className="text-xs text-cream/50">
            © {new Date().getFullYear()} Bait ul Aqba. All rights reserved.
          </p>
          <p className="text-xs text-cream/50">
            Verified &amp; Transparent · Zakat Eligible · Zero Admin Fees
          </p>
        </div>
      </div>
    </footer>
  );
}

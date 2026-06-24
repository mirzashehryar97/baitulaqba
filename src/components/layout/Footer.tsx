import { Facebook, Instagram, Linkedin, Twitter, Youtube } from 'lucide-react';

import { Logo } from '@/components/ui/Logo';

import { NAV_LINKS } from '@/data/content';

const SOCIALS = [
  { label: 'Facebook', icon: Facebook, href: '#' },
  { label: 'Instagram', icon: Instagram, href: '#' },
  { label: 'Twitter', icon: Twitter, href: '#' },
  { label: 'YouTube', icon: Youtube, href: '#' },
  { label: 'LinkedIn', icon: Linkedin, href: '#' },
];

const FOOTER_COLUMNS = [
  {
    title: 'Programs',
    links: ['Orphan Sponsorship', 'Tent Schools', 'Education Pathways', 'Emergency Relief'],
  },
  {
    title: 'Organisation',
    links: ['About Us', 'Our Mission', 'Transparency', 'Annual Reports'],
  },
  {
    title: 'Support',
    links: ['Contact', 'Donate', 'Zakat Calculator', 'FAQs'],
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
              Restoring stability, education, and hope for orphans in Gaza. 100% of your donation
              reaches those who need it most.
            </p>
            <div className="mt-6 flex items-center gap-3">
              {SOCIALS.map((social) => (
                <a
                  aria-label={social.label}
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-cream/15 text-cream/70 transition-colors hover:border-gold/60 hover:text-gold-soft"
                  href={social.href}
                  key={social.label}
                >
                  <social.icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          {FOOTER_COLUMNS.map((column) => (
            <div className="lg:col-span-2" key={column.title}>
              <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-gold-soft">
                {column.title}
              </h3>
              <ul className="mt-4 flex flex-col gap-2.5">
                {column.links.map((link) => (
                  <li key={link}>
                    <a
                      className="text-sm text-cream/65 transition-colors hover:text-gold-soft"
                      href="#contact"
                    >
                      {link}
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
                    href={link.href}
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-cream/10 pt-6 text-center sm:flex-row sm:text-left">
          <p className="text-xs text-cream/50">
            © {new Date().getFullYear()} Bait ul Aqba. All rights reserved.
          </p>
          <p className="text-xs text-cream/50">
            Verified &amp; Transparent · Zakat Eligible · 100% Donations to Gaza
          </p>
        </div>
      </div>
    </footer>
  );
}

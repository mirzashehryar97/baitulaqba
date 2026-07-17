'use client';

import { useEffect, useState } from 'react';

import { AnimatePresence, motion } from 'framer-motion';
import { LogIn, Menu, X } from 'lucide-react';

import { Logo } from '@/components/ui/Logo';
import { SponsorOrphanButton } from '@/components/ui/SponsorOrphanButton';

import { NAV_LINKS } from '@/data/content';

import { cn } from '@/lib/utils';

const HEADER_NAV_LINKS = NAV_LINKS.filter(
  (link) => link.href !== '#blog' && link.href !== '#adoption',
);

// Hash-only links (e.g. `#impact`) target homepage sections, so prefix them
// with `/` to route back to the homepage from any other page (matches Footer).
const resolveNavHref = (href: string) => (href.startsWith('#') ? `/${href}` : href);

export function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [menuOpen]);

  return (
    <motion.header
      animate={{ y: 0, opacity: 1 }}
      className={cn(
        'fixed inset-x-0 top-0 z-50 transition-colors duration-500',
        scrolled
          ? 'border-b border-white/10 bg-emerald-deepest/85 backdrop-blur-lg'
          : 'bg-transparent',
      )}
      initial={{ y: -40, opacity: 0 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="mx-auto flex h-20 w-full max-w-7xl items-center justify-between gap-4 px-5 sm:px-8 lg:px-12">
        <Logo tone="light" />

        <nav
          aria-label="Primary"
          className="hidden min-w-0 flex-1 items-center justify-center gap-6 xl:flex"
        >
          {HEADER_NAV_LINKS.map((link) => (
            <a
              className="relative whitespace-nowrap text-sm font-medium text-cream/80 transition-colors hover:text-gold-soft after:absolute after:-bottom-1.5 after:left-0 after:h-px after:w-0 after:bg-gold after:transition-all after:duration-300 hover:after:w-full"
              href={resolveNavHref(link.href)}
              key={link.href}
            >
              {link.label}
            </a>
          ))}
          <a
            className="relative whitespace-nowrap text-sm font-medium text-cream/80 transition-colors hover:text-gold-soft after:absolute after:-bottom-1.5 after:left-0 after:h-px after:w-0 after:bg-gold after:transition-all after:duration-300 hover:after:w-full"
            href="/faq"
          >
            FAQ
          </a>
        </nav>

        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <div className="hidden sm:block">
            <SponsorOrphanButton className="whitespace-nowrap" size="sm" />
          </div>

          <a
            className="hidden h-10 items-center gap-2 rounded-full border border-cream/25 px-4 text-sm font-semibold text-cream/85 transition-colors hover:border-gold/60 hover:text-gold-soft md:inline-flex"
            href="/portal/login"
          >
            <LogIn className="h-4 w-4" />
            Login
          </a>

          <button
            aria-expanded={menuOpen}
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-cream/25 text-cream-soft transition-colors hover:border-gold/60 xl:hidden"
            onClick={() => setMenuOpen((v) => !v)}
            type="button"
          >
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {menuOpen ? (
          <motion.div
            animate={{ opacity: 1, height: 'auto' }}
            className="overflow-hidden border-t border-white/10 bg-emerald-deepest/95 backdrop-blur-lg xl:hidden"
            exit={{ opacity: 0, height: 0 }}
            initial={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          >
            <nav
              aria-label="Mobile"
              className="mx-auto flex w-full max-w-7xl flex-col gap-1 px-5 py-5 sm:px-8"
            >
              {HEADER_NAV_LINKS.map((link) => (
                <a
                  className="rounded-lg px-3 py-3 text-base font-medium text-cream/85 transition-colors hover:bg-white/5 hover:text-gold-soft"
                  href={resolveNavHref(link.href)}
                  key={link.href}
                  onClick={() => setMenuOpen(false)}
                >
                  {link.label}
                </a>
              ))}
              <a
                className="rounded-lg px-3 py-3 text-base font-medium text-cream/85 transition-colors hover:bg-white/5 hover:text-gold-soft"
                href="/faq"
                onClick={() => setMenuOpen(false)}
              >
                FAQ
              </a>
              <SponsorOrphanButton className="mt-3 w-full" onOpen={() => setMenuOpen(false)} />
              <a
                className="mt-3 flex items-center justify-center gap-2 rounded-lg border border-cream/20 px-3 py-3 text-base font-bold text-cream/90 transition-colors hover:border-gold/50 hover:text-gold-soft"
                href="/portal/login"
                onClick={() => setMenuOpen(false)}
              >
                <LogIn className="h-4 w-4" />
                Login
              </a>
            </nav>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </motion.header>
  );
}

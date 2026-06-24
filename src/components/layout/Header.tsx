'use client';

import { useEffect, useState } from 'react';

import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown, Globe, Heart, Menu, X } from 'lucide-react';

import { Button } from '@/components/ui/Button';
import { Logo } from '@/components/ui/Logo';

import { LANGUAGES, NAV_LINKS } from '@/data/content';

import { cn } from '@/lib/utils';

export function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const [lang, setLang] = useState<string>(LANGUAGES[0]);

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
          {NAV_LINKS.map((link) => (
            <a
              className="relative whitespace-nowrap text-sm font-medium text-cream/80 transition-colors hover:text-gold-soft after:absolute after:-bottom-1.5 after:left-0 after:h-px after:w-0 after:bg-gold after:transition-all after:duration-300 hover:after:w-full"
              href={link.href}
              key={link.href}
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2 sm:gap-3">
          <div className="hidden sm:block">
            <Button className="whitespace-nowrap" href="#adoption" size="sm">
              <Heart className="h-4 w-4" />
              Sponsor an Orphan
            </Button>
          </div>

          <div className="relative hidden xl:block">
            <button
              aria-expanded={langOpen}
              aria-haspopup="listbox"
              className="flex items-center gap-1.5 rounded-full border border-cream/25 px-3 py-2 text-xs font-medium text-cream/85 transition-colors hover:border-gold/60 hover:text-gold-soft"
              onClick={() => setLangOpen((v) => !v)}
              type="button"
            >
              <Globe className="h-3.5 w-3.5" />
              {lang}
              <ChevronDown
                className={cn('h-3.5 w-3.5 transition-transform', langOpen && 'rotate-180')}
              />
            </button>
            <AnimatePresence>
              {langOpen ? (
                <motion.ul
                  animate={{ opacity: 1, y: 0 }}
                  className="absolute right-0 top-12 z-50 w-28 overflow-hidden rounded-xl border border-emerald/10 bg-cream-soft p-1 shadow-card"
                  exit={{ opacity: 0, y: -8 }}
                  initial={{ opacity: 0, y: -8 }}
                  role="listbox"
                  transition={{ duration: 0.18 }}
                >
                  {LANGUAGES.map((code) => (
                    <li key={code}>
                      <button
                        aria-selected={lang === code}
                        className={cn(
                          'w-full rounded-lg px-3 py-2 text-left text-xs font-medium transition-colors',
                          lang === code
                            ? 'bg-emerald/10 text-emerald-deep'
                            : 'text-ink/70 hover:bg-emerald/5',
                        )}
                        onClick={() => {
                          setLang(code);
                          setLangOpen(false);
                        }}
                        role="option"
                        type="button"
                      >
                        {code}
                      </button>
                    </li>
                  ))}
                </motion.ul>
              ) : null}
            </AnimatePresence>
          </div>

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
              {NAV_LINKS.map((link) => (
                <a
                  className="rounded-lg px-3 py-3 text-base font-medium text-cream/85 transition-colors hover:bg-white/5 hover:text-gold-soft"
                  href={link.href}
                  key={link.href}
                  onClick={() => setMenuOpen(false)}
                >
                  {link.label}
                </a>
              ))}
              <Button className="mt-3 w-full" href="#adoption" onClick={() => setMenuOpen(false)}>
                <Heart className="h-4 w-4" />
                Sponsor an Orphan
              </Button>
              <div className="mt-3 flex items-center gap-2">
                {LANGUAGES.map((code) => (
                  <button
                    className={cn(
                      'flex-1 rounded-full border px-3 py-2 text-xs font-medium transition-colors',
                      lang === code
                        ? 'border-gold/60 text-gold-soft'
                        : 'border-cream/20 text-cream/70',
                    )}
                    key={code}
                    onClick={() => setLang(code)}
                    type="button"
                  >
                    {code}
                  </button>
                ))}
              </div>
            </nav>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </motion.header>
  );
}

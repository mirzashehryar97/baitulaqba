'use client';

import { useEffect, useRef, useState } from 'react';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  FileText,
  HeartHandshake,
  LayoutDashboard,
  LogOut,
  Menu,
  Search,
  ShieldCheck,
  UserRound,
  X,
} from 'lucide-react';

import { BrandMark } from '@/components/ui/BrandMark';
import { useConfirmation } from '@/components/ui/ConfirmationProvider';
import { NavLinkIcon } from '@/components/ui/NavLinkIcon';

import { cn } from '@/lib/utils';

import type { DonorPortalSession } from '@/types/portal';

const navItems = [
  { href: '/portal', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/portal/sponsorships', icon: HeartHandshake, label: 'My Sponsorships' },
  { href: '/portal/receipts', icon: FileText, label: 'Receipts' },
  { href: '/portal/available-orphans', icon: Search, label: 'Available Orphans' },
  { href: '/portal/profile', icon: UserRound, label: 'Profile' },
];

export function PortalShell({
  children,
  session,
}: {
  children: React.ReactNode;
  session: DonorPortalSession;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const confirm = useConfirmation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const accountMenuRef = useRef<HTMLDivElement | null>(null);
  const initials = getInitials(session.donor.fullName) || 'D';

  const signOut = async () => {
    const confirmed = await confirm({
      confirmLabel: 'Sign Out',
      description: 'This will end your donor portal session on this browser.',
      title: 'Sign out?',
    });

    if (!confirmed) return;

    setAccountMenuOpen(false);
    setSigningOut(true);
    await fetch('/api/portal/session', { method: 'DELETE' }).catch(() => null);
    router.push('/portal/login');
    router.refresh();
  };

  useEffect(() => {
    if (!accountMenuOpen) {
      return;
    }

    const handlePointerDown = (event: PointerEvent) => {
      if (accountMenuRef.current && !accountMenuRef.current.contains(event.target as Node)) {
        setAccountMenuOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setAccountMenuOpen(false);
      }
    };

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [accountMenuOpen]);

  return (
    <div className="portal-workspace min-h-screen overflow-x-hidden bg-[#f7f7f4] font-sans text-[#111827]">
      <PortalSidebar
        activePathname={pathname}
        collapsed={collapsed}
        donorName={session.donor.fullName}
        initials={initials}
        onClose={() => setSidebarOpen(false)}
        onToggleCollapsed={() => setCollapsed((value) => !value)}
        open={sidebarOpen}
      />

      <div
        className={cn(
          'min-h-screen min-w-0 transition-[padding] duration-300',
          collapsed ? 'lg:pl-[4.5rem]' : 'lg:pl-[15.5rem]',
        )}
      >
        <header className="sticky top-0 z-30 flex min-h-[4.75rem] items-center justify-between gap-3 border-b border-gold/18 bg-offwhite/94 px-4 py-2 backdrop-blur sm:px-5 lg:px-6">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <button
              aria-label="Open donor navigation"
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-gold/20 bg-white text-emerald-deep transition hover:border-gold/50 hover:bg-cream lg:hidden"
              onClick={() => setSidebarOpen(true)}
              type="button"
            >
              <Menu className="h-4.5 w-4.5" />
            </button>
            <div className="min-w-0">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-gold-deep">
                Donor Portal
              </p>
              <h1 className="truncate font-display text-xl font-semibold text-emerald-deep sm:text-[1.35rem]">
                {session.donor.fullName}
              </h1>
            </div>
          </div>

          <div className="flex min-w-0 shrink-0 items-center gap-2 sm:gap-3">
            <div className="relative" ref={accountMenuRef}>
              <button
                aria-label="Open donor account menu"
                aria-expanded={accountMenuOpen}
                aria-haspopup="menu"
                className="relative z-50 flex items-center gap-3 rounded-xl px-1 py-1 text-left transition hover:bg-cream disabled:opacity-60"
                disabled={signingOut}
                onPointerDown={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  setAccountMenuOpen((value) => !value);
                }}
                type="button"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-deepest text-sm font-black text-gold-soft">
                  {initials}
                </div>
                <div className="hidden min-w-0 text-left sm:block">
                  <p className="truncate text-sm font-bold text-emerald-deep">
                    {session.donor.fullName}
                  </p>
                  <p className="truncate text-xs font-semibold text-ink/65">Donor</p>
                </div>
                <ChevronDown
                  className={cn(
                    'hidden h-4 w-4 text-ink/60 transition xl:block',
                    accountMenuOpen && 'rotate-180',
                  )}
                />
              </button>

              {accountMenuOpen ? (
                <div
                  className="absolute right-0 top-full z-[80] mt-2 w-72 overflow-hidden rounded-xl border border-gold/18 bg-offwhite shadow-[0_24px_70px_-45px_rgba(7,39,29,0.75)]"
                  role="menu"
                >
                  <div className="border-b border-emerald/10 px-4 py-3">
                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-ink/50">
                      Donor Account
                    </p>
                    <p className="mt-1 truncate text-sm font-bold text-emerald-deep">
                      {session.donor.fullName}
                    </p>
                    <p className="truncate text-xs font-semibold text-ink/62">
                      {session.donor.email}
                    </p>
                  </div>

                  {session.teamMember && session.donor.canSwitchToAdmin ? (
                    <Link
                      className="flex items-start gap-3 px-4 py-3 text-left transition hover:bg-cream"
                      href={session.donor.switchToAdminHref ?? '/admin'}
                      role="menuitem"
                    >
                      <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gold/12 text-gold-deep">
                        <NavLinkIcon className="h-4 w-4" icon={ShieldCheck} />
                      </span>
                      <span className="min-w-0">
                        <span className="block text-sm font-bold text-emerald-deep">
                          Admin Panel
                        </span>
                        <span className="mt-0.5 block text-xs font-semibold text-ink/62">
                          Switch to administration
                        </span>
                      </span>
                    </Link>
                  ) : null}

                  <button
                    className="flex w-full items-center gap-3 border-t border-emerald/10 px-4 py-3 text-left text-sm font-bold text-emerald-deep transition hover:bg-cream disabled:opacity-60"
                    disabled={signingOut}
                    onClick={signOut}
                    role="menuitem"
                    type="button"
                  >
                    <LogOut className="h-4 w-4" />
                    {signingOut ? 'Signing out...' : 'Sign Out'}
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        </header>
        <main className="portal-workspace-content min-w-0 px-4 py-5 sm:px-5 lg:px-6">
          {children}
        </main>
      </div>
    </div>
  );
}

function getInitials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');
}

function PortalSidebar({
  activePathname,
  collapsed,
  donorName,
  initials,
  onClose,
  onToggleCollapsed,
  open,
}: {
  activePathname: string;
  collapsed: boolean;
  donorName: string;
  initials: string;
  onClose: () => void;
  onToggleCollapsed: () => void;
  open: boolean;
}) {
  const [hovered, setHovered] = useState(false);
  // On desktop a collapsed sidebar expands into an overlay drawer while hovered,
  // then snaps back on mouse-out. The persistent `collapsed` state still drives
  // the page padding so this hover-expand overlays content instead of reflowing it.
  const effectiveCollapsed = collapsed && !hovered;

  return (
    <>
      <button
        aria-label="Close donor navigation backdrop"
        className={cn(
          'fixed inset-0 z-40 bg-emerald-deepest/55 opacity-0 backdrop-blur-sm transition lg:hidden',
          open ? 'pointer-events-auto opacity-100' : 'pointer-events-none',
        )}
        onClick={onClose}
        type="button"
      />
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex -translate-x-full flex-col bg-emerald-deepest text-cream-soft shadow-2xl transition-[width,transform,box-shadow] duration-300 ease-in-out lg:translate-x-0 lg:shadow-none',
          open && 'translate-x-0',
          effectiveCollapsed ? 'w-72 lg:w-[4.5rem]' : 'w-72 lg:w-[15.5rem]',
          collapsed && hovered && 'lg:shadow-2xl',
        )}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        <div className="relative border-b border-white/8 px-4 pb-6 pt-6">
          <Link
            aria-label="Bait ul Aqba home"
            className={cn('flex items-center gap-3', effectiveCollapsed && 'lg:justify-center')}
            href="/"
            onClick={onClose}
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-gold/45 bg-cream-soft p-1 shadow-sm">
              <BrandMark className="h-full w-full" priority />
            </span>
            <span className={cn('min-w-0', effectiveCollapsed && 'lg:hidden')}>
              <span className="block truncate font-display text-lg font-semibold text-gold-soft">
                Bait ul Aqba
              </span>
              <span className="mt-1 block text-[0.65rem] font-bold uppercase tracking-[0.18em] text-cream/65">
                Donor Portal
              </span>
            </span>
          </Link>

          <button
            aria-label="Close donor navigation"
            className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-lg text-cream/70 transition hover:bg-white/8 hover:text-cream lg:hidden"
            onClick={onClose}
            type="button"
          >
            <X className="h-5 w-5" />
          </button>

          <button
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className="absolute -right-3 bottom-5 hidden h-7 w-7 items-center justify-center rounded-full border border-gold/30 bg-emerald-deepest text-gold-soft shadow-lg transition hover:bg-emerald-deep lg:flex"
            onClick={onToggleCollapsed}
            type="button"
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
        </div>

        <nav className="space-y-1 px-2.5 py-4">
          {navItems.map((item) => {
            const active =
              activePathname === item.href ||
              (item.href !== '/portal' && activePathname.startsWith(item.href));

            return (
              <Link
                className={cn(
                  'flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm font-bold transition hover:bg-white/10',
                  active ? 'bg-gold/18 text-white' : 'text-cream-soft/78',
                  effectiveCollapsed && 'lg:justify-center lg:px-0',
                )}
                href={item.href}
                key={item.href}
                onClick={onClose}
                title={effectiveCollapsed ? item.label : undefined}
              >
                <NavLinkIcon className="h-4.5 w-4.5 shrink-0" icon={item.icon} />
                <span className={cn(effectiveCollapsed && 'lg:hidden')}>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto space-y-3 px-4 pb-5 pt-3">
          <div className={cn('flex items-center gap-3', effectiveCollapsed && 'lg:justify-center')}>
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/75 bg-transparent text-sm font-semibold text-white">
              {initials}
            </div>
            <div className={cn('min-w-0', effectiveCollapsed && 'lg:hidden')}>
              <p className="truncate text-sm font-semibold text-white">{donorName}</p>
              <p className="mt-0.5 truncate text-xs font-medium text-gold-soft">Donor</p>
            </div>
            <ChevronDown
              className={cn('ml-auto h-4 w-4 text-white/80', effectiveCollapsed && 'lg:hidden')}
            />
          </div>
        </div>
      </aside>
    </>
  );
}

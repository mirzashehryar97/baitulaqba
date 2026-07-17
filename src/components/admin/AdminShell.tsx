'use client';

import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import {
  BarChart3,
  CalendarClock,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Contact,
  FileText,
  HeartHandshake,
  Home,
  LogOut,
  Menu,
  Settings,
  ShieldCheck,
  UserRound,
  UsersRound,
  X,
} from 'lucide-react';

import { BrandMark } from '@/components/ui/BrandMark';
import { useConfirmation } from '@/components/ui/ConfirmationProvider';
import { CustomSelect } from '@/components/ui/CustomSelect';
import { NavLinkIcon } from '@/components/ui/NavLinkIcon';

import { type AdminPageKey, canAccessAdminPage } from '@/lib/adminPermissions';
import { TEAM_MEMBER_ROLE_LABELS } from '@/lib/teamMemberRoles';
import { cn } from '@/lib/utils';

import type { Donor, TeamMember } from '@/types/accounts';

export type AdminNavKey = AdminPageKey;

type AdminNavItem = {
  group: 'admin' | 'global' | 'initiative';
  href?: string;
  icon: React.ElementType;
  key: AdminPageKey;
  label: string;
};

const navItems: AdminNavItem[] = [
  { group: 'global', href: '/admin', icon: Home, key: 'dashboard', label: 'Dashboard' },
  { group: 'global', href: '/admin/donors', icon: UsersRound, key: 'sponsors', label: 'Donors' },
  {
    group: 'initiative',
    href: '/admin/sponsorship-requests',
    icon: ClipboardList,
    key: 'sponsorship_requests',
    label: 'Sponsorship Requests',
  },
  {
    group: 'initiative',
    href: '/admin/orphans',
    icon: UserRound,
    key: 'orphan_profiles',
    label: 'Orphan Profiles',
  },
  {
    group: 'initiative',
    href: '/admin/matches',
    icon: HeartHandshake,
    key: 'matches',
    label: 'Matches',
  },
  {
    group: 'initiative',
    href: '/admin/receipts',
    icon: FileText,
    key: 'receipts',
    label: 'Receipts',
  },
  {
    group: 'initiative',
    href: '/admin/unpaid-donors',
    icon: CalendarClock,
    key: 'unpaid_donors',
    label: 'Unpaid Donors',
  },
  { group: 'initiative', icon: BarChart3, key: 'reports', label: 'Reports' },
  {
    group: 'admin',
    href: '/admin/team',
    icon: Contact,
    key: 'team_members',
    label: 'Team Members',
  },
  {
    group: 'admin',
    href: '/admin/team/roles',
    icon: ShieldCheck,
    key: 'roles_access',
    label: 'Roles & Access',
  },
  { group: 'admin', icon: Settings, key: 'settings', label: 'Settings' },
];

const AdminAccountContext = createContext<{
  donorProfile: Donor | null;
  searchValue: string;
  setSearchValue: (value: string) => void;
  teamMember: TeamMember;
} | null>(null);

export function useAdminAccount() {
  const context = useContext(AdminAccountContext);

  if (!context) {
    throw new Error('useAdminAccount must be used inside AdminShell.');
  }

  return context;
}

function getInitials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');
}

export function AdminShell({
  children,
  donorProfile,
  onSearchChange,
  searchValue,
  teamMember,
}: {
  children: React.ReactNode;
  donorProfile?: Donor | null;
  onSearchChange?: (value: string) => void;
  searchValue?: string;
  teamMember: TeamMember;
}) {
  const pathname = usePathname();
  const confirm = useConfirmation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const [initiative, setInitiative] = useState('orphan-sponsorship');
  const [internalSearch, setInternalSearch] = useState('');
  const accountMenuRef = useRef<HTMLDivElement | null>(null);
  const activeItem = getActiveNavItem(pathname);
  const visibleNavItems = useMemo(
    () => navItems.filter((item) => canAccessAdminPage(teamMember, item.key)),
    [teamMember],
  );
  const currentSearch = searchValue ?? internalSearch;
  const setSearch = onSearchChange ?? setInternalSearch;
  const initials = getInitials(teamMember.fullName) || 'A';
  const accountContext = useMemo(
    () => ({
      donorProfile: donorProfile ?? null,
      searchValue: currentSearch,
      setSearchValue: setSearch,
      teamMember,
    }),
    [currentSearch, donorProfile, setSearch, teamMember],
  );

  const signOut = async () => {
    const confirmed = await confirm({
      confirmLabel: 'Sign Out',
      description: 'This will end your admin session on this browser.',
      title: 'Sign out?',
    });

    if (!confirmed) return;

    await fetch('/api/admin/session', { method: 'DELETE' });
    window.location.href = '/admin/login';
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
    <AdminAccountContext.Provider value={accountContext}>
      <div className="admin-workspace min-h-screen bg-[#f7f7f4] font-sans text-[#111827]">
        <AdminSidebar
          activeItem={activeItem}
          collapsed={collapsed}
          navItems={visibleNavItems}
          onClose={() => setSidebarOpen(false)}
          onToggleCollapsed={() => setCollapsed((value) => !value)}
          open={sidebarOpen}
          teamMember={teamMember}
        />

        <div
          className={cn(
            'min-h-screen transition-[padding] duration-300',
            collapsed ? 'lg:pl-[4.5rem]' : 'lg:pl-[15.5rem]',
          )}
        >
          <header className="sticky top-0 z-30 flex min-h-[4.75rem] items-center justify-between gap-3 border-b border-gold/18 bg-offwhite/94 px-4 py-2 backdrop-blur sm:px-5 lg:px-6">
            <div className="flex min-w-0 flex-1 items-center gap-3">
              <button
                aria-label="Open admin navigation"
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-gold/20 bg-white text-emerald-deep transition hover:border-gold/50 hover:bg-cream lg:hidden"
                onClick={() => setSidebarOpen(true)}
                type="button"
              >
                <Menu className="h-4.5 w-4.5" />
              </button>

              <div className="flex min-w-0 flex-1 flex-col gap-1 sm:w-[13.8rem] sm:flex-none">
                <span className="block text-xs font-semibold uppercase leading-none tracking-[0.12em] text-[#374151]">
                  Initiative
                </span>
                <div className="relative">
                  <HeartHandshake className="pointer-events-none absolute left-3 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-[#075b43]" />
                  <CustomSelect
                    ariaLabel="Selected initiative"
                    onChange={setInitiative}
                    options={[
                      { label: 'Orphan Sponsorship', value: 'orphan-sponsorship' },
                      { disabled: true, label: 'Mosques · Planning', value: 'mosques' },
                      { disabled: true, label: 'Food & Water · Future', value: 'food-water' },
                    ]}
                    triggerClassName="h-10 border-[#d9ded8] pl-9 pr-2 font-medium text-[#1f2937]"
                    value={initiative}
                  />
                </div>
              </div>
            </div>

            <div className="flex min-w-0 items-center gap-2 sm:gap-3">
              <div className="relative" ref={accountMenuRef}>
                <button
                  aria-label="Open admin account menu"
                  aria-expanded={accountMenuOpen}
                  aria-haspopup="menu"
                  className="relative z-50 flex items-center gap-3 rounded-xl px-1 py-1 text-left transition hover:bg-cream"
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
                      {teamMember.fullName}
                    </p>
                    <p className="truncate text-xs font-semibold text-ink/65">
                      {TEAM_MEMBER_ROLE_LABELS[teamMember.role]}
                    </p>
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
                        Admin Account
                      </p>
                      <p className="mt-1 truncate text-sm font-bold text-emerald-deep">
                        {teamMember.fullName}
                      </p>
                      <p className="truncate text-xs font-semibold text-ink/62">
                        {teamMember.email}
                      </p>
                    </div>

                    {donorProfile ? (
                      <Link
                        className="flex items-start gap-3 px-4 py-3 text-left transition hover:bg-cream"
                        href="/portal"
                        role="menuitem"
                      >
                        <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gold/12 text-gold-deep">
                          <NavLinkIcon className="h-4 w-4" icon={HeartHandshake} />
                        </span>
                        <span className="min-w-0">
                          <span className="block text-sm font-bold text-emerald-deep">
                            Donor Portal
                          </span>
                          <span className="mt-0.5 block truncate text-xs font-semibold text-ink/62">
                            {donorProfile.fullName}
                          </span>
                        </span>
                      </Link>
                    ) : null}
                    <button
                      className="flex w-full items-center gap-3 border-t border-emerald/10 px-4 py-3 text-left text-sm font-bold text-emerald-deep transition hover:bg-cream"
                      onClick={signOut}
                      role="menuitem"
                      type="button"
                    >
                      <LogOut className="h-4 w-4" />
                      Sign Out
                    </button>
                  </div>
                ) : null}
              </div>
            </div>
          </header>

          <div className="admin-workspace-content px-4 py-5 sm:px-5 lg:px-6">{children}</div>
        </div>
      </div>
    </AdminAccountContext.Provider>
  );
}

function getActiveNavItem(pathname: string): AdminNavKey {
  if (pathname === '/admin') {
    return 'dashboard';
  }

  if (pathname.startsWith('/admin/sponsorship-requests')) {
    return 'sponsorship_requests';
  }

  if (pathname.startsWith('/admin/team/roles')) {
    return 'roles_access';
  }

  if (pathname.startsWith('/admin/team')) {
    return 'team_members';
  }

  if (pathname.startsWith('/admin/donors')) {
    return 'sponsors';
  }

  if (pathname.startsWith('/admin/orphans')) {
    return 'orphan_profiles';
  }

  if (pathname.startsWith('/admin/matches')) {
    return 'matches';
  }

  if (pathname.startsWith('/admin/receipts')) {
    return 'receipts';
  }

  if (pathname.startsWith('/admin/unpaid-donors')) {
    return 'unpaid_donors';
  }

  return 'dashboard';
}

function AdminSidebar({
  activeItem,
  collapsed,
  navItems,
  onClose,
  onToggleCollapsed,
  open,
  teamMember,
}: {
  activeItem: AdminNavKey;
  collapsed: boolean;
  navItems: AdminNavItem[];
  onClose: () => void;
  onToggleCollapsed: () => void;
  open: boolean;
  teamMember: TeamMember;
}) {
  const initials = getInitials(teamMember.fullName) || 'A';
  const [hovered, setHovered] = useState(false);
  // On desktop a collapsed sidebar expands into an overlay drawer while hovered,
  // then snaps back on mouse-out. The persistent `collapsed` state still drives
  // the page padding so this hover-expand overlays content instead of reflowing it.
  const effectiveCollapsed = collapsed && !hovered;

  return (
    <>
      <button
        aria-label="Close admin navigation backdrop"
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
        <div className="relative px-4 pb-5 pt-5">
          <Link
            aria-label="Bait ul Aqba home"
            className={cn('flex items-center gap-3', effectiveCollapsed && 'lg:justify-center')}
            href="/"
            onClick={onClose}
          >
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-gold/45 bg-cream-soft p-1 shadow-sm">
              <BrandMark className="h-full w-full" priority />
            </span>
            <span className={cn('min-w-0', effectiveCollapsed && 'lg:hidden')}>
              <span className="block truncate font-display text-[1.45rem] font-semibold leading-tight text-white">
                Bait ul Aqba
              </span>
              <span className="mt-1 block text-[0.62rem] font-semibold uppercase tracking-[0.22em] text-cream/80">
                Admin
              </span>
            </span>
          </Link>

          <button
            aria-label="Close admin navigation"
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

        <nav className="hide-scrollbar flex-1 overflow-y-auto px-2.5 pb-4">
          {(['global', 'initiative', 'admin'] as const).map((group) => {
            const items = navItems.filter((item) => item.group === group);

            if (items.length === 0) return null;

            return (
              <div
                className={cn(
                  'space-y-1',
                  group === 'initiative' && 'mt-5',
                  group === 'admin' && 'mt-5 border-t border-white/20 pt-4',
                )}
                key={group}
              >
                <p
                  className={cn(
                    'px-2 pb-1.5 text-[0.62rem] font-semibold uppercase tracking-[0.12em] text-cream/70',
                    effectiveCollapsed && 'lg:hidden',
                  )}
                >
                  {group === 'global'
                    ? 'Global'
                    : group === 'initiative'
                      ? 'Orphan Sponsorship'
                      : 'Admin'}
                </p>
                {items.map((item) => (
                  <NavItem
                    active={activeItem === item.key}
                    collapsed={effectiveCollapsed}
                    item={item}
                    key={item.key}
                    onClose={onClose}
                  />
                ))}
              </div>
            );
          })}
        </nav>

        <div className="mt-auto space-y-3 px-4 pb-5 pt-3">
          <div className={cn('flex items-center gap-3', effectiveCollapsed && 'lg:justify-center')}>
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/75 bg-transparent text-sm font-semibold text-white">
              {initials}
            </div>
            <div className={cn('min-w-0', effectiveCollapsed && 'lg:hidden')}>
              <p className="truncate text-sm font-semibold text-white">{teamMember.fullName}</p>
              <p className="mt-0.5 truncate text-xs font-medium text-gold-soft">
                {TEAM_MEMBER_ROLE_LABELS[teamMember.role]}
              </p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}

function NavItem({
  active,
  collapsed,
  item,
  onClose,
}: {
  active: boolean;
  collapsed: boolean;
  item: AdminNavItem;
  onClose: () => void;
}) {
  const content = (
    <>
      <item.icon className="h-4.5 w-4.5 shrink-0" />
      <span className={cn('truncate', collapsed && 'lg:hidden')}>{item.label}</span>
    </>
  );
  const className = cn(
    'flex h-11 w-full items-center gap-3 rounded-lg px-3 text-left text-sm font-semibold transition',
    collapsed && 'lg:justify-center lg:px-0',
    active
      ? 'bg-[#087b5b] text-white shadow-[0_12px_35px_-24px_rgba(0,0,0,0.9)]'
      : 'text-white/88 hover:bg-white/7 hover:text-white',
  );

  if (!item.href) {
    return (
      <button
        aria-disabled="true"
        className={cn(className, 'cursor-default')}
        title={`${item.label} is coming soon`}
        type="button"
      >
        {content}
      </button>
    );
  }

  return (
    <Link className={className} href={item.href} onClick={onClose}>
      <NavLinkIcon className="h-4.5 w-4.5 shrink-0" icon={item.icon} />
      <span className={cn('truncate', collapsed && 'lg:hidden')}>{item.label}</span>
    </Link>
  );
}

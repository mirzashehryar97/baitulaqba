import { FileText, HeartHandshake, LayoutDashboard, Search, UserRound } from 'lucide-react';

import { BrandMark } from '@/components/ui/BrandMark';

import { cn } from '@/lib/utils';

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard' },
  { icon: HeartHandshake, label: 'My Sponsorships' },
  { icon: FileText, label: 'Receipts' },
  { icon: Search, label: 'Available Orphans' },
  { icon: UserRound, label: 'Profile' },
];

export function PortalLoadingShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#f7f7f4] text-ink">
      <aside className="fixed inset-y-0 left-0 z-50 hidden w-[15.5rem] flex-col bg-emerald-deepest text-cream-soft lg:flex">
        <div className="border-b border-white/8 px-4 pb-6 pt-6">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-gold/45 bg-cream-soft p-1 shadow-sm">
              <BrandMark className="h-full w-full" priority />
            </span>
            <span className="min-w-0">
              <span className="block truncate font-display text-lg font-semibold text-gold-soft">
                Bait ul Aqba
              </span>
              <span className="mt-1 block text-[0.65rem] font-bold uppercase tracking-[0.18em] text-cream/65">
                Donor Portal
              </span>
            </span>
          </div>
        </div>

        <nav className="space-y-1 px-2.5 py-4">
          {navItems.map((item, index) => (
            <div
              className={cn(
                'flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm font-bold',
                index === 0 ? 'bg-gold/18 text-white' : 'text-cream-soft/78',
              )}
              key={item.label}
            >
              <item.icon className="h-4.5 w-4.5 shrink-0" />
              {item.label}
            </div>
          ))}
        </nav>

        <div className="mt-auto space-y-3 px-4 pb-5 pt-3">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 animate-pulse rounded-full border border-white/50 bg-white/10" />
            <div className="min-w-0 flex-1">
              <div className="h-4 w-28 animate-pulse rounded bg-cream/20" />
              <div className="mt-2 h-3 w-12 animate-pulse rounded bg-gold/20" />
            </div>
            <div className="h-4 w-4 animate-pulse rounded bg-white/15" />
          </div>
        </div>
      </aside>

      <div className="min-h-screen lg:pl-[15.5rem]">
        <header className="sticky top-0 z-30 flex min-h-[4.75rem] items-center justify-between gap-3 border-b border-gold/18 bg-offwhite/94 px-4 py-2 backdrop-blur sm:px-5 lg:px-6">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-gold-deep">
              Donor Portal
            </p>
            <div className="mt-1 h-6 w-40 animate-pulse rounded bg-emerald-deep/10" />
          </div>
          <div className="flex items-center gap-3 rounded-xl px-1 py-1">
            <div className="h-10 w-10 animate-pulse rounded-full bg-emerald-deep/12" />
            <div className="hidden sm:block">
              <div className="h-4 w-24 animate-pulse rounded bg-emerald-deep/10" />
              <div className="mt-2 h-3 w-12 animate-pulse rounded bg-emerald-deep/10" />
            </div>
            <div className="hidden h-4 w-4 animate-pulse rounded bg-emerald-deep/10 xl:block" />
          </div>
        </header>

        <main className="px-4 py-5 sm:px-5 lg:px-6">{children}</main>
      </div>
    </div>
  );
}

export function SkeletonBlock({ className }: { className?: string }) {
  return <div className={cn('animate-pulse rounded bg-emerald-deep/10', className)} />;
}

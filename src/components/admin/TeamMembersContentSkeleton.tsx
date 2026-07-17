import { cn } from '@/lib/utils';

const TEAM_KPIS = ['total', 'active', 'admins', 'pending'];
const TEAM_TABS = ['all', 'super-admin', 'admin', 'sponsorship', 'finance', 'field', 'viewer'];
const TEAM_FILTERS = ['search', 'role', 'status', 'clear'];
const TEAM_ROWS = ['one', 'two', 'three', 'four', 'five', 'six'];
const TEAM_COLUMNS = ['member', 'email', 'role', 'phone', 'status', 'last-active', 'menu'];
const TEAM_MOBILE_CARDS = ['one', 'two', 'three', 'four'];

export function TeamMembersContentSkeleton() {
  return (
    <>
      <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {TEAM_KPIS.map((item) => (
          <article
            className="rounded-xl border border-gold/16 bg-offwhite p-4 shadow-soft"
            key={`team-kpi-skeleton-${item}`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <SkeletonBlock className="h-5 w-36" />
                <SkeletonBlock className="mt-4 h-9 w-14" />
                <SkeletonBlock className="mt-3 h-4 w-32" />
              </div>
              <SkeletonBlock className="h-10 w-10 rounded-full" />
            </div>
          </article>
        ))}
      </div>

      <div className="mt-5">
        <section className="min-w-0 overflow-hidden rounded-xl border border-gold/16 bg-offwhite shadow-soft">
          <div className="flex flex-wrap items-center gap-2 border-b border-emerald/10 px-4 py-3">
            {TEAM_TABS.map((item, index) => (
              <SkeletonBlock
                className={cn('h-9 rounded-full', index === 0 ? 'w-20' : 'w-32')}
                key={`team-tab-skeleton-${item}`}
              />
            ))}
          </div>
          <div className="grid gap-3 border-b border-emerald/10 px-4 py-3 md:grid-cols-[minmax(14rem,1fr)_11rem_11rem_auto]">
            {TEAM_FILTERS.map((item) => (
              <SkeletonBlock className="h-10 rounded-lg" key={`team-filter-skeleton-${item}`} />
            ))}
          </div>
          <div className="hidden overflow-x-auto md:block">
            <div className="min-w-[850px]">
              {TEAM_ROWS.map((row) => (
                <div
                  className="grid grid-cols-[1.2fr_1.2fr_0.9fr_1fr_0.7fr_1fr_3rem] items-center border-b border-emerald/8 px-4 py-3.5"
                  key={`team-row-skeleton-${row}`}
                >
                  {TEAM_COLUMNS.map((column, columnIndex) => (
                    <SkeletonBlock
                      className={cn(
                        'h-4',
                        columnIndex === 0 && 'w-36',
                        columnIndex === 1 && 'w-40',
                        columnIndex === 2 && 'w-28',
                        columnIndex === 3 && 'w-32',
                        columnIndex === 4 && 'w-20',
                        columnIndex === 5 && 'w-28',
                        columnIndex === 6 && 'h-8 w-8 rounded-lg',
                      )}
                      key={`${row}-${column}`}
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>
          <div className="space-y-3 p-4 md:hidden">
            {TEAM_MOBILE_CARDS.map((item) => (
              <div
                className="rounded-lg border border-emerald/8 bg-white p-4"
                key={`team-mobile-skeleton-${item}`}
              >
                <SkeletonBlock className="h-5 w-44" />
                <SkeletonBlock className="mt-3 h-4 w-52" />
                <SkeletonBlock className="mt-4 h-8 w-24 rounded-md" />
              </div>
            ))}
          </div>
        </section>
      </div>
    </>
  );
}

function SkeletonBlock({ className }: { className?: string }) {
  return <div className={cn('animate-pulse rounded bg-emerald-deep/10', className)} />;
}

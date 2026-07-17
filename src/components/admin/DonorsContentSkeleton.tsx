import { cn } from '@/lib/utils';

const DONOR_KPIS = ['total', 'active', 'pending', 'inactive'];
const DONOR_FILTERS = ['search', 'status', 'method', 'source', 'clear'];
const DONOR_ROWS = ['one', 'two', 'three', 'four', 'five'];
const DONOR_COLUMNS = ['name', 'email', 'phone', 'status', 'source', 'method', 'created', 'menu'];
const DONOR_MOBILE_CARDS = ['one', 'two', 'three', 'four'];

export function DonorsContentSkeleton() {
  return (
    <>
      <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {DONOR_KPIS.map((item) => (
          <article
            className="rounded-xl border border-gold/16 bg-offwhite p-4 shadow-soft"
            key={`donor-kpi-skeleton-${item}`}
          >
            <div className="flex items-start gap-3">
              <SkeletonBlock className="h-10 w-10 rounded-full" />
              <div className="flex-1">
                <SkeletonBlock className="h-5 w-32" />
                <SkeletonBlock className="mt-4 h-9 w-14" />
              </div>
            </div>
          </article>
        ))}
      </div>
      <section className="mt-5 overflow-hidden rounded-xl border border-gold/16 bg-offwhite shadow-soft">
        <div className="grid gap-3 border-b border-emerald/10 px-4 py-3 md:grid-cols-[minmax(14rem,1fr)_11rem_11rem_11rem_auto]">
          {DONOR_FILTERS.map((item) => (
            <SkeletonBlock className="h-10 rounded-lg" key={`donor-filter-${item}`} />
          ))}
        </div>
        <div className="hidden md:block">
          {DONOR_ROWS.map((row) => (
            <div
              className="grid grid-cols-[1.4fr_1fr_1fr_0.8fr_1fr_0.8fr_1fr_3rem] items-center border-b border-emerald/8 px-4 py-3.5"
              key={`donor-row-skeleton-${row}`}
            >
              {DONOR_COLUMNS.map((column, columnIndex) => (
                <SkeletonBlock
                  className={cn('h-4', columnIndex === 0 && 'w-40', columnIndex === 7 && 'h-8 w-8')}
                  key={`${row}-${column}`}
                />
              ))}
            </div>
          ))}
        </div>
        <div className="space-y-3 p-4 md:hidden">
          {DONOR_MOBILE_CARDS.map((item) => (
            <div className="rounded-lg border border-emerald/8 bg-white p-4" key={item}>
              <SkeletonBlock className="h-5 w-44" />
              <SkeletonBlock className="mt-3 h-4 w-52" />
              <SkeletonBlock className="mt-4 h-8 w-24 rounded-md" />
            </div>
          ))}
        </div>
      </section>
    </>
  );
}

function SkeletonBlock({ className }: { className?: string }) {
  return <div className={cn('animate-pulse rounded bg-emerald-deep/10', className)} />;
}

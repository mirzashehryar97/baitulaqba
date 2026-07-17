import { cn } from '@/lib/utils';

const REQUEST_KPIS = ['total', 'new', 'review', 'converted'];
const REQUEST_TABS = ['all', 'new', 'reviewing', 'contacted', 'approved', 'converted'];
const REQUEST_FILTERS = ['search', 'status', 'source', 'assigned', 'created', 'updated', 'clear'];
const REQUEST_ROWS = ['one', 'two', 'three', 'four', 'five', 'six', 'seven'];
const REQUEST_COLUMNS = [
  'select',
  'name',
  'contact',
  'status',
  'source',
  'assigned',
  'date',
  'menu',
];
const REQUEST_MOBILE_CARDS = ['one', 'two', 'three', 'four'];

export function RequestsContentSkeleton() {
  return (
    <>
      <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {REQUEST_KPIS.map((item) => (
          <article
            className="rounded-xl border border-gold/16 bg-offwhite p-4 shadow-soft"
            key={`request-kpi-skeleton-${item}`}
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
            {REQUEST_TABS.map((item, index) => (
              <SkeletonBlock
                className={cn('h-9 rounded-full', index === 0 ? 'w-32' : 'w-28')}
                key={`request-tab-skeleton-${item}`}
              />
            ))}
          </div>
          <div className="flex flex-wrap gap-3 border-b border-emerald/10 px-4 py-3">
            {REQUEST_FILTERS.map((item, index) => (
              <SkeletonBlock
                className={cn(
                  'h-10 min-w-[min(100%,10.5rem)] flex-[1_1_10.5rem] rounded-lg',
                  index === 0 && 'min-w-[min(100%,18rem)] flex-[1_1_20rem]',
                  index >= 4 && 'min-w-[min(100%,11rem)] flex-[1_1_11rem]',
                )}
                key={`request-filter-skeleton-${item}`}
              />
            ))}
          </div>
          <div className="hidden overflow-x-auto md:block">
            <div className="min-w-[790px]">
              {REQUEST_ROWS.map((row) => (
                <div
                  className="grid grid-cols-[2.5rem_1.1fr_1.2fr_0.8fr_0.8fr_0.9fr_1fr_3rem] items-center border-b border-emerald/8 px-4 py-3.5 first:border-t-0"
                  key={`request-row-skeleton-${row}`}
                >
                  {REQUEST_COLUMNS.map((column, columnIndex) => (
                    <SkeletonBlock
                      className={cn(
                        'h-4',
                        columnIndex === 0 && 'w-4 rounded',
                        columnIndex === 1 && 'w-32',
                        columnIndex === 2 && 'w-36',
                        columnIndex === 3 && 'w-20',
                        columnIndex === 4 && 'w-24',
                        columnIndex === 5 && 'w-20',
                        columnIndex === 6 && 'w-28',
                        columnIndex === 7 && 'h-8 w-8 rounded-lg',
                      )}
                      key={`${row}-${column}`}
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>
          <div className="space-y-3 p-4 md:hidden">
            {REQUEST_MOBILE_CARDS.map((item) => (
              <div
                className="rounded-lg border border-emerald/8 bg-white p-4"
                key={`request-mobile-skeleton-${item}`}
              >
                <SkeletonBlock className="h-5 w-44" />
                <SkeletonBlock className="mt-3 h-4 w-36" />
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

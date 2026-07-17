import { cn } from '@/lib/utils';

const ORPHAN_KPIS = ['total', 'drafts', 'review', 'approved'];
const ORPHAN_FILTERS = ['search', 'status', 'verification'];
const ORPHAN_ROWS = ['one', 'two', 'three', 'four', 'five', 'six'];
const ORPHAN_COLUMNS = [
  'code',
  'profile',
  'age',
  'guardian',
  'region',
  'verification',
  'status',
  'date',
];
const ORPHAN_MOBILE_CARDS = ['one', 'two', 'three', 'four'];

export function OrphansContentSkeleton() {
  return (
    <>
      <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {ORPHAN_KPIS.map((item) => (
          <article
            className="rounded-xl border border-gold/16 bg-offwhite p-4 shadow-soft"
            key={`orphan-kpi-skeleton-${item}`}
          >
            <div className="flex items-start gap-3">
              <SkeletonBlock className="h-10 w-10 rounded-full" />
              <div className="flex-1">
                <SkeletonBlock className="h-5 w-36" />
                <SkeletonBlock className="mt-4 h-9 w-14" />
              </div>
            </div>
          </article>
        ))}
      </div>

      <section className="mt-5 min-w-0 overflow-hidden rounded-xl border border-gold/16 bg-offwhite shadow-soft">
        <div className="grid gap-3 border-b border-emerald/10 px-4 py-3 md:grid-cols-[minmax(14rem,1fr)_13rem_13rem]">
          {ORPHAN_FILTERS.map((item) => (
            <SkeletonBlock className="h-10 rounded-lg" key={`orphan-filter-skeleton-${item}`} />
          ))}
        </div>

        <div className="hidden overflow-x-auto md:block">
          <div className="min-w-[980px]">
            {ORPHAN_ROWS.map((row) => (
              <div
                className="grid grid-cols-[0.8fr_1.4fr_1fr_1fr_1fr_1fr_0.8fr_0.8fr] items-center border-b border-emerald/8 px-4 py-3.5"
                key={`orphan-row-skeleton-${row}`}
              >
                {ORPHAN_COLUMNS.map((column, columnIndex) => (
                  <SkeletonBlock
                    className={cn(
                      'h-4',
                      columnIndex === 0 && 'w-20 rounded-full',
                      columnIndex === 1 && 'h-11 w-44 rounded-lg',
                      columnIndex === 2 && 'w-36',
                      columnIndex === 3 && 'w-28',
                      columnIndex === 4 && 'w-32',
                      columnIndex === 5 && 'w-32 rounded-full',
                      columnIndex === 6 && 'w-24 rounded-full',
                      columnIndex === 7 && 'w-24',
                    )}
                    key={`${row}-${column}`}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-3 p-4 md:hidden">
          {ORPHAN_MOBILE_CARDS.map((item) => (
            <div
              className="rounded-lg border border-emerald/8 bg-white p-4"
              key={`orphan-mobile-skeleton-${item}`}
            >
              <SkeletonBlock className="h-5 w-44" />
              <SkeletonBlock className="mt-3 h-4 w-36" />
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

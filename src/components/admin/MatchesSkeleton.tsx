const MATCH_KPIS = ['active', 'paused', 'ending', 'total'];
const MATCH_FILTERS = ['search', 'status', 'created-by', 'started-from', 'started-to'];
const MATCH_ROWS = ['one', 'two', 'three', 'four', 'five', 'six'];
const MATCH_COLUMNS = ['donor', 'orphan', 'status', 'amount', 'actions'];
const MATCH_MOBILE_CARDS = ['one', 'two', 'three', 'four'];

export function MatchesSkeleton() {
  return (
    <div className="mt-5 space-y-4">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {MATCH_KPIS.map((item) => (
          <div
            className="rounded-lg border border-gold/16 bg-offwhite px-4 py-3.5 shadow-[0_16px_36px_-30px_rgba(7,39,29,0.6)]"
            key={`match-stat-skeleton-${item}`}
          >
            <div className="flex items-start gap-3">
              <div className="mt-1 h-10 w-10 shrink-0 animate-pulse rounded-full bg-emerald-deepest/14" />
              <div className="min-w-0 flex-1">
                <div className="h-4 w-28 animate-pulse rounded-md bg-emerald-deepest/10" />
                <div className="mt-3 h-9 w-14 animate-pulse rounded-md bg-emerald-deepest/10" />
                <div className="mt-3 h-3 w-24 animate-pulse rounded-md bg-emerald-deepest/10" />
              </div>
            </div>
          </div>
        ))}
      </div>
      <section className="min-w-0 overflow-hidden rounded-xl border border-gold/16 bg-offwhite shadow-soft">
        <div className="grid gap-3 border-b border-emerald/10 px-4 py-3 md:grid-cols-2 xl:grid-cols-[minmax(14rem,1fr)_12rem_14rem_10rem_10rem]">
          {MATCH_FILTERS.map((item) => (
            <div
              className="h-10 animate-pulse rounded-lg bg-emerald-deepest/10"
              key={`match-filter-skeleton-${item}`}
            />
          ))}
        </div>
        <div className="hidden divide-y divide-emerald/10 lg:block">
          {MATCH_ROWS.map((row) => (
            <div
              className="grid grid-cols-[1.2fr_1.2fr_0.7fr_0.8fr_1fr] gap-4 px-4 py-4"
              key={`match-row-skeleton-${row}`}
            >
              {MATCH_COLUMNS.map((column) => (
                <div
                  className="h-6 animate-pulse rounded-md bg-emerald-deepest/10"
                  key={`match-row-skeleton-${row}-${column}`}
                />
              ))}
            </div>
          ))}
        </div>
        <div className="space-y-3 p-4 lg:hidden">
          {MATCH_MOBILE_CARDS.map((item) => (
            <div
              className="h-32 animate-pulse rounded-lg border border-gold/16 bg-cream-soft"
              key={`match-card-skeleton-${item}`}
            />
          ))}
        </div>
      </section>
    </div>
  );
}

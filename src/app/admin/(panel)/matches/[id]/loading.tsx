export default function MatchDetailLoading() {
  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <div className="h-4 w-32 animate-pulse rounded bg-emerald/10" />
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-2">
            <div className="h-9 w-64 animate-pulse rounded-lg bg-emerald/10" />
            <div className="h-4 w-72 max-w-full animate-pulse rounded bg-emerald/10" />
          </div>
          <div className="h-10 w-48 animate-pulse rounded-lg bg-emerald/10" />
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {['monthly', 'received', 'current', 'coverage'].map((item) => (
          <div
            className="h-28 animate-pulse rounded-lg border border-emerald/10 bg-white"
            key={item}
          />
        ))}
      </div>
      <div className="h-11 animate-pulse border-b border-emerald/10" />
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.75fr)_minmax(19rem,0.8fr)]">
        <div className="space-y-4">
          <div className="h-56 animate-pulse rounded-lg border border-emerald/10 bg-white" />
          <div className="h-80 animate-pulse rounded-lg border border-emerald/10 bg-white" />
        </div>
        <div className="space-y-4">
          <div className="h-80 animate-pulse rounded-lg border border-emerald/10 bg-white" />
          <div className="h-32 animate-pulse rounded-lg border border-emerald/10 bg-white" />
        </div>
      </div>
    </div>
  );
}

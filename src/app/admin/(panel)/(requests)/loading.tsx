export default function AdminDashboardLoading() {
  return (
    <section className="space-y-4">
      <div>
        <div className="h-9 w-40 animate-pulse rounded-lg bg-emerald-deepest/16" />
        <div className="mt-2 h-5 w-80 max-w-full animate-pulse rounded bg-emerald-deepest/10" />
      </div>

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-3 2xl:grid-cols-6">
        {['requests', 'profiles', 'matches', 'reviews', 'overdue', 'verified'].map((item) => (
          <div
            className="h-[5.65rem] animate-pulse rounded-lg border border-[#dfe5df] bg-white"
            key={item}
          />
        ))}
      </div>

      <div className="rounded-lg border border-[#dfe5df] bg-white p-4">
        <div className="h-5 w-44 animate-pulse rounded bg-emerald-deepest/10" />
        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {['verified', 'delivered', 'review', 'receipts'].map((item) => (
            <div className="h-[5.5rem] animate-pulse rounded-lg bg-emerald-deepest/8" key={item} />
          ))}
        </div>
      </div>
    </section>
  );
}

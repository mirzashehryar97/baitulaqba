export default function UnpaidDonorsLoading() {
  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {['unpaid', 'expected', 'month'].map((item) => (
          <div
            className="h-28 animate-pulse rounded-lg border border-emerald/10 bg-white"
            key={item}
          />
        ))}
      </div>
      <div className="h-[32rem] animate-pulse rounded-lg border border-emerald/10 bg-white" />
    </div>
  );
}

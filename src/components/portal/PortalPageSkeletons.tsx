import { SkeletonBlock } from '@/components/portal/PortalLoadingShell';

export function PortalDashboardSkeleton() {
  return (
    <div className="space-y-5 sm:space-y-6">
      <section>
        <SkeletonBlock className="h-11 w-80 max-w-full" />
        <SkeletonBlock className="mt-3 h-5 w-64 max-w-full" />
      </section>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.62fr)_minmax(18rem,1fr)]">
        <SkeletonBlock className="h-44 rounded-[1.15rem]" />
        <SkeletonBlock className="h-44 rounded-[1.15rem]" />
      </section>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,0.93fr)_minmax(0,1.07fr)]">
        <section className="rounded-[1.15rem] border border-[#dfe3dc] bg-white p-5">
          <SkeletonBlock className="h-7 w-44" />
          <div className="mt-4 space-y-3">
            {['one', 'two', 'three'].map((item) => (
              <SkeletonBlock className="h-20 rounded-xl" key={item} />
            ))}
          </div>
        </section>
        <SkeletonBlock className="h-[22rem] rounded-[1.15rem]" />
      </div>

      <section className="rounded-[1.15rem] border border-[#dfe3dc] bg-white p-5">
        <SkeletonBlock className="h-7 w-56" />
        <SkeletonBlock className="mt-2 h-4 w-72 max-w-full" />
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {['education', 'food', 'healthcare'].map((item) => (
            <SkeletonBlock className="h-24 rounded-xl" key={item} />
          ))}
        </div>
      </section>
    </div>
  );
}

export function SponsorshipsSkeleton() {
  return (
    <div className="space-y-6">
      <header className="flex items-start justify-between gap-4">
        <div>
          <SkeletonBlock className="h-9 w-56" />
          <SkeletonBlock className="mt-3 h-4 w-96 max-w-full" />
        </div>
        <SkeletonBlock className="hidden h-11 w-48 rounded-lg sm:block" />
      </header>
      <section className="grid gap-3 md:grid-cols-3">
        {['active', 'commitment', 'delivered'].map((item) => (
          <SkeletonBlock className="h-24 rounded-lg" key={item} />
        ))}
      </section>
      <SkeletonBlock className="h-20 rounded-lg" />
      <section>
        <div className="flex items-end justify-between gap-4">
          <div>
            <SkeletonBlock className="h-8 w-52" />
            <SkeletonBlock className="mt-2 h-4 w-72 max-w-full" />
          </div>
          <SkeletonBlock className="hidden h-11 w-64 rounded-lg sm:block" />
        </div>
        <div className="mt-4 space-y-3">
          {['one', 'two', 'three'].map((item) => (
            <SkeletonBlock className="h-40 rounded-lg lg:h-36" key={item} />
          ))}
        </div>
      </section>
    </div>
  );
}

export function AvailableOrphansSkeleton() {
  return (
    <div className="space-y-6">
      <header className="flex items-start justify-between gap-4">
        <div>
          <SkeletonBlock className="h-9 w-64" />
          <SkeletonBlock className="mt-3 h-4 w-[30rem] max-w-full" />
        </div>
        <SkeletonBlock className="hidden h-10 w-48 rounded-lg sm:block" />
      </header>
      <SkeletonBlock className="h-36 rounded-lg" />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-[1.8fr_0.65fr_0.75fr_0.85fr_auto]">
        <SkeletonBlock className="h-12 rounded-lg sm:col-span-2 xl:col-span-1" />
        <SkeletonBlock className="h-12 rounded-lg" />
        <SkeletonBlock className="h-12 rounded-lg" />
        <SkeletonBlock className="h-12 rounded-lg" />
        <SkeletonBlock className="h-4 w-24 self-center sm:col-span-2 xl:col-span-1" />
      </div>
      <section>
        <SkeletonBlock className="h-7 w-64" />
        <SkeletonBlock className="mt-2 h-4 w-80 max-w-full" />
        <div className="mt-4 grid gap-3 xl:grid-cols-2">
          {['one', 'two', 'three', 'four'].map((item) => (
            <SkeletonBlock className="h-64 rounded-lg" key={item} />
          ))}
        </div>
      </section>
    </div>
  );
}

export function ReceiptsSkeleton() {
  return (
    <section className="rounded-xl border border-gold/16 bg-offwhite p-5 shadow-soft">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <SkeletonBlock className="h-9 w-36" />
          <SkeletonBlock className="mt-3 h-4 w-72 max-w-full" />
        </div>
        <SkeletonBlock className="h-11 w-36 rounded-lg" />
      </div>
      <div className="mt-6 hidden overflow-hidden rounded-lg border border-emerald/8 md:block">
        {['head', 'one', 'two', 'three', 'four', 'five'].map((row) => (
          <div
            className="grid grid-cols-6 gap-4 border-b border-emerald/8 px-4 py-4 last:border-b-0"
            key={row}
          >
            {['month', 'sponsorship', 'amount', 'bank', 'status', 'submitted'].map((column) => (
              <SkeletonBlock className="h-4" key={`${row}-${column}`} />
            ))}
          </div>
        ))}
      </div>
      <div className="mt-6 space-y-3 md:hidden">
        {['one', 'two', 'three'].map((item) => (
          <SkeletonBlock className="h-28 rounded-lg" key={item} />
        ))}
      </div>
    </section>
  );
}

export function ProfileSkeleton() {
  return (
    <section className="rounded-xl border border-gold/16 bg-offwhite p-5 shadow-soft">
      <SkeletonBlock className="h-9 w-32" />
      <SkeletonBlock className="mt-3 h-4 w-80 max-w-full" />
      <div className="mt-6 grid gap-5 md:grid-cols-2">
        {['name', 'email', 'phone', 'city', 'method'].map((item) => (
          <div key={item}>
            <SkeletonBlock className="h-4 w-32" />
            <SkeletonBlock className="mt-2 h-12 rounded-lg" />
          </div>
        ))}
      </div>
      <SkeletonBlock className="mt-6 h-12 w-32 rounded-lg" />
    </section>
  );
}

export function ReceiptUploadSkeleton() {
  return (
    <section className="rounded-xl border border-gold/16 bg-offwhite p-5 shadow-soft">
      <SkeletonBlock className="h-9 w-48" />
      <SkeletonBlock className="mt-3 h-4 w-96 max-w-full" />
      <div className="mt-6 grid gap-5">
        <div>
          <SkeletonBlock className="h-4 w-28" />
          <SkeletonBlock className="mt-2 h-12 rounded-lg" />
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {['month', 'amount', 'currency'].map((item) => (
            <div key={item}>
              <SkeletonBlock className="h-4 w-28" />
              <SkeletonBlock className="mt-2 h-12 rounded-lg" />
            </div>
          ))}
        </div>
        {['bank', 'file', 'note'].map((item) => (
          <div key={item}>
            <SkeletonBlock className="h-4 w-32" />
            <SkeletonBlock className="mt-2 h-12 rounded-lg" />
          </div>
        ))}
        <SkeletonBlock className="h-12 w-40 rounded-lg" />
      </div>
    </section>
  );
}

export function SponsorshipDetailSkeleton() {
  return (
    <div className="space-y-5">
      <header>
        <SkeletonBlock className="h-4 w-48" />
        <div className="mt-4 flex items-center gap-3">
          <SkeletonBlock className="h-10 w-64 max-w-[70%]" />
          <SkeletonBlock className="h-8 w-20 rounded-md" />
        </div>
      </header>

      <section className="grid gap-5 rounded-xl border border-[#dfe5df] bg-white p-4 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
          <SkeletonBlock className="h-64 w-full shrink-0 rounded-lg sm:h-56 sm:w-56 xl:h-60 xl:w-60" />
          <div className="min-w-0 flex-1">
            <SkeletonBlock className="h-4 w-24" />
            <SkeletonBlock className="mt-4 h-11 w-64 max-w-full" />
            <SkeletonBlock className="mt-4 h-5 w-80 max-w-full" />
            <SkeletonBlock className="mt-5 h-20 rounded-lg" />
          </div>
        </div>
        <SkeletonBlock className="h-60 rounded-lg" />
      </section>

      <section className="grid gap-3 sm:grid-cols-2 2xl:grid-cols-4">
        {['monthly', 'since', 'verified', 'delivered'].map((item) => (
          <SkeletonBlock className="h-24 rounded-xl" key={item} />
        ))}
      </section>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1.8fr)_minmax(18rem,0.9fr)]">
        <div>
          <SkeletonBlock className="h-14 rounded-lg" />
          <div className="mt-3 rounded-xl border border-[#dfe5df] bg-white p-5">
            <SkeletonBlock className="h-7 w-48" />
            <SkeletonBlock className="mt-2 h-4 w-64 max-w-full" />
            <div className="mt-5 space-y-3">
              {['one', 'two', 'three', 'four'].map((row) => (
                <SkeletonBlock className="h-12 rounded-md" key={row} />
              ))}
            </div>
          </div>
        </div>
        <SkeletonBlock className="h-80 rounded-xl" />
      </section>
    </div>
  );
}

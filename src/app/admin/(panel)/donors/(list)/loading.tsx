import { DonorsContentSkeleton } from '@/components/admin/DonorsContentSkeleton';

export default function DonorsLoading() {
  return (
    <>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h2 className="font-display text-[1.7rem] font-semibold leading-tight text-emerald-deep">
            Donors
          </h2>
          <p className="mt-1 text-[0.95rem] font-medium text-ink/70">
            Manage donor profiles, contact preferences, and account access.
          </p>
        </div>
        <div className="h-11 w-32 animate-pulse rounded-lg bg-emerald-deepest/20" />
      </div>

      <DonorsContentSkeleton />
    </>
  );
}

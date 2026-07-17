import { TeamMembersContentSkeleton } from '@/components/admin/TeamMembersContentSkeleton';

export default function TeamMembersLoading() {
  return (
    <>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h2 className="font-display text-[1.7rem] font-semibold leading-tight text-emerald-deep">
            Team Members
          </h2>
          <p className="mt-1 text-[0.95rem] font-medium text-ink/70">
            Manage staff access, roles, and account status.
          </p>
        </div>
        <div className="h-11 w-40 animate-pulse rounded-lg bg-emerald-deepest/20" />
      </div>

      <TeamMembersContentSkeleton />
    </>
  );
}

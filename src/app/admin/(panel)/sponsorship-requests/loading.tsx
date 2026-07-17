import { RequestsContentSkeleton } from '@/components/admin/RequestsContentSkeleton';

export default function SponsorshipRequestsLoading() {
  return (
    <>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="font-display text-[1.7rem] font-semibold leading-tight text-emerald-deep">
            Sponsorship Requests
          </h2>
          <p className="mt-1 text-[0.95rem] font-medium text-ink/70">
            Manage and follow up on orphan sponsorship requests.
          </p>
        </div>
        <div className="h-11 w-32 animate-pulse rounded-lg bg-emerald-deepest/20" />
      </div>

      <RequestsContentSkeleton />
    </>
  );
}

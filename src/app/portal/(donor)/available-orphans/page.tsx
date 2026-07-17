import { redirect } from 'next/navigation';

import { AvailableOrphansGrid } from '@/components/portal/AvailableOrphansGrid';

import { requireDonor } from '@/lib/adminAuth';
import {
  listAvailableOrphanFilterOptionsForPortal,
  listAvailableOrphansForPortal,
} from '@/lib/portal';

export const dynamic = 'force-dynamic';

export default async function PortalAvailableOrphansPage() {
  const donor = await requireDonor().catch(() => null);
  if (!donor) redirect('/portal/login?error=not_allowed');

  const [initialPage, filterOptions] = await Promise.all([
    listAvailableOrphansForPortal(),
    listAvailableOrphanFilterOptionsForPortal(),
  ]);

  return (
    <div className="space-y-5 font-sans text-[#111827] sm:space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-[-0.02em] text-[#111827]">
            Available Orphans
          </h1>
          <p className="mt-2 text-sm font-normal text-[#6b7280]">
            Browse approved, field-verified profiles currently awaiting sponsorship.
          </p>
        </div>
        <span className="inline-flex h-10 w-fit items-center rounded-lg border border-[#0d6b50] bg-white px-4 text-xs font-semibold uppercase tracking-[0.04em] text-[#07543f]">
          {initialPage.total} {initialPage.total === 1 ? 'profile' : 'profiles'} available
        </span>
      </header>
      <AvailableOrphansGrid filterOptions={filterOptions} initialPage={initialPage} />
    </div>
  );
}

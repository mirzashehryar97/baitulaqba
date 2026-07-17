import { NextResponse } from 'next/server';

import { requireDonor } from '@/lib/adminAuth';
import { getPaginationOptions } from '@/lib/pagination';
import { listAvailableOrphansForPortal } from '@/lib/portal';
import { handlePortalApiError } from '@/lib/portalApi';

export async function GET(request: Request) {
  try {
    await requireDonor();
    const url = new URL(request.url);
    const orphans = await listAvailableOrphansForPortal(
      {
        age: parseAge(url.searchParams.get('age')),
        education: url.searchParams.get('education') ?? undefined,
        location: url.searchParams.get('location') ?? undefined,
        search: url.searchParams.get('search') ?? undefined,
      },
      getPaginationOptions(url),
    );

    return NextResponse.json({ data: orphans });
  } catch (error) {
    return handlePortalApiError(error, 'Could not load available orphans.');
  }
}

function parseAge(value: string | null) {
  return value === 'under-8' || value === '8-10' || value === '11-plus' ? value : undefined;
}

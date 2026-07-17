import { NextResponse } from 'next/server';

import { requireTeamMember } from '@/lib/adminAuth';
import { listOverdueSponsorshipsPage } from '@/lib/finance';
import { handleFinanceApiError } from '@/lib/financeApiErrors';
import { getPaginationOptions } from '@/lib/pagination';

export async function GET(request: Request) {
  try {
    const teamMember = await requireTeamMember();
    const url = new URL(request.url);
    const overdue = await listOverdueSponsorshipsPage(
      teamMember,
      {
        month: url.searchParams.get('month') ?? undefined,
        search: url.searchParams.get('search') ?? undefined,
      },
      getPaginationOptions(url),
    );

    return NextResponse.json({ data: overdue });
  } catch (error) {
    return handleFinanceApiError(error, 'Could not load overdue sponsorships.');
  }
}

import { NextResponse } from 'next/server';

import { requireTeamMember } from '@/lib/adminAuth';
import { getAdminFinanceSummary } from '@/lib/finance';
import { handleFinanceApiError } from '@/lib/financeApiErrors';

export async function GET(request: Request) {
  try {
    const teamMember = await requireTeamMember();
    const url = new URL(request.url);
    const summary = await getAdminFinanceSummary(teamMember, url.searchParams.get('month'));

    return NextResponse.json({ data: summary });
  } catch (error) {
    return handleFinanceApiError(error, 'Could not load finance summary.');
  }
}

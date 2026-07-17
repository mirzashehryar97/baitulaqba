import { NextResponse } from 'next/server';

import { requireTeamMember } from '@/lib/adminAuth';
import { getAdminReceiptDetail } from '@/lib/finance';
import { handleFinanceApiError } from '@/lib/financeApiErrors';

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const teamMember = await requireTeamMember();
    const { id } = await params;
    const receipt = await getAdminReceiptDetail(teamMember, id);

    if (!receipt) {
      return NextResponse.json({ error: 'Receipt not found.' }, { status: 404 });
    }

    return NextResponse.json({ data: receipt });
  } catch (error) {
    return handleFinanceApiError(error, 'Could not load receipt.');
  }
}

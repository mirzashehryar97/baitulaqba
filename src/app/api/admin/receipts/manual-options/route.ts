import { NextResponse } from 'next/server';

import { requireTeamMember } from '@/lib/adminAuth';
import { listAdminManualReceiptOptions } from '@/lib/finance';
import { handleFinanceApiError } from '@/lib/financeApiErrors';

export async function GET() {
  try {
    const teamMember = await requireTeamMember();
    const options = await listAdminManualReceiptOptions(teamMember);

    return NextResponse.json({ data: options });
  } catch (error) {
    return handleFinanceApiError(error, 'Could not load receipt entry options.');
  }
}

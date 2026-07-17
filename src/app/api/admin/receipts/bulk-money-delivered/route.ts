import { NextResponse } from 'next/server';

import { requireTeamMember } from '@/lib/adminAuth';
import { bulkMarkReceiptsMoneyDelivered } from '@/lib/finance';
import { handleFinanceApiError } from '@/lib/financeApiErrors';

import type { AdminBulkDeliveryInput } from '@/types/finance';

export async function PATCH(request: Request) {
  try {
    const teamMember = await requireTeamMember();
    const body = (await request.json().catch(() => null)) as AdminBulkDeliveryInput | null;

    const result = await bulkMarkReceiptsMoneyDelivered(
      teamMember,
      body ?? { selectionMode: 'explicit', receiptIds: [] },
    );

    return NextResponse.json({ data: result });
  } catch (error) {
    return handleFinanceApiError(error, 'Could not mark receipts delivered.');
  }
}

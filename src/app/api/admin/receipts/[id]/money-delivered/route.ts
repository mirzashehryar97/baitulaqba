import { NextResponse } from 'next/server';

import { requireTeamMember } from '@/lib/adminAuth';
import { markReceiptMoneyDelivered } from '@/lib/finance';
import { handleFinanceApiError } from '@/lib/financeApiErrors';

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const teamMember = await requireTeamMember();
    const { id } = await params;
    const body = (await request.json().catch(() => ({}))) as {
      deliveryReference?: string;
      financeNotes?: string;
    };
    const receipt = await markReceiptMoneyDelivered(teamMember, id, {
      deliveryReference: body.deliveryReference,
      financeNotes: body.financeNotes,
    });

    if (!receipt) {
      return NextResponse.json({ error: 'Receipt not found.' }, { status: 404 });
    }

    return NextResponse.json({ data: receipt });
  } catch (error) {
    return handleFinanceApiError(error, 'Could not mark receipt delivered.');
  }
}

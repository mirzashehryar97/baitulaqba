import { NextResponse } from 'next/server';

import { requireTeamMember } from '@/lib/adminAuth';
import { rejectReceipt } from '@/lib/finance';
import { handleFinanceApiError } from '@/lib/financeApiErrors';

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const teamMember = await requireTeamMember();
    const { id } = await params;
    const body = (await request.json().catch(() => ({}))) as {
      financeNotes?: string;
      rejectionReason?: string;
    };
    const receipt = await rejectReceipt(teamMember, id, {
      financeNotes: body.financeNotes,
      rejectionReason: body.rejectionReason,
    });

    if (!receipt) {
      return NextResponse.json({ error: 'Receipt not found.' }, { status: 404 });
    }

    return NextResponse.json({ data: receipt });
  } catch (error) {
    return handleFinanceApiError(error, 'Could not reject receipt.');
  }
}

import { NextResponse } from 'next/server';

import { requireTeamMember } from '@/lib/adminAuth';
import { getReceiptFileSignedUrl } from '@/lib/finance';
import { handleFinanceApiError } from '@/lib/financeApiErrors';

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const teamMember = await requireTeamMember();
    const { id } = await params;
    const signedUrl = await getReceiptFileSignedUrl(teamMember, id);

    if (!signedUrl) {
      return NextResponse.json({ error: 'Receipt file not found.' }, { status: 404 });
    }

    return NextResponse.json({ data: { signedUrl } });
  } catch (error) {
    return handleFinanceApiError(error, 'Could not load receipt file.');
  }
}

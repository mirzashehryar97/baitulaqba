import { NextResponse } from 'next/server';

import { requireTeamMember } from '@/lib/adminAuth';
import {
  createAdminManualReceipt,
  FinanceValidationError,
  listAdminReceipts,
  parseReceiptFilters,
} from '@/lib/finance';
import { handleFinanceApiError } from '@/lib/financeApiErrors';
import { getPaginationOptions } from '@/lib/pagination';

export async function GET(request: Request) {
  try {
    const teamMember = await requireTeamMember();
    const url = new URL(request.url);
    const receipts = await listAdminReceipts(
      teamMember,
      parseReceiptFilters(url),
      getPaginationOptions(url),
    );

    return NextResponse.json({ data: receipts });
  } catch (error) {
    return handleFinanceApiError(error, 'Could not load receipts.');
  }
}

export async function POST(request: Request) {
  try {
    const teamMember = await requireTeamMember();
    const formData = await request.formData();
    const file = formData.get('file');

    if (!(file instanceof File)) {
      throw new FinanceValidationError({ file: 'Upload a receipt image.' });
    }

    const receipt = await createAdminManualReceipt(teamMember, {
      amount: Number(formData.get('amount')),
      currency: String(formData.get('currency') ?? ''),
      donationMonth: String(formData.get('donationMonth') ?? ''),
      file,
      financeNotes: String(formData.get('financeNotes') ?? ''),
      organizationBankAccountId: String(formData.get('organizationBankAccountId') ?? ''),
      sponsorshipMatchId: String(formData.get('sponsorshipMatchId') ?? ''),
      transferDate: String(formData.get('transferDate') ?? ''),
      transferReference: String(formData.get('transferReference') ?? ''),
    });

    return NextResponse.json({ data: receipt }, { status: 201 });
  } catch (error) {
    return handleFinanceApiError(error, 'Could not create receipt.');
  }
}

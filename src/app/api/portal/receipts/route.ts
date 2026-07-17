import { NextResponse } from 'next/server';

import { requireDonor } from '@/lib/adminAuth';
import {
  createPortalReceiptUpload,
  listPortalReceipts,
  PortalValidationError,
  parseReceiptStatus,
} from '@/lib/portal';
import { handlePortalApiError } from '@/lib/portalApi';

export async function GET(request: Request) {
  try {
    const donor = await requireDonor();
    const url = new URL(request.url);
    const receipts = await listPortalReceipts(donor.id, {
      matchId: url.searchParams.get('matchId') ?? undefined,
      monthFrom: url.searchParams.get('monthFrom') ?? undefined,
      monthTo: url.searchParams.get('monthTo') ?? undefined,
      status: parseReceiptStatus(url.searchParams.get('status')),
    });

    return NextResponse.json({ data: receipts });
  } catch (error) {
    return handlePortalApiError(error, 'Could not load receipts.');
  }
}

export async function POST(request: Request) {
  try {
    const donor = await requireDonor();
    const formData = await request.formData();
    const file = formData.get('file');

    if (!(file instanceof File)) {
      throw new PortalValidationError({ file: 'Upload a receipt image.' });
    }

    const receipt = await createPortalReceiptUpload(donor.id, {
      amount: Number(formData.get('amount')),
      currency: String(formData.get('currency') ?? ''),
      donationMonth: String(formData.get('donationMonth') ?? ''),
      donorNote: String(formData.get('donorNote') ?? ''),
      file,
      organizationBankAccountId: String(formData.get('organizationBankAccountId') ?? ''),
      sponsorshipMatchId: String(formData.get('sponsorshipMatchId') ?? ''),
    });

    return NextResponse.json({ data: receipt }, { status: 201 });
  } catch (error) {
    return handlePortalApiError(error, 'Could not upload receipt.');
  }
}

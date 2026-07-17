import { NextResponse } from 'next/server';

import { requireDonor } from '@/lib/adminAuth';
import {
  getCurrentDonationMonth,
  listActiveOrganizationBankAccounts,
  listPortalSponsorshipsForDonor,
} from '@/lib/portal';
import { handlePortalApiError } from '@/lib/portalApi';

export async function GET() {
  try {
    const donor = await requireDonor();
    const [sponsorships, bankAccounts] = await Promise.all([
      listPortalSponsorshipsForDonor(donor.id),
      listActiveOrganizationBankAccounts(),
    ]);

    return NextResponse.json({
      data: {
        bankAccounts,
        currentMonth: getCurrentDonationMonth(),
        sponsorships,
      },
    });
  } catch (error) {
    return handlePortalApiError(error, 'Could not load receipt upload options.');
  }
}

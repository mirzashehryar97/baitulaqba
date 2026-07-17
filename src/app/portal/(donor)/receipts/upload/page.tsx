import { redirect } from 'next/navigation';

import { ReceiptUploadForm } from '@/components/portal/ReceiptUploadForm';

import { requireDonor } from '@/lib/adminAuth';
import {
  getCurrentDonationMonth,
  listActiveOrganizationBankAccounts,
  listPortalSponsorshipsForDonor,
} from '@/lib/portal';

export const dynamic = 'force-dynamic';

export default async function PortalReceiptUploadPage() {
  const donor = await requireDonor().catch(() => null);
  if (!donor) redirect('/portal/login?error=not_allowed');

  const [sponsorships, bankAccounts] = await Promise.all([
    listPortalSponsorshipsForDonor(donor.id),
    listActiveOrganizationBankAccounts(),
  ]);

  return (
    <ReceiptUploadForm
      bankAccounts={bankAccounts}
      currentMonth={getCurrentDonationMonth()}
      sponsorships={sponsorships.filter((sponsorship) => sponsorship.matchStatus === 'active')}
    />
  );
}

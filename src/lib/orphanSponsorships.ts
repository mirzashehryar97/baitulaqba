import {
  canViewDonors,
  canViewFinanceReceiptFiles,
  canViewFinanceReceipts,
  canViewMatches,
  canViewMatchFinancialAmount,
} from '@/lib/adminPermissions';
import { listAdminReceiptsForMatches } from '@/lib/finance';
import { listMatchesForOrphan } from '@/lib/sponsorshipMatches';

import type { TeamMember } from '@/types/accounts';
import type {
  OrphanPaymentRecord,
  OrphanSponsorshipMatchSummary,
  OrphanSponsorshipOverview,
} from '@/types/orphanSponsorship';

export async function getOrphanSponsorshipOverview(
  actor: TeamMember,
  orphanId: string,
): Promise<OrphanSponsorshipOverview> {
  const matches = await listMatchesForOrphan(orphanId);
  const canViewSponsorIdentity = canViewMatches(actor);
  const canViewSponsorContact = canViewSponsorIdentity && canViewDonors(actor);
  const canViewMonthlyAmount = canViewMatchFinancialAmount(actor);
  const canViewPaymentHistory = canViewFinanceReceipts(actor);
  const canViewReceiptFiles = canViewPaymentHistory && canViewFinanceReceiptFiles(actor);

  const receipts = canViewPaymentHistory
    ? await listAdminReceiptsForMatches(
        actor,
        matches.map((match) => match.id),
      )
    : null;

  return {
    matches: matches.map<OrphanSponsorshipMatchSummary>((match) => ({
      certificateSeq: match.certificateSeq,
      createdAt: match.createdAt,
      donor:
        canViewSponsorIdentity && match.donor
          ? {
              email: canViewSponsorContact ? match.donor.email : null,
              fullName: match.donor.fullName,
              id: match.donor.id,
              phone: canViewSponsorContact ? match.donor.phone : null,
            }
          : null,
      donorId: match.donorId,
      endedAt: match.endedAt,
      id: match.id,
      monthlyAmount: canViewMonthlyAmount ? match.monthlyAmount : null,
      startedAt: match.startedAt,
      status: match.status,
      statusReason: match.statusReason,
    })),
    permissions: {
      canOpenDonor: canViewSponsorContact,
      canOpenMatch: canViewSponsorIdentity,
      canViewMonthlyAmount,
      canViewPaymentHistory,
      canViewReceiptFiles,
      canViewSponsorContact,
      canViewSponsorIdentity,
    },
    receipts:
      receipts?.map<OrphanPaymentRecord>((receipt) => ({
        amount: receipt.amount,
        currency: receipt.currency,
        donationMonth: receipt.donationMonth,
        id: receipt.id,
        matchId: receipt.matchId,
        moneyDeliveredAt: receipt.moneyDeliveredAt,
        receiptFileName: receipt.receiptFileName,
        status: receipt.status,
        submittedAt: receipt.submittedAt,
        transferDate: receipt.transferDate,
        transferReference: receipt.transferReference,
        verifiedAt: receipt.verifiedAt,
      })) ?? null,
  };
}

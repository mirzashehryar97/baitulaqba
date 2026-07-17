import {
  canViewDonors,
  canViewFinanceReceiptFiles,
  canViewFinanceReceipts,
  canViewMatchFinancialAmount,
  canViewOrphans,
} from '@/lib/adminPermissions';
import { listAdminReceiptsForMatches } from '@/lib/finance';
import { getSponsorshipMatchById } from '@/lib/sponsorshipMatches';

import type { TeamMember } from '@/types/accounts';
import type {
  MatchDetailActivity,
  MatchDetailOverview,
  MatchDetailPayment,
} from '@/types/matchDetail';

function formatActivityMonth(value: string) {
  return new Intl.DateTimeFormat('en', {
    month: 'long',
    timeZone: 'UTC',
    year: 'numeric',
  }).format(new Date(value));
}

function updatedActivityLabel(
  status: MatchDetailOverview['match']['status'],
  reason: string | null,
) {
  if (status === 'paused') return 'Match paused';
  if (status === 'ended') return 'Match ended';
  if (status === 'voided') return 'Match voided';
  if (reason?.toLowerCase().includes('resum')) return 'Match resumed';
  return 'Match details updated';
}

export async function getMatchDetailOverview(
  actor: TeamMember,
  matchId: string,
): Promise<MatchDetailOverview | null> {
  const match = await getSponsorshipMatchById(matchId);

  if (!match) {
    return null;
  }

  const canViewDonorContact = canViewDonors(actor);
  const canViewMonthlyAmount = canViewMatchFinancialAmount(actor);
  const canViewPaymentHistory = canViewFinanceReceipts(actor);
  const canViewReceiptFiles = canViewPaymentHistory && canViewFinanceReceiptFiles(actor);
  const receipts = canViewPaymentHistory
    ? await listAdminReceiptsForMatches(actor, [matchId])
    : null;
  const payments =
    receipts?.map<MatchDetailPayment>((receipt) => ({
      amount: receipt.amount,
      donationMonth: receipt.donationMonth,
      id: receipt.id,
      moneyDeliveredAt: receipt.moneyDeliveredAt,
      receiptFileName: receipt.receiptFileName,
      status: receipt.status,
      submittedAt: receipt.submittedAt,
      transferDate: receipt.transferDate,
      transferReference: receipt.transferReference,
      verifiedAt: receipt.verifiedAt,
    })) ?? null;
  const activity: MatchDetailActivity[] = [];

  for (const receipt of receipts ?? []) {
    const month = formatActivityMonth(receipt.donationMonth);

    activity.push({
      actorName: match.donor?.fullName ?? null,
      at: receipt.submittedAt,
      id: `receipt-submitted-${receipt.id}`,
      kind: 'receipt_submitted',
      label: `Receipt submitted for ${month}`,
      receiptId: receipt.id,
    });

    if (receipt.verifiedAt) {
      activity.push({
        actorName: 'Finance team',
        at: receipt.verifiedAt,
        id: `receipt-verified-${receipt.id}`,
        kind: 'receipt_verified',
        label: `Receipt verified for ${month}`,
        receiptId: receipt.id,
      });
    }

    if (receipt.moneyDeliveredAt) {
      activity.push({
        actorName: 'Finance team',
        at: receipt.moneyDeliveredAt,
        id: `receipt-delivered-${receipt.id}`,
        kind: 'money_delivered',
        label: `Funds delivered for ${month}`,
        receiptId: receipt.id,
      });
    }
  }

  const updatedAfterCreation =
    new Date(match.updatedAt).getTime() - new Date(match.createdAt).getTime() > 1_000;

  if (updatedAfterCreation) {
    activity.push({
      actorName: match.updatedByTeamMember?.fullName ?? null,
      at: match.updatedAt,
      id: `match-updated-${match.id}`,
      kind: 'match_updated',
      label: updatedActivityLabel(match.status, match.statusReason),
      receiptId: null,
    });
  }

  activity.push({
    actorName: match.createdByTeamMember?.fullName ?? null,
    at: match.createdAt,
    id: `match-created-${match.id}`,
    kind: 'match_created',
    label: 'Match created',
    receiptId: null,
  });

  return {
    activity: activity.sort(
      (first, second) => new Date(second.at).getTime() - new Date(first.at).getTime(),
    ),
    match: {
      certificateSeq: match.certificateSeq,
      createdAt: match.createdAt,
      createdByTeamMember: match.createdByTeamMember
        ? { fullName: match.createdByTeamMember.fullName, id: match.createdByTeamMember.id }
        : null,
      currency: match.currency,
      donor: match.donor
        ? {
            active: match.donor.active,
            email: canViewDonorContact ? match.donor.email : null,
            fullName: match.donor.fullName,
            id: match.donor.id,
            phone: canViewDonorContact ? match.donor.phone : null,
            preferredContactMethod: canViewDonorContact ? match.donor.preferredContactMethod : null,
          }
        : null,
      donorId: match.donorId,
      endedAt: match.endedAt,
      id: match.id,
      monthlyAmount: canViewMonthlyAmount ? match.monthlyAmount : null,
      notes: match.notes,
      orphan: match.orphan,
      orphanId: match.orphanId,
      startedAt: match.startedAt,
      status: match.status,
      statusReason: match.statusReason,
      updatedAt: match.updatedAt,
      updatedByTeamMember: match.updatedByTeamMember
        ? { fullName: match.updatedByTeamMember.fullName, id: match.updatedByTeamMember.id }
        : null,
    },
    payments,
    permissions: {
      canOpenDonor: canViewDonorContact,
      canOpenOrphan: canViewOrphans(actor),
      canOpenReceipt: canViewPaymentHistory,
      canViewDonorContact,
      canViewMonthlyAmount,
      canViewPaymentHistory,
      canViewReceiptFiles,
    },
  };
}

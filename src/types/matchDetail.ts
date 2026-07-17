import type { DonorPreferredContactMethod } from '@/types/accounts';
import type { MatchOrphanSummary, SponsorshipMatchStatus } from '@/types/matches';
import type { DonorPortalReceiptStatus } from '@/types/portal';

export type MatchDetailTeamMember = {
  fullName: string;
  id: string;
};

export type MatchDetailDonor = {
  active: boolean;
  email: string | null;
  fullName: string;
  id: string;
  phone: string | null;
  preferredContactMethod: DonorPreferredContactMethod | null;
};

export type MatchDetailRecord = {
  certificateSeq: number | null;
  createdAt: string;
  createdByTeamMember: MatchDetailTeamMember | null;
  currency: string;
  donor: MatchDetailDonor | null;
  donorId: string;
  endedAt: string | null;
  id: string;
  monthlyAmount: number | null;
  notes: string | null;
  orphan: MatchOrphanSummary | null;
  orphanId: string;
  startedAt: string;
  status: SponsorshipMatchStatus;
  statusReason: string | null;
  updatedAt: string;
  updatedByTeamMember: MatchDetailTeamMember | null;
};

export type MatchDetailPayment = {
  amount: number;
  donationMonth: string;
  id: string;
  moneyDeliveredAt: string | null;
  receiptFileName: string | null;
  status: DonorPortalReceiptStatus;
  submittedAt: string;
  transferDate: string | null;
  transferReference: string | null;
  verifiedAt: string | null;
};

export type MatchDetailActivityKind =
  | 'match_created'
  | 'match_updated'
  | 'receipt_submitted'
  | 'receipt_verified'
  | 'money_delivered';

export type MatchDetailActivity = {
  actorName: string | null;
  at: string;
  id: string;
  kind: MatchDetailActivityKind;
  label: string;
  receiptId: string | null;
};

export type MatchDetailPermissions = {
  canOpenDonor: boolean;
  canOpenOrphan: boolean;
  canOpenReceipt: boolean;
  canViewDonorContact: boolean;
  canViewMonthlyAmount: boolean;
  canViewPaymentHistory: boolean;
  canViewReceiptFiles: boolean;
};

export type MatchDetailOverview = {
  activity: MatchDetailActivity[];
  match: MatchDetailRecord;
  payments: MatchDetailPayment[] | null;
  permissions: MatchDetailPermissions;
};

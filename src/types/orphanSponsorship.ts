import type { SponsorshipMatchStatus } from '@/types/matches';
import type { DonorPortalReceiptStatus } from '@/types/portal';

export type OrphanSponsorSummary = {
  email: string | null;
  fullName: string;
  id: string;
  phone: string | null;
};

export type OrphanSponsorshipMatchSummary = {
  certificateSeq: number | null;
  createdAt: string;
  donor: OrphanSponsorSummary | null;
  donorId: string;
  endedAt: string | null;
  id: string;
  monthlyAmount: number | null;
  startedAt: string;
  status: SponsorshipMatchStatus;
  statusReason: string | null;
};

export type OrphanPaymentRecord = {
  amount: number;
  currency: string;
  donationMonth: string;
  id: string;
  matchId: string;
  moneyDeliveredAt: string | null;
  receiptFileName: string | null;
  status: DonorPortalReceiptStatus;
  submittedAt: string;
  transferDate: string | null;
  transferReference: string | null;
  verifiedAt: string | null;
};

export type OrphanSponsorshipPermissions = {
  canOpenDonor: boolean;
  canOpenMatch: boolean;
  canViewMonthlyAmount: boolean;
  canViewPaymentHistory: boolean;
  canViewReceiptFiles: boolean;
  canViewSponsorContact: boolean;
  canViewSponsorIdentity: boolean;
};

export type OrphanSponsorshipOverview = {
  matches: OrphanSponsorshipMatchSummary[];
  permissions: OrphanSponsorshipPermissions;
  receipts: OrphanPaymentRecord[] | null;
};

import type { DonorPreferredContactMethod, TeamMember } from '@/types/accounts';
import type { SponsorshipMatchStatus } from '@/types/matches';

export type DonorPortalReceiptStatus =
  | 'submitted'
  | 'ready_for_review'
  | 'reviewed'
  | 'verified'
  | 'rejected'
  | 'money_delivered';

export type DonorMonthlyPaymentStatus =
  | 'pending'
  | 'due_soon'
  | 'overdue'
  | DonorPortalReceiptStatus;

export type OrganizationBankAccountRow = {
  account_label: string;
  account_number: string | null;
  account_title: string;
  active: boolean;
  bank_name: string;
  country: string | null;
  created_at: string;
  currency: string;
  iban: string | null;
  id: string;
  instructions: string | null;
  sort_order: number;
  updated_at: string;
};

export type OrganizationBankAccount = {
  accountLabel: string;
  accountNumber: string | null;
  accountTitle: string;
  active: boolean;
  bankName: string;
  country: string | null;
  createdAt: string;
  currency: string;
  iban: string | null;
  id: string;
  instructions: string | null;
  sortOrder: number;
  updatedAt: string;
};

export type DonationReceiptRow = {
  amount: number | string;
  created_at: string;
  currency: string;
  donation_month: string;
  donor_id: string;
  donor_note: string | null;
  id: string;
  money_delivered_at: string | null;
  money_delivered_by_team_member_id: string | null;
  organization_bank_account_id: string | null;
  receipt_file_name: string | null;
  receipt_file_size: number | null;
  receipt_file_type: string | null;
  receipt_file_url: string;
  rejection_reason: string | null;
  reviewed_at: string | null;
  reviewed_by_team_member_id: string | null;
  sponsorship_match_id: string;
  status: DonorPortalReceiptStatus;
  submitted_at: string;
  submitted_late: boolean;
  transfer_date: string | null;
  transfer_reference: string | null;
  updated_at: string;
  verified_at: string | null;
  verified_by_team_member_id: string | null;
  bank_account?: OrganizationBankAccountRow | null;
  match?: {
    orphan?: {
      full_name: string;
      id: string;
      orphan_code: string;
    } | null;
  } | null;
};

export type DonorPortalReceipt = {
  amount: number;
  bankAccount: OrganizationBankAccount | null;
  createdAt: string;
  currency: string;
  donationMonth: string;
  donorId: string;
  donorNote: string | null;
  id: string;
  matchId: string;
  moneyDeliveredAt: string | null;
  orphanCode: string | null;
  orphanName: string | null;
  receiptFileName: string | null;
  receiptFileSize: number | null;
  receiptFileType: string | null;
  receiptFileUrl: string;
  rejectionReason: string | null;
  reviewedAt: string | null;
  status: DonorPortalReceiptStatus;
  submittedAt: string;
  submittedLate: boolean;
  transferDate: string | null;
  transferReference: string | null;
  updatedAt: string;
  verifiedAt: string | null;
};

export type DonorPortalOrphan = {
  ageEstimate: number | null;
  backgroundSummary: string | null;
  cityArea: string | null;
  educationStatus: string | null;
  fullName: string;
  id: string;
  orphanCode: string;
  profileImageUrl: string;
};

export type DonorPortalSponsorship = {
  currentMonth: string;
  currentMonthReceipt: DonorPortalReceipt | null;
  currentMonthStatus: DonorMonthlyPaymentStatus;
  currency: string;
  endedAt: string | null;
  lastReceiptStatus: DonorPortalReceiptStatus | null;
  matchId: string;
  matchStatus: SponsorshipMatchStatus;
  monthlyAmount: number;
  orphan: DonorPortalOrphan;
  startedAt: string;
  totalDeliveredContributed: number;
  totalVerifiedContributed: number;
};

export type DonorPortalProfile = {
  authUserId: string | null;
  canSwitchToAdmin: boolean;
  cityCountry: string | null;
  email: string;
  fullName: string;
  id: string;
  phone: string | null;
  preferredContactMethod: DonorPreferredContactMethod;
  switchToAdminHref: string | null;
};

export type DonorPortalSession = {
  donor: DonorPortalProfile;
  teamMember: TeamMember | null;
};

export type ContributionSeriesPoint = {
  delivered: number;
  expected: number;
  month: string;
  submitted: number;
  verified: number;
};

export type ContributionSummary = {
  lifetimeDelivered: number;
  lifetimeSubmitted: number;
  lifetimeVerified: number;
  monthlySeries: ContributionSeriesPoint[];
  perSponsorshipTotals: Array<{
    delivered: number;
    matchId: string;
    orphanCode: string;
    orphanName: string;
    verified: number;
  }>;
  thisYearDelivered: number;
  thisYearVerified: number;
};

export type PortalDashboard = {
  contributionSummary: ContributionSummary;
  recentReceipts: DonorPortalReceipt[];
  sponsorships: DonorPortalSponsorship[];
};

export type ReceiptUploadInput = {
  amount: number;
  currency: string;
  donationMonth: string;
  donorNote?: string;
  file: File;
  organizationBankAccountId: string;
  sponsorshipMatchId: string;
};

export type AvailableOrphanSummary = DonorPortalOrphan & {
  approvedAt: string | null;
  suggestedAmount: number | null;
};

export type AvailableOrphanFilterOptions = {
  education: string[];
  locations: string[];
};

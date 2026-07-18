import type {
  DonorPortalReceiptStatus,
  OrganizationBankAccount,
  OrganizationBankAccountRow,
} from '@/types/portal';

export type AdminReceiptQueueStatus = DonorPortalReceiptStatus | 'all' | 'needs_review';

export type AdminReceiptQueueFilters = {
  bankAccountId?: string;
  donorId?: string;
  matchId?: string;
  monthFrom?: string;
  monthTo?: string;
  orphanId?: string;
  search?: string;
  status?: AdminReceiptQueueStatus;
  submittedLate?: boolean;
  underpaidOnly?: boolean;
};

export type AdminReceiptDecisionInput = {
  deliveryReference?: string | null;
  financeNotes?: string | null;
  rejectionReason?: string | null;
};

export type AdminManualReceiptInput = {
  amount: number;
  currency: string;
  donationMonth: string;
  file: File;
  financeNotes?: string | null;
  organizationBankAccountId?: string | null;
  sponsorshipMatchId: string;
  transferDate?: string | null;
  transferReference?: string | null;
};

export type AdminManualReceiptMatch = {
  currency: string;
  donor: {
    email: string | null;
    fullName: string;
    id: string;
    phone: string | null;
  };
  endedAt: string | null;
  expectedAmount: number;
  matchId: string;
  orphan: {
    fullName: string;
    id: string;
    orphanCode: string;
  };
  startedAt: string;
  status: string;
};

export type AdminManualReceiptOptions = {
  bankAccounts: OrganizationBankAccount[];
  currentMonth: string;
  matches: AdminManualReceiptMatch[];
};

export type AdminBulkDeliveryInput = {
  deliveryReference?: string | null;
  excludeReceiptIds?: string[];
  filters?: AdminReceiptQueueFilters;
  receiptIds?: string[];
  selectionMode: 'explicit' | 'filtered';
};

export type AdminBulkDeliveryResult = {
  selected: number;
  skippedForbiddenOrMissing: number;
  skippedNotVerified: number;
  updated: number;
};

export type AdminReceiptRow = {
  amount: number | string;
  created_at: string;
  currency: string;
  delivery_reference: string | null;
  donation_month: string;
  donor_id: string;
  donor_note: string | null;
  finance_notes: string | null;
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
  status_changed_at: string | null;
  submitted_at: string;
  submitted_late: boolean;
  transfer_date: string | null;
  transfer_reference: string | null;
  updated_at: string;
  verified_at: string | null;
  verified_by_team_member_id: string | null;
  bank_account?: OrganizationBankAccountRow | null;
  donor?: {
    email: string | null;
    full_name: string;
    id: string;
    phone: string | null;
    preferred_contact_method: string | null;
  } | null;
  match?: {
    currency: string;
    id: string;
    monthly_amount: number | string;
    status: string;
    orphan?: {
      full_name: string;
      id: string;
      orphan_code: string;
    } | null;
  } | null;
};

export type AdminReceipt = {
  amount: number;
  amountVariance: number;
  bankAccount: {
    accountLabel: string;
    accountTitle: string;
    bankName: string;
    id: string;
  } | null;
  createdAt: string;
  currency: string;
  deliveryReference: string | null;
  donationMonth: string;
  donor: {
    email: string | null;
    fullName: string;
    id: string;
    phone: string | null;
    preferredContactMethod: string | null;
  } | null;
  donorId: string;
  donorNote: string | null;
  expectedAmount: number;
  financeNotes: string | null;
  id: string;
  matchId: string;
  matchStatus: string | null;
  moneyDeliveredAt: string | null;
  orphan: {
    fullName: string;
    id: string;
    orphanCode: string;
  } | null;
  receiptFileName: string | null;
  receiptFileSize: number | null;
  receiptFileType: string | null;
  rejectionReason: string | null;
  reviewedAt: string | null;
  status: DonorPortalReceiptStatus;
  statusChangedAt: string | null;
  submittedAt: string;
  submittedLate: boolean;
  transferDate: string | null;
  transferReference: string | null;
  updatedAt: string;
  verifiedAt: string | null;
};

export type AdminFinanceSummary = {
  deliveredThisMonth: number;
  expectedCurrentMonthTotal: number;
  month: string;
  overdueSponsorships: number;
  readyForReview: number;
  rejectedThisMonth: number;
  reviewedAwaitingVerification: number;
  verifiedCurrentMonthTotal: number;
  verifiedThisMonth: number;
};

export type DonorPaymentHistoryStatus =
  | 'paid'
  | 'partial'
  | 'in_review'
  | 'pending'
  | 'overdue'
  | 'rejected';

export type DonorPaymentHistoryEntry = {
  expectedAmount: number;
  month: string;
  paidAmount: number;
  paymentDate: string | null;
  receiptIds: string[];
  status: DonorPaymentHistoryStatus;
  submittedAmount: number;
};

export type DonorPaymentOverview = {
  currentMonth: string;
  history: DonorPaymentHistoryEntry[];
  paymentStreak: number;
};

export type AdminOverdueSponsorship = {
  currency: string;
  donorEmail: string;
  donorId: string;
  donorName: string;
  donorPhone: string | null;
  expectedAmount: number;
  matchId: string;
  orphanCode: string;
  orphanName: string;
};

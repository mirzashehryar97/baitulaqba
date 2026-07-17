export type AdminDashboardAvailability = {
  finance: boolean;
  matches: boolean;
  orphans: boolean;
  requests: boolean;
};

export type AdminDashboardActivityKind =
  | 'match_created'
  | 'orphan_approved'
  | 'receipt_verified'
  | 'request_received';

export type AdminDashboardActivity = {
  at: string;
  href: string;
  id: string;
  kind: AdminDashboardActivityKind;
  label: string;
};

export type AdminDashboardContributionMonth = {
  delivered: number;
  expected: number;
  label: string;
  month: string;
  verified: number;
};

export type AdminDashboardLifetimeContributions = {
  awaitingReviewAmount: number;
  deliveredAmount: number;
  receiptCount: number;
  verifiedAmount: number;
};

export type AdminDashboardPipeline = {
  contacted: number;
  converted: number;
  matched: number;
  new: number;
  profilesPrepared: number;
  profilesShared: number;
};

export type AdminDashboardSummary = {
  activity: AdminDashboardActivity[];
  availability: AdminDashboardAvailability;
  contributionHealth: AdminDashboardContributionMonth[];
  kpis: {
    activeMatches: number;
    newRequests: number;
    overdueDonors: number;
    profilesUnderReview: number;
    receiptsNeedReview: number;
    verifiedThisMonth: number;
  };
  lifetimeContributions: AdminDashboardLifetimeContributions;
  month: string;
  pipeline: AdminDashboardPipeline;
  updatedAt: string;
  workQueue: {
    followUpsDue: number;
    orphanProfilesAwaitingApproval: number;
    receiptsReadyForReview: number;
    unpaidDonors: number;
  };
};

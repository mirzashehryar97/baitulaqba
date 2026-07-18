import type { AccountTeamMemberSummary, Donor } from '@/types/accounts';
import type { OrphanProfile, OrphanProfileStatus, OrphanVerificationStatus } from '@/types/orphans';

export type SponsorshipMatchStatus = 'active' | 'paused' | 'ended' | 'voided';

export type MatchDonorSummary = Pick<
  Donor,
  'active' | 'authUserId' | 'email' | 'fullName' | 'id' | 'phone' | 'preferredContactMethod'
>;

export type MatchOrphanSummary = Pick<
  OrphanProfile,
  | 'cityArea'
  | 'fullName'
  | 'id'
  | 'orphanCode'
  | 'profileImageUrl'
  | 'profileStatus'
  | 'verificationStatus'
>;

export type SponsorshipMatchRow = {
  id: string;
  certificate_seq: number | string | null;
  donor_id: string;
  orphan_id: string;
  monthly_amount: number | string;
  currency: string;
  status: SponsorshipMatchStatus;
  started_at: string;
  ended_at: string | null;
  status_reason: string | null;
  notes: string | null;
  created_by_team_member_id: string | null;
  updated_by_team_member_id: string | null;
  created_at: string;
  updated_at: string;
  donor?: {
    active: boolean;
    auth_user_id: string | null;
    email: string | null;
    full_name: string;
    id: string;
    phone: string | null;
    preferred_contact_method: Donor['preferredContactMethod'];
  } | null;
  orphan?: {
    city_area: string | null;
    full_name: string;
    id: string;
    orphan_code: string;
    profile_image_url: string;
    profile_status: OrphanProfileStatus;
    verification_status: OrphanVerificationStatus;
  } | null;
  created_by_team_member?: {
    email: string;
    full_name: string;
    id: string;
    role: AccountTeamMemberSummary['role'];
  } | null;
  updated_by_team_member?: {
    email: string;
    full_name: string;
    id: string;
    role: AccountTeamMemberSummary['role'];
  } | null;
};

export type SponsorshipMatch = {
  certificateSeq: number | null;
  createdAt: string;
  createdByTeamMember: AccountTeamMemberSummary | null;
  createdByTeamMemberId: string | null;
  currency: string;
  donor: MatchDonorSummary | null;
  donorId: string;
  endedAt: string | null;
  id: string;
  monthlyAmount: number;
  notes: string | null;
  orphan: MatchOrphanSummary | null;
  orphanId: string;
  startedAt: string;
  status: SponsorshipMatchStatus;
  statusReason: string | null;
  updatedAt: string;
  updatedByTeamMember: AccountTeamMemberSummary | null;
  updatedByTeamMemberId: string | null;
};

export type SponsorshipMatchInput = {
  currency: string;
  donorId: string;
  monthlyAmount: number;
  notes?: string;
  orphanId: string;
  startedAt: string;
};

export type SponsorshipMatchUpdate = {
  currency?: string;
  endedAt?: string | null;
  monthlyAmount?: number;
  notes?: string | null;
  startedAt?: string;
};

export type SponsorshipMatchStatusInput = {
  endedAt?: string | null;
  reason: string;
};

export type MatchableDonorState = 'ready' | 'pending_first_login' | 'already_sponsoring';

export type MatchableDonor = MatchDonorSummary & {
  activeMatchCount: number;
  donorState: MatchableDonorState;
};

export type MatchableOrphan = MatchOrphanSummary & {
  ageEstimate: number | null;
  approvedAt: string | null;
  cityArea: string | null;
};

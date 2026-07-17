import type { TeamMemberRole } from '@/types/accounts';

export type SponsorshipRequestStatus =
  | 'new'
  | 'contacted'
  | 'profiles_prepared'
  | 'profiles_shared'
  | 'converted_to_donor'
  | 'closed';

export type PreferredContactMethod = 'whatsapp' | 'phone' | 'email';

export type RequestSource =
  | 'public_form'
  | 'admin_created'
  | 'whatsapp'
  | 'phone'
  | 'email'
  | 'referral'
  | 'walk_in'
  | 'other';

export type ContactLogMethod = PreferredContactMethod | 'sms' | 'in_person' | 'other';

export type ContactLogDirection = 'outbound' | 'inbound' | 'internal_note';

export type ContactLogOutcome =
  | 'logged'
  | 'reached'
  | 'no_response'
  | 'follow_up_needed'
  | 'not_interested'
  | 'converted';

export type SponsorshipRequestInput = {
  fullName: string;
  email: string;
  phone: string;
  cityCountry?: string;
  preferredContactMethod: PreferredContactMethod;
  message?: string;
  confirmedMinimumAmount: boolean;
};

export type SponsorshipRequestCreateInput = SponsorshipRequestInput & {
  adminNotes?: string;
  assignedTeamMemberId?: string | null;
  nextFollowUpAt?: string | null;
  requestSource?: RequestSource;
  status?: SponsorshipRequestStatus;
};

export type TeamMemberSummary = {
  id: string;
  email: string;
  fullName: string;
  role: TeamMemberRole;
};

export type DonorSummary = {
  id: string;
  email: string;
  fullName: string;
};

export type SponsorshipRequest = SponsorshipRequestInput & {
  id: string;
  status: SponsorshipRequestStatus;
  assignedTo: string | null;
  assignedTeamMember: TeamMemberSummary | null;
  assignedTeamMemberId: string | null;
  closedAt: string | null;
  contactedAt: string | null;
  convertedAt: string | null;
  convertedByTeamMemberId: string | null;
  convertedDonor: DonorSummary | null;
  convertedDonorId: string | null;
  createdByTeamMember: TeamMemberSummary | null;
  createdByTeamMemberId: string | null;
  profilesPreparedAt: string | null;
  profilesSharedAt: string | null;
  requestSource: RequestSource;
  lastContactedAt: string | null;
  nextFollowUpAt: string | null;
  adminNotes: string | null;
  createdAt: string;
  updatedAt: string;
};

export type SponsorshipRequestRow = {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  city_country: string | null;
  preferred_contact_method: PreferredContactMethod;
  message: string | null;
  confirmed_minimum_amount: boolean;
  status: SponsorshipRequestStatus;
  assigned_to: string | null;
  assigned_team_member_id: string | null;
  closed_at: string | null;
  contacted_at: string | null;
  converted_donor_id: string | null;
  converted_by_team_member_id: string | null;
  converted_at: string | null;
  created_by_team_member_id: string | null;
  profiles_prepared_at: string | null;
  profiles_shared_at: string | null;
  request_source: RequestSource;
  last_contacted_at: string | null;
  next_follow_up_at: string | null;
  admin_notes: string | null;
  created_at: string;
  updated_at: string;
  assigned_team_member?: {
    id: string;
    email: string;
    full_name: string;
    role: TeamMemberRole;
  } | null;
  converted_donor?: {
    id: string;
    email: string;
    full_name: string;
  } | null;
  created_by_team_member?: {
    id: string;
    email: string;
    full_name: string;
    role: TeamMemberRole;
  } | null;
};

export type SponsorshipRequestUpdate = {
  status?: SponsorshipRequestStatus;
  assignedTo?: string | null;
  assignedTeamMemberId?: string | null;
  adminNotes?: string | null;
  nextFollowUpAt?: string | null;
};

export type ContactLogInput = {
  contactMethod: ContactLogMethod;
  direction: ContactLogDirection;
  outcome: ContactLogOutcome;
  summary: string;
  nextFollowUpAt?: string | null;
};

export type ContactLog = ContactLogInput & {
  id: string;
  donorId: string | null;
  sponsorshipRequestId: string | null;
  teamMember: TeamMemberSummary | null;
  teamMemberId: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ContactLogRow = {
  id: string;
  sponsorship_request_id: string | null;
  donor_id: string | null;
  team_member_id: string | null;
  contact_method: ContactLogMethod;
  direction: ContactLogDirection;
  outcome: ContactLogOutcome;
  summary: string;
  next_follow_up_at: string | null;
  created_at: string;
  updated_at: string;
  team_member?: {
    id: string;
    email: string;
    full_name: string;
    role: TeamMemberRole;
  } | null;
};

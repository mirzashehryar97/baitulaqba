export const TEAM_MEMBER_ROLES = [
  'super_admin',
  'admin',
  'sponsorship_manager',
  'orphan_coordinator',
  'finance_manager',
  'support_coordinator',
  'viewer',
  'custom',
] as const;

export type TeamMemberRole = (typeof TEAM_MEMBER_ROLES)[number];

/**
 * Roles that appear as columns in the Roles & Access matrix and can be assigned directly.
 * `custom` is excluded: it is only ever applied implicitly when a super-admin edits an
 * individual member's permissions.
 */
export const ASSIGNABLE_TEAM_MEMBER_ROLES = TEAM_MEMBER_ROLES.filter(
  (role) => role !== 'custom',
) as Exclude<TeamMemberRole, 'custom'>[];

export type TeamMemberRow = {
  id: string;
  auth_user_id: string | null;
  full_name: string;
  email: string;
  phone: string | null;
  role: TeamMemberRole;
  active: boolean;
  notes: string | null;
  created_by_team_member_id: string | null;
  created_at: string;
  updated_at: string;
};

export type TeamMember = {
  id: string;
  authUserId: string | null;
  fullName: string;
  email: string;
  phone: string | null;
  role: TeamMemberRole;
  active: boolean;
  notes: string | null;
  createdByTeamMemberId: string | null;
  createdAt: string;
  updatedAt: string;
  /**
   * Resolved effective permissions (role defaults + role overrides + per-member overrides).
   * Populated by the auth layer for the authenticated member; may be absent on member
   * summaries fetched purely for display.
   */
  permissions?: import('@/lib/permissionFeatures').EffectivePermissions;
};

export type TeamMemberInput = {
  fullName: string;
  email: string;
  phone?: string;
  role: TeamMemberRole;
  active: boolean;
  notes?: string;
};

export type TeamMemberUpdate = Partial<TeamMemberInput>;

export type DonorPreferredContactMethod = 'whatsapp' | 'phone' | 'email';

export type DonorSource =
  | 'converted_request'
  | 'admin_created'
  | 'whatsapp'
  | 'phone'
  | 'email'
  | 'referral'
  | 'other';

export type AccountTeamMemberSummary = {
  email: string;
  fullName: string;
  id: string;
  role: TeamMemberRole;
};

export type DonorRow = {
  id: string;
  auth_user_id: string | null;
  full_name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  city_country: string | null;
  preferred_contact_method: DonorPreferredContactMethod;
  donor_source: DonorSource;
  active: boolean;
  notes: string | null;
  created_by_team_member_id: string | null;
  created_at: string;
  updated_at: string;
  created_by_team_member?: {
    email: string;
    full_name: string;
    id: string;
    role: TeamMemberRole;
  } | null;
};

export type Donor = {
  id: string;
  authUserId: string | null;
  fullName: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  cityCountry: string | null;
  preferredContactMethod: DonorPreferredContactMethod;
  donorSource: DonorSource;
  active: boolean;
  notes: string | null;
  createdByTeamMemberId: string | null;
  createdByTeamMember: AccountTeamMemberSummary | null;
  createdAt: string;
  updatedAt: string;
};

export type DonorInput = {
  active: boolean;
  address: string;
  cityCountry?: string;
  donorSource: DonorSource;
  /** Optional for admin-created donors. Empty string is stored as NULL (no portal login). */
  email: string;
  fullName: string;
  notes?: string;
  phone: string;
  preferredContactMethod: DonorPreferredContactMethod;
};

export type DonorUpdate = Partial<DonorInput>;

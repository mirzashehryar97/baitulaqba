import type { AccountTeamMemberSummary, TeamMemberRole } from '@/types/accounts';

export type OrphanGender = 'male' | 'female';

export type OrphanVerificationStatus =
  | 'unverified'
  | 'documents_received'
  | 'field_verified'
  | 'needs_more_information'
  | 'rejected';

export type OrphanProfileStatus = 'draft' | 'under_review' | 'approved' | 'matched' | 'archived';

export type OrphanCodeMode = 'auto' | 'manual';

export type DocumentCategory =
  | 'profile_image'
  | 'birth_or_identity_document'
  | 'guardian_document'
  | 'school_document'
  | 'medical_document'
  | 'verification_photo'
  | 'donation_receipt'
  | 'other';

export type OrphanProfileRow = {
  id: string;
  orphan_code: string;
  full_name: string;
  profile_image_url: string;
  gender: OrphanGender;
  date_of_birth: string | null;
  age_estimate: number | null;
  city_area: string | null;
  health_notes: string | null;
  education_status: string | null;
  background_summary: string | null;
  verification_status: OrphanVerificationStatus;
  profile_status: OrphanProfileStatus;
  created_by_team_member_id: string | null;
  submitted_by_team_member_id: string | null;
  submitted_at: string | null;
  approved_by_team_member_id: string | null;
  approved_at: string | null;
  archived_by_team_member_id: string | null;
  archived_at: string | null;
  archive_reason: string | null;
  created_at: string;
  updated_at: string;
  approved_by_team_member?: OrphanTeamMemberRow | null;
  created_by_team_member?: OrphanTeamMemberRow | null;
  submitted_by_team_member?: OrphanTeamMemberRow | null;
};

export type OrphanStatusHistoryRow = {
  id: string;
  orphan_id: string;
  previous_status: OrphanProfileStatus | null;
  new_status: OrphanProfileStatus;
  changed_by_team_member_id: string | null;
  changed_at: string;
  reason: string | null;
  changed_by_team_member?: OrphanTeamMemberRow | null;
};

export type OrphanVerificationHistoryRow = {
  id: string;
  orphan_id: string;
  previous_status: OrphanVerificationStatus | null;
  new_status: OrphanVerificationStatus;
  changed_by_team_member_id: string | null;
  changed_at: string;
  reason: string | null;
  changed_by_team_member?: OrphanTeamMemberRow | null;
};

export type OrphanTeamMemberRow = {
  email: string;
  full_name: string;
  id: string;
  role: TeamMemberRole;
};

export type OrphanGuardianRow = {
  id: string;
  orphan_id: string;
  guardian_name: string;
  relationship: string;
  phone: string | null;
  whatsapp: string | null;
  address: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type DocumentRow = {
  id: string;
  owner_type: 'orphan_profile' | 'donor' | 'sponsorship_request';
  owner_id: string;
  file_url: string;
  file_name: string;
  file_type: string;
  document_category: DocumentCategory | null;
  is_primary_profile_image: boolean;
  uploaded_by_team_member_id: string | null;
  uploaded_by_donor_id: string | null;
  created_at: string;
};

export type OrphanGuardian = {
  address: string | null;
  createdAt: string;
  guardianName: string;
  id: string;
  notes: string | null;
  orphanId: string;
  phone: string | null;
  relationship: string;
  updatedAt: string;
  whatsapp: string | null;
};

export type OrphanStatusHistory = {
  changedAt: string;
  changedByTeamMember: AccountTeamMemberSummary | null;
  changedByTeamMemberId: string | null;
  id: string;
  newStatus: OrphanProfileStatus;
  orphanId: string;
  previousStatus: OrphanProfileStatus | null;
  reason: string | null;
};

export type OrphanVerificationHistory = {
  changedAt: string;
  changedByTeamMember: AccountTeamMemberSummary | null;
  changedByTeamMemberId: string | null;
  id: string;
  newStatus: OrphanVerificationStatus;
  orphanId: string;
  previousStatus: OrphanVerificationStatus | null;
  reason: string | null;
};

export type Document = {
  createdAt: string;
  documentCategory: DocumentCategory | null;
  fileName: string;
  fileType: string;
  fileUrl: string;
  id: string;
  isPrimaryProfileImage: boolean;
  ownerId: string;
  ownerType: 'orphan_profile' | 'donor' | 'sponsorship_request';
  uploadedByDonorId: string | null;
  uploadedByTeamMemberId: string | null;
};

export type OrphanProfile = {
  ageEstimate: number | null;
  approvedAt: string | null;
  approvedByTeamMember: AccountTeamMemberSummary | null;
  approvedByTeamMemberId: string | null;
  archivedAt: string | null;
  archivedByTeamMemberId: string | null;
  archiveReason: string | null;
  backgroundSummary: string | null;
  cityArea: string | null;
  createdAt: string;
  createdByTeamMember: AccountTeamMemberSummary | null;
  createdByTeamMemberId: string | null;
  dateOfBirth: string | null;
  documents: Document[];
  educationStatus: string | null;
  fullName: string;
  gender: OrphanGender;
  guardian: OrphanGuardian | null;
  healthNotes: string | null;
  id: string;
  orphanCode: string;
  profileImageUrl: string;
  profileStatus: OrphanProfileStatus;
  statusHistory: OrphanStatusHistory[];
  submittedAt: string | null;
  submittedByTeamMember: AccountTeamMemberSummary | null;
  submittedByTeamMemberId: string | null;
  updatedAt: string;
  verificationHistory: OrphanVerificationHistory[];
  verificationStatus: OrphanVerificationStatus;
};

export type OrphanGuardianInput = {
  address?: string;
  guardianName: string;
  notes?: string;
  phone?: string;
  relationship: string;
  whatsapp?: string;
};

export type OrphanProfileInput = {
  ageEstimate?: number | null;
  backgroundSummary?: string;
  cityArea?: string;
  codeMode: OrphanCodeMode;
  dateOfBirth?: string;
  educationStatus?: string;
  fullName: string;
  gender: OrphanGender;
  guardian: OrphanGuardianInput;
  healthNotes?: string;
  orphanCode?: string;
  profileImageUrl: string;
  verificationStatus?: OrphanVerificationStatus;
};

export type OrphanProfileUpdate = Partial<Omit<OrphanProfileInput, 'codeMode'>> & {
  profileStatus?: OrphanProfileStatus;
};

export type DocumentInput = {
  documentCategory?: DocumentCategory;
  fileName: string;
  fileType: string;
  fileUrl: string;
  isPrimaryProfileImage?: boolean;
};

export type OrphanProfilePdfOptions = {
  preview?: boolean;
};

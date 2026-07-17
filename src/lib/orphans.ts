import { readFileSync } from 'node:fs';
import path from 'node:path';

import {
  createPaginatedResult,
  normalizePaginationOptions,
  type PaginationOptions,
} from '@/lib/pagination';
import {
  containsArabic,
  drawRoundedImage,
  fetchPdfImageBuffer,
  formatPdfDate,
  getPdfFontBuffers,
  PDF_COLORS,
  PDFDocument,
  registerPdfFonts,
} from '@/lib/pdfKit';
import { createSupabaseAdminClient, isMissingDatabaseFunctionError } from '@/lib/supabase/server';

import type { AccountTeamMemberSummary, TeamMemberRole } from '@/types/accounts';
import type {
  Document,
  DocumentCategory,
  DocumentInput,
  DocumentRow,
  OrphanGender,
  OrphanGuardian,
  OrphanGuardianInput,
  OrphanGuardianRow,
  OrphanProfile,
  OrphanProfileInput,
  OrphanProfileRow,
  OrphanProfileStatus,
  OrphanProfileUpdate,
  OrphanStatusHistory,
  OrphanStatusHistoryRow,
  OrphanTeamMemberRow,
  OrphanVerificationHistory,
  OrphanVerificationHistoryRow,
  OrphanVerificationStatus,
} from '@/types/orphans';

const PDF_TEMPLATE_IMAGE = readFileSync(
  path.join(process.cwd(), 'public', 'images', 'pdf', 'orphan-sponsorship-template.png'),
);
const PDF_CARD_SIZE: [number, number] = [561, 701];

export const ORPHAN_GENDERS: OrphanGender[] = ['male', 'female'];
export const ORPHAN_VERIFICATION_STATUSES: OrphanVerificationStatus[] = [
  'unverified',
  'documents_received',
  'field_verified',
  'needs_more_information',
  'rejected',
];
export const ORPHAN_PROFILE_STATUSES: OrphanProfileStatus[] = [
  'draft',
  'under_review',
  'approved',
  'matched',
  'archived',
];
export const DOCUMENT_CATEGORIES: DocumentCategory[] = [
  'profile_image',
  'birth_or_identity_document',
  'guardian_document',
  'school_document',
  'medical_document',
  'verification_photo',
  'donation_receipt',
  'other',
];

const ORPHAN_CODE_START = 1100;
const PROFILE_IMAGE_BUCKET = 'orphan-photos';
const ORPHAN_DOCUMENT_BUCKET = 'orphan-documents';
const MAX_PROFILE_IMAGE_BYTES = 5 * 1024 * 1024;
const MAX_ORPHAN_DOCUMENT_BYTES = 10 * 1024 * 1024;
const ALLOWED_PROFILE_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const ALLOWED_ORPHAN_DOCUMENT_TYPES = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];

const ORPHAN_SELECT = `
  *,
  created_by_team_member:team_members!orphan_profiles_created_by_team_member_id_fkey(
    id,
    full_name,
    email,
    role
  ),
  submitted_by_team_member:team_members!orphan_profiles_submitted_by_team_member_id_fkey(
    id,
    full_name,
    email,
    role
  ),
  approved_by_team_member:team_members!orphan_profiles_approved_by_team_member_id_fkey(
    id,
    full_name,
    email,
    role
  )
`;

export type OrphanListOptions = {
  cityArea?: string;
  gender?: OrphanGender;
  profileStatus?: OrphanProfileStatus;
  search?: string;
  verificationStatus?: OrphanVerificationStatus;
};

export type OrphanListSummary = {
  approved: number;
  drafts: number;
  total: number;
  underReview: number;
};

function normalizeOptionalText(value: string | null | undefined) {
  return value?.trim() || null;
}

function normalizeOrphanCode(value: string) {
  return value.trim().toUpperCase();
}

function parseOrCodeNumber(code: string) {
  const match = /^OR(\d+)$/.exec(code.trim().toUpperCase());
  return match ? Number(match[1]) : null;
}

function mapTeamMemberSummary(
  row: OrphanTeamMemberRow | null | undefined,
): AccountTeamMemberSummary | null {
  if (!row) {
    return null;
  }

  return {
    email: row.email,
    fullName: row.full_name,
    id: row.id,
    role: row.role as TeamMemberRole,
  };
}

export function mapOrphanGuardianRow(row: OrphanGuardianRow): OrphanGuardian {
  return {
    address: row.address,
    createdAt: row.created_at,
    guardianName: row.guardian_name,
    id: row.id,
    notes: row.notes,
    orphanId: row.orphan_id,
    phone: row.phone,
    relationship: row.relationship,
    updatedAt: row.updated_at,
    whatsapp: row.whatsapp,
  };
}

export function mapDocumentRow(row: DocumentRow): Document {
  return {
    createdAt: row.created_at,
    documentCategory: row.document_category,
    fileName: row.file_name,
    fileType: row.file_type,
    fileUrl: row.file_url,
    id: row.id,
    isPrimaryProfileImage: row.is_primary_profile_image,
    ownerId: row.owner_id,
    ownerType: row.owner_type,
    uploadedByDonorId: row.uploaded_by_donor_id,
    uploadedByTeamMemberId: row.uploaded_by_team_member_id,
  };
}

export function mapOrphanStatusHistoryRow(row: OrphanStatusHistoryRow): OrphanStatusHistory {
  return {
    changedAt: row.changed_at,
    changedByTeamMember: mapTeamMemberSummary(row.changed_by_team_member),
    changedByTeamMemberId: row.changed_by_team_member_id,
    id: row.id,
    newStatus: row.new_status,
    orphanId: row.orphan_id,
    previousStatus: row.previous_status,
    reason: row.reason,
  };
}

export function mapOrphanVerificationHistoryRow(
  row: OrphanVerificationHistoryRow,
): OrphanVerificationHistory {
  return {
    changedAt: row.changed_at,
    changedByTeamMember: mapTeamMemberSummary(row.changed_by_team_member),
    changedByTeamMemberId: row.changed_by_team_member_id,
    id: row.id,
    newStatus: row.new_status,
    orphanId: row.orphan_id,
    previousStatus: row.previous_status,
    reason: row.reason,
  };
}

export function mapOrphanProfileRow(
  row: OrphanProfileRow,
  guardian: OrphanGuardian | null = null,
  documents: Document[] = [],
  statusHistory: OrphanStatusHistory[] = [],
  verificationHistory: OrphanVerificationHistory[] = [],
): OrphanProfile {
  return {
    ageEstimate: row.age_estimate,
    approvedAt: row.approved_at,
    approvedByTeamMember: mapTeamMemberSummary(row.approved_by_team_member),
    approvedByTeamMemberId: row.approved_by_team_member_id,
    archivedAt: row.archived_at,
    archivedByTeamMemberId: row.archived_by_team_member_id,
    archiveReason: row.archive_reason,
    backgroundSummary: row.background_summary,
    cityArea: row.city_area,
    createdAt: row.created_at,
    createdByTeamMember: mapTeamMemberSummary(row.created_by_team_member),
    createdByTeamMemberId: row.created_by_team_member_id,
    dateOfBirth: row.date_of_birth,
    documents,
    educationStatus: row.education_status,
    fullName: row.full_name,
    gender: row.gender,
    guardian,
    healthNotes: row.health_notes,
    id: row.id,
    orphanCode: row.orphan_code,
    profileImageUrl: row.profile_image_url,
    profileStatus: row.profile_status,
    statusHistory,
    submittedAt: row.submitted_at,
    submittedByTeamMember: mapTeamMemberSummary(row.submitted_by_team_member),
    submittedByTeamMemberId: row.submitted_by_team_member_id,
    updatedAt: row.updated_at,
    verificationHistory,
    verificationStatus: row.verification_status,
  };
}

async function attachChangedByTeamMembers<
  Row extends {
    changed_by_team_member?: OrphanTeamMemberRow | null;
    changed_by_team_member_id: string | null;
  },
>(rows: Row[]) {
  const teamMemberIds = Array.from(
    new Set(rows.map((row) => row.changed_by_team_member_id).filter(Boolean)),
  ) as string[];

  if (teamMemberIds.length === 0) {
    return rows;
  }

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from('team_members')
    .select('id, full_name, email, role')
    .in('id', teamMemberIds)
    .returns<OrphanTeamMemberRow[]>();

  if (error) {
    throw new Error(error.message);
  }

  const teamMembersById = new Map(data.map((row) => [row.id, row]));
  return rows.map((row) => ({
    ...row,
    changed_by_team_member: row.changed_by_team_member_id
      ? (teamMembersById.get(row.changed_by_team_member_id) ?? null)
      : null,
  }));
}

export function validateOrphanInput(
  input: Partial<OrphanProfileInput> | null | undefined,
  options: { allowPartial?: boolean } = {},
) {
  const errors: Partial<
    Record<
      keyof OrphanProfileInput | 'guardianName' | 'guardianRelationship' | 'guardianPhone',
      string
    >
  > = {};
  const required = !options.allowPartial;

  if ((required || input?.fullName !== undefined) && !input?.fullName?.trim()) {
    errors.fullName = 'Full name is required.';
  }

  if ((required || input?.profileImageUrl !== undefined) && !input?.profileImageUrl?.trim()) {
    errors.profileImageUrl = 'Profile image URL is required.';
  }

  if (
    (required || input?.gender !== undefined) &&
    (!input?.gender || !ORPHAN_GENDERS.includes(input.gender))
  ) {
    errors.gender = 'Choose a valid gender.';
  }

  if (
    (required || input?.codeMode !== undefined) &&
    input?.codeMode !== 'auto' &&
    input?.codeMode !== 'manual'
  ) {
    errors.codeMode = 'Choose how to create the orphan code.';
  }

  if (input?.codeMode === 'manual') {
    if (!input.orphanCode?.trim()) {
      errors.orphanCode = 'Enter the existing orphan code.';
    } else if (!/^OR\d+$/.test(normalizeOrphanCode(input.orphanCode))) {
      errors.orphanCode = 'Use the format OR followed by numbers, for example OR507.';
    }
  }

  if ((required || input?.dateOfBirth !== undefined) && !input?.dateOfBirth?.trim()) {
    errors.dateOfBirth = 'Date of birth is required.';
  } else if (input?.dateOfBirth && Number.isNaN(new Date(input.dateOfBirth).getTime())) {
    errors.dateOfBirth = 'Choose a valid date of birth.';
  }

  if ((required || input?.cityArea !== undefined) && !input?.cityArea?.trim()) {
    errors.cityArea = 'Location is required.';
  }

  if (
    input?.ageEstimate !== undefined &&
    input.ageEstimate !== null &&
    (!Number.isInteger(input.ageEstimate) || input.ageEstimate < 0 || input.ageEstimate > 30)
  ) {
    errors.ageEstimate = 'Age estimate must be a whole number between 0 and 30.';
  }

  if (
    input?.verificationStatus !== undefined &&
    !ORPHAN_VERIFICATION_STATUSES.includes(input.verificationStatus)
  ) {
    errors.verificationStatus = 'Choose a valid verification status.';
  }

  if ((required || input?.guardian !== undefined) && !input?.guardian?.guardianName?.trim()) {
    errors.guardianName = 'Guardian name is required.';
  }

  if ((required || input?.guardian !== undefined) && !input?.guardian?.relationship?.trim()) {
    errors.guardianRelationship = 'Guardian relationship is required.';
  }

  if ((required || input?.guardian !== undefined) && !input?.guardian?.phone?.trim()) {
    errors.guardianPhone = 'Guardian phone is required.';
  }

  if (input?.backgroundSummary && input.backgroundSummary.trim().length > 1600) {
    errors.backgroundSummary = 'Background summary must be 1,600 characters or less.';
  }

  if (input?.healthNotes && input.healthNotes.trim().length > 1200) {
    errors.healthNotes = 'Health notes must be 1,200 characters or less.';
  }

  return errors;
}

export function validateDocumentInput(input: Partial<DocumentInput> | null | undefined) {
  const errors: Partial<Record<keyof DocumentInput, string>> = {};

  if (!input?.fileUrl?.trim()) {
    errors.fileUrl = 'File URL is required.';
  }

  if (!input?.fileName?.trim()) {
    errors.fileName = 'File name is required.';
  }

  if (!input?.fileType?.trim()) {
    errors.fileType = 'File type is required.';
  }

  if (input?.documentCategory && !DOCUMENT_CATEGORIES.includes(input.documentCategory)) {
    errors.documentCategory = 'Choose a valid document category.';
  }

  return errors;
}

export async function listOrphanProfiles(
  options: OrphanListOptions = {},
  paginationOptions: PaginationOptions = {},
) {
  const supabase = createSupabaseAdminClient();
  const pagination = normalizePaginationOptions(paginationOptions);
  let query = supabase
    .from('orphan_profiles')
    .select(ORPHAN_SELECT, pagination.knownTotal === undefined ? { count: 'exact' } : undefined)
    .order('created_at', { ascending: false });

  if (options.profileStatus) {
    query = query.eq('profile_status', options.profileStatus);
  }

  if (options.verificationStatus) {
    query = query.eq('verification_status', options.verificationStatus);
  }

  if (options.gender) {
    query = query.eq('gender', options.gender);
  }

  if (options.cityArea?.trim()) {
    query = query.ilike('city_area', `%${options.cityArea.trim()}%`);
  }

  if (options.search?.trim()) {
    const search = options.search.trim().replaceAll(',', ' ');
    query = query.or(
      `orphan_code.ilike.%${search}%,full_name.ilike.%${search}%,city_area.ilike.%${search}%`,
    );
  }

  const { count, data, error } = await query
    .range(pagination.offset, pagination.offset + pagination.limit - 1)
    .returns<OrphanProfileRow[]>();

  if (error) {
    throw new Error(error.message);
  }

  if (data.length === 0) {
    return createPaginatedResult([], pagination.knownTotal ?? count ?? 0, pagination);
  }

  const guardians = await listGuardiansForOrphans(data.map((row) => row.id));
  return createPaginatedResult(
    data.map((row) => mapOrphanProfileRow(row, guardians.get(row.id) ?? null)),
    pagination.knownTotal ?? count ?? 0,
    pagination,
  );
}

export async function getOrphanListSummary(): Promise<OrphanListSummary> {
  const supabase = createSupabaseAdminClient();
  const functionName = 'admin_orphan_list_summary';
  const { data: summary, error: summaryError } = await supabase.rpc(functionName);

  if (!summaryError && summary) {
    return summary as unknown as OrphanListSummary;
  }

  if (!isMissingDatabaseFunctionError(summaryError, functionName)) {
    throw new Error(summaryError?.message ?? 'Orphan summary query returned no data.');
  }

  // Backward-compatible fallback while an environment is waiting for the database migration.
  const [totalResult, draftsResult, underReviewResult, approvedResult] = await Promise.all([
    supabase.from('orphan_profiles').select('id', { count: 'exact', head: true }),
    supabase
      .from('orphan_profiles')
      .select('id', { count: 'exact', head: true })
      .eq('profile_status', 'draft'),
    supabase
      .from('orphan_profiles')
      .select('id', { count: 'exact', head: true })
      .eq('profile_status', 'under_review'),
    supabase
      .from('orphan_profiles')
      .select('id', { count: 'exact', head: true })
      .eq('profile_status', 'approved'),
  ]);

  for (const result of [totalResult, draftsResult, underReviewResult, approvedResult]) {
    if (result.error) {
      throw new Error(result.error.message);
    }
  }

  return {
    approved: approvedResult.count ?? 0,
    drafts: draftsResult.count ?? 0,
    total: totalResult.count ?? 0,
    underReview: underReviewResult.count ?? 0,
  };
}

export async function getOrphanProfileById(
  id: string,
  options: { includeDocuments?: boolean } = {},
) {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from('orphan_profiles')
    .select(ORPHAN_SELECT)
    .eq('id', id)
    .maybeSingle<OrphanProfileRow>();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    return null;
  }

  const [guardian, documents] = await Promise.all([
    getGuardianForOrphan(id),
    options.includeDocuments === false ? Promise.resolve([]) : listOrphanDocuments(id),
  ]);
  const [statusHistory, verificationHistory] = await Promise.all([
    listOrphanStatusHistory(id),
    listOrphanVerificationHistory(id),
  ]);

  return mapOrphanProfileRow(data, guardian, documents, statusHistory, verificationHistory);
}

export async function createOrphanProfile(
  input: OrphanProfileInput,
  createdByTeamMemberId: string,
) {
  const supabase = createSupabaseAdminClient();
  const orphanCode =
    input.codeMode === 'manual'
      ? normalizeOrphanCode(input.orphanCode ?? '')
      : await generateNextOrphanCode();

  const { data, error } = await supabase
    .from('orphan_profiles')
    .insert({
      age_estimate: input.ageEstimate ?? null,
      background_summary: normalizeOptionalText(input.backgroundSummary),
      city_area: normalizeOptionalText(input.cityArea),
      created_by_team_member_id: createdByTeamMemberId,
      date_of_birth: normalizeOptionalText(input.dateOfBirth),
      education_status: normalizeOptionalText(input.educationStatus),
      full_name: input.fullName.trim(),
      gender: input.gender,
      health_notes: normalizeOptionalText(input.healthNotes),
      orphan_code: orphanCode,
      profile_image_url: input.profileImageUrl.trim(),
      verification_status: input.verificationStatus ?? 'unverified',
    })
    .select(ORPHAN_SELECT)
    .single<OrphanProfileRow>();

  if (error) {
    throw new Error(error.message);
  }

  const guardian = await upsertGuardian(data.id, input.guardian);
  await createOrUpdatePrimaryProfileImageDocument(
    data.id,
    input.profileImageUrl,
    createdByTeamMemberId,
  );
  const statusHistory = [
    await recordOrphanStatusChange({
      changedByTeamMemberId: createdByTeamMemberId,
      newStatus: data.profile_status,
      orphanId: data.id,
      previousStatus: null,
      reason: 'Profile created.',
    }),
  ];
  const verificationHistory = [
    await recordOrphanVerificationChange({
      changedByTeamMemberId: createdByTeamMemberId,
      newStatus: data.verification_status,
      orphanId: data.id,
      previousStatus: null,
      reason: 'Verification status set.',
    }),
  ];

  return mapOrphanProfileRow(
    data,
    guardian,
    await listOrphanDocuments(data.id),
    statusHistory,
    verificationHistory,
  );
}

export async function updateOrphanProfile(
  id: string,
  update: OrphanProfileUpdate,
  options: { changedByTeamMemberId?: string } = {},
) {
  const supabase = createSupabaseAdminClient();
  const patch: Partial<OrphanProfileRow> = {};
  let previousStatus: OrphanProfileStatus | null = null;
  let previousVerificationStatus: OrphanVerificationStatus | null = null;

  if (update.orphanCode !== undefined) {
    patch.orphan_code = normalizeOrphanCode(update.orphanCode);
  }

  if (update.fullName !== undefined) {
    patch.full_name = update.fullName.trim();
  }

  if (update.profileImageUrl !== undefined) {
    patch.profile_image_url = update.profileImageUrl.trim();
  }

  if (update.gender !== undefined) {
    patch.gender = update.gender;
  }

  if (update.dateOfBirth !== undefined) {
    patch.date_of_birth = normalizeOptionalText(update.dateOfBirth);
  }

  if (update.ageEstimate !== undefined) {
    patch.age_estimate = update.ageEstimate;
  }

  if (update.cityArea !== undefined) {
    patch.city_area = normalizeOptionalText(update.cityArea);
  }

  if (update.healthNotes !== undefined) {
    patch.health_notes = normalizeOptionalText(update.healthNotes);
  }

  if (update.educationStatus !== undefined) {
    patch.education_status = normalizeOptionalText(update.educationStatus);
  }

  if (update.backgroundSummary !== undefined) {
    patch.background_summary = normalizeOptionalText(update.backgroundSummary);
  }

  if (update.verificationStatus !== undefined) {
    const { data: existing, error: existingError } = await supabase
      .from('orphan_profiles')
      .select('verification_status')
      .eq('id', id)
      .maybeSingle<{ verification_status: OrphanVerificationStatus }>();

    if (existingError) {
      throw new Error(existingError.message);
    }

    previousVerificationStatus = existing?.verification_status ?? null;
    patch.verification_status = update.verificationStatus;
  }

  if (update.profileStatus !== undefined) {
    const { data: existing, error: existingError } = await supabase
      .from('orphan_profiles')
      .select('profile_status')
      .eq('id', id)
      .maybeSingle<{ profile_status: OrphanProfileStatus }>();

    if (existingError) {
      throw new Error(existingError.message);
    }

    previousStatus = existing?.profile_status ?? null;
    patch.profile_status = update.profileStatus;
  }

  const { data, error } = await supabase
    .from('orphan_profiles')
    .update(patch)
    .eq('id', id)
    .select(ORPHAN_SELECT)
    .single<OrphanProfileRow>();

  if (error) {
    throw new Error(error.message);
  }

  const guardian = update.guardian
    ? await upsertGuardian(id, update.guardian)
    : await getGuardianForOrphan(id);
  const documents = await listOrphanDocuments(id);
  if (update.profileStatus !== undefined && previousStatus !== data.profile_status) {
    await recordOrphanStatusChange({
      changedByTeamMemberId: options.changedByTeamMemberId ?? null,
      newStatus: data.profile_status,
      orphanId: id,
      previousStatus,
      reason: 'Profile status updated.',
    });
  }

  if (
    update.verificationStatus !== undefined &&
    previousVerificationStatus !== data.verification_status
  ) {
    await recordOrphanVerificationChange({
      changedByTeamMemberId: options.changedByTeamMemberId ?? null,
      newStatus: data.verification_status,
      orphanId: id,
      previousStatus: previousVerificationStatus,
      reason: 'Verification status updated.',
    });
  }

  const [statusHistory, verificationHistory] = await Promise.all([
    listOrphanStatusHistory(id),
    listOrphanVerificationHistory(id),
  ]);

  return mapOrphanProfileRow(data, guardian, documents, statusHistory, verificationHistory);
}

export async function submitOrphanProfileForReview(id: string, submittedByTeamMemberId: string) {
  const orphan = await getOrphanProfileById(id);

  if (!orphan) {
    return null;
  }

  const approvalErrors = validateApprovalReadiness(orphan);
  if (Object.keys(approvalErrors).length > 0) {
    throw new Error(`Profile is incomplete: ${Object.values(approvalErrors).join(' ')}`);
  }

  const supabase = createSupabaseAdminClient();
  const changedAt = new Date().toISOString();
  const { data, error } = await supabase
    .from('orphan_profiles')
    .update({
      profile_status: 'under_review',
      submitted_at: changedAt,
      submitted_by_team_member_id: submittedByTeamMemberId,
    })
    .eq('id', id)
    .in('profile_status', ['draft', 'under_review'])
    .select(ORPHAN_SELECT)
    .single<OrphanProfileRow>();

  if (error) {
    throw new Error(error.message);
  }

  const statusHistory = await recordOrphanStatusChange({
    changedAt,
    changedByTeamMemberId: submittedByTeamMemberId,
    newStatus: data.profile_status,
    orphanId: id,
    previousStatus: orphan.profileStatus,
    reason: 'Submitted for review.',
  });

  return mapOrphanProfileRow(
    data,
    orphan.guardian,
    orphan.documents,
    [statusHistory, ...orphan.statusHistory],
    orphan.verificationHistory,
  );
}

export async function approveOrphanProfile(id: string, approvedByTeamMemberId: string) {
  const orphan = await getOrphanProfileById(id);

  if (!orphan) {
    return null;
  }

  const approvalErrors = validateApprovalReadiness(orphan);
  if (Object.keys(approvalErrors).length > 0) {
    throw new Error(`Profile is incomplete: ${Object.values(approvalErrors).join(' ')}`);
  }

  const supabase = createSupabaseAdminClient();
  const changedAt = new Date().toISOString();
  const { data, error } = await supabase
    .from('orphan_profiles')
    .update({
      approved_at: changedAt,
      approved_by_team_member_id: approvedByTeamMemberId,
      profile_status: 'approved',
    })
    .eq('id', id)
    .in('profile_status', ['draft', 'under_review'])
    .select(ORPHAN_SELECT)
    .single<OrphanProfileRow>();

  if (error) {
    throw new Error(error.message);
  }

  const statusHistory = await recordOrphanStatusChange({
    changedAt,
    changedByTeamMemberId: approvedByTeamMemberId,
    newStatus: data.profile_status,
    orphanId: id,
    previousStatus: orphan.profileStatus,
    reason: 'Profile approved.',
  });

  return mapOrphanProfileRow(
    data,
    orphan.guardian,
    orphan.documents,
    [statusHistory, ...orphan.statusHistory],
    orphan.verificationHistory,
  );
}

export async function archiveOrphanProfile(
  id: string,
  archivedByTeamMemberId: string,
  archiveReason: string,
) {
  const orphan = await getOrphanProfileById(id);

  if (!orphan) {
    return null;
  }

  const supabase = createSupabaseAdminClient();
  const changedAt = new Date().toISOString();
  const { data, error } = await supabase
    .from('orphan_profiles')
    .update({
      archive_reason: archiveReason.trim(),
      archived_at: changedAt,
      archived_by_team_member_id: archivedByTeamMemberId,
      profile_status: 'archived',
    })
    .eq('id', id)
    .select(ORPHAN_SELECT)
    .single<OrphanProfileRow>();

  if (error) {
    throw new Error(error.message);
  }

  const statusHistory = await recordOrphanStatusChange({
    changedAt,
    changedByTeamMemberId: archivedByTeamMemberId,
    newStatus: data.profile_status,
    orphanId: id,
    previousStatus: orphan.profileStatus,
    reason: archiveReason.trim(),
  });

  return mapOrphanProfileRow(
    data,
    orphan.guardian,
    orphan.documents,
    [statusHistory, ...orphan.statusHistory],
    orphan.verificationHistory,
  );
}

export async function listOrphanStatusHistory(orphanId: string) {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from('orphan_profile_status_history')
    .select('*')
    .eq('orphan_id', orphanId)
    .order('changed_at', { ascending: false })
    .returns<OrphanStatusHistoryRow[]>();

  if (error) {
    throw new Error(error.message);
  }

  const rows = await attachChangedByTeamMembers(data);
  return rows.map(mapOrphanStatusHistoryRow);
}

export async function recordOrphanStatusChange({
  changedAt,
  changedByTeamMemberId,
  newStatus,
  orphanId,
  previousStatus,
  reason,
}: {
  changedAt?: string;
  changedByTeamMemberId: string | null;
  newStatus: OrphanProfileStatus;
  orphanId: string;
  previousStatus: OrphanProfileStatus | null;
  reason?: string | null;
}) {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from('orphan_profile_status_history')
    .insert({
      changed_at: changedAt ?? new Date().toISOString(),
      changed_by_team_member_id: changedByTeamMemberId,
      new_status: newStatus,
      orphan_id: orphanId,
      previous_status: previousStatus,
      reason: normalizeOptionalText(reason),
    })
    .select('*')
    .single<OrphanStatusHistoryRow>();

  if (error) {
    throw new Error(error.message);
  }

  const [row] = await attachChangedByTeamMembers([data]);
  return mapOrphanStatusHistoryRow(row);
}

export async function listOrphanVerificationHistory(orphanId: string) {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from('orphan_profile_verification_history')
    .select('*')
    .eq('orphan_id', orphanId)
    .order('changed_at', { ascending: false })
    .returns<OrphanVerificationHistoryRow[]>();

  if (error) {
    throw new Error(error.message);
  }

  const rows = await attachChangedByTeamMembers(data);
  return rows.map(mapOrphanVerificationHistoryRow);
}

export async function recordOrphanVerificationChange({
  changedAt,
  changedByTeamMemberId,
  newStatus,
  orphanId,
  previousStatus,
  reason,
}: {
  changedAt?: string;
  changedByTeamMemberId: string | null;
  newStatus: OrphanVerificationStatus;
  orphanId: string;
  previousStatus: OrphanVerificationStatus | null;
  reason?: string | null;
}) {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from('orphan_profile_verification_history')
    .insert({
      changed_at: changedAt ?? new Date().toISOString(),
      changed_by_team_member_id: changedByTeamMemberId,
      new_status: newStatus,
      orphan_id: orphanId,
      previous_status: previousStatus,
      reason: normalizeOptionalText(reason),
    })
    .select('*')
    .single<OrphanVerificationHistoryRow>();

  if (error) {
    throw new Error(error.message);
  }

  const [row] = await attachChangedByTeamMembers([data]);
  return mapOrphanVerificationHistoryRow(row);
}

export async function listOrphanDocuments(orphanId: string) {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from('documents')
    .select('*')
    .eq('owner_type', 'orphan_profile')
    .eq('owner_id', orphanId)
    .order('created_at', { ascending: false })
    .returns<DocumentRow[]>();

  if (error) {
    throw new Error(error.message);
  }

  return data.map(mapDocumentRow);
}

export async function createOrphanDocument(
  orphanId: string,
  input: DocumentInput,
  uploadedByTeamMemberId: string,
) {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from('documents')
    .insert({
      document_category: input.documentCategory ?? 'other',
      file_name: input.fileName.trim(),
      file_type: input.fileType.trim(),
      file_url: input.fileUrl.trim(),
      is_primary_profile_image: input.isPrimaryProfileImage ?? false,
      owner_id: orphanId,
      owner_type: 'orphan_profile',
      uploaded_by_team_member_id: uploadedByTeamMemberId,
    })
    .select('*')
    .single<DocumentRow>();

  if (error) {
    throw new Error(error.message);
  }

  return mapDocumentRow(data);
}

export async function getOrphanDocument(orphanId: string, documentId: string) {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from('documents')
    .select('*')
    .eq('id', documentId)
    .eq('owner_type', 'orphan_profile')
    .eq('owner_id', orphanId)
    .maybeSingle<DocumentRow>();

  if (error) {
    throw new Error(error.message);
  }

  return data ? mapDocumentRow(data) : null;
}

export async function uploadOrphanDocumentFile({
  file,
  orphanId,
}: {
  file: File;
  orphanId: string;
}) {
  validateOrphanDocumentFile(file);

  const supabase = createSupabaseAdminClient();
  const safeName = sanitizeFileName(file.name, 'document');
  const path = `orphans/${orphanId}/documents/${Date.now()}-${crypto.randomUUID()}-${safeName}`;
  const { error } = await supabase.storage
    .from(ORPHAN_DOCUMENT_BUCKET)
    .upload(path, Buffer.from(await file.arrayBuffer()), {
      contentType: file.type,
      upsert: false,
    });

  if (error) {
    throw new Error(error.message);
  }

  return {
    fileName: file.name,
    fileType: file.type,
    path,
  };
}

export async function removeOrphanDocumentFile(path: string) {
  const supabase = createSupabaseAdminClient();
  await supabase.storage.from(ORPHAN_DOCUMENT_BUCKET).remove([path]);
}

export async function createOrphanDocumentSignedUrl(path: string) {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase.storage
    .from(ORPHAN_DOCUMENT_BUCKET)
    .createSignedUrl(path, 60);

  if (error) {
    throw new Error(error.message);
  }

  return data.signedUrl;
}

export async function uploadOrphanProfileImageFile({
  file,
  orphanId,
  uploadedByTeamMemberId,
}: {
  file: File;
  orphanId?: string;
  uploadedByTeamMemberId: string;
}) {
  validateProfileImageFile(file);

  const supabase = createSupabaseAdminClient();
  const safeName = sanitizeFileName(file.name);
  const folder = orphanId ? `orphans/${orphanId}/profile` : 'orphans/pending/profile';
  const path = `${folder}/${Date.now()}-${crypto.randomUUID()}-${safeName}`;
  const { error } = await supabase.storage
    .from(PROFILE_IMAGE_BUCKET)
    .upload(path, Buffer.from(await file.arrayBuffer()), {
      contentType: file.type,
      upsert: false,
    });

  if (error) {
    throw new Error(error.message);
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from(PROFILE_IMAGE_BUCKET).getPublicUrl(path);

  if (orphanId) {
    const updated = await updateOrphanProfile(orphanId, { profileImageUrl: publicUrl });
    await createOrUpdatePrimaryProfileImageDocument(orphanId, publicUrl, uploadedByTeamMemberId);
    return { orphan: updated, path, publicUrl };
  }

  return { path, publicUrl };
}

export async function generateOrphanProfilePdf(orphan: OrphanProfile) {
  const imageBuffer = await fetchPdfImageBuffer(orphan.profileImageUrl);

  return new Promise<Buffer>((resolve, reject) => {
    const doc = new PDFDocument({
      font: getPdfFontBuffers().inter as unknown as string,
      margin: 0,
      size: PDF_CARD_SIZE,
    });
    const chunks: Buffer[] = [];

    doc.on('data', (chunk: Buffer) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    drawProfilePdf(doc, orphan, imageBuffer);
    doc.end();
  });
}

function validateProfileImageFile(file: File) {
  if (!ALLOWED_PROFILE_IMAGE_TYPES.includes(file.type)) {
    throw new Error('Profile image must be a JPEG, PNG, or WebP file.');
  }

  if (file.size > MAX_PROFILE_IMAGE_BYTES) {
    throw new Error('Profile image must be 5MB or smaller.');
  }
}

function validateOrphanDocumentFile(file: File) {
  if (!ALLOWED_ORPHAN_DOCUMENT_TYPES.includes(file.type)) {
    throw new Error('Document must be a PDF, JPEG, PNG, or WebP file.');
  }

  if (file.size > MAX_ORPHAN_DOCUMENT_BYTES) {
    throw new Error('Document must be 10MB or smaller.');
  }
}

function sanitizeFileName(fileName: string, fallback = 'profile-image') {
  const cleanName = fileName
    .toLowerCase()
    .replace(/[^a-z0-9.]+/g, '-')
    .replace(/^-+|-+$/g, '');

  return cleanName || fallback;
}

function drawProfilePdf(
  doc: PDFKit.PDFDocument,
  orphan: OrphanProfile,
  imageBuffer: Buffer | null,
) {
  registerPdfFonts(doc);

  const pageWidth = doc.page.width;
  const pageHeight = doc.page.height;
  doc.image(PDF_TEMPLATE_IMAGE, 0, 0, { height: pageHeight, width: pageWidth });

  const imageX = 51;
  const imageY = 201;
  const imageWidth = 206;
  const imageHeight = 298;
  drawRoundedImage(doc, imageBuffer, imageX, imageY, imageWidth, imageHeight, {
    border: false,
    radius: 14,
  });

  drawTemplateValue(doc, 346, 248, orphan.orphanCode, 180);
  drawPdfName(doc, orphan.fullName, 346, 320, 180);
  drawTemplateValue(doc, 346, 400, getOrphanAgeLabel(orphan), 180);
  drawTemplateValue(doc, 346, 472, orphan.cityArea ?? 'Gaza', 180);
  doc
    .fillColor(PDF_COLORS.cream)
    .font('Inter')
    .fontSize(9)
    .text(`Generated ${formatPdfDate(new Date().toISOString())}`, 30, 676, {
      align: 'left',
      width: 200,
    });
}

function drawPdfName(doc: PDFKit.PDFDocument, name: string, x: number, y: number, width: number) {
  const isArabic = containsArabic(name);
  const minFontSize = 9;
  let fontSize = isArabic ? 16 : 15;

  doc.font(isArabic ? 'Amiri-Bold' : 'Inter-Bold');
  while (fontSize > minFontSize && doc.fontSize(fontSize).widthOfString(name) > width) {
    fontSize -= 1;
  }

  doc
    .fillColor(PDF_COLORS.emeraldDark)
    .fontSize(fontSize)
    .text(name, x, y, {
      align: 'left',
      ellipsis: true,
      height: fontSize + 8,
      lineGap: 0,
      width,
    });
}

function drawTemplateValue(
  doc: PDFKit.PDFDocument,
  x: number,
  y: number,
  value: string,
  width: number,
) {
  doc.fillColor(PDF_COLORS.ink).font('Inter-Bold').fontSize(15).text(value, x, y, {
    ellipsis: true,
    width,
  });
}

function getOrphanAgeLabel(orphan: OrphanProfile) {
  if (orphan.ageEstimate !== null) {
    return orphan.ageEstimate.toString();
  }

  if (!orphan.dateOfBirth) {
    return 'Not specified';
  }

  const birthDate = new Date(orphan.dateOfBirth);
  if (Number.isNaN(birthDate.getTime())) {
    return 'Not specified';
  }

  const now = new Date();
  let age = now.getFullYear() - birthDate.getFullYear();
  const birthdayPassed =
    now.getMonth() > birthDate.getMonth() ||
    (now.getMonth() === birthDate.getMonth() && now.getDate() >= birthDate.getDate());

  if (!birthdayPassed) {
    age -= 1;
  }

  return age >= 0 ? age.toString() : 'Not specified';
}

async function generateNextOrphanCode() {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase.from('orphan_profiles').select('orphan_code');

  if (error) {
    throw new Error(error.message);
  }

  const maxCode = (data as Array<{ orphan_code: string | null }>)
    .map((row) => (row.orphan_code ? parseOrCodeNumber(row.orphan_code) : null))
    .filter((value): value is number => value !== null && value >= ORPHAN_CODE_START)
    .reduce((max, value) => Math.max(max, value), ORPHAN_CODE_START - 1);

  return `OR${maxCode + 1}`;
}

async function listGuardiansForOrphans(orphanIds: string[]) {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from('orphan_guardians')
    .select('*')
    .in('orphan_id', orphanIds)
    .returns<OrphanGuardianRow[]>();

  if (error) {
    throw new Error(error.message);
  }

  return new Map(data.map((row) => [row.orphan_id, mapOrphanGuardianRow(row)]));
}

async function getGuardianForOrphan(orphanId: string) {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from('orphan_guardians')
    .select('*')
    .eq('orphan_id', orphanId)
    .limit(1)
    .maybeSingle<OrphanGuardianRow>();

  if (error) {
    throw new Error(error.message);
  }

  return data ? mapOrphanGuardianRow(data) : null;
}

async function upsertGuardian(orphanId: string, input: OrphanGuardianInput) {
  const existing = await getGuardianForOrphan(orphanId);
  const supabase = createSupabaseAdminClient();
  const payload = {
    address: normalizeOptionalText(input.address),
    guardian_name: input.guardianName.trim(),
    notes: normalizeOptionalText(input.notes),
    orphan_id: orphanId,
    phone: normalizeOptionalText(input.phone),
    relationship: input.relationship.trim(),
    whatsapp: normalizeOptionalText(input.whatsapp),
  };

  const query = existing
    ? supabase.from('orphan_guardians').update(payload).eq('id', existing.id)
    : supabase.from('orphan_guardians').insert(payload);

  const { data, error } = await query.select('*').single<OrphanGuardianRow>();

  if (error) {
    throw new Error(error.message);
  }

  return mapOrphanGuardianRow(data);
}

async function createOrUpdatePrimaryProfileImageDocument(
  orphanId: string,
  profileImageUrl: string,
  uploadedByTeamMemberId: string,
) {
  const existing = (await listOrphanDocuments(orphanId)).find(
    (document) => document.isPrimaryProfileImage,
  );
  const fileName = `${orphanId}-profile-image`;
  const input = {
    document_category: 'profile_image' as const,
    file_name: fileName,
    file_type: 'image',
    file_url: profileImageUrl.trim(),
    is_primary_profile_image: true,
    owner_id: orphanId,
    owner_type: 'orphan_profile' as const,
    uploaded_by_team_member_id: uploadedByTeamMemberId,
  };
  const supabase = createSupabaseAdminClient();

  const query = existing
    ? supabase.from('documents').update(input).eq('id', existing.id)
    : supabase.from('documents').insert(input);

  const { error } = await query.select('id').single();

  if (error) {
    throw new Error(error.message);
  }
}

function validateApprovalReadiness(orphan: OrphanProfile) {
  const errors: Record<string, string> = {};

  if (!orphan.profileImageUrl) errors.profileImageUrl = 'Profile image is required.';
  if (!orphan.fullName) errors.fullName = 'Full name is required.';
  if (!orphan.cityArea) errors.cityArea = 'City/area is required.';
  if (!orphan.backgroundSummary) errors.backgroundSummary = 'Background summary is required.';
  if (!orphan.dateOfBirth && orphan.ageEstimate === null) {
    errors.ageEstimate = 'Date of birth or age estimate is required.';
  }
  if (orphan.verificationStatus === 'unverified') {
    errors.verificationStatus = 'Verification status must be updated before approval.';
  }
  if (!orphan.guardian?.guardianName || !orphan.guardian.relationship) {
    errors.guardian = 'Guardian details are required.';
  }

  return errors;
}

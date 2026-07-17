import {
  buildEffectivePermissions,
  type EffectivePermissions,
  effectiveHasAction,
  effectiveHasPage,
  type FeatureAccessMap,
  getRoleDefaultAccess,
} from '@/lib/permissionFeatures';
import { isAdminRole, isSuperAdminRole } from '@/lib/teamMemberRoles';

import type { TeamMember, TeamMemberRole } from '@/types/accounts';

export type AdminPageKey =
  | 'dashboard'
  | 'sponsorship_requests'
  | 'orphan_profiles'
  | 'sponsors'
  | 'matches'
  | 'receipts'
  | 'unpaid_donors'
  | 'contact_logs'
  | 'reports'
  | 'team_members'
  | 'roles_access'
  | 'settings';

export type AdminActionKey =
  | 'team_members.view'
  | 'team_members.create'
  | 'team_members.update'
  | 'team_members.manage_admin_accounts'
  | 'sponsorship_requests.view'
  | 'sponsorship_requests.create'
  | 'sponsorship_requests.update'
  | 'sponsorship_requests.assign'
  | 'sponsorship_requests.convert_to_donor'
  | 'contact_logs.view'
  | 'contact_logs.create'
  | 'contact_logs.view_all'
  | 'donor_contact_logs.view'
  | 'donor_contact_logs.create'
  | 'donors.view'
  | 'donors.create'
  | 'donors.update'
  | 'donors.activate'
  | 'donors.deactivate'
  | 'orphans.view'
  | 'orphans.create'
  | 'orphans.update'
  | 'orphans.submit_for_review'
  | 'orphans.approve'
  | 'orphans.archive'
  | 'orphans.upload_profile_image'
  | 'orphans.upload_documents'
  | 'orphans.view_documents'
  | 'orphans.delete_documents'
  | 'orphans.download_profile_pdf'
  | 'matches.view'
  | 'matches.create'
  | 'matches.update'
  | 'matches.pause'
  | 'matches.resume'
  | 'matches.end'
  | 'matches.void'
  | 'matches.download_certificate'
  | 'matches.view_financial_amount'
  | 'finance.receipts.view'
  | 'finance.receipts.view_file'
  | 'finance.receipts.create'
  | 'finance.receipts.review'
  | 'finance.receipts.verify'
  | 'finance.receipts.reject'
  | 'finance.receipts.mark_delivered'
  | 'finance.receipts.bulk_mark_delivered'
  | 'finance.summary.view'
  | 'reports.view';

export type AdminAuditAction =
  | 'team_member.created'
  | 'team_member.updated'
  | 'team_member.activated'
  | 'team_member.deactivated'
  | 'team_member.role_changed'
  | 'team_member.permissions_changed'
  | 'role.permissions_changed'
  | 'sponsorship_request.assigned'
  | 'sponsorship_request.created'
  | 'sponsorship_request.follow_up_created'
  | 'sponsorship_request.converted_to_donor'
  | 'sponsorship_request.status_changed'
  | 'sponsorship_request.notes_updated'
  | 'sponsorship_match.created'
  | 'sponsorship_match.updated'
  | 'sponsorship_match.paused'
  | 'sponsorship_match.resumed'
  | 'sponsorship_match.ended'
  | 'sponsorship_match.voided'
  | 'donation_receipt.reviewed'
  | 'donation_receipt.verified'
  | 'donation_receipt.rejected'
  | 'donation_receipt.money_delivered'
  | 'donation_receipt.bulk_money_delivered'
  | 'contact_log.created';

/**
 * Anything a permission check can be run against. Passing a full `TeamMember` uses that member's
 * resolved effective permissions (role defaults + role overrides + per-member overrides), which
 * is what enforcement should do. Passing a bare `TeamMemberRole` resolves the built-in role
 * defaults only (no persisted overrides) — a convenience for display and a safe fallback.
 */
export type PermissionSubject = TeamMember | TeamMemberRole;

const roleDefaultPermsCache = new Map<TeamMemberRole, EffectivePermissions>();

function defaultPermsForRole(role: TeamMemberRole): EffectivePermissions {
  let cached = roleDefaultPermsCache.get(role);
  if (!cached) {
    cached = buildEffectivePermissions(getRoleDefaultAccess(role));
    roleDefaultPermsCache.set(role, cached);
  }
  return cached;
}

// The `pages`/`actions` Sets on EffectivePermissions may not survive the server→client props
// boundary intact. `featureAccess` is a plain object that always serializes, so we rebuild the
// derived Sets from it (memoized by object identity) rather than trusting the transferred Sets.
const rebuiltPermsCache = new WeakMap<FeatureAccessMap, EffectivePermissions>();

function fromFeatureAccess(featureAccess: FeatureAccessMap): EffectivePermissions {
  let cached = rebuiltPermsCache.get(featureAccess);
  if (!cached) {
    cached = buildEffectivePermissions(featureAccess);
    rebuiltPermsCache.set(featureAccess, cached);
  }
  return cached;
}

function resolveSubject(subject: PermissionSubject): EffectivePermissions {
  if (typeof subject === 'string') {
    return defaultPermsForRole(subject);
  }
  if (subject.permissions?.featureAccess) {
    return fromFeatureAccess(subject.permissions.featureAccess);
  }
  return defaultPermsForRole(subject.role);
}

function subjectRole(subject: PermissionSubject): TeamMemberRole {
  return typeof subject === 'string' ? subject : subject.role;
}

export function canAccessAdminPage(subject: PermissionSubject, pageKey: AdminPageKey) {
  return effectiveHasPage(resolveSubject(subject), pageKey);
}

export function getAllowedAdminPageKeys(subject: PermissionSubject) {
  return [...resolveSubject(subject).pages];
}

export function requireAdminPageAccess(subject: PermissionSubject, pageKey: AdminPageKey) {
  if (!canAccessAdminPage(subject, pageKey)) {
    throw new Error(`Role ${subjectRole(subject)} cannot access ${pageKey}.`);
  }
}

export function canPerformAdminAction(subject: PermissionSubject, actionKey: AdminActionKey) {
  return effectiveHasAction(resolveSubject(subject), actionKey);
}

export function getFirstAllowedAdminPath(subject: PermissionSubject) {
  if (subjectRole(subject) === 'finance_manager' && canAccessAdminPage(subject, 'receipts')) {
    return '/admin/receipts';
  }

  if (canAccessAdminPage(subject, 'sponsorship_requests')) {
    return '/admin';
  }

  if (canAccessAdminPage(subject, 'team_members')) {
    return '/admin/team';
  }

  return '/admin/forbidden';
}

export function canManageTeamMembers(subject: PermissionSubject) {
  return canPerformAdminAction(subject, 'team_members.update');
}

export function canCreateTeamMembers(subject: PermissionSubject) {
  return canPerformAdminAction(subject, 'team_members.create');
}

export function canManageAdminAccounts(subject: PermissionSubject) {
  return canPerformAdminAction(subject, 'team_members.manage_admin_accounts');
}

export function canCreateTeamMemberWithRole(actor: PermissionSubject, targetRole: TeamMemberRole) {
  if (!canCreateTeamMembers(actor)) {
    return false;
  }

  return !isAdminRole(targetRole) || canManageAdminAccounts(actor);
}

export function canChangeTeamMemberRole(actor: TeamMember, target: TeamMember) {
  if (!canManageTeamMembers(actor)) {
    return false;
  }

  if (actor.id === target.id) {
    return false;
  }

  if (isSuperAdminRole(actor.role)) {
    return true;
  }

  return !isAdminRole(target.role);
}

export function canChangeTeamMemberStatus(actor: TeamMember, target: TeamMember) {
  return canChangeTeamMemberRole(actor, target);
}

export function canAssignTeamMemberRole(
  actor: TeamMember,
  target: TeamMember,
  nextRole: TeamMemberRole,
) {
  if (!canChangeTeamMemberRole(actor, target)) {
    return false;
  }

  return !isAdminRole(nextRole) || canManageAdminAccounts(actor);
}

/** Only super admins may edit the permission matrix or a member's individual permissions. */
export function canManagePermissions(subject: PermissionSubject) {
  return isSuperAdminRole(subjectRole(subject));
}

export function canViewSponsorshipRequests(subject: PermissionSubject) {
  return canPerformAdminAction(subject, 'sponsorship_requests.view');
}

export function canCreateSponsorshipRequests(subject: PermissionSubject) {
  return canPerformAdminAction(subject, 'sponsorship_requests.create');
}

export function canUpdateSponsorshipRequests(subject: PermissionSubject) {
  return canPerformAdminAction(subject, 'sponsorship_requests.update');
}

export function canManageSponsorshipRequests(subject: PermissionSubject) {
  return canUpdateSponsorshipRequests(subject);
}

export function canAssignSponsorshipRequests(subject: PermissionSubject) {
  return canPerformAdminAction(subject, 'sponsorship_requests.assign');
}

export function canConvertSponsorshipRequestsToDonor(subject: PermissionSubject) {
  return canPerformAdminAction(subject, 'sponsorship_requests.convert_to_donor');
}

export function canViewContactLogs(subject: PermissionSubject) {
  // Contact logs surface inline on request detail, which every role can view. Historically this
  // was open to all roles; the Contact Logs *page* is what the `contact_logs` feature gates.
  return canViewSponsorshipRequests(subject) || canAccessAdminPage(subject, 'contact_logs');
}

export function canCreateContactLogs(subject: PermissionSubject) {
  return canPerformAdminAction(subject, 'contact_logs.create');
}

export function canViewAllContactLogs(subject: PermissionSubject) {
  return canAssignSponsorshipRequests(subject);
}

export function canViewReports(subject: PermissionSubject) {
  return canPerformAdminAction(subject, 'reports.view');
}

export function canViewDonors(subject: PermissionSubject) {
  return canPerformAdminAction(subject, 'donors.view');
}

export function canCreateDonors(subject: PermissionSubject) {
  return canPerformAdminAction(subject, 'donors.create');
}

export function canUpdateDonors(subject: PermissionSubject) {
  return canPerformAdminAction(subject, 'donors.update');
}

export function canActivateDonors(subject: PermissionSubject) {
  return canPerformAdminAction(subject, 'donors.activate');
}

export function canDeactivateDonors(subject: PermissionSubject) {
  return canPerformAdminAction(subject, 'donors.deactivate');
}

export function canViewDonorContactLogs(subject: PermissionSubject) {
  return canPerformAdminAction(subject, 'donor_contact_logs.view');
}

export function canCreateDonorContactLogs(subject: PermissionSubject) {
  return canPerformAdminAction(subject, 'donor_contact_logs.create');
}

export function canViewOrphans(subject: PermissionSubject) {
  return canPerformAdminAction(subject, 'orphans.view');
}

export function canCreateOrphans(subject: PermissionSubject) {
  return canPerformAdminAction(subject, 'orphans.create');
}

export function canUpdateOrphans(subject: PermissionSubject) {
  return canPerformAdminAction(subject, 'orphans.update');
}

export function canSubmitOrphansForReview(subject: PermissionSubject) {
  return canPerformAdminAction(subject, 'orphans.submit_for_review');
}

export function canApproveOrphans(subject: PermissionSubject) {
  return canPerformAdminAction(subject, 'orphans.approve');
}

export function canArchiveOrphans(subject: PermissionSubject) {
  return canPerformAdminAction(subject, 'orphans.archive');
}

export function canUploadOrphanDocuments(subject: PermissionSubject) {
  return canPerformAdminAction(subject, 'orphans.upload_documents');
}

export function canUploadOrphanProfileImage(subject: PermissionSubject) {
  return canPerformAdminAction(subject, 'orphans.upload_profile_image');
}

export function canViewOrphanDocuments(subject: PermissionSubject) {
  return canPerformAdminAction(subject, 'orphans.view_documents');
}

export function canDeleteOrphanDocuments(subject: PermissionSubject) {
  return canPerformAdminAction(subject, 'orphans.delete_documents');
}

export function canDownloadOrphanProfilePdf(subject: PermissionSubject) {
  return canPerformAdminAction(subject, 'orphans.download_profile_pdf');
}

export function canViewMatches(subject: PermissionSubject) {
  return canPerformAdminAction(subject, 'matches.view');
}

export function canCreateMatches(subject: PermissionSubject) {
  return canPerformAdminAction(subject, 'matches.create');
}

export function canUpdateMatches(subject: PermissionSubject) {
  return canPerformAdminAction(subject, 'matches.update');
}

export function canPauseMatches(subject: PermissionSubject) {
  return canPerformAdminAction(subject, 'matches.pause');
}

export function canResumeMatches(subject: PermissionSubject) {
  return canPerformAdminAction(subject, 'matches.resume');
}

export function canEndMatches(subject: PermissionSubject) {
  return canPerformAdminAction(subject, 'matches.end');
}

export function canVoidMatches(subject: PermissionSubject) {
  return canPerformAdminAction(subject, 'matches.void');
}

export function canDownloadMatchCertificate(subject: PermissionSubject) {
  return canPerformAdminAction(subject, 'matches.download_certificate');
}

export function canViewMatchFinancialAmount(subject: PermissionSubject) {
  return canPerformAdminAction(subject, 'matches.view_financial_amount');
}

export function canViewFinanceReceipts(subject: PermissionSubject) {
  return canPerformAdminAction(subject, 'finance.receipts.view');
}

export function canViewFinanceReceiptFiles(subject: PermissionSubject) {
  return canPerformAdminAction(subject, 'finance.receipts.view_file');
}

export function canCreateFinanceReceipts(subject: PermissionSubject) {
  return canPerformAdminAction(subject, 'finance.receipts.create');
}

export function canMarkReceiptReviewed(subject: PermissionSubject) {
  return canPerformAdminAction(subject, 'finance.receipts.review');
}

export function canVerifyReceipts(subject: PermissionSubject) {
  return canPerformAdminAction(subject, 'finance.receipts.verify');
}

export function canRejectReceipts(subject: PermissionSubject) {
  return canPerformAdminAction(subject, 'finance.receipts.reject');
}

export function canMarkReceiptsDelivered(subject: PermissionSubject) {
  return canPerformAdminAction(subject, 'finance.receipts.mark_delivered');
}

export function canBulkMarkReceiptsDelivered(subject: PermissionSubject) {
  return canPerformAdminAction(subject, 'finance.receipts.bulk_mark_delivered');
}

export function canViewFinanceSummary(subject: PermissionSubject) {
  return canPerformAdminAction(subject, 'finance.summary.view');
}

export function canViewAssignedOnly(role: TeamMemberRole, _featureKey: AdminPageKey) {
  return role === 'support_coordinator';
}

export function isAssignedOnlySponsorshipRole(role: TeamMemberRole) {
  return role === 'support_coordinator';
}

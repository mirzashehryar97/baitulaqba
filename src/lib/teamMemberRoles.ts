import type { TeamMemberRole } from '@/types/accounts';

export const TEAM_MEMBER_ROLE_LABELS: Record<TeamMemberRole, string> = {
  admin: 'Admin',
  custom: 'Custom',
  finance_manager: 'Finance Manager',
  orphan_coordinator: 'Orphan Coordinator',
  sponsorship_manager: 'Sponsorship Manager',
  super_admin: 'Super Admin',
  support_coordinator: 'Support Coordinator',
  viewer: 'Viewer',
};

export const TEAM_MEMBER_ROLE_DESCRIPTIONS: Record<TeamMemberRole, string> = {
  admin: 'Full system access and all administrative capabilities.',
  custom:
    'A tailored set of permissions granted individually by a super admin. Access no longer follows a standard role.',
  finance_manager: 'Manage donations, payments, receipts, and financial reports.',
  orphan_coordinator: 'Add and manage orphan profiles and related information.',
  sponsorship_manager: 'Manage sponsorship requests, sponsors, and communications.',
  super_admin:
    'Highest system access. Can manage admins, change admin roles, and activate or deactivate admin accounts.',
  support_coordinator: 'Handle inquiries, communications, and follow-ups.',
  viewer: 'View-only access without editing permissions.',
};

export function isAdminRole(role: TeamMemberRole) {
  return role === 'super_admin' || role === 'admin';
}

export function isSuperAdminRole(role: TeamMemberRole) {
  return role === 'super_admin';
}

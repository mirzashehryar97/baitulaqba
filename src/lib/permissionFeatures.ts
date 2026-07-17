import type { AdminActionKey, AdminPageKey } from '@/lib/adminPermissions';

import { TEAM_MEMBER_ROLES, type TeamMemberRole } from '@/types/accounts';

/**
 * Canonical, single source of truth for the admin permission matrix.
 *
 * Every capability in the admin panel is expressed as a "feature" that a role (or an
 * individual team member) holds at one of three access levels. This registry powers three
 * things at once, which previously drifted out of sync:
 *   1. The Roles & Access matrix display.
 *   2. The editable role / per-member permission tables.
 *   3. The runtime enforcement in `adminPermissions.ts`.
 *
 * `view`  → can open the feature's page(s) and see its data.
 * `full`  → everything `view` grants, plus the feature's mutating actions.
 * `none`  → no access.
 */
export type AccessLevel = 'none' | 'view' | 'full';

export const ACCESS_LEVELS: AccessLevel[] = ['none', 'view', 'full'];

const ACCESS_RANK: Record<AccessLevel, number> = {
  full: 2,
  none: 0,
  view: 1,
};

export function accessAtLeast(actual: AccessLevel, required: AccessLevel) {
  return ACCESS_RANK[actual] >= ACCESS_RANK[required];
}

export function maxAccess(a: AccessLevel, b: AccessLevel): AccessLevel {
  return ACCESS_RANK[a] >= ACCESS_RANK[b] ? a : b;
}

export type PermissionFeatureKey =
  | 'dashboard'
  | 'sponsorship_requests'
  | 'assign_requests'
  | 'contact_logs'
  | 'sponsors'
  | 'donor_contact_logs'
  | 'orphan_profiles'
  | 'orphan_approvals'
  | 'orphan_documents'
  | 'orphan_pdf'
  | 'matches'
  | 'matches_void'
  | 'matches_financial'
  | 'receipts'
  | 'finance_summary'
  | 'reports'
  | 'team_members'
  | 'manage_admin_accounts'
  | 'roles_access'
  | 'settings';

export type PermissionFeature = {
  key: PermissionFeatureKey;
  label: string;
  description: string;
  /** Icon name from lucide-react, resolved to a component in the UI layer. */
  icon: string;
  /** Pages unlocked when the member holds at least `view` on this feature. */
  pageKeys: AdminPageKey[];
  /** Actions requiring at least `view`. */
  viewActions: AdminActionKey[];
  /** Actions requiring `full`. */
  fullActions: AdminActionKey[];
  /**
   * When false, this feature can never be granted through the permission editors — it is held
   * only by the super admin role itself. Stored overrides for it are ignored on read and write.
   */
  grantable?: boolean;
  /** Levels a super-admin may assign for this feature (some features are view-only). */
  supportedLevels: AccessLevel[];
};

const NONE_VIEW: AccessLevel[] = ['none', 'view'];
const NONE_FULL: AccessLevel[] = ['none', 'full'];
const ALL_LEVELS: AccessLevel[] = ['none', 'view', 'full'];

export const PERMISSION_FEATURES: PermissionFeature[] = [
  {
    description: 'Access the admin overview dashboard.',
    fullActions: [],
    icon: 'Home',
    key: 'dashboard',
    label: 'Dashboard',
    pageKeys: ['dashboard'],
    supportedLevels: NONE_VIEW,
    viewActions: [],
  },
  {
    description: 'View sponsorship requests, and create or update them.',
    fullActions: ['sponsorship_requests.create', 'sponsorship_requests.update'],
    icon: 'ClipboardList',
    key: 'sponsorship_requests',
    label: 'Sponsorship Requests',
    pageKeys: ['sponsorship_requests'],
    supportedLevels: ALL_LEVELS,
    viewActions: ['sponsorship_requests.view'],
  },
  {
    description: 'Assign requests to team members and convert them to donors.',
    fullActions: ['sponsorship_requests.assign', 'sponsorship_requests.convert_to_donor'],
    icon: 'UserCog',
    key: 'assign_requests',
    label: 'Assign & Convert Requests',
    pageKeys: [],
    supportedLevels: NONE_FULL,
    viewActions: [],
  },
  {
    description: 'Open the contact logs page and record follow-up notes.',
    fullActions: ['contact_logs.create'],
    icon: 'Contact',
    key: 'contact_logs',
    label: 'Contact Logs',
    pageKeys: ['contact_logs'],
    supportedLevels: ALL_LEVELS,
    viewActions: [],
  },
  {
    description: 'View the sponsors directory, and add or edit donor records.',
    fullActions: ['donors.create', 'donors.update', 'donors.activate', 'donors.deactivate'],
    icon: 'UserPlus',
    key: 'sponsors',
    label: 'Sponsors',
    pageKeys: ['sponsors'],
    supportedLevels: ALL_LEVELS,
    viewActions: ['donors.view', 'donor_contact_logs.view'],
  },
  {
    description: 'Record contact notes on donor profiles.',
    fullActions: ['donor_contact_logs.create'],
    icon: 'Contact',
    key: 'donor_contact_logs',
    label: 'Donor Contact Notes',
    pageKeys: [],
    supportedLevels: NONE_FULL,
    viewActions: [],
  },
  {
    description: 'View orphan profiles, and add, edit, or submit them for review.',
    fullActions: [
      'orphans.create',
      'orphans.update',
      'orphans.submit_for_review',
      'orphans.upload_documents',
      'orphans.upload_profile_image',
    ],
    icon: 'UserRound',
    key: 'orphan_profiles',
    label: 'Orphan Profiles',
    pageKeys: ['orphan_profiles'],
    supportedLevels: ALL_LEVELS,
    viewActions: ['orphans.view'],
  },
  {
    description: 'Approve, archive, and delete orphan documents.',
    fullActions: ['orphans.approve', 'orphans.archive', 'orphans.delete_documents'],
    icon: 'ShieldCheck',
    key: 'orphan_approvals',
    label: 'Orphan Approvals',
    pageKeys: [],
    supportedLevels: NONE_FULL,
    viewActions: [],
  },
  {
    description: 'View uploaded orphan documents.',
    fullActions: [],
    icon: 'FileCheck2',
    key: 'orphan_documents',
    label: 'Orphan Documents',
    pageKeys: [],
    supportedLevels: NONE_VIEW,
    viewActions: ['orphans.view_documents'],
  },
  {
    description: 'Download orphan profile PDFs.',
    fullActions: [],
    icon: 'FileCheck2',
    key: 'orphan_pdf',
    label: 'Orphan Profile PDF',
    pageKeys: [],
    supportedLevels: NONE_VIEW,
    viewActions: ['orphans.download_profile_pdf'],
  },
  {
    description: 'View sponsorship matches, and create, pause, resume, or end them.',
    fullActions: [
      'matches.create',
      'matches.update',
      'matches.pause',
      'matches.resume',
      'matches.end',
      'matches.download_certificate',
    ],
    icon: 'UsersRound',
    key: 'matches',
    label: 'Sponsorship Matches',
    pageKeys: ['matches'],
    supportedLevels: ALL_LEVELS,
    viewActions: ['matches.view'],
  },
  {
    description: 'Void sponsorship matches.',
    fullActions: ['matches.void'],
    icon: 'ShieldCheck',
    key: 'matches_void',
    label: 'Void Matches',
    pageKeys: [],
    supportedLevels: NONE_FULL,
    viewActions: [],
  },
  {
    description: 'See financial amounts on sponsorship matches.',
    fullActions: [],
    icon: 'WalletCards',
    key: 'matches_financial',
    label: 'Match Financials',
    pageKeys: [],
    supportedLevels: NONE_VIEW,
    viewActions: ['matches.view_financial_amount'],
  },
  {
    description: 'Manage donation receipts: record, review, verify, reject, and mark delivered.',
    fullActions: [
      'finance.receipts.create',
      'finance.receipts.review',
      'finance.receipts.verify',
      'finance.receipts.reject',
      'finance.receipts.mark_delivered',
      'finance.receipts.bulk_mark_delivered',
    ],
    icon: 'Receipt',
    key: 'receipts',
    label: 'Payments & Receipts',
    pageKeys: ['receipts'],
    supportedLevels: ALL_LEVELS,
    viewActions: ['finance.receipts.view', 'finance.receipts.view_file'],
  },
  {
    description: 'View the unpaid donors summary and finance totals.',
    fullActions: [],
    icon: 'WalletCards',
    key: 'finance_summary',
    label: 'Finance Summary',
    pageKeys: ['unpaid_donors'],
    supportedLevels: NONE_VIEW,
    viewActions: ['finance.summary.view'],
  },
  {
    description: 'View reports and audit logs.',
    fullActions: [],
    icon: 'FileCheck2',
    key: 'reports',
    label: 'Reports & Audit Logs',
    pageKeys: ['reports'],
    supportedLevels: NONE_VIEW,
    viewActions: ['reports.view'],
  },
  {
    description: 'View team members, and create or edit their profiles.',
    fullActions: ['team_members.create', 'team_members.update'],
    icon: 'Contact',
    key: 'team_members',
    label: 'Team Members',
    pageKeys: ['team_members'],
    supportedLevels: ALL_LEVELS,
    viewActions: ['team_members.view'],
  },
  {
    description: 'Create or change admin-level accounts and roles.',
    fullActions: ['team_members.manage_admin_accounts'],
    grantable: false,
    icon: 'ShieldCheck',
    key: 'manage_admin_accounts',
    label: 'Manage Admin Accounts',
    pageKeys: [],
    supportedLevels: NONE_FULL,
    viewActions: [],
  },
  {
    description: 'Open the Roles & Access page.',
    fullActions: [],
    icon: 'ShieldCheck',
    key: 'roles_access',
    label: 'Roles & Access',
    pageKeys: ['roles_access'],
    supportedLevels: NONE_VIEW,
    viewActions: [],
  },
  {
    description: 'Open the system settings page.',
    fullActions: [],
    icon: 'Settings',
    key: 'settings',
    label: 'Settings',
    pageKeys: ['settings'],
    supportedLevels: NONE_VIEW,
    viewActions: [],
  },
];

export const PERMISSION_FEATURE_KEYS: PermissionFeatureKey[] = PERMISSION_FEATURES.map(
  (feature) => feature.key,
);

const FEATURE_BY_KEY = new Map<PermissionFeatureKey, PermissionFeature>(
  PERMISSION_FEATURES.map((feature) => [feature.key, feature]),
);

export function getPermissionFeature(key: PermissionFeatureKey) {
  const feature = FEATURE_BY_KEY.get(key);
  if (!feature) {
    throw new Error(`Unknown permission feature: ${key}`);
  }
  return feature;
}

export function isFeatureGrantable(key: PermissionFeatureKey) {
  return getPermissionFeature(key).grantable !== false;
}

/** Reverse lookup: which feature + level gates a given page. */
const PAGE_TO_FEATURES = new Map<AdminPageKey, PermissionFeatureKey[]>();
/** Reverse lookup: which feature + level gates a given action. */
const ACTION_TO_REQUIREMENT = new Map<
  AdminActionKey,
  { feature: PermissionFeatureKey; level: AccessLevel }
>();

for (const feature of PERMISSION_FEATURES) {
  for (const pageKey of feature.pageKeys) {
    const existing = PAGE_TO_FEATURES.get(pageKey) ?? [];
    existing.push(feature.key);
    PAGE_TO_FEATURES.set(pageKey, existing);
  }
  for (const actionKey of feature.viewActions) {
    ACTION_TO_REQUIREMENT.set(actionKey, { feature: feature.key, level: 'view' });
  }
  for (const actionKey of feature.fullActions) {
    ACTION_TO_REQUIREMENT.set(actionKey, { feature: feature.key, level: 'full' });
  }
}

export type FeatureAccessMap = Record<PermissionFeatureKey, AccessLevel>;

function emptyFeatureAccess(): FeatureAccessMap {
  return Object.fromEntries(
    PERMISSION_FEATURE_KEYS.map((key) => [key, 'none' as AccessLevel]),
  ) as FeatureAccessMap;
}

/**
 * Built-in defaults per role. These reproduce the historical static behavior exactly and are
 * the base layer that DB overrides are merged on top of. `custom` starts from nothing —
 * its access comes entirely from per-member overrides.
 */
const f = 'full' as const;
const v = 'view' as const;
const n = 'none' as const;

type RoleDefaults = Partial<Record<PermissionFeatureKey, AccessLevel>>;

const ROLE_DEFAULTS: Record<TeamMemberRole, RoleDefaults> = {
  admin: {}, // filled below (admin mirrors super_admin minus a couple of super-only features)
  custom: {},
  finance_manager: {
    contact_logs: n,
    dashboard: v,
    finance_summary: v,
    matches: v,
    matches_financial: v,
    orphan_profiles: v,
    receipts: f,
    reports: v,
    sponsors: v,
    sponsorship_requests: v,
  },
  orphan_coordinator: {
    dashboard: v,
    matches: v,
    orphan_documents: v,
    orphan_pdf: v,
    orphan_profiles: f,
    sponsorship_requests: v,
  },
  sponsorship_manager: {
    assign_requests: f,
    contact_logs: f,
    dashboard: v,
    donor_contact_logs: f,
    matches: f,
    matches_financial: v,
    orphan_pdf: v,
    orphan_profiles: v,
    reports: v,
    sponsors: f,
    sponsorship_requests: f,
  },
  super_admin: {}, // filled below — super_admin holds max level on every feature
  support_coordinator: {
    contact_logs: f,
    dashboard: v,
    donor_contact_logs: f,
    matches: v,
    orphan_profiles: v,
    sponsors: v,
    sponsorship_requests: f,
  },
  viewer: {
    contact_logs: v,
    dashboard: v,
    finance_summary: v,
    matches: v,
    orphan_profiles: v,
    reports: v,
    sponsors: v,
    sponsorship_requests: v,
  },
};

// super_admin: maximum supported level on every feature (locked / non-editable in the UI).
for (const feature of PERMISSION_FEATURES) {
  ROLE_DEFAULTS.super_admin[feature.key] = feature.supportedLevels.includes('full') ? f : v;
}

// admin: same as super_admin except the super-admin-only capabilities.
const ADMIN_EXCLUDED: PermissionFeatureKey[] = ['manage_admin_accounts', 'settings'];
for (const feature of PERMISSION_FEATURES) {
  ROLE_DEFAULTS.admin[feature.key] = ADMIN_EXCLUDED.includes(feature.key)
    ? n
    : (ROLE_DEFAULTS.super_admin[feature.key] ?? n);
}

/** The complete built-in feature access map for a role (defaults only, no DB overrides). */
export function getRoleDefaultAccess(role: TeamMemberRole): FeatureAccessMap {
  const base = emptyFeatureAccess();
  const overrides = ROLE_DEFAULTS[role] ?? {};
  for (const key of PERMISSION_FEATURE_KEYS) {
    base[key] = overrides[key] ?? 'none';
  }
  return base;
}

export const DEFAULT_ROLE_ACCESS: Record<TeamMemberRole, FeatureAccessMap> = Object.fromEntries(
  TEAM_MEMBER_ROLES.map((role) => [role, getRoleDefaultAccess(role)]),
) as Record<TeamMemberRole, FeatureAccessMap>;

/** Merge a partial override map on top of a base feature access map. */
export function mergeFeatureAccess(
  base: FeatureAccessMap,
  overrides: Partial<FeatureAccessMap>,
): FeatureAccessMap {
  const result = { ...base };
  for (const key of PERMISSION_FEATURE_KEYS) {
    const override = overrides[key];
    if (override) {
      result[key] = override;
    }
  }
  return result;
}

/**
 * The resolved, effective permissions for a single subject (role or member). Derived sets are
 * precomputed so runtime `canX` checks stay synchronous and cheap.
 */
export type EffectivePermissions = {
  featureAccess: FeatureAccessMap;
  pages: Set<AdminPageKey>;
  actions: Set<AdminActionKey>;
};

export function buildEffectivePermissions(featureAccess: FeatureAccessMap): EffectivePermissions {
  const pages = new Set<AdminPageKey>();
  const actions = new Set<AdminActionKey>();

  for (const feature of PERMISSION_FEATURES) {
    const level = featureAccess[feature.key] ?? 'none';
    if (level === 'none') {
      continue;
    }

    for (const pageKey of feature.pageKeys) {
      pages.add(pageKey);
    }
    for (const actionKey of feature.viewActions) {
      actions.add(actionKey);
    }
    if (level === 'full') {
      for (const actionKey of feature.fullActions) {
        actions.add(actionKey);
      }
    }
  }

  return { actions, featureAccess, pages };
}

export function effectiveHasPage(perms: EffectivePermissions, pageKey: AdminPageKey) {
  return perms.pages.has(pageKey);
}

export function effectiveHasAction(perms: EffectivePermissions, actionKey: AdminActionKey) {
  return perms.actions.has(actionKey);
}

/** Summarize a feature access map into full / view / none counts (for the matrix sidebar). */
export function summarizeAccess(featureAccess: FeatureAccessMap) {
  let full = 0;
  let view = 0;
  let none = 0;
  for (const key of PERMISSION_FEATURE_KEYS) {
    const level = featureAccess[key];
    if (level === 'full') {
      full += 1;
    } else if (level === 'view') {
      view += 1;
    } else {
      none += 1;
    }
  }
  return { full, none, view };
}

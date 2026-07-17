import {
  type AccessLevel,
  buildEffectivePermissions,
  type EffectivePermissions,
  type FeatureAccessMap,
  getPermissionFeature,
  getRoleDefaultAccess,
  isFeatureGrantable,
  mergeFeatureAccess,
  PERMISSION_FEATURE_KEYS,
  type PermissionFeatureKey,
} from '@/lib/permissionFeatures';
import { createSupabaseAdminClient } from '@/lib/supabase/server';

import {
  ASSIGNABLE_TEAM_MEMBER_ROLES,
  type TeamMember,
  type TeamMemberRole,
} from '@/types/accounts';

/** Roles that own an editable column in the permission matrix (excludes `custom`). */
export type AssignableTeamMemberRole = (typeof ASSIGNABLE_TEAM_MEMBER_ROLES)[number];

type PermissionOverrideRow = {
  feature_key: string;
  access_level: AccessLevel;
};

type RolePermissionRow = PermissionOverrideRow & { role: TeamMemberRole };

const FEATURE_KEY_SET = new Set<string>(PERMISSION_FEATURE_KEYS);

function isValidFeatureKey(key: string): key is PermissionFeatureKey {
  return FEATURE_KEY_SET.has(key);
}

/**
 * The permission tables are applied manually via the Supabase SQL editor. Until that runs, we
 * fall back to the built-in role defaults instead of hard-failing the whole admin panel.
 */
function isMissingTableError(error: { code?: string; message?: string } | null) {
  if (!error) return false;
  return (
    error.code === '42P01' ||
    (typeof error.message === 'string' && error.message.includes('does not exist'))
  );
}

function rowsToOverrides(rows: PermissionOverrideRow[]): Partial<FeatureAccessMap> {
  const overrides: Partial<FeatureAccessMap> = {};
  for (const row of rows) {
    // Non-grantable features (e.g. manage_admin_accounts) ignore stored overrides entirely —
    // they follow role defaults only, so nothing short of the super admin role can hold them.
    if (isValidFeatureKey(row.feature_key) && isFeatureGrantable(row.feature_key)) {
      overrides[row.feature_key] = row.access_level;
    }
  }
  return overrides;
}

/** Clamp a requested level to what the feature actually supports. */
function clampLevel(featureKey: PermissionFeatureKey, level: AccessLevel): AccessLevel {
  const feature = getPermissionFeature(featureKey);
  if (feature.grantable === false) {
    return 'none';
  }
  if (feature.supportedLevels.includes(level)) {
    return level;
  }
  // Requested a level the feature can't hold (e.g. 'full' on a view-only feature) → step down.
  if (level === 'full' && feature.supportedLevels.includes('view')) {
    return 'view';
  }
  return 'none';
}

export async function loadRolePermissionOverrides(): Promise<
  Partial<Record<TeamMemberRole, Partial<FeatureAccessMap>>>
> {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from('role_permissions')
    .select('role, feature_key, access_level')
    .returns<RolePermissionRow[]>();

  if (error) {
    if (isMissingTableError(error)) return {};
    throw new Error(error.message);
  }

  const byRole: Partial<Record<TeamMemberRole, Partial<FeatureAccessMap>>> = {};
  for (const row of data) {
    if (!isValidFeatureKey(row.feature_key) || !isFeatureGrantable(row.feature_key)) continue;
    const bucket = byRole[row.role] ?? {};
    bucket[row.feature_key] = row.access_level;
    byRole[row.role] = bucket;
  }
  return byRole;
}

export async function loadRolePermissionOverridesForRole(
  role: TeamMemberRole,
): Promise<Partial<FeatureAccessMap>> {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from('role_permissions')
    .select('feature_key, access_level')
    .eq('role', role)
    .returns<PermissionOverrideRow[]>();

  if (error) {
    if (isMissingTableError(error)) return {};
    throw new Error(error.message);
  }

  return rowsToOverrides(data);
}

export async function loadMemberPermissionOverrides(
  teamMemberId: string,
): Promise<Partial<FeatureAccessMap>> {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from('team_member_permissions')
    .select('feature_key, access_level')
    .eq('team_member_id', teamMemberId)
    .returns<PermissionOverrideRow[]>();

  if (error) {
    if (isMissingTableError(error)) return {};
    throw new Error(error.message);
  }

  return rowsToOverrides(data);
}

/** The full feature access map for a standard role (defaults merged with role overrides). */
export function resolveRoleFeatureAccess(
  role: TeamMemberRole,
  roleOverrides: Partial<FeatureAccessMap>,
): FeatureAccessMap {
  return mergeFeatureAccess(getRoleDefaultAccess(role), roleOverrides);
}

/**
 * Resolve the effective permissions for a member. A `custom` member's access lives entirely in
 * their per-member overrides (role defaults for `custom` are empty); a standard-role member
 * resolves from role defaults + role overrides.
 */
export async function resolveEffectivePermissionsForMember(
  member: Pick<TeamMember, 'id' | 'role'>,
): Promise<EffectivePermissions> {
  const [roleOverrides, memberOverrides] = await Promise.all([
    loadRolePermissionOverridesForRole(member.role),
    loadMemberPermissionOverrides(member.id),
  ]);

  const withRole = resolveRoleFeatureAccess(member.role, roleOverrides);
  const featureAccess = mergeFeatureAccess(withRole, memberOverrides);
  return buildEffectivePermissions(featureAccess);
}

/** Resolved feature access for every assignable role (defaults + role overrides). */
export async function resolveAllRoleFeatureAccess(): Promise<
  Record<AssignableTeamMemberRole, FeatureAccessMap>
> {
  const overrides = await loadRolePermissionOverrides();
  return Object.fromEntries(
    ASSIGNABLE_TEAM_MEMBER_ROLES.map((role) => [
      role,
      resolveRoleFeatureAccess(role, overrides[role] ?? {}),
    ]),
  ) as Record<AssignableTeamMemberRole, FeatureAccessMap>;
}

/**
 * If a complete feature access map is identical to a standard role's resolved access, return that
 * role so the member can keep (or regain) the standard role instead of becoming `custom`.
 * `super_admin` is never matched — it is locked and carries account-management authority that
 * must be granted explicitly.
 */
export async function findRoleMatchingFeatureAccess(
  featureAccess: FeatureAccessMap,
): Promise<AssignableTeamMemberRole | null> {
  const allRoleAccess = await resolveAllRoleFeatureAccess();
  for (const role of ASSIGNABLE_TEAM_MEMBER_ROLES) {
    if (role === 'super_admin') continue;
    const roleAccess = allRoleAccess[role];
    const matches = PERMISSION_FEATURE_KEYS.every(
      (key) => clampLevel(key, featureAccess[key] ?? 'none') === roleAccess[key],
    );
    if (matches) return role;
  }
  return null;
}

/** Resolve a member's current feature access map (for display in the per-member editor). */
export async function resolveMemberFeatureAccess(
  member: Pick<TeamMember, 'id' | 'role'>,
): Promise<FeatureAccessMap> {
  const perms = await resolveEffectivePermissionsForMember(member);
  return perms.featureAccess;
}

function sanitizeChanges(changes: Partial<FeatureAccessMap>): Array<{
  feature_key: PermissionFeatureKey;
  access_level: AccessLevel;
}> {
  const rows: Array<{ feature_key: PermissionFeatureKey; access_level: AccessLevel }> = [];
  for (const key of PERMISSION_FEATURE_KEYS) {
    const level = changes[key];
    if (level) {
      rows.push({ access_level: clampLevel(key, level), feature_key: key });
    }
  }
  return rows;
}

export async function saveRolePermissionOverrides(
  role: TeamMemberRole,
  changes: Partial<FeatureAccessMap>,
  actorTeamMemberId: string,
) {
  const supabase = createSupabaseAdminClient();
  const now = new Date().toISOString();
  const rows = sanitizeChanges(changes).map((row) => ({
    ...row,
    role,
    updated_at: now,
    updated_by_team_member_id: actorTeamMemberId,
  }));

  if (rows.length === 0) return;

  const { error } = await supabase
    .from('role_permissions')
    .upsert(rows, { onConflict: 'role,feature_key' });

  if (error) {
    throw new Error(error.message);
  }
}

/**
 * Persist a member's complete feature access map as per-member overrides. Every feature gets an
 * explicit row so a custom member is fully self-describing and immune to later role-default
 * changes.
 */
export async function saveMemberPermissionOverrides(
  teamMemberId: string,
  featureAccess: FeatureAccessMap,
  actorTeamMemberId: string,
) {
  const supabase = createSupabaseAdminClient();
  const now = new Date().toISOString();
  const rows = PERMISSION_FEATURE_KEYS.map((key) => ({
    access_level: clampLevel(key, featureAccess[key] ?? 'none'),
    feature_key: key,
    team_member_id: teamMemberId,
    updated_at: now,
    updated_by_team_member_id: actorTeamMemberId,
  }));

  const { error } = await supabase
    .from('team_member_permissions')
    .upsert(rows, { onConflict: 'team_member_id,feature_key' });

  if (error) {
    throw new Error(error.message);
  }
}

/** Remove a member's per-member overrides (used when reassigning them back to a standard role). */
export async function clearMemberPermissionOverrides(teamMemberId: string) {
  const supabase = createSupabaseAdminClient();
  const { error } = await supabase
    .from('team_member_permissions')
    .delete()
    .eq('team_member_id', teamMemberId);

  if (error && !isMissingTableError(error)) {
    throw new Error(error.message);
  }
}

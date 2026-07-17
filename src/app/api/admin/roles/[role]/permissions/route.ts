import { NextResponse } from 'next/server';

import { ForbiddenError, requireTeamMember, UnauthorizedError } from '@/lib/adminAuth';
import { canManagePermissions } from '@/lib/adminPermissions';
import {
  ACCESS_LEVELS,
  type AccessLevel,
  type FeatureAccessMap,
  getPermissionFeature,
  isFeatureGrantable,
  PERMISSION_FEATURE_KEYS,
  type PermissionFeatureKey,
} from '@/lib/permissionFeatures';
import {
  loadRolePermissionOverridesForRole,
  resolveRoleFeatureAccess,
  saveRolePermissionOverrides,
} from '@/lib/permissions';
import { MissingSupabaseConfigError } from '@/lib/supabase/server';

import { ASSIGNABLE_TEAM_MEMBER_ROLES, type TeamMemberRole } from '@/types/accounts';

const ASSIGNABLE = new Set<string>(ASSIGNABLE_TEAM_MEMBER_ROLES);
const FEATURE_KEYS = new Set<string>(PERMISSION_FEATURE_KEYS);
const LEVELS = new Set<string>(ACCESS_LEVELS);

type PermissionsPatchBody = {
  featureAccess?: Record<string, string>;
};

function parseChanges(body: PermissionsPatchBody | null): Partial<FeatureAccessMap> | null {
  if (!body || typeof body.featureAccess !== 'object' || body.featureAccess === null) {
    return null;
  }

  const changes: Partial<FeatureAccessMap> = {};
  for (const [key, level] of Object.entries(body.featureAccess)) {
    if (!FEATURE_KEYS.has(key) || !LEVELS.has(level)) {
      return null;
    }
    changes[key as keyof FeatureAccessMap] = level as AccessLevel;
  }
  return changes;
}

export async function PATCH(request: Request, context: { params: Promise<{ role: string }> }) {
  const { role } = await context.params;
  const body = (await request.json().catch(() => null)) as PermissionsPatchBody | null;
  const changes = parseChanges(body);

  if (!changes) {
    return NextResponse.json({ error: 'Invalid permission payload.' }, { status: 400 });
  }

  const lockedKey = (Object.keys(changes) as PermissionFeatureKey[]).find(
    (key) => !isFeatureGrantable(key),
  );

  if (lockedKey) {
    return NextResponse.json(
      {
        error: `${getPermissionFeature(lockedKey).label} is reserved for super admins and cannot be granted to a role.`,
      },
      { status: 400 },
    );
  }

  try {
    const currentTeamMember = await requireTeamMember();

    if (!canManagePermissions(currentTeamMember)) {
      throw new ForbiddenError('Only a super admin can edit role permissions.');
    }

    if (!ASSIGNABLE.has(role)) {
      return NextResponse.json({ error: 'Unknown role.' }, { status: 404 });
    }

    if (role === 'super_admin') {
      return NextResponse.json(
        { error: 'Super admin permissions are locked and cannot be changed.' },
        { status: 403 },
      );
    }

    await saveRolePermissionOverrides(role as TeamMemberRole, changes, currentTeamMember.id);
    const overrides = await loadRolePermissionOverridesForRole(role as TeamMemberRole);
    const featureAccess = resolveRoleFeatureAccess(role as TeamMemberRole, overrides);

    return NextResponse.json({ data: { featureAccess, role } });
  } catch (error) {
    return handlePermissionsApiError(error, 'Could not update role permissions.');
  }
}

function handlePermissionsApiError(error: unknown, fallbackMessage: string) {
  if (error instanceof UnauthorizedError) {
    return NextResponse.json({ error: error.message }, { status: 401 });
  }

  if (error instanceof ForbiddenError) {
    return NextResponse.json({ error: error.message }, { status: 403 });
  }

  if (error instanceof MissingSupabaseConfigError) {
    return NextResponse.json({ error: error.message }, { status: 503 });
  }

  return NextResponse.json({ error: fallbackMessage }, { status: 500 });
}

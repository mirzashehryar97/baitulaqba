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
} from '@/lib/permissionFeatures';
import {
  clearMemberPermissionOverrides,
  findRoleMatchingFeatureAccess,
  resolveMemberFeatureAccess,
  saveMemberPermissionOverrides,
} from '@/lib/permissions';
import { MissingSupabaseConfigError } from '@/lib/supabase/server';
import { getTeamMemberById, updateTeamMember } from '@/lib/teamMembers';

const FEATURE_KEYS = new Set<string>(PERMISSION_FEATURE_KEYS);
const LEVELS = new Set<string>(ACCESS_LEVELS);

type PermissionsPatchBody = {
  featureAccess?: Record<string, string>;
};

/** Require a complete feature access map so a custom member is fully self-describing. */
function parseFeatureAccess(body: PermissionsPatchBody | null): FeatureAccessMap | null {
  if (!body || typeof body.featureAccess !== 'object' || body.featureAccess === null) {
    return null;
  }

  const result = {} as FeatureAccessMap;
  for (const key of PERMISSION_FEATURE_KEYS) {
    const level = body.featureAccess[key];
    if (typeof level !== 'string' || !LEVELS.has(level)) {
      return null;
    }
    result[key] = level as AccessLevel;
  }

  for (const key of Object.keys(body.featureAccess)) {
    if (!FEATURE_KEYS.has(key)) {
      return null;
    }
  }

  return result;
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const body = (await request.json().catch(() => null)) as PermissionsPatchBody | null;
  const featureAccess = parseFeatureAccess(body);

  if (!featureAccess) {
    return NextResponse.json({ error: 'Invalid permission payload.' }, { status: 400 });
  }

  const lockedKey = PERMISSION_FEATURE_KEYS.find(
    (key) => !isFeatureGrantable(key) && featureAccess[key] !== 'none',
  );

  if (lockedKey) {
    return NextResponse.json(
      {
        error: `${getPermissionFeature(lockedKey).label} is reserved for super admins. To grant it, assign the Super Admin role instead.`,
      },
      { status: 400 },
    );
  }

  try {
    const currentTeamMember = await requireTeamMember();

    if (!canManagePermissions(currentTeamMember)) {
      throw new ForbiddenError('Only a super admin can edit member permissions.');
    }

    const target = await getTeamMemberById(id);

    if (!target) {
      return NextResponse.json({ error: 'Team member not found.' }, { status: 404 });
    }

    if (target.id === currentTeamMember.id) {
      return NextResponse.json(
        { error: 'You cannot change your own permissions.' },
        { status: 403 },
      );
    }

    if (target.role === 'super_admin') {
      return NextResponse.json(
        { error: 'Super admin permissions are locked and cannot be changed.' },
        { status: 403 },
      );
    }

    // If the edited permissions are identical to a standard role's, keep the member on that
    // role (with no per-member overrides) instead of detaching them to custom.
    const matchedRole = await findRoleMatchingFeatureAccess(featureAccess);

    if (matchedRole) {
      const member =
        target.role === matchedRole ? target : await updateTeamMember(id, { role: matchedRole });
      await clearMemberPermissionOverrides(id);
      const resolved = await resolveMemberFeatureAccess({ id, role: matchedRole });

      return NextResponse.json({ data: { featureAccess: resolved, member } });
    }

    await saveMemberPermissionOverrides(id, featureAccess, currentTeamMember.id);

    // Individual overrides detach the member from any standard role.
    const member =
      target.role === 'custom' ? target : await updateTeamMember(id, { role: 'custom' });
    const resolved = await resolveMemberFeatureAccess({ id, role: 'custom' });

    return NextResponse.json({ data: { featureAccess: resolved, member } });
  } catch (error) {
    return handlePermissionsApiError(error, 'Could not update member permissions.');
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

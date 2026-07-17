'use client';

import { type Ref, useEffect, useImperativeHandle, useMemo, useState } from 'react';

import { useAdminAccount } from '@/components/admin/AdminShell';
import { PermissionLevelControl } from '@/components/admin/PermissionLevelControl';
import { CustomSelect } from '@/components/ui/CustomSelect';
import { useToast } from '@/components/ui/ToastProvider';

import { canAssignTeamMemberRole } from '@/lib/adminPermissions';
import {
  type AccessLevel,
  type FeatureAccessMap,
  PERMISSION_FEATURE_KEYS,
  PERMISSION_FEATURES,
  type PermissionFeatureKey,
} from '@/lib/permissionFeatures';
import type { AssignableTeamMemberRole } from '@/lib/permissions';
import { TEAM_MEMBER_ROLE_DESCRIPTIONS, TEAM_MEMBER_ROLE_LABELS } from '@/lib/teamMemberRoles';

import {
  ASSIGNABLE_TEAM_MEMBER_ROLES,
  type TeamMember,
  type TeamMemberRole,
} from '@/types/accounts';

function featureAccessEquals(a: FeatureAccessMap, b: FeatureAccessMap) {
  return PERMISSION_FEATURE_KEYS.every((key) => a[key] === b[key]);
}

/** Imperative surface for the page-level Save button: persist the draft, resolve to success. */
export type MemberPermissionsEditorHandle = {
  save: () => Promise<boolean>;
};

/**
 * The Role & Permissions body on a team member's profile: a role selector plus the per-feature
 * permission grid. Read-only until the section's edit mode is on. Picking a role previews that
 * role's resolved access in the grid immediately; editing individual toggles detaches the draft
 * to Custom. Saving routes a pure role change through the team-member API and everything else
 * through the member-permissions API (which re-matches the map back to a standard role when it
 * fits). Saving is triggered by the page's single Save button through the imperative handle.
 */
export function MemberPermissionsEditor({
  canEditPermissions,
  canEditRole,
  editing,
  initialFeatureAccess,
  member,
  onDirtyChange,
  ref,
  roleFeatureAccess,
}: {
  canEditPermissions: boolean;
  canEditRole: boolean;
  editing: boolean;
  initialFeatureAccess: FeatureAccessMap;
  member: TeamMember;
  onDirtyChange?: (dirty: boolean) => void;
  ref?: Ref<MemberPermissionsEditorHandle>;
  roleFeatureAccess: Record<AssignableTeamMemberRole, FeatureAccessMap>;
}) {
  const { teamMember } = useAdminAccount();
  const toast = useToast();
  const [savedRole, setSavedRole] = useState<TeamMemberRole>(member.role);
  const [saved, setSaved] = useState<FeatureAccessMap>(initialFeatureAccess);
  const [draft, setDraft] = useState<FeatureAccessMap>(initialFeatureAccess);

  // Server data changed underneath us (e.g. router.refresh after a profile save) → resync.
  useEffect(() => {
    setSavedRole(member.role);
    setSaved(initialFeatureAccess);
    setDraft(initialFeatureAccess);
  }, [initialFeatureAccess, member.role]);

  // Leaving edit mode (e.g. Cancel in the section header) discards unsaved draft changes.
  useEffect(() => {
    if (!editing) {
      setDraft(saved);
    }
  }, [editing, saved]);

  /**
   * The role the draft currently represents: the member's saved role while the draft still
   * matches its resolved access, otherwise whichever standard role the draft equals, otherwise
   * Custom.
   */
  const draftRole = useMemo<TeamMemberRole>(() => {
    if (savedRole !== 'custom' && featureAccessEquals(draft, roleFeatureAccess[savedRole])) {
      return savedRole;
    }
    return (
      ASSIGNABLE_TEAM_MEMBER_ROLES.find((role) =>
        featureAccessEquals(draft, roleFeatureAccess[role]),
      ) ?? 'custom'
    );
  }, [draft, roleFeatureAccess, savedRole]);

  const displayRole = editing && canEditRole ? draftRole : savedRole;
  // Super admin access is locked by design, so selecting it turns the grid into a preview.
  const gridEditable = editing && canEditPermissions && draftRole !== 'super_admin';
  const dirtyCount = useMemo(
    () => PERMISSION_FEATURE_KEYS.filter((key) => draft[key] !== saved[key]).length,
    [draft, saved],
  );
  const isDirty = dirtyCount > 0;

  // Let the page know whether this section holds unsaved changes, so its single Save button can
  // include them.
  useEffect(() => {
    onDirtyChange?.(isDirty);
  }, [isDirty, onDirtyChange]);

  const setLevel = (key: PermissionFeatureKey, level: AccessLevel) => {
    setDraft((current) => ({ ...current, [key]: level }));
  };

  const selectRole = (role: string) => {
    const next = ASSIGNABLE_TEAM_MEMBER_ROLES.find((candidate) => candidate === role);
    if (next) {
      setDraft(roleFeatureAccess[next]);
    }
  };

  const applySavedState = (role: TeamMemberRole, featureAccess: FeatureAccessMap) => {
    setSavedRole(role);
    setSaved(featureAccess);
    setDraft(featureAccess);
  };

  /** Pure role changes (and any change by a non-permission-manager) use the team-member API. */
  const saveRoleChange = async () => {
    if (draftRole === 'custom') {
      toast({
        description: 'Pick a standard role from the dropdown first.',
        title: 'Save failed',
        type: 'error',
      });
      return false;
    }

    const response = await fetch(`/api/admin/team-members/${member.id}`, {
      body: JSON.stringify({ role: draftRole }),
      headers: { 'Content-Type': 'application/json' },
      method: 'PATCH',
    });
    const body = (await response.json().catch(() => null)) as {
      data?: TeamMember;
      error?: string;
    } | null;

    if (!response.ok || !body?.data) {
      toast({
        description: body?.error ?? 'Could not change this role.',
        title: 'Save failed',
        type: 'error',
      });
      return false;
    }

    const nextRole = body.data.role;
    applySavedState(nextRole, nextRole === 'custom' ? draft : roleFeatureAccess[nextRole]);
    toast({
      description: `${member.fullName}'s role is now ${TEAM_MEMBER_ROLE_LABELS[nextRole]}.`,
      title: 'Role updated',
      type: 'success',
    });
    return true;
  };

  const savePermissions = async () => {
    const response = await fetch(`/api/admin/team-members/${member.id}/permissions`, {
      body: JSON.stringify({ featureAccess: draft }),
      headers: { 'Content-Type': 'application/json' },
      method: 'PATCH',
    });
    const body = (await response.json().catch(() => null)) as {
      data?: { featureAccess: FeatureAccessMap; member: { role: TeamMemberRole } };
      error?: string;
    } | null;

    if (!response.ok || !body?.data) {
      toast({
        description: body?.error ?? 'Could not save these permissions.',
        title: 'Save failed',
        type: 'error',
      });
      return false;
    }

    const nextRole = body.data.member.role;
    applySavedState(nextRole, body.data.featureAccess);
    const roleLabel = TEAM_MEMBER_ROLE_LABELS[nextRole];
    toast({
      description:
        nextRole === 'custom'
          ? `${member.fullName}'s permissions were updated. Their role is now Custom.`
          : `These permissions match the ${roleLabel} role, so ${member.fullName}'s role is now ${roleLabel}.`,
      title: 'Permissions saved',
      type: 'success',
    });
    return true;
  };

  const save = async () => {
    if (!isDirty) {
      return true;
    }

    try {
      if (draftRole === 'super_admin' || !canEditPermissions) {
        return await saveRoleChange();
      }
      return await savePermissions();
    } catch {
      toast({
        description: 'Please check your connection and try again.',
        title: 'Save failed',
        type: 'error',
      });
      return false;
    }
  };

  useImperativeHandle(ref, () => ({ save }));

  return (
    <div className="mt-5">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-emerald/10 bg-white px-4 py-3">
        <div>
          <p className="text-sm font-bold text-ink/80">Role</p>
          <p className="mt-0.5 max-w-md text-xs font-medium text-ink/58">
            {TEAM_MEMBER_ROLE_DESCRIPTIONS[displayRole]}
          </p>
        </div>
        {editing && canEditRole ? (
          <CustomSelect
            ariaLabel="Role"
            onChange={selectRole}
            triggerClassName="h-11 min-w-52 px-4 text-ink"
            value={draftRole}
          >
            {draftRole === 'custom' ? (
              <option disabled value="custom">
                {TEAM_MEMBER_ROLE_LABELS.custom}
              </option>
            ) : null}
            {ASSIGNABLE_TEAM_MEMBER_ROLES.map((role) => (
              <option
                disabled={
                  !canAssignTeamMemberRole(teamMember, { ...member, role: savedRole }, role)
                }
                key={role}
                value={role}
              >
                {TEAM_MEMBER_ROLE_LABELS[role]}
              </option>
            ))}
          </CustomSelect>
        ) : (
          <span className="inline-flex items-center gap-2 rounded-md border border-gold/25 bg-gold/14 px-3 py-1 text-sm font-bold text-gold-deep">
            {TEAM_MEMBER_ROLE_LABELS[displayRole]}
          </span>
        )}
      </div>

      {editing && draftRole === 'super_admin' ? (
        <p className="mt-2 text-xs font-semibold text-gold-deep">
          Super admins hold every permission, so the grid below is locked while Super Admin is
          selected.
        </p>
      ) : null}

      <div className="mt-4 overflow-hidden rounded-lg border border-emerald/10">
        <table className="w-full border-collapse text-sm">
          <tbody>
            {PERMISSION_FEATURES.map((feature) => {
              const grantable = feature.grantable !== false;
              return (
                <tr className="border-b border-emerald/8 last:border-b-0" key={feature.key}>
                  <td className="px-4 py-3">
                    <p className="text-sm font-bold text-ink/80">{feature.label}</p>
                    <p className="mt-0.5 text-xs font-medium text-ink/58">{feature.description}</p>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end">
                      <PermissionLevelControl
                        disabled={!gridEditable || !grantable}
                        onChange={(level) => setLevel(feature.key, level)}
                        supportedLevels={feature.supportedLevels}
                        value={draft[feature.key]}
                      />
                    </div>
                    {gridEditable && !grantable ? (
                      <p className="mt-1.5 text-xs font-semibold text-gold-deep">
                        {`Reserved for super admins. To grant this, change ${member.fullName}'s role to Super Admin.`}
                      </p>
                    ) : null}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {editing ? (
        <p className="mt-4 text-sm font-semibold text-ink/68">
          {!isDirty
            ? 'No unsaved changes.'
            : draftRole !== savedRole
              ? `Role will change to ${TEAM_MEMBER_ROLE_LABELS[draftRole]} when you save.`
              : `${dirtyCount} unsaved permission ${dirtyCount === 1 ? 'change' : 'changes'} — use Save Changes below.`}
        </p>
      ) : null}
    </div>
  );
}

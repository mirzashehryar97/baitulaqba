'use client';

import { useMemo, useState } from 'react';

import {
  ArrowLeft,
  CheckCircle2,
  ClipboardList,
  Contact,
  Eye,
  FileCheck2,
  Home,
  Minus,
  Pencil,
  Receipt,
  Save,
  Settings,
  ShieldCheck,
  UserCog,
  UserPlus,
  UserRound,
  UsersRound,
  WalletCards,
} from 'lucide-react';

import { PermissionLevelControl } from '@/components/admin/PermissionLevelControl';
import { useToast } from '@/components/ui/ToastProvider';

import {
  type AccessLevel,
  type FeatureAccessMap,
  PERMISSION_FEATURES,
  type PermissionFeatureKey,
  summarizeAccess,
} from '@/lib/permissionFeatures';
import { TEAM_MEMBER_ROLE_DESCRIPTIONS, TEAM_MEMBER_ROLE_LABELS } from '@/lib/teamMemberRoles';
import { cn } from '@/lib/utils';

import { ASSIGNABLE_TEAM_MEMBER_ROLES } from '@/types/accounts';

type AssignableRole = (typeof ASSIGNABLE_TEAM_MEMBER_ROLES)[number];

const iconByName: Record<string, React.ElementType> = {
  ClipboardList,
  Contact,
  FileCheck2,
  Home,
  Receipt,
  Settings,
  ShieldCheck,
  UserCog,
  UserPlus,
  UserRound,
  UsersRound,
  WalletCards,
};

const roleIcons: Record<AssignableRole, React.ElementType> = {
  admin: ShieldCheck,
  finance_manager: WalletCards,
  orphan_coordinator: UserRound,
  sponsorship_manager: UsersRound,
  super_admin: ShieldCheck,
  support_coordinator: Contact,
  viewer: Eye,
};

export function RolesAccessPage({
  canEdit,
  initialAccess,
}: {
  canEdit: boolean;
  initialAccess: Record<AssignableRole, FeatureAccessMap>;
}) {
  const toast = useToast();
  const [access, setAccess] = useState(initialAccess);
  const [selectedRole, setSelectedRole] = useState<AssignableRole>('orphan_coordinator');
  const [editingRole, setEditingRole] = useState<AssignableRole | null>(null);

  if (editingRole) {
    return (
      <RoleEditor
        access={access[editingRole]}
        onCancel={() => setEditingRole(null)}
        onSaved={(featureAccess) => {
          setAccess((current) => ({ ...current, [editingRole]: featureAccess }));
          setEditingRole(null);
          toast({
            description: `${TEAM_MEMBER_ROLE_LABELS[editingRole]} permissions were updated.`,
            title: 'Permissions saved',
            type: 'success',
          });
        }}
        role={editingRole}
      />
    );
  }

  const SelectedIcon = roleIcons[selectedRole];
  const roleStats = summarizeAccess(access[selectedRole]);
  const roleEditable = canEdit && selectedRole !== 'super_admin';

  return (
    <>
      <div>
        <h2 className="font-display text-3xl font-semibold text-emerald-deep">Roles & Access</h2>
        <p className="mt-1 text-base font-medium text-ink/70">
          {canEdit
            ? 'Review and edit what each team role can see and manage.'
            : 'Review what each team role can see and manage.'}
        </p>
      </div>

      <div className="mt-6 grid gap-5 2xl:grid-cols-[minmax(0,1fr)_24rem]">
        <section className="min-w-0 overflow-hidden rounded-xl border border-gold/16 bg-offwhite shadow-soft">
          <div className="flex items-center gap-3 border-b border-emerald/10 px-5 py-4">
            <ShieldCheck className="h-5 w-5 text-gold-deep" />
            <h3 className="font-display text-xl font-semibold text-emerald-deep">
              Permission Matrix
            </h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[960px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-emerald/10">
                  <th className="w-56 px-4 py-4 text-left text-[0.82rem] font-bold uppercase tracking-[0.16em] text-emerald-deep/75">
                    Feature
                  </th>
                  {ASSIGNABLE_TEAM_MEMBER_ROLES.map((role) => {
                    const Icon = roleIcons[role];
                    return (
                      <th
                        className={cn(
                          'w-36 border-l border-emerald/8 px-3 py-4 text-center font-bold text-emerald-deep',
                          selectedRole === role && 'bg-gold/10',
                        )}
                        key={role}
                      >
                        <button
                          className="mx-auto flex flex-col items-center gap-2"
                          onClick={() => setSelectedRole(role)}
                          type="button"
                        >
                          <Icon className="h-5 w-5 text-ink/75" />
                          <span className="leading-tight">{TEAM_MEMBER_ROLE_LABELS[role]}</span>
                        </button>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {PERMISSION_FEATURES.map((feature) => {
                  const FeatureIcon = iconByName[feature.icon] ?? ShieldCheck;
                  return (
                    <tr className="border-b border-emerald/8 last:border-b-0" key={feature.key}>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3 text-base font-semibold text-ink/76">
                          <FeatureIcon className="h-4.5 w-4.5 text-emerald-deep" />
                          {feature.label}
                        </div>
                      </td>
                      {ASSIGNABLE_TEAM_MEMBER_ROLES.map((role) => (
                        <td
                          className={cn(
                            'border-l border-emerald/8 px-3 py-4 text-center',
                            selectedRole === role && 'bg-gold/8',
                          )}
                          key={role}
                        >
                          <div className="flex justify-center">
                            <PermissionLevelControl
                              disabled
                              supportedLevels={feature.supportedLevels}
                              value={access[role][feature.key]}
                            />
                          </div>
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="flex flex-wrap gap-5 border-t border-emerald/10 px-5 py-4 text-base font-semibold text-ink/72">
            <Legend icon={<CheckCircle2 className="h-4 w-4 text-emerald" />} label="Full access" />
            <Legend icon={<Eye className="h-4 w-4 text-gold-deep" />} label="View only" />
            <Legend icon={<Minus className="h-4 w-4 text-ink/60" />} label="No access" />
          </div>
        </section>

        <aside className="rounded-xl border border-gold/16 bg-offwhite p-6 shadow-soft">
          <h3 className="font-display text-xl font-semibold text-emerald-deep">Selected Role</h3>
          <div className="mt-6 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-deepest text-gold-soft">
            <SelectedIcon className="h-8 w-8" />
          </div>
          <h4 className="mt-5 font-display text-2xl font-semibold text-emerald-deep">
            {TEAM_MEMBER_ROLE_LABELS[selectedRole]}
          </h4>
          <div className="mt-6">
            <p className="text-base font-bold text-ink/68">Description</p>
            <p className="mt-2 text-base font-medium leading-relaxed text-ink/78">
              {TEAM_MEMBER_ROLE_DESCRIPTIONS[selectedRole]}
            </p>
          </div>

          <div className="mt-6 space-y-4 border-t border-emerald/10 pt-5">
            <DetailRow label="Full access" value={String(roleStats.full)} />
            <DetailRow label="View-only access" value={String(roleStats.view)} />
            <DetailRow label="No access" value={String(roleStats.none)} />
          </div>

          {roleEditable ? (
            <button
              className="mt-7 flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-emerald-deepest px-4 text-sm font-bold text-cream-soft transition hover:bg-emerald-deep"
              onClick={() => setEditingRole(selectedRole)}
              type="button"
            >
              <Pencil className="h-4 w-4" />
              Edit {TEAM_MEMBER_ROLE_LABELS[selectedRole]} Permissions
            </button>
          ) : null}

          <div className="mt-5 rounded-lg border border-gold/24 bg-gold/10 p-4 text-base font-semibold leading-relaxed text-ink/76">
            {selectedRole === 'super_admin'
              ? 'Super admin holds full access to everything and cannot be edited.'
              : canEdit
                ? 'Changes are enforced on both the UI and API routes.'
                : 'Only a super admin can edit role permissions.'}
          </div>
        </aside>
      </div>
    </>
  );
}

function RoleEditor({
  access,
  onCancel,
  onSaved,
  role,
}: {
  access: FeatureAccessMap;
  onCancel: () => void;
  onSaved: (featureAccess: FeatureAccessMap) => void;
  role: AssignableRole;
}) {
  const toast = useToast();
  const [draft, setDraft] = useState<FeatureAccessMap>(access);
  const [saving, setSaving] = useState(false);

  const dirtyKeys = useMemo(
    () => PERMISSION_FEATURES.filter((feature) => draft[feature.key] !== access[feature.key]),
    [draft, access],
  );
  const isDirty = dirtyKeys.length > 0;

  const setLevel = (key: PermissionFeatureKey, level: AccessLevel) => {
    setDraft((current) => ({ ...current, [key]: level }));
  };

  const save = async () => {
    if (!isDirty) {
      onCancel();
      return;
    }
    setSaving(true);

    const changes: Partial<FeatureAccessMap> = {};
    for (const feature of dirtyKeys) {
      changes[feature.key] = draft[feature.key];
    }

    try {
      const response = await fetch(`/api/admin/roles/${role}/permissions`, {
        body: JSON.stringify({ featureAccess: changes }),
        headers: { 'Content-Type': 'application/json' },
        method: 'PATCH',
      });
      const body = (await response.json().catch(() => null)) as {
        data?: { featureAccess: FeatureAccessMap };
        error?: string;
      } | null;

      if (!response.ok || !body?.data) {
        toast({
          description: body?.error ?? 'Could not save these permissions.',
          title: 'Save failed',
          type: 'error',
        });
        return;
      }

      onSaved(body.data.featureAccess);
    } catch {
      toast({
        description: 'Please check your connection and try again.',
        title: 'Save failed',
        type: 'error',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <button
            className="inline-flex items-center gap-2 text-sm font-semibold text-[#6b7280] transition hover:text-[#006b4f]"
            onClick={onCancel}
            type="button"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to matrix
          </button>
          <h2 className="mt-2 font-display text-3xl font-semibold text-emerald-deep">
            Edit {TEAM_MEMBER_ROLE_LABELS[role]} Permissions
          </h2>
          <p className="mt-1 text-base font-medium text-ink/70">
            Set the access level for each feature. Changes apply to everyone with this role.
          </p>
        </div>
      </div>

      <div className="mt-6 overflow-hidden rounded-xl border border-gold/16 bg-offwhite shadow-soft">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-emerald/10">
              <th className="px-5 py-4 text-left text-[0.82rem] font-bold uppercase tracking-[0.16em] text-emerald-deep/75">
                Feature
              </th>
              <th className="px-5 py-4 text-right text-[0.82rem] font-bold uppercase tracking-[0.16em] text-emerald-deep/75">
                Access level
              </th>
            </tr>
          </thead>
          <tbody>
            {PERMISSION_FEATURES.map((feature) => {
              const FeatureIcon = iconByName[feature.icon] ?? ShieldCheck;
              const grantable = feature.grantable !== false;
              return (
                <tr className="border-b border-emerald/8 last:border-b-0" key={feature.key}>
                  <td className="px-5 py-4">
                    <div className="flex items-start gap-3">
                      <FeatureIcon className="mt-0.5 h-5 w-5 shrink-0 text-emerald-deep" />
                      <div>
                        <p className="text-base font-semibold text-ink/80">{feature.label}</p>
                        <p className="mt-0.5 text-sm font-medium text-ink/60">
                          {feature.description}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex justify-end">
                      <PermissionLevelControl
                        disabled={!grantable}
                        onChange={(level) => setLevel(feature.key, level)}
                        supportedLevels={feature.supportedLevels}
                        value={draft[feature.key]}
                      />
                    </div>
                    {!grantable ? (
                      <p className="mt-1.5 text-right text-xs font-semibold text-gold-deep">
                        Reserved for super admins. Make a member a Super Admin to grant this.
                      </p>
                    ) : null}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="mt-5 flex flex-col gap-3 rounded-xl border border-gold/16 bg-offwhite p-5 shadow-soft sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm font-semibold text-ink/70">
          {isDirty
            ? `${dirtyKeys.length} unsaved ${dirtyKeys.length === 1 ? 'change' : 'changes'}.`
            : 'No unsaved changes.'}
        </p>
        <div className="flex gap-3">
          <button
            className="inline-flex h-11 items-center justify-center rounded-lg border border-emerald/15 bg-white px-5 text-sm font-bold text-emerald-deep transition hover:border-gold/45"
            onClick={onCancel}
            type="button"
          >
            Cancel
          </button>
          <button
            className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-emerald-deepest px-5 text-sm font-bold text-cream-soft transition hover:bg-emerald-deep disabled:cursor-wait disabled:opacity-70"
            disabled={saving || !isDirty}
            onClick={save}
            type="button"
          >
            <Save className="h-4 w-4" />
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </>
  );
}

function Legend({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-2">
      {icon}
      <span>{label}</span>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 text-base">
      <span className="font-semibold text-ink/72">{label}</span>
      <span className="font-bold text-emerald-deep">{value}</span>
    </div>
  );
}

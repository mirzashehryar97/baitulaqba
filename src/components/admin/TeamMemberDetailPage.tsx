'use client';

import { useRef, useState } from 'react';

import { useRouter } from 'next/navigation';

import {
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Mail,
  Save,
  ShieldCheck,
  SquarePen,
  UserCheck,
  UserMinus,
  UserRound,
  X,
} from 'lucide-react';

import { useAdminAccount } from '@/components/admin/AdminShell';
import {
  MemberPermissionsEditor,
  type MemberPermissionsEditorHandle,
} from '@/components/admin/MemberPermissionsEditor';
import BackLink from '@/components/ui/BackLink';
import { useConfirmation } from '@/components/ui/ConfirmationProvider';
import { CustomSelect } from '@/components/ui/CustomSelect';
import { useToast } from '@/components/ui/ToastProvider';

import {
  canChangeTeamMemberRole,
  canChangeTeamMemberStatus,
  canManageAdminAccounts,
  canManagePermissions,
} from '@/lib/adminPermissions';
import { type FeatureAccessMap } from '@/lib/permissionFeatures';
import type { AssignableTeamMemberRole } from '@/lib/permissions';
import { isAdminRole, TEAM_MEMBER_ROLE_LABELS } from '@/lib/teamMemberRoles';
import { cn } from '@/lib/utils';

import type { TeamMember, TeamMemberInput } from '@/types/accounts';

function getInitials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('en', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

function formatDateOnly(value: string) {
  return new Intl.DateTimeFormat('en', {
    dateStyle: 'medium',
  }).format(new Date(value));
}

/** Profile fields editable in the Profile Information form — role is managed in Role & Permissions. */
type ProfileFormInput = Omit<TeamMemberInput, 'role'>;

export function TeamMemberDetailPage({
  initialFeatureAccess,
  member,
  roleFeatureAccess,
}: {
  initialFeatureAccess: FeatureAccessMap;
  member: TeamMember;
  roleFeatureAccess: Record<AssignableTeamMemberRole, FeatureAccessMap>;
}) {
  const { teamMember } = useAdminAccount();
  const toast = useToast();
  const confirm = useConfirmation();
  const router = useRouter();
  const [form, setForm] = useState<ProfileFormInput>({
    active: member.active,
    email: member.email,
    fullName: member.fullName,
    notes: member.notes ?? '',
    phone: member.phone ?? '',
  });
  const [errors, setErrors] = useState<Partial<Record<keyof TeamMemberInput, string>>>({});
  const [serverError, setServerError] = useState('');
  const [saving, setSaving] = useState(false);
  const [editingPermissions, setEditingPermissions] = useState(false);
  const [permissionsDirty, setPermissionsDirty] = useState(false);
  const permissionsEditorRef = useRef<MemberPermissionsEditorHandle>(null);

  const profileDirty =
    form.fullName !== member.fullName ||
    form.email !== member.email ||
    (form.phone ?? '') !== (member.phone ?? '') ||
    (form.notes ?? '') !== (member.notes ?? '') ||
    form.active !== member.active;

  const updateForm = <Key extends keyof ProfileFormInput>(
    key: Key,
    value: ProfileFormInput[Key],
  ) => {
    setForm((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined }));
  };

  /** Persist the profile form. Callers own the `saving` flag so multi-step saves don't flicker. */
  const savePayload = async (payload: ProfileFormInput) => {
    setServerError('');

    try {
      const response = await fetch(`/api/admin/team-members/${member.id}`, {
        body: JSON.stringify(payload),
        headers: { 'Content-Type': 'application/json' },
        method: 'PATCH',
      });
      const body = (await response.json().catch(() => null)) as {
        data?: TeamMember;
        error?: string;
        errors?: Partial<Record<keyof TeamMemberInput, string>>;
      } | null;

      if (!response.ok) {
        setErrors(body?.errors ?? {});
        const message = body?.error ?? 'Could not save changes.';
        setServerError(message);
        toast({
          description: 'Please review the highlighted fields and try again.',
          title: message,
          type: 'error',
        });
        return false;
      }

      toast({
        description: `${payload.fullName}'s profile was updated successfully.`,
        title: 'Team member saved',
        type: 'success',
      });
      router.refresh();
      return true;
    } catch {
      const message = 'Could not save changes.';
      setServerError(message);
      toast({
        description: 'Please check your connection and try again.',
        title: message,
        type: 'error',
      });
      return false;
    }
  };

  // The page has a single Save button: it persists the profile form and any pending role or
  // permission changes from the Role & Permissions section in one go.
  const save = async (event?: React.FormEvent<HTMLFormElement>) => {
    event?.preventDefault();

    if (!profileDirty && !permissionsDirty) return;

    const confirmed = await confirm({
      confirmLabel: 'Save Changes',
      description: `Save changes to ${form.fullName || member.fullName}'s team member account.`,
      title: 'Save team member changes?',
    });

    if (!confirmed) return;

    setSaving(true);
    try {
      if (profileDirty && !(await savePayload(form))) {
        return;
      }

      if (permissionsDirty) {
        const saved = (await permissionsEditorRef.current?.save()) ?? false;

        if (!saved) return;

        setEditingPermissions(false);
        router.refresh();
      }
    } finally {
      setSaving(false);
    }
  };

  const setActiveAndSave = async (active: boolean) => {
    const previousForm = form;
    const nextForm = { ...form, active };
    setForm(nextForm);
    setSaving(true);
    const success = await savePayload(nextForm);
    setSaving(false);

    if (!success) {
      setForm(previousForm);
    }

    return success;
  };

  const confirmActiveChange = async (active: boolean) => {
    const confirmed = await confirm({
      confirmLabel: active ? 'Activate Member' : 'Deactivate Member',
      description: active
        ? `Restore admin access for ${member.fullName}.`
        : member.id === teamMember.id
          ? 'This will deactivate your own admin access. You may lose access to the admin panel.'
          : `Pause admin access for ${member.fullName}.`,
      title: active ? 'Activate team member?' : 'Deactivate team member?',
      variant: active ? 'default' : 'destructive',
    });

    if (confirmed) {
      await setActiveAndSave(active);
    }
  };
  const ActiveChangeIcon = form.active ? UserMinus : UserCheck;
  const isOwnAccount = member.id === teamMember.id;
  const targetIsAdmin = isAdminRole(member.role);
  const currentUserCanManageAdminAccounts = canManageAdminAccounts(teamMember);
  const canEditRole = canChangeTeamMemberRole(teamMember, member);
  const canChangeStatus = canChangeTeamMemberStatus(teamMember, member);
  const canEditPermissions =
    canManagePermissions(teamMember) && !isOwnAccount && member.role !== 'super_admin';
  const canOpenRoleEditor = canEditRole || canEditPermissions;
  const protectedRoleMessage = isOwnAccount
    ? 'You cannot change your own role or account status.'
    : !currentUserCanManageAdminAccounts && targetIsAdmin
      ? 'Only a super admin can change admin roles or admin account status.'
      : '';

  return (
    <>
      <BackLink href="/admin/team" label="Back to Team Members" />

      <div className="mt-6 flex flex-col gap-5 lg:flex-row lg:items-center">
        <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-full bg-emerald-deepest text-3xl font-black text-gold-soft shadow-soft">
          {getInitials(member.fullName)}
        </div>
        <div className="min-w-0">
          <h2 className="font-display text-4xl font-semibold text-emerald-deep">
            {member.fullName}
          </h2>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center gap-2 rounded-md border border-gold/25 bg-gold/14 px-3 py-1 text-sm font-bold text-gold-deep">
              <UserRound className="h-4 w-4" />
              {TEAM_MEMBER_ROLE_LABELS[member.role]}
            </span>
            <span
              className={cn(
                'inline-flex items-center gap-2 rounded-md border px-3 py-1 text-sm font-bold',
                member.active
                  ? 'border-emerald/20 bg-emerald/10 text-emerald-deep'
                  : 'border-ink/15 bg-ink/8 text-ink/72',
              )}
            >
              <CheckCircle2 className="h-4 w-4" />
              {member.active ? 'Active' : 'Inactive'}
            </span>
          </div>
          <div className="mt-4 flex flex-wrap gap-4 text-base font-semibold text-ink/76">
            <span className="inline-flex items-center gap-2">
              <CalendarDays className="h-4 w-4" />
              Member since {formatDateOnly(member.createdAt)}
            </span>
            <span className="inline-flex items-center gap-2">
              <Mail className="h-4 w-4" />
              {member.email}
            </span>
          </div>
        </div>
      </div>

      <div className="mt-7 grid gap-6 xl:grid-cols-[minmax(0,1fr)_26rem]">
        <div className="space-y-6">
          <form
            className="rounded-xl border border-gold/16 bg-offwhite p-5 shadow-soft"
            onSubmit={save}
          >
            <h3 className="flex items-center gap-2 border-b border-emerald/10 pb-4 font-display text-xl font-semibold text-emerald-deep">
              <UserRound className="h-5 w-5 text-gold-deep" />
              Profile Information
            </h3>

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <TextField
                error={errors.fullName}
                label="Full Name"
                onChange={(value) => updateForm('fullName', value)}
                value={form.fullName}
              />
              <TextField
                error={errors.email}
                label="Email Address"
                onChange={(value) => updateForm('email', value)}
                type="email"
                value={form.email}
              />
              <TextField
                label="Phone Number"
                onChange={(value) => updateForm('phone', value)}
                value={form.phone ?? ''}
              />
              <div className="block">
                <span className="text-sm font-bold text-ink/72">Role</span>
                <div className="mt-2 flex h-12 w-full items-center rounded-lg border border-emerald/10 bg-ink/4 px-4 text-sm font-semibold text-ink/72">
                  {TEAM_MEMBER_ROLE_LABELS[member.role]}
                </div>
                <span className="mt-1 block text-xs font-semibold text-ink/55">
                  Managed in the Role &amp; Permissions section below.
                </span>
              </div>
              <SelectField
                disabled={!canChangeStatus}
                label="Status"
                onChange={(value) => updateForm('active', value === 'active')}
                value={form.active ? 'active' : 'inactive'}
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </SelectField>
              <label className="block">
                <span className="text-sm font-bold text-ink/72">Internal Notes</span>
                <textarea
                  className="mt-2 min-h-24 w-full rounded-lg border border-emerald/10 bg-white px-4 py-3 text-sm font-semibold leading-relaxed text-ink outline-none transition focus:border-gold focus:ring-4 focus:ring-gold/15"
                  onChange={(event) => updateForm('notes', event.target.value)}
                  value={form.notes ?? ''}
                />
              </label>
            </div>

            {protectedRoleMessage ? (
              <p className="mt-4 rounded-lg border border-gold/24 bg-gold/10 px-4 py-3 text-sm font-bold text-gold-deep">
                {protectedRoleMessage}
              </p>
            ) : null}

            {serverError ? (
              <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
                {serverError}
              </div>
            ) : null}
          </form>

          <section className="rounded-xl border border-gold/16 bg-offwhite p-5 shadow-soft">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-emerald/10 pb-4">
              <h3 className="flex items-center gap-2 font-display text-xl font-semibold text-emerald-deep">
                <ShieldCheck className="h-5 w-5 text-gold-deep" />
                Role & Permissions
              </h3>
              {canOpenRoleEditor ? (
                <button
                  className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-emerald/20 bg-white px-3 text-xs font-bold text-emerald-deep transition hover:bg-emerald/5"
                  onClick={() => setEditingPermissions((current) => !current)}
                  type="button"
                >
                  {editingPermissions ? (
                    <>
                      <X className="h-3.5 w-3.5" />
                      Cancel
                    </>
                  ) : (
                    <>
                      <SquarePen className="h-3.5 w-3.5" />
                      Edit Role & Permissions
                    </>
                  )}
                </button>
              ) : null}
            </div>
            <div className="mt-4 rounded-lg border border-gold/24 bg-gold/10 p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-gold-deep" />
                <div>
                  <p className="text-sm font-bold text-gold-deep">
                    {canEditPermissions && editingPermissions
                      ? 'Editing permissions creates a custom role'
                      : 'Changing role affects access'}
                  </p>
                  <p className="mt-1 text-base font-medium leading-relaxed text-ink/76">
                    {canEditPermissions && editingPermissions
                      ? `Granting or removing individual access for ${member.fullName} will change their role to Custom. To restore a standard role, pick one from the Role dropdown below.`
                      : `Updating ${member.fullName}'s role will change the pages and features they can access in the admin panel. Please ensure the selected role matches their responsibilities.`}
                  </p>
                </div>
              </div>
            </div>

            <MemberPermissionsEditor
              canEditPermissions={canEditPermissions}
              canEditRole={canEditRole}
              editing={editingPermissions}
              initialFeatureAccess={initialFeatureAccess}
              member={member}
              onDirtyChange={setPermissionsDirty}
              ref={permissionsEditorRef}
              roleFeatureAccess={roleFeatureAccess}
            />
          </section>

          <div className="flex flex-col gap-3 rounded-xl border border-gold/16 bg-offwhite p-5 shadow-soft md:flex-row md:items-center">
            <button
              className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-emerald-deepest px-5 text-sm font-bold text-cream-soft transition hover:bg-emerald-deep disabled:cursor-not-allowed disabled:opacity-70"
              disabled={saving || (!profileDirty && !permissionsDirty)}
              onClick={() => save()}
              type="button"
            >
              <Save className="h-4 w-4" />
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
            <button
              className={cn(
                'inline-flex h-12 items-center justify-center gap-2 rounded-lg border bg-white px-5 text-sm font-bold transition disabled:opacity-70',
                saving && 'cursor-wait',
                !canChangeStatus && 'cursor-not-allowed opacity-45',
                form.active
                  ? 'border-red-300 text-red-600 hover:bg-red-50'
                  : 'border-emerald/25 text-emerald-deep hover:bg-cream',
              )}
              disabled={saving || !canChangeStatus}
              onClick={() => confirmActiveChange(!form.active)}
              title={protectedRoleMessage}
              type="button"
            >
              <ActiveChangeIcon className="h-4 w-4" />
              {form.active ? 'Deactivate Member' : 'Activate Member'}
            </button>
          </div>
        </div>

        <aside className="overflow-hidden rounded-xl border border-gold/16 bg-offwhite shadow-soft">
          <section className="p-5">
            <h3 className="flex items-center gap-2 font-display text-xl font-semibold text-emerald-deep">
              <span className="font-sans text-2xl font-black text-[#4285f4]">G</span>
              Google Login
            </h3>
            <div className="mt-5 space-y-4">
              <DetailPair label="Provider" value="Google" />
              <DetailPair
                label="Auth User ID"
                value={member.authUserId ? 'Linked' : 'Pending first login'}
              />
              <DetailPair
                label="First Login"
                value={member.authUserId ? formatDate(member.createdAt) : '-'}
              />
              <DetailPair
                label="Last Login"
                value={member.authUserId ? formatDate(member.updatedAt) : '-'}
              />
            </div>
          </section>

          <section className="border-t border-emerald/10 p-5">
            <h3 className="flex items-center gap-2 font-display text-xl font-semibold text-emerald-deep">
              <Clock3 className="h-5 w-5 text-gold-deep" />
              Activity
            </h3>
            <div className="mt-5 space-y-5">
              <ActivityItem
                meta={`by ${teamMember.fullName}`}
                title={`Role set to ${TEAM_MEMBER_ROLE_LABELS[member.role]}`}
                value={formatDate(member.updatedAt)}
              />
              <ActivityItem
                meta={`by ${teamMember.fullName}`}
                title={member.active ? 'Account activated' : 'Account deactivated'}
                value={formatDate(member.createdAt)}
              />
              <ActivityItem
                meta="System"
                title={
                  member.authUserId
                    ? 'First Google login completed'
                    : 'Waiting for first Google login'
                }
                value={member.authUserId ? formatDate(member.createdAt) : 'Pending'}
              />
            </div>
          </section>
        </aside>
      </div>
    </>
  );
}

function TextField({
  error,
  label,
  onChange,
  type = 'text',
  value,
}: {
  error?: string;
  label: string;
  onChange: (value: string) => void;
  type?: string;
  value: string;
}) {
  return (
    <label className="block">
      <span className="text-sm font-bold text-ink/72">{label}</span>
      <input
        className={cn(
          'mt-2 h-12 w-full rounded-lg border bg-white px-4 text-sm font-semibold text-ink outline-none transition focus:ring-4 focus:ring-gold/15',
          error ? 'border-red-300' : 'border-emerald/10 focus:border-gold',
        )}
        onChange={(event) => onChange(event.target.value)}
        type={type}
        value={value}
      />
      {error ? <span className="mt-1 block text-xs font-bold text-red-600">{error}</span> : null}
    </label>
  );
}

function SelectField({
  children,
  disabled = false,
  label,
  onChange,
  value,
}: {
  children: React.ReactNode;
  disabled?: boolean;
  label: string;
  onChange: (value: string) => void;
  value: string;
}) {
  return (
    <div className="relative block">
      <span className="text-sm font-bold text-ink/72">{label}</span>
      <CustomSelect
        ariaLabel={label}
        disabled={disabled}
        onChange={onChange}
        triggerClassName="mt-2 h-12 px-4 text-ink"
        value={value}
      >
        {children}
      </CustomSelect>
    </div>
  );
}

function DetailPair({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[8rem_1fr] gap-3 text-base">
      <span className="font-bold text-ink/70">{label}</span>
      <span className="break-words font-semibold text-ink/72">{value}</span>
    </div>
  );
}

function ActivityItem({ meta, title, value }: { meta: string; title: string; value: string }) {
  return (
    <div className="relative pl-7">
      <span className="absolute left-0 top-1.5 h-3 w-3 rounded-full border-2 border-emerald-deep bg-emerald-deep" />
      <p className="text-sm font-bold text-emerald-deep">{title}</p>
      <p className="mt-1 text-sm font-semibold text-ink/68">{value}</p>
      <p className="mt-1 text-sm font-semibold text-ink/62">{meta}</p>
    </div>
  );
}

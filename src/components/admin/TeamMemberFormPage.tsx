'use client';

import { useState } from 'react';

import Link from 'next/link';
import { useRouter } from 'next/navigation';

import {
  CheckCircle2,
  Eye,
  Headphones,
  KeyRound,
  Mail,
  ShieldCheck,
  UserCog,
  UserPlus,
  UserRound,
  UsersRound,
  WalletCards,
} from 'lucide-react';

import { useAdminAccount } from '@/components/admin/AdminShell';
import BackLink from '@/components/ui/BackLink';
import { useConfirmation } from '@/components/ui/ConfirmationProvider';
import { NavLinkSpinner } from '@/components/ui/NavLinkIcon';
import { useToast } from '@/components/ui/ToastProvider';

import { canCreateTeamMemberWithRole } from '@/lib/adminPermissions';
import {
  isAdminRole,
  TEAM_MEMBER_ROLE_DESCRIPTIONS,
  TEAM_MEMBER_ROLE_LABELS,
} from '@/lib/teamMemberRoles';
import { cn } from '@/lib/utils';

import {
  ASSIGNABLE_TEAM_MEMBER_ROLES,
  type TeamMember,
  type TeamMemberInput,
  type TeamMemberRole,
} from '@/types/accounts';

const roleIcons: Record<TeamMemberRole, React.ElementType> = {
  admin: ShieldCheck,
  custom: UserCog,
  finance_manager: WalletCards,
  orphan_coordinator: UserRound,
  sponsorship_manager: UsersRound,
  super_admin: KeyRound,
  support_coordinator: Headphones,
  viewer: Eye,
};

export function TeamMemberFormPage() {
  const router = useRouter();
  const toast = useToast();
  const confirm = useConfirmation();
  const { teamMember } = useAdminAccount();
  const [form, setForm] = useState<TeamMemberInput>({
    active: true,
    email: '',
    fullName: '',
    notes: '',
    phone: '',
    role: 'orphan_coordinator',
  });
  const [errors, setErrors] = useState<Partial<Record<keyof TeamMemberInput, string>>>({});
  const [serverError, setServerError] = useState('');
  const [saving, setSaving] = useState(false);

  const updateForm = <Key extends keyof TeamMemberInput>(key: Key, value: TeamMemberInput[Key]) => {
    setForm((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined }));
  };

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const confirmed = await confirm({
      confirmLabel: 'Create Team Member',
      description: `Create a ${TEAM_MEMBER_ROLE_LABELS[form.role]} account for ${
        form.fullName || form.email || 'this team member'
      }.`,
      title: 'Create team member?',
    });

    if (!confirmed) return;

    setSaving(true);
    setServerError('');

    try {
      const response = await fetch('/api/admin/team-members', {
        body: JSON.stringify(form),
        headers: { 'Content-Type': 'application/json' },
        method: 'POST',
      });
      const body = (await response.json().catch(() => null)) as {
        data?: TeamMember;
        error?: string;
        errors?: Partial<Record<keyof TeamMemberInput, string>>;
      } | null;

      if (!response.ok) {
        setErrors(body?.errors ?? {});
        const message = body?.error ?? 'Could not save team member.';
        setServerError(message);
        toast({
          description: 'Please review the form and try again.',
          title: message,
          type: 'error',
        });
        return;
      }

      if (body?.data) {
        toast({
          description: `${body.data.fullName} can now sign in with their Google account.`,
          title: 'Team member created',
          type: 'success',
        });
        router.push(`/admin/team/${body.data.id}`);
      }
    } catch {
      const message = 'Could not save team member.';
      setServerError(message);
      toast({
        description: 'Please check your connection and try again.',
        title: message,
        type: 'error',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className="mb-5">
        <BackLink href="/admin/team" label="Back to Team Members" />
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_24rem]">
        <div>
          <h2 className="font-display text-3xl font-semibold text-emerald-deep">Add Team Member</h2>
          <p className="mt-1 text-base font-medium text-ink/70">
            Invite a trusted team member and assign their access role.
          </p>

          <form
            className="mt-6 overflow-hidden rounded-xl border border-gold/16 bg-offwhite shadow-soft"
            onSubmit={submit}
          >
            <FormSection icon={UsersRound} title="Basic Information">
              <div className="grid gap-4 md:grid-cols-2">
                <TextField
                  error={errors.fullName}
                  label="Full Name"
                  onChange={(value) => updateForm('fullName', value)}
                  placeholder="Enter full name"
                  required
                  value={form.fullName}
                />
                <TextField
                  error={errors.email}
                  label="Email Address"
                  onChange={(value) => updateForm('email', value)}
                  placeholder="name@example.com"
                  required
                  type="email"
                  value={form.email}
                />
              </div>
              <div className="mt-4 max-w-xl">
                <TextField
                  label="Phone Number"
                  onChange={(value) => updateForm('phone', value)}
                  placeholder="+92 300 1234567"
                  value={form.phone ?? ''}
                />
              </div>
            </FormSection>

            <FormSection
              description="Select the role that best matches their responsibilities."
              icon={UserCog}
              title="Access Role"
            >
              {errors.role ? (
                <p className="mb-3 text-sm font-bold text-red-600">{errors.role}</p>
              ) : null}
              <div className="grid gap-3 md:grid-cols-2 2xl:grid-cols-3">
                {ASSIGNABLE_TEAM_MEMBER_ROLES.map((role) => (
                  <RoleCard
                    checked={form.role === role}
                    disabled={!canCreateTeamMemberWithRole(teamMember, role)}
                    key={role}
                    onClick={() => updateForm('role', role)}
                    role={role}
                  />
                ))}
              </div>
            </FormSection>

            <FormSection
              description="Control whether this team member can sign in and access the system."
              icon={UsersRound}
              title="Account Status"
            >
              <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_22rem] md:items-center">
                <button
                  aria-pressed={form.active}
                  className="flex items-center gap-3 text-left"
                  onClick={() => updateForm('active', !form.active)}
                  type="button"
                >
                  <span
                    className={cn(
                      'relative h-8 w-14 rounded-full transition',
                      form.active ? 'bg-emerald' : 'bg-ink/18',
                    )}
                  >
                    <span
                      className={cn(
                        'absolute top-1 h-6 w-6 rounded-full bg-white shadow transition',
                        form.active ? 'left-7' : 'left-1',
                      )}
                    />
                  </span>
                  <span>
                    <span className="block text-sm font-bold text-emerald-deep">
                      {form.active ? 'Active' : 'Inactive'}
                    </span>
                    <span className="mt-1 block text-base font-medium text-ink/72">
                      Active members can sign in with Google and access the system.
                    </span>
                  </span>
                </button>
                <div className="rounded-lg border border-emerald/18 bg-emerald/8 p-4 text-sm font-semibold leading-relaxed text-emerald-deep">
                  <CheckCircle2 className="mb-2 h-5 w-5" />
                  We'll allow access for the email address above. They can sign in with Google using
                  this email.
                </div>
              </div>
              {errors.active ? (
                <p className="mt-3 text-sm font-bold text-red-600">{errors.active}</p>
              ) : null}
            </FormSection>

            {serverError ? (
              <div className="mx-5 mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
                {serverError}
              </div>
            ) : null}

            <div className="flex flex-col gap-3 border-t border-emerald/10 px-5 py-5 sm:flex-row">
              <button
                className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-emerald-deepest px-5 text-sm font-bold text-cream-soft transition hover:bg-emerald-deep disabled:cursor-wait disabled:opacity-70"
                disabled={saving}
                type="submit"
              >
                <UserPlus className="h-4 w-4" />
                {saving ? 'Saving...' : 'Save Team Member'}
              </button>
              <Link
                className="inline-flex h-12 items-center justify-center gap-2 rounded-lg border border-emerald/10 bg-white px-5 text-sm font-bold text-emerald-deep transition hover:border-gold/45"
                href="/admin/team"
              >
                Cancel
                <NavLinkSpinner className="h-4 w-4" />
              </Link>
            </div>
          </form>
        </div>

        <aside className="space-y-5">
          <InfoCard icon={KeyRound} title="How access works">
            The team member will sign in with Google using this email. Access is allowed only when
            the email exists here and the account is active.
          </InfoCard>
          <InfoCard icon={Mail} title="Sign in with Google">
            Team members use Google to sign in with their work email. No password is stored in this
            app.
          </InfoCard>
          <InfoCard icon={CheckCircle2} title="Account must be active">
            Only active accounts are allowed to access the admin panel.
          </InfoCard>

          <div className="rounded-xl border border-gold/16 bg-offwhite p-5 shadow-soft">
            <h3 className="font-display text-xl font-semibold text-emerald-deep">
              Role descriptions
            </h3>
            <div className="mt-4 space-y-4">
              {ASSIGNABLE_TEAM_MEMBER_ROLES.map((role) => {
                const Icon = roleIcons[role];
                return (
                  <div className="flex gap-3" key={role}>
                    <Icon className="mt-0.5 h-4 w-4 shrink-0 text-emerald-deep" />
                    <div>
                      <p className="text-sm font-bold text-emerald-deep">
                        {TEAM_MEMBER_ROLE_LABELS[role]}
                      </p>
                      <p className="mt-1 text-sm font-semibold leading-relaxed text-ink/72">
                        {TEAM_MEMBER_ROLE_DESCRIPTIONS[role]}
                      </p>
                      {!canCreateTeamMemberWithRole(teamMember, role) && isAdminRole(role) ? (
                        <p className="mt-1 text-xs font-bold text-gold-deep">Super admin only</p>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </aside>
      </div>
    </>
  );
}

function FormSection({
  children,
  description,
  icon: Icon,
  title,
}: {
  children: React.ReactNode;
  description?: string;
  icon: React.ElementType;
  title: string;
}) {
  return (
    <section className="border-b border-emerald/10 px-5 py-5 last:border-b-0">
      <div className="mb-4 flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gold/14 text-gold-deep">
          <Icon className="h-5 w-5" />
        </span>
        <div>
          <h3 className="font-display text-xl font-semibold text-emerald-deep">{title}</h3>
          {description ? (
            <p className="mt-1 text-base font-medium text-ink/70">{description}</p>
          ) : null}
        </div>
      </div>
      {children}
    </section>
  );
}

function TextField({
  error,
  label,
  onChange,
  placeholder,
  required,
  type = 'text',
  value,
}: {
  error?: string;
  label: string;
  onChange: (value: string) => void;
  placeholder: string;
  required?: boolean;
  type?: string;
  value: string;
}) {
  return (
    <label className="block">
      <span className="text-sm font-bold text-ink/72">
        {label}
        {required ? <span className="text-red-600"> *</span> : null}
      </span>
      <input
        className={cn(
          'mt-2 h-12 w-full rounded-lg border bg-white px-4 text-sm font-semibold text-ink outline-none transition focus:ring-4 focus:ring-gold/15',
          error ? 'border-red-300' : 'border-emerald/10 focus:border-gold',
        )}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        type={type}
        value={value}
      />
      {error ? <span className="mt-1 block text-xs font-bold text-red-600">{error}</span> : null}
    </label>
  );
}

function RoleCard({
  checked,
  disabled = false,
  onClick,
  role,
}: {
  checked: boolean;
  disabled?: boolean;
  onClick: () => void;
  role: TeamMemberRole;
}) {
  const Icon = roleIcons[role];

  return (
    <button
      className={cn(
        'flex min-h-28 items-start gap-3 rounded-lg border bg-white p-4 text-left transition',
        disabled && 'cursor-not-allowed opacity-50',
        checked
          ? 'border-gold bg-gold/8 shadow-[0_16px_32px_-28px_rgba(184,128,38,0.75)]'
          : 'border-emerald/10 hover:border-gold/45',
      )}
      disabled={disabled}
      onClick={onClick}
      title={disabled ? 'Only a super admin can assign this role.' : undefined}
      type="button"
    >
      <span
        className={cn(
          'flex h-10 w-10 shrink-0 items-center justify-center rounded-full',
          checked ? 'bg-emerald-deepest text-gold-soft' : 'bg-cream text-emerald-deep',
        )}
      >
        <Icon className="h-5 w-5" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-bold text-emerald-deep">
          {TEAM_MEMBER_ROLE_LABELS[role]}
        </span>
        <span className="mt-1 block text-base font-medium leading-snug text-ink/72">
          {TEAM_MEMBER_ROLE_DESCRIPTIONS[role]}
        </span>
      </span>
      <span
        className={cn(
          'mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border',
          checked ? 'border-gold bg-gold text-emerald-deepest' : 'border-ink/18 bg-white',
        )}
      >
        {checked ? <CheckCircle2 className="h-3.5 w-3.5" /> : null}
      </span>
    </button>
  );
}

function InfoCard({
  children,
  icon: Icon,
  title,
}: {
  children: React.ReactNode;
  icon: React.ElementType;
  title: string;
}) {
  return (
    <div className="rounded-xl border border-gold/16 bg-offwhite p-5 shadow-soft">
      <div className="flex gap-4">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gold/14 text-gold-deep">
          <Icon className="h-5 w-5" />
        </span>
        <div>
          <h3 className="font-display text-lg font-semibold text-emerald-deep">{title}</h3>
          <p className="mt-2 text-base font-medium leading-relaxed text-ink/72">{children}</p>
        </div>
      </div>
    </div>
  );
}

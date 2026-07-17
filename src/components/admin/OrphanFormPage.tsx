'use client';

import { useMemo, useState } from 'react';

import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { FileImage, IdCard, Save, UserRound, UsersRound } from 'lucide-react';

import BackLink from '@/components/ui/BackLink';
import { useConfirmation } from '@/components/ui/ConfirmationProvider';
import { CustomSelect } from '@/components/ui/CustomSelect';
import { NavLinkSpinner } from '@/components/ui/NavLinkIcon';
import { useToast } from '@/components/ui/ToastProvider';

import { cn } from '@/lib/utils';

import type { OrphanGender, OrphanProfile, OrphanProfileInput } from '@/types/orphans';

type OrphanFormErrors = Partial<
  Record<
    keyof OrphanProfileInput | 'guardianName' | 'guardianRelationship' | 'guardianPhone',
    string
  >
>;

export function OrphanFormPage() {
  const router = useRouter();
  const toast = useToast();
  const confirm = useConfirmation();
  const [form, setForm] = useState<OrphanProfileInput>({
    ageEstimate: null,
    backgroundSummary: '',
    cityArea: '',
    codeMode: 'auto',
    dateOfBirth: '',
    educationStatus: '',
    fullName: '',
    gender: 'male',
    guardian: {
      address: '',
      guardianName: '',
      notes: '',
      phone: '',
      relationship: '',
      whatsapp: '',
    },
    healthNotes: '',
    orphanCode: '',
    profileImageUrl: '',
    verificationStatus: 'unverified',
  });
  const [errors, setErrors] = useState<OrphanFormErrors>({});
  const [serverError, setServerError] = useState('');
  const [saving, setSaving] = useState(false);
  const [profileImageFile, setProfileImageFile] = useState<File | null>(null);
  const previewUrl = useMemo(
    () => (profileImageFile ? URL.createObjectURL(profileImageFile) : ''),
    [profileImageFile],
  );

  const updateForm = <Key extends keyof OrphanProfileInput>(
    key: Key,
    value: OrphanProfileInput[Key],
  ) => {
    setForm((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined }));
  };

  const updateGuardian = (key: keyof OrphanProfileInput['guardian'], value: string) => {
    setForm((current) => ({
      ...current,
      guardian: { ...current.guardian, [key]: value },
    }));
    setErrors((current) => ({
      ...current,
      guardianName: key === 'guardianName' ? undefined : current.guardianName,
      guardianRelationship: key === 'relationship' ? undefined : current.guardianRelationship,
    }));
  };

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const confirmed = await confirm({
      confirmLabel: 'Save Profile',
      description: `Create an orphan profile for ${form.fullName || 'this child'} and upload the selected profile image.`,
      title: 'Create orphan profile?',
    });

    if (!confirmed) return;

    setSaving(true);
    setServerError('');

    try {
      if (!profileImageFile) {
        setErrors((current) => ({
          ...current,
          profileImageUrl: 'Profile image file is required.',
        }));
        setSaving(false);
        return;
      }

      const imageFormData = new FormData();
      imageFormData.append('file', profileImageFile);

      const uploadResponse = await fetch('/api/admin/orphans/profile-image', {
        body: imageFormData,
        method: 'POST',
      });
      const uploadBody = (await uploadResponse.json().catch(() => null)) as {
        data?: { publicUrl: string };
        error?: string;
      } | null;

      if (!uploadResponse.ok || !uploadBody?.data?.publicUrl) {
        const message = uploadBody?.error ?? 'Could not upload profile image.';
        setServerError(message);
        toast({
          description: 'Please choose a valid JPEG, PNG, or WebP image and try again.',
          title: message,
          type: 'error',
        });
        setSaving(false);
        return;
      }

      const response = await fetch('/api/admin/orphans', {
        body: JSON.stringify({ ...form, profileImageUrl: uploadBody.data.publicUrl }),
        headers: { 'Content-Type': 'application/json' },
        method: 'POST',
      });
      const body = (await response.json().catch(() => null)) as {
        data?: OrphanProfile;
        error?: string;
        errors?: OrphanFormErrors;
      } | null;

      if (!response.ok || !body?.data) {
        setErrors(body?.errors ?? {});
        const message = body?.error ?? 'Could not save orphan profile.';
        setServerError(message);
        toast({
          description: 'Please review the form and try again.',
          title: message,
          type: 'error',
        });
        return;
      }

      toast({
        description: `${body.data.orphanCode} was added to orphan profiles.`,
        title: 'Orphan profile created',
        type: 'success',
      });
      router.push(`/admin/orphans/${body.data.id}`);
    } catch {
      const message = 'Could not save orphan profile.';
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
        <BackLink href="/admin/orphans" label="Back to Orphan Profiles" />
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_24rem]">
        <div>
          <h2 className="font-display text-3xl font-semibold text-emerald-deep">
            Add Orphan Profile
          </h2>
          <p className="mt-1 text-base font-medium text-ink/70">
            Create a verified profile with the existing donor-facing code or a new auto-generated
            code.
          </p>

          <form
            className="mt-6 overflow-hidden rounded-xl border border-gold/16 bg-offwhite shadow-soft"
            onSubmit={submit}
          >
            <FormSection icon={IdCard} title="Orphan Code">
              <div className="grid gap-3 sm:grid-cols-2">
                <CodeModeButton
                  active={form.codeMode === 'auto'}
                  description="Use the next available code starting at OR1100."
                  label="Auto-generate new code"
                  onClick={() => updateForm('codeMode', 'auto')}
                />
                <CodeModeButton
                  active={form.codeMode === 'manual'}
                  description="Use existing records like OR507 or OR508."
                  label="Enter existing code"
                  onClick={() => updateForm('codeMode', 'manual')}
                />
              </div>
              {form.codeMode === 'manual' ? (
                <TextField
                  className="mt-4 max-w-sm"
                  error={errors.orphanCode}
                  label="Existing Orphan Code"
                  onChange={(value) => updateForm('orphanCode', value.toUpperCase())}
                  placeholder="OR507"
                  required
                  value={form.orphanCode ?? ''}
                />
              ) : (
                <p className="mt-4 rounded-lg border border-gold/20 bg-gold/10 px-4 py-3 text-sm font-bold text-gold-deep">
                  The next available code will be assigned automatically starting at OR1100.
                </p>
              )}
            </FormSection>

            <FormSection icon={FileImage} title="Profile Image">
              <label className="block">
                <span className="text-sm font-bold text-ink/72">
                  Upload Profile Image <span className="text-red-600">*</span>
                </span>
                <input
                  accept="image/jpeg,image/png,image/webp"
                  className="mt-2 block w-full cursor-pointer rounded-lg border border-emerald/10 bg-white px-4 py-3 text-sm font-semibold text-ink file:mr-4 file:cursor-pointer file:rounded-lg file:border-0 file:bg-emerald-deepest file:px-4 file:py-2 file:text-sm file:font-bold file:text-cream-soft"
                  onChange={(event) => {
                    const file = event.target.files?.[0] ?? null;
                    setProfileImageFile(file);
                    setErrors((current) => ({ ...current, profileImageUrl: undefined }));
                  }}
                  type="file"
                />
                {errors.profileImageUrl ? (
                  <span className="mt-1 block text-xs font-bold text-red-600">
                    {errors.profileImageUrl}
                  </span>
                ) : null}
              </label>
              {previewUrl ? (
                <img alt="" className="mt-4 h-40 w-40 rounded-xl object-cover" src={previewUrl} />
              ) : null}
            </FormSection>

            <FormSection icon={UserRound} title="Basic Information">
              <div className="grid gap-4 md:grid-cols-2">
                <TextField
                  error={errors.fullName}
                  label="Full Name"
                  onChange={(value) => updateForm('fullName', value)}
                  placeholder="Enter full name in English or Arabic"
                  required
                  value={form.fullName}
                />
                <SelectField
                  error={errors.gender}
                  label="Gender"
                  onChange={(value) => updateForm('gender', value as OrphanGender)}
                  value={form.gender}
                >
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                </SelectField>
                <TextField
                  error={errors.dateOfBirth}
                  label="Date Of Birth"
                  onChange={(value) => updateForm('dateOfBirth', value)}
                  required
                  type="date"
                  value={form.dateOfBirth ?? ''}
                />
                <TextField
                  error={errors.ageEstimate}
                  label="Age Estimate"
                  onChange={(value) =>
                    updateForm('ageEstimate', value ? Number.parseInt(value, 10) : null)
                  }
                  placeholder="8"
                  type="number"
                  value={form.ageEstimate?.toString() ?? ''}
                />
                <TextField
                  error={errors.cityArea}
                  label="City / Area"
                  onChange={(value) => updateForm('cityArea', value)}
                  placeholder="Gaza"
                  required
                  value={form.cityArea ?? ''}
                />
                <TextField
                  label="Education Status"
                  onChange={(value) => updateForm('educationStatus', value)}
                  placeholder="Primary school"
                  value={form.educationStatus ?? ''}
                />
              </div>
              <TextArea
                className="mt-4"
                error={errors.backgroundSummary}
                label="Background Summary"
                onChange={(value) => updateForm('backgroundSummary', value)}
                placeholder="Donor-safe summary for review and profile download"
                value={form.backgroundSummary ?? ''}
              />
              <TextArea
                className="mt-4"
                error={errors.healthNotes}
                label="Health Notes"
                onChange={(value) => updateForm('healthNotes', value)}
                placeholder="Keep sensitive details minimal"
                value={form.healthNotes ?? ''}
              />
            </FormSection>

            <FormSection icon={UsersRound} title="Guardian / Caretaker">
              <div className="grid gap-4 md:grid-cols-2">
                <TextField
                  error={errors.guardianName}
                  label="Guardian Name"
                  onChange={(value) => updateGuardian('guardianName', value)}
                  required
                  value={form.guardian.guardianName}
                />
                <TextField
                  error={errors.guardianRelationship}
                  label="Relationship"
                  onChange={(value) => updateGuardian('relationship', value)}
                  placeholder="Mother, uncle, caretaker"
                  required
                  value={form.guardian.relationship}
                />
                <TextField
                  error={errors.guardianPhone}
                  label="Phone"
                  onChange={(value) => updateGuardian('phone', value)}
                  required
                  value={form.guardian.phone ?? ''}
                />
                <TextField
                  label="WhatsApp"
                  onChange={(value) => updateGuardian('whatsapp', value)}
                  value={form.guardian.whatsapp ?? ''}
                />
              </div>
              <TextArea
                className="mt-4"
                label="Address"
                onChange={(value) => updateGuardian('address', value)}
                value={form.guardian.address ?? ''}
              />
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
                <Save className="h-4 w-4" />
                {saving ? 'Saving...' : 'Save Orphan Profile'}
              </button>
              <Link
                className="inline-flex h-12 items-center justify-center gap-2 rounded-lg border border-emerald/10 bg-white px-5 text-sm font-bold text-emerald-deep transition hover:border-gold/45"
                href="/admin/orphans"
              >
                Cancel
                <NavLinkSpinner className="h-4 w-4" />
              </Link>
            </div>
          </form>
        </div>

        <aside className="space-y-5">
          <InfoCard title="Code rule">
            Use manual mode for existing codes below OR1100. Use auto mode for brand-new records.
          </InfoCard>
          <InfoCard title="Profile image">
            Every orphan profile requires an image URL before it can be saved.
          </InfoCard>
          <InfoCard title="Approval">
            Draft profiles can be submitted and approved after required public fields are complete.
          </InfoCard>
        </aside>
      </div>
    </>
  );
}

function CodeModeButton({
  active,
  description,
  label,
  onClick,
}: {
  active: boolean;
  description: string;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      className={cn(
        'rounded-lg border px-4 py-3 text-left transition',
        active
          ? 'border-gold bg-gold/12 shadow-[0_14px_30px_-24px_rgba(0,0,0,0.8)]'
          : 'border-emerald/10 bg-white hover:border-gold/45',
      )}
      onClick={onClick}
      type="button"
    >
      <span className="block text-sm font-black text-emerald-deep">{label}</span>
      <span className="mt-1 block text-xs font-semibold text-ink/65">{description}</span>
    </button>
  );
}

function FormSection({
  children,
  icon: Icon,
  title,
}: {
  children: React.ReactNode;
  icon: React.ElementType;
  title: string;
}) {
  return (
    <section className="border-b border-emerald/10 p-5 last:border-b-0">
      <h3 className="mb-5 flex items-center gap-2 font-display text-xl font-semibold text-emerald-deep">
        <Icon className="h-5 w-5 text-gold-deep" />
        {title}
      </h3>
      {children}
    </section>
  );
}

function TextField({
  className,
  error,
  label,
  onChange,
  placeholder,
  required = false,
  type = 'text',
  value,
}: {
  className?: string;
  error?: string;
  label: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  type?: string;
  value: string;
}) {
  return (
    <label className={cn('block', className)}>
      <span className="text-sm font-bold text-ink/72">
        {label}
        {required ? <span className="text-red-600"> *</span> : null}
      </span>
      <input
        className={cn(
          'mt-2 h-12 w-full rounded-lg border bg-white px-4 text-sm font-semibold text-ink outline-none transition focus:border-gold focus:ring-4 focus:ring-gold/15',
          error ? 'border-red-300' : 'border-emerald/10',
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

function SelectField({
  children,
  error,
  label,
  onChange,
  value,
}: {
  children: React.ReactNode;
  error?: string;
  label: string;
  onChange: (value: string) => void;
  value: string;
}) {
  return (
    <div className="block">
      <span className="text-sm font-bold text-ink/72">{label}</span>
      <div className="relative mt-2">
        <CustomSelect
          ariaLabel={label}
          onChange={onChange}
          triggerClassName={cn(
            'h-12 px-4 text-ink',
            error ? 'border-red-300' : 'border-emerald/10',
          )}
          value={value}
        >
          {children}
        </CustomSelect>
      </div>
      {error ? <span className="mt-1 block text-xs font-bold text-red-600">{error}</span> : null}
    </div>
  );
}

function TextArea({
  className,
  error,
  label,
  onChange,
  placeholder,
  value,
}: {
  className?: string;
  error?: string;
  label: string;
  onChange: (value: string) => void;
  placeholder?: string;
  value: string;
}) {
  return (
    <label className={cn('block', className)}>
      <span className="text-sm font-bold text-ink/72">{label}</span>
      <textarea
        className={cn(
          'mt-2 min-h-28 w-full rounded-lg border bg-white px-4 py-3 text-sm font-semibold leading-relaxed text-ink outline-none transition focus:border-gold focus:ring-4 focus:ring-gold/15',
          error ? 'border-red-300' : 'border-emerald/10',
        )}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        value={value}
      />
      {error ? <span className="mt-1 block text-xs font-bold text-red-600">{error}</span> : null}
    </label>
  );
}

function InfoCard({ children, title }: { children: React.ReactNode; title: string }) {
  return (
    <div className="rounded-lg border border-gold/16 bg-offwhite p-4 shadow-soft">
      <p className="font-display text-lg font-semibold text-emerald-deep">{title}</p>
      <p className="mt-2 text-sm font-semibold leading-relaxed text-ink/68">{children}</p>
    </div>
  );
}

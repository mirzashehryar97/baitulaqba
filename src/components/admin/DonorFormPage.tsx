'use client';

import { useState } from 'react';

import Link from 'next/link';
import { useRouter } from 'next/navigation';

import {
  CheckCircle2,
  HeartHandshake,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  Save,
  UserRound,
} from 'lucide-react';

import BackLink from '@/components/ui/BackLink';
import { useConfirmation } from '@/components/ui/ConfirmationProvider';
import { CustomSelect } from '@/components/ui/CustomSelect';
import { NavLinkSpinner } from '@/components/ui/NavLinkIcon';
import { useToast } from '@/components/ui/ToastProvider';

import { cn } from '@/lib/utils';

import type { Donor, DonorInput, DonorPreferredContactMethod, DonorSource } from '@/types/accounts';

const donorSourceLabels: Record<DonorSource, string> = {
  admin_created: 'Admin Created',
  converted_request: 'Converted Request',
  email: 'Email',
  other: 'Other',
  phone: 'Phone',
  referral: 'Referral',
  whatsapp: 'WhatsApp',
};

const contactMethodLabels: Record<DonorPreferredContactMethod, string> = {
  email: 'Email',
  phone: 'Phone',
  whatsapp: 'WhatsApp',
};

export function DonorFormPage() {
  const router = useRouter();
  const toast = useToast();
  const confirm = useConfirmation();
  const [form, setForm] = useState<DonorInput>({
    active: true,
    address: '',
    cityCountry: '',
    donorSource: 'admin_created',
    email: '',
    fullName: '',
    notes: '',
    phone: '',
    preferredContactMethod: 'whatsapp',
  });
  const [errors, setErrors] = useState<Partial<Record<keyof DonorInput, string>>>({});
  const [serverError, setServerError] = useState('');
  const [saving, setSaving] = useState(false);

  const updateForm = <Key extends keyof DonorInput>(key: Key, value: DonorInput[Key]) => {
    setForm((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined }));
  };

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const confirmed = await confirm({
      confirmLabel: 'Create Donor',
      description: `Create a donor profile for ${form.fullName || 'this person'}.`,
      title: 'Create donor?',
    });

    if (!confirmed) return;

    setSaving(true);
    setServerError('');

    try {
      const response = await fetch('/api/admin/donors', {
        body: JSON.stringify(form),
        headers: { 'Content-Type': 'application/json' },
        method: 'POST',
      });
      const body = (await response.json().catch(() => null)) as {
        data?: Donor;
        error?: string;
        errors?: Partial<Record<keyof DonorInput, string>>;
      } | null;

      if (!response.ok || !body?.data) {
        setErrors(body?.errors ?? {});
        const message = body?.error ?? 'Could not save donor.';
        setServerError(message);
        toast({
          description: 'Please review the form and try again.',
          title: message,
          type: 'error',
        });
        return;
      }

      toast({
        description: `${body.data.fullName} was added to donor management.`,
        title: 'Donor created',
        type: 'success',
      });
      router.push(`/admin/donors/${body.data.id}`);
    } catch {
      const message = 'Could not save donor.';
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
        <BackLink href="/admin/donors" label="Back to Donors" />
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_24rem]">
        <div>
          <h2 className="font-display text-3xl font-semibold text-emerald-deep">Add Donor</h2>
          <p className="mt-1 text-base font-medium text-ink/70">
            Create a donor profile that can later be linked to Google login and sponsorships.
          </p>

          <form
            className="mt-6 overflow-hidden rounded-xl border border-gold/16 bg-offwhite shadow-soft"
            onSubmit={submit}
          >
            <FormSection icon={UserRound} title="Profile Information">
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
                  hint="Optional. Required for donor portal login."
                  label="Email Address"
                  onChange={(value) => updateForm('email', value)}
                  placeholder="name@example.com"
                  type="email"
                  value={form.email}
                />
                <TextField
                  error={errors.phone}
                  label="Phone Number"
                  onChange={(value) => updateForm('phone', value)}
                  placeholder="+92 300 1234567"
                  required
                  value={form.phone}
                />
                <TextField
                  error={errors.address}
                  label="Address"
                  onChange={(value) => updateForm('address', value)}
                  placeholder="House, street, area, city"
                  required
                  value={form.address}
                />
                <TextField
                  label="City / Country"
                  onChange={(value) => updateForm('cityCountry', value)}
                  placeholder="Karachi, Pakistan"
                  value={form.cityCountry ?? ''}
                />
              </div>
            </FormSection>

            <FormSection icon={MessageCircle} title="Contact And Source">
              <div className="grid gap-4 md:grid-cols-2">
                <SelectField
                  error={errors.preferredContactMethod}
                  label="Preferred Contact Method"
                  onChange={(value) =>
                    updateForm('preferredContactMethod', value as DonorPreferredContactMethod)
                  }
                  value={form.preferredContactMethod}
                >
                  {(Object.keys(contactMethodLabels) as DonorPreferredContactMethod[]).map(
                    (method) => (
                      <option key={method} value={method}>
                        {contactMethodLabels[method]}
                      </option>
                    ),
                  )}
                </SelectField>
                <SelectField
                  error={errors.donorSource}
                  label="Donor Source"
                  onChange={(value) => updateForm('donorSource', value as DonorSource)}
                  value={form.donorSource}
                >
                  {(Object.keys(donorSourceLabels) as DonorSource[])
                    .filter((source) => source !== 'converted_request')
                    .map((source) => (
                      <option key={source} value={source}>
                        {donorSourceLabels[source]}
                      </option>
                    ))}
                </SelectField>
              </div>
            </FormSection>

            <FormSection icon={HeartHandshake} title="Notes And Access">
              <label className="block">
                <span className="text-sm font-bold text-ink/72">Internal Notes</span>
                <textarea
                  className="mt-2 min-h-28 w-full rounded-lg border border-emerald/10 bg-white px-4 py-3 text-sm font-semibold leading-relaxed text-ink outline-none transition focus:border-gold focus:ring-4 focus:ring-gold/15"
                  onChange={(event) => updateForm('notes', event.target.value)}
                  placeholder="Private donor notes for the team"
                  value={form.notes ?? ''}
                />
                {errors.notes ? (
                  <span className="mt-1 block text-xs font-bold text-red-600">{errors.notes}</span>
                ) : null}
              </label>

              <button
                aria-pressed={form.active}
                className="mt-4 flex items-center gap-3 text-left"
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
                    Active donors can access the donor portal after Google login is linked.
                  </span>
                </span>
              </button>
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
                {saving ? 'Saving...' : 'Save Donor'}
              </button>
              <Link
                className="inline-flex h-12 items-center justify-center gap-2 rounded-lg border border-emerald/10 bg-white px-5 text-sm font-bold text-emerald-deep transition hover:border-gold/45"
                href="/admin/donors"
              >
                Cancel
                <NavLinkSpinner className="h-4 w-4" />
              </Link>
            </div>
          </form>
        </div>

        <aside className="space-y-5">
          <InfoCard icon={Mail} title="Google login email">
            Email is optional here. Donors sign in to the portal with Google using this email, so a
            donor added without one won't have portal access until you add it later.
          </InfoCard>
          <InfoCard icon={Phone} title="Contact preference">
            Preferred method helps support and sponsorship managers know how to follow up.
          </InfoCard>
          <InfoCard icon={MapPin} title="No orphan assignment yet">
            This phase creates the donor profile only. Matching a donor to an orphan comes later.
          </InfoCard>
        </aside>
      </div>
    </>
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
  error,
  hint,
  label,
  onChange,
  placeholder,
  required = false,
  type = 'text',
  value,
}: {
  error?: string;
  hint?: string;
  label: string;
  onChange: (value: string) => void;
  placeholder?: string;
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
          'mt-2 h-12 w-full rounded-lg border bg-white px-4 text-sm font-semibold text-ink outline-none transition focus:border-gold focus:ring-4 focus:ring-gold/15',
          error ? 'border-red-300' : 'border-emerald/10',
        )}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        type={type}
        value={value}
      />
      {error ? (
        <span className="mt-1 block text-xs font-bold text-red-600">{error}</span>
      ) : hint ? (
        <span className="mt-1 block text-xs font-medium text-ink/55">{hint}</span>
      ) : null}
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
    <div className="relative block">
      <span className="text-sm font-bold text-ink/72">
        {label}
        <span className="text-red-600"> *</span>
      </span>
      <CustomSelect
        ariaLabel={label}
        onChange={onChange}
        triggerClassName={cn(
          'mt-2 h-12 px-4 text-ink',
          error ? 'border-red-300' : 'border-emerald/10',
        )}
        value={value}
      >
        {children}
      </CustomSelect>
      {error ? <span className="mt-1 block text-xs font-bold text-red-600">{error}</span> : null}
    </div>
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
    <section className="rounded-xl border border-gold/16 bg-offwhite p-5 shadow-soft">
      <h3 className="flex items-center gap-2 font-display text-xl font-semibold text-emerald-deep">
        <Icon className="h-5 w-5 text-gold-deep" />
        {title}
      </h3>
      <p className="mt-3 text-base font-medium leading-relaxed text-ink/72">{children}</p>
      <CheckCircle2 className="mt-4 h-5 w-5 text-emerald-deep" />
    </section>
  );
}

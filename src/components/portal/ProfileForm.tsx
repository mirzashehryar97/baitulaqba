'use client';

import { useState } from 'react';

import { Save } from 'lucide-react';

import { useConfirmation } from '@/components/ui/ConfirmationProvider';
import { CustomSelect } from '@/components/ui/CustomSelect';
import { useToast } from '@/components/ui/ToastProvider';

import type { DonorPortalProfile } from '@/types/portal';

export function ProfileForm({ initialProfile }: { initialProfile: DonorPortalProfile }) {
  const toast = useToast();
  const confirm = useConfirmation();
  const [profile, setProfile] = useState(initialProfile);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const save = async () => {
    const confirmed = await confirm({
      confirmLabel: 'Save Profile',
      description: 'Update your donor portal contact details.',
      title: 'Save profile changes?',
    });

    if (!confirmed) return;

    setSaving(true);
    setErrors({});

    try {
      const response = await fetch('/api/portal/profile', {
        body: JSON.stringify({
          cityCountry: profile.cityCountry,
          fullName: profile.fullName,
          phone: profile.phone,
          preferredContactMethod: profile.preferredContactMethod,
        }),
        headers: { 'Content-Type': 'application/json' },
        method: 'PATCH',
      });
      const body = (await response.json().catch(() => null)) as {
        data?: DonorPortalProfile;
        error?: string;
        errors?: Record<string, string>;
      } | null;

      if (!response.ok || !body?.data) {
        setErrors(body?.errors ?? {});
        toast({
          description: body?.error ?? 'Please review your profile and try again.',
          title: 'Profile not saved',
          type: 'error',
        });
        return;
      }

      setProfile(body.data);
      toast({ title: 'Profile saved', type: 'success' });
    } catch {
      toast({
        description: 'Please check your connection and try again.',
        title: 'Profile not saved',
        type: 'error',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="max-w-full overflow-hidden rounded-xl border border-gold/16 bg-offwhite p-4 shadow-soft sm:p-5">
      <h1 className="font-display text-3xl font-semibold text-emerald-deep">Profile</h1>
      <p className="mt-2 text-sm font-semibold text-ink/65">
        Keep your contact details current for sponsorship follow-up.
      </p>

      <div className="mt-6 grid min-w-0 gap-5 md:grid-cols-2">
        <Field error={errors.fullName} label="Full name">
          <input
            className="h-12 w-full min-w-0 rounded-lg border border-emerald/10 bg-white px-3 text-sm font-bold outline-none focus:border-gold focus:ring-4 focus:ring-gold/15"
            onChange={(event) =>
              setProfile((current) => ({ ...current, fullName: event.target.value }))
            }
            value={profile.fullName}
          />
        </Field>
        <Field label="Email">
          <input
            className="h-12 w-full min-w-0 cursor-not-allowed rounded-lg border border-emerald/10 bg-cream/70 px-3 text-sm font-bold text-ink/60"
            disabled
            value={profile.email}
          />
        </Field>
        <Field error={errors.phone} label="Phone / WhatsApp">
          <input
            className="h-12 w-full min-w-0 rounded-lg border border-emerald/10 bg-white px-3 text-sm font-bold outline-none focus:border-gold focus:ring-4 focus:ring-gold/15"
            onChange={(event) =>
              setProfile((current) => ({ ...current, phone: event.target.value }))
            }
            value={profile.phone ?? ''}
          />
        </Field>
        <Field label="City / Country">
          <input
            className="h-12 w-full min-w-0 rounded-lg border border-emerald/10 bg-white px-3 text-sm font-bold outline-none focus:border-gold focus:ring-4 focus:ring-gold/15"
            onChange={(event) =>
              setProfile((current) => ({ ...current, cityCountry: event.target.value }))
            }
            value={profile.cityCountry ?? ''}
          />
        </Field>
        <Field error={errors.preferredContactMethod} label="Preferred contact method">
          <CustomSelect
            ariaLabel="Preferred contact method"
            onChange={(value) =>
              setProfile((current) => ({
                ...current,
                preferredContactMethod: value as DonorPortalProfile['preferredContactMethod'],
              }))
            }
            triggerClassName="h-12 text-emerald-deep"
            value={profile.preferredContactMethod}
          >
            <option value="whatsapp">WhatsApp</option>
            <option value="phone">Phone</option>
            <option value="email">Email</option>
          </CustomSelect>
        </Field>
      </div>

      <button
        className="mt-6 inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-emerald-deepest px-5 text-sm font-bold text-cream-soft transition hover:bg-emerald-deep disabled:cursor-wait disabled:opacity-60"
        disabled={saving}
        onClick={save}
        type="button"
      >
        <Save className="h-4 w-4" />
        {saving ? 'Saving...' : 'Save Profile'}
      </button>
    </section>
  );
}

function Field({
  children,
  error,
  label,
}: {
  children: React.ReactNode;
  error?: string;
  label: string;
}) {
  return (
    <div className="block min-w-0">
      <span className="text-sm font-bold text-ink/72">{label}</span>
      <div className="mt-2 min-w-0">{children}</div>
      {error ? <span className="mt-1 block text-xs font-bold text-red-600">{error}</span> : null}
    </div>
  );
}

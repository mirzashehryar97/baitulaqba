'use client';

import { useEffect, useMemo, useState } from 'react';

import Link from 'next/link';

import {
  BadgeCheck,
  Check,
  CheckCircle2,
  Clock3,
  ExternalLink,
  HeartHandshake,
  History,
  MapPin,
  MessageCircle,
  Pencil,
  ReceiptText,
  Save,
  TrendingUp,
  UserCheck,
  UserMinus,
  UserRound,
  UsersRound,
  WalletCards,
  X,
} from 'lucide-react';
import useSWR from 'swr';

import { useAdminAccount } from '@/components/admin/AdminShell';
import BackLink from '@/components/ui/BackLink';
import { useConfirmation } from '@/components/ui/ConfirmationProvider';
import { CustomSelect } from '@/components/ui/CustomSelect';
import { NavLinkIcon, NavLinkSpinner } from '@/components/ui/NavLinkIcon';
import { useToast } from '@/components/ui/ToastProvider';

import {
  canActivateDonors,
  canCreateDonorContactLogs,
  canDeactivateDonors,
  canUpdateDonors,
  canViewFinanceReceipts,
  canViewMatches,
  canViewMatchFinancialAmount,
  canViewOrphans,
} from '@/lib/adminPermissions';
import { fetchApiData } from '@/lib/apiFetcher';
import { formatCurrency } from '@/lib/currency';
import { cn } from '@/lib/utils';

import type { Donor, DonorInput, DonorPreferredContactMethod, DonorSource } from '@/types/accounts';
import type {
  DonorPaymentHistoryEntry,
  DonorPaymentHistoryStatus,
  DonorPaymentOverview,
} from '@/types/finance';
import type { SponsorshipMatch } from '@/types/matches';
import type {
  ContactLog,
  ContactLogDirection,
  ContactLogInput,
  ContactLogMethod,
  ContactLogOutcome,
  SponsorshipRequest,
} from '@/types/sponsorship';

type DonorDetailPayload = {
  contactLogs: ContactLog[];
  convertedRequests: SponsorshipRequest[];
  donor: Donor;
  matches: SponsorshipMatch[];
  paymentOverview: DonorPaymentOverview | null;
};

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

const contactLogMethodLabels: Record<ContactLogMethod, string> = {
  email: 'Email',
  in_person: 'In Person',
  other: 'Other',
  phone: 'Phone',
  sms: 'SMS',
  whatsapp: 'WhatsApp',
};

const directionLabels: Record<ContactLogDirection, string> = {
  inbound: 'Inbound',
  internal_note: 'Internal Note',
  outbound: 'Outbound',
};

const outcomeLabels: Record<ContactLogOutcome, string> = {
  converted: 'Converted',
  follow_up_needed: 'Follow-up Needed',
  logged: 'Logged',
  no_response: 'No Response',
  not_interested: 'Not Interested',
  reached: 'Reached',
};

const requestStatusLabels: Record<SponsorshipRequest['status'], string> = {
  closed: 'Closed',
  contacted: 'Contacted',
  converted_to_donor: 'Converted to donor',
  new: 'New request',
  profiles_prepared: 'Profiles prepared',
  profiles_shared: 'Profiles shared',
};

const matchStatusLabels: Record<SponsorshipMatch['status'], string> = {
  active: 'Active',
  ended: 'Ended',
  paused: 'Paused',
  voided: 'Voided',
};

const paymentStatusLabels: Record<DonorPaymentHistoryStatus, string> = {
  in_review: 'In review',
  overdue: 'Overdue',
  paid: 'Paid',
  partial: 'Partially paid',
  pending: 'Pending',
  rejected: 'Rejected',
};

const paymentStatusClasses: Record<DonorPaymentHistoryStatus, string> = {
  in_review: 'border-amber-200 bg-amber-50 text-amber-800',
  overdue: 'border-red-200 bg-red-50 text-red-700',
  paid: 'border-emerald-200 bg-emerald-50 text-emerald-800',
  partial: 'border-amber-200 bg-amber-50 text-amber-800',
  pending: 'border-[#d9ded8] bg-[#f8faf8] text-[#4b5563]',
  rejected: 'border-red-200 bg-red-50 text-red-700',
};

const surface =
  'rounded-xl border border-[#dfe5df] bg-white shadow-[0_14px_40px_-34px_rgba(17,24,39,0.45)]';
const primaryButton =
  'inline-flex items-center justify-center gap-2 rounded-lg border border-[#006b4f] bg-[#006b4f] font-semibold text-white shadow-sm transition hover:border-[#07543f] hover:bg-[#07543f] disabled:cursor-wait disabled:opacity-60';
const secondaryButton =
  'inline-flex items-center justify-center gap-2 rounded-lg border border-[#d9ded8] bg-white font-medium text-[#1f2937] shadow-sm transition hover:border-[#c8d0c7] hover:bg-[#f8faf8] disabled:cursor-wait disabled:opacity-60';

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

function formatDateOnly(value: string | null) {
  if (!value) return 'Not recorded';

  return new Intl.DateTimeFormat('en', {
    dateStyle: 'medium',
  }).format(new Date(value));
}

function formatMonth(value: string) {
  return new Intl.DateTimeFormat('en', {
    month: 'short',
    timeZone: 'UTC',
    year: 'numeric',
  }).format(new Date(`${value.slice(0, 7)}-01T00:00:00.000Z`));
}

function toDonorInput(donor: Donor): DonorInput {
  return {
    active: donor.active,
    address: donor.address ?? '',
    cityCountry: donor.cityCountry ?? '',
    donorSource: donor.donorSource,
    email: donor.email,
    fullName: donor.fullName,
    notes: donor.notes ?? '',
    phone: donor.phone ?? '',
    preferredContactMethod: donor.preferredContactMethod,
  };
}

export function DonorDetailPage({ initialPayload }: { initialPayload: DonorDetailPayload }) {
  const { teamMember } = useAdminAccount();
  const toast = useToast();
  const confirm = useConfirmation();
  const { data, isValidating, mutate } = useSWR<DonorDetailPayload>(
    `/api/admin/donors/${initialPayload.donor.id}`,
    fetchApiData,
    {
      dedupingInterval: 10_000,
      fallbackData: initialPayload,
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
    },
  );
  const payload = data ?? initialPayload;
  const donor = payload.donor;
  const canUpdate = canUpdateDonors(teamMember);
  const canActivate = canActivateDonors(teamMember);
  const canDeactivate = canDeactivateDonors(teamMember);
  const canCreateLogs = canCreateDonorContactLogs(teamMember);
  const canViewFinancials = canViewMatchFinancialAmount(teamMember);
  const canOpenReceipts = canViewFinanceReceipts(teamMember);
  const [form, setForm] = useState<DonorInput>(toDonorInput(donor));
  const [logForm, setLogForm] = useState<ContactLogInput>({
    contactMethod: donor.preferredContactMethod,
    direction: 'outbound',
    nextFollowUpAt: '',
    outcome: 'logged',
    summary: '',
  });
  const [errors, setErrors] = useState<Partial<Record<keyof DonorInput, string>>>({});
  const [logErrors, setLogErrors] = useState<Partial<Record<keyof ContactLogInput, string>>>({});
  const [serverError, setServerError] = useState('');
  const [saving, setSaving] = useState(false);
  const [savingLog, setSavingLog] = useState(false);
  const [profileEditorOpen, setProfileEditorOpen] = useState(false);
  const [contactEditorOpen, setContactEditorOpen] = useState(false);
  const [historyYear, setHistoryYear] = useState(
    payload.paymentOverview?.currentMonth.slice(0, 4) ?? String(new Date().getFullYear()),
  );
  const [historyStatus, setHistoryStatus] = useState('all');

  useEffect(() => {
    setForm(toDonorInput(donor));
  }, [donor]);

  const activeMatches = payload.matches.filter((match) => match.status === 'active');
  const currentMatches = payload.matches.filter(
    (match) => match.status === 'active' || match.status === 'paused',
  );
  const historicalMatches = payload.matches.filter(
    (match) => match.status === 'ended' || match.status === 'voided',
  );
  const monthlyCommitment = activeMatches.reduce((total, match) => total + match.monthlyAmount, 0);
  const currentPayment = payload.paymentOverview?.history.find(
    (entry) => entry.month === payload.paymentOverview?.currentMonth,
  );
  const currentExpected = currentPayment?.expectedAmount ?? monthlyCommitment;
  const currentPaid = currentPayment?.paidAmount ?? 0;
  const paymentProgress =
    currentExpected > 0 ? Math.min(100, (currentPaid / currentExpected) * 100) : 0;
  const yearOptions = useMemo(
    () =>
      Array.from(
        new Set((payload.paymentOverview?.history ?? []).map((entry) => entry.month.slice(0, 4))),
      ),
    [payload.paymentOverview?.history],
  );
  const visibleHistory = useMemo(
    () =>
      (payload.paymentOverview?.history ?? []).filter(
        (entry) =>
          entry.month.startsWith(historyYear) &&
          (historyStatus === 'all' || entry.status === historyStatus),
      ),
    [historyStatus, historyYear, payload.paymentOverview?.history],
  );

  const updateForm = <Key extends keyof DonorInput>(key: Key, value: DonorInput[Key]) => {
    setForm((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined }));
  };

  const updateLogForm = <Key extends keyof ContactLogInput>(
    key: Key,
    value: ContactLogInput[Key],
  ) => {
    setLogForm((current) => ({ ...current, [key]: value }));
    setLogErrors((current) => ({ ...current, [key]: undefined }));
  };

  const savePayload = async (payloadToSave: DonorInput) => {
    setSaving(true);
    setServerError('');

    try {
      const response = await fetch(`/api/admin/donors/${donor.id}`, {
        body: JSON.stringify(payloadToSave),
        headers: { 'Content-Type': 'application/json' },
        method: 'PATCH',
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
          description: 'Please review the donor profile and try again.',
          title: message,
          type: 'error',
        });
        return false;
      }

      await mutate((current) => {
        if (!current || !body.data) return current;
        return { ...current, donor: body.data };
      }, false);
      toast({
        description: `${body.data.fullName}'s donor profile was updated.`,
        title: 'Donor saved',
        type: 'success',
      });
      void mutate();
      return true;
    } catch {
      const message = 'Could not save donor.';
      setServerError(message);
      toast({
        description: 'Please check your connection and try again.',
        title: message,
        type: 'error',
      });
      return false;
    } finally {
      setSaving(false);
    }
  };

  const save = async (event?: React.FormEvent<HTMLFormElement>) => {
    event?.preventDefault();
    const confirmed = await confirm({
      confirmLabel: 'Save Donor',
      description: `Save profile changes for ${form.fullName || donor.fullName}.`,
      title: 'Save donor changes?',
    });

    if (!confirmed) return;

    if (await savePayload(form)) setProfileEditorOpen(false);
  };

  const confirmActiveChange = async (active: boolean) => {
    const confirmed = await confirm({
      confirmLabel: active ? 'Activate Donor' : 'Deactivate Donor',
      description: active
        ? `Restore donor portal access for ${donor.fullName}.`
        : `Pause donor portal access for ${donor.fullName}.`,
      title: active ? 'Activate donor?' : 'Deactivate donor?',
      variant: active ? 'default' : 'destructive',
    });

    if (!confirmed) return;

    const previousForm = form;
    const nextForm = { ...form, active };
    setForm(nextForm);

    if (!(await savePayload(nextForm))) setForm(previousForm);
  };

  const saveContactLog = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const confirmed = await confirm({
      confirmLabel: 'Save Contact Log',
      description: `Add this contact log to ${donor.fullName}'s donor record.`,
      title: 'Save contact log?',
    });

    if (!confirmed) return;

    setSavingLog(true);

    try {
      const response = await fetch(`/api/admin/donors/${donor.id}/contact-logs`, {
        body: JSON.stringify(logForm),
        headers: { 'Content-Type': 'application/json' },
        method: 'POST',
      });
      const body = (await response.json().catch(() => null)) as {
        data?: ContactLog;
        error?: string;
        errors?: Partial<Record<keyof ContactLogInput, string>>;
      } | null;

      if (!response.ok || !body?.data) {
        setLogErrors(body?.errors ?? {});
        toast({
          description: body?.error ?? 'Please review the contact log and try again.',
          title: 'Contact log failed',
          type: 'error',
        });
        return;
      }

      await mutate((current) => {
        if (!current || !body.data) return current;
        return { ...current, contactLogs: [body.data, ...current.contactLogs] };
      }, false);
      setLogForm({
        contactMethod: donor.preferredContactMethod,
        direction: 'outbound',
        nextFollowUpAt: '',
        outcome: 'logged',
        summary: '',
      });
      setContactEditorOpen(false);
      toast({
        description: 'The donor contact history has been updated.',
        title: 'Contact log saved',
        type: 'success',
      });
      void mutate();
    } catch {
      toast({
        description: 'Please check your connection and try again.',
        title: 'Contact log failed',
        type: 'error',
      });
    } finally {
      setSavingLog(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <BackLink href="/admin/donors" label="Back to Donors" />
        {isValidating ? (
          <span className="rounded-full border border-[#ead7a2] bg-[#fff8e7] px-2.5 py-1 text-xs font-semibold text-[#8a6100]">
            Syncing
          </span>
        ) : null}
      </div>

      <section className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 items-center gap-4">
          <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-[#043d31] text-2xl font-bold text-white shadow-sm">
            {getInitials(donor.fullName) || 'D'}
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-3xl font-semibold tracking-[-0.025em] text-[#111827] sm:text-4xl">
                {donor.fullName}
              </h1>
              <DonorStatusBadge donor={donor} />
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-sm text-[#6b7280]">
              <span>{donor.email}</span>
              <span aria-hidden="true">·</span>
              <span>{donor.phone || 'No phone added'}</span>
              <span aria-hidden="true">·</span>
              <span>{donor.cityCountry || 'Location not added'}</span>
            </div>
            <p className="mt-2 text-sm text-[#6b7280]">
              {donorSourceLabels[donor.donorSource]} · Donor since {formatDateOnly(donor.createdAt)}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {canCreateLogs ? (
            <button
              className={cn(secondaryButton, 'h-10 px-4 text-sm')}
              onClick={() => setContactEditorOpen((open) => !open)}
              type="button"
            >
              <MessageCircle className="h-4 w-4" />
              Log Contact
            </button>
          ) : null}
          {canUpdate ? (
            <button
              className={cn(primaryButton, 'h-10 px-4 text-sm')}
              onClick={() => setProfileEditorOpen((open) => !open)}
              type="button"
            >
              <Pencil className="h-4 w-4" />
              Edit Profile
            </button>
          ) : null}
        </div>
      </section>

      {profileEditorOpen ? (
        <ProfileEditor
          activeButtonAllowed={form.active ? canDeactivate : canActivate}
          donor={donor}
          errors={errors}
          form={form}
          onActiveChange={confirmActiveChange}
          onChange={updateForm}
          onClose={() => setProfileEditorOpen(false)}
          onSave={save}
          saving={saving}
          serverError={serverError}
        />
      ) : null}

      {contactEditorOpen ? (
        <ContactLogEditor
          errors={logErrors}
          form={logForm}
          onChange={updateLogForm}
          onClose={() => setContactEditorOpen(false)}
          onSave={saveContactLog}
          saving={savingLog}
        />
      ) : null}

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          accent
          icon={UsersRound}
          label="Active Sponsorships"
          value={String(activeMatches.length)}
        />
        <MetricCard
          icon={WalletCards}
          label="Monthly Commitment"
          value={canViewFinancials ? formatCurrency(monthlyCommitment) : 'Restricted'}
        />
        <MetricCard
          icon={CheckCircle2}
          label="Paid This Month"
          value={canViewFinancials ? formatCurrency(currentPaid) : 'Restricted'}
        />
        <MetricCard
          icon={TrendingUp}
          label="Payment Streak"
          value={
            canViewFinancials
              ? `${payload.paymentOverview?.paymentStreak ?? 0} ${
                  payload.paymentOverview?.paymentStreak === 1 ? 'month' : 'months'
                }`
              : 'Restricted'
          }
        />
      </section>

      <div className="grid gap-5 2xl:grid-cols-[minmax(0,1.75fr)_minmax(20rem,0.8fr)]">
        <main className="min-w-0 space-y-5">
          <section className={surface}>
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#e8ece8] px-4 py-3.5 sm:px-5">
              <div>
                <h2 className="text-lg font-semibold text-[#111827]">
                  Supported Orphans ({currentMatches.length})
                </h2>
                <p className="mt-0.5 text-sm text-[#6b7280]">
                  Current active and paused sponsorship relationships.
                </p>
              </div>
              {canViewMatches(teamMember) ? (
                <Link
                  className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#006b4f] hover:underline"
                  href={`/admin/matches?donorId=${donor.id}`}
                >
                  View all matches
                  <NavLinkIcon className="h-3.5 w-3.5" icon={ExternalLink} />
                </Link>
              ) : null}
            </div>

            <div className="space-y-2.5 p-3 sm:p-4">
              {currentMatches.length > 0 ? (
                currentMatches.map((match) => (
                  <SupportedOrphanRow
                    canOpenOrphan={canViewOrphans(teamMember)}
                    canViewFinancials={canViewFinancials}
                    key={match.id}
                    match={match}
                  />
                ))
              ) : (
                <EmptyState
                  description="Create a sponsorship match to connect this donor with an approved orphan profile."
                  icon={HeartHandshake}
                  title="No current sponsorships"
                />
              )}
            </div>
          </section>

          <section className={surface}>
            <div className="flex flex-col gap-3 border-b border-[#e8ece8] px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:px-5">
              <div>
                <h2 className="text-lg font-semibold text-[#111827]">Monthly Payment History</h2>
                <p className="mt-0.5 text-sm text-[#6b7280]">
                  Expected versus verified contributions across all sponsorships.
                </p>
              </div>
              {canViewFinancials ? (
                <div className="flex flex-wrap items-center gap-2">
                  <CustomSelect
                    ariaLabel="Payment history year"
                    onChange={setHistoryYear}
                    options={(yearOptions.length > 0 ? yearOptions : [historyYear]).map((year) => ({
                      label: year,
                      value: year,
                    }))}
                    triggerClassName="h-9 min-w-24 border-[#d9ded8] px-3 text-sm"
                    value={historyYear}
                  />
                  <CustomSelect
                    ariaLabel="Payment history status"
                    onChange={setHistoryStatus}
                    options={[
                      { label: 'All statuses', value: 'all' },
                      ...Object.entries(paymentStatusLabels).map(([value, label]) => ({
                        label,
                        value,
                      })),
                    ]}
                    triggerClassName="h-9 min-w-36 border-[#d9ded8] px-3 text-sm"
                    value={historyStatus}
                  />
                  {canOpenReceipts ? (
                    <Link
                      className={cn(secondaryButton, 'h-9 px-3 text-sm')}
                      href="/admin/receipts"
                    >
                      <NavLinkIcon className="h-4 w-4" icon={ReceiptText} />
                      Open Receipts
                    </Link>
                  ) : null}
                </div>
              ) : null}
            </div>

            {canViewFinancials ? (
              <PaymentHistoryTable canOpenReceipts={canOpenReceipts} entries={visibleHistory} />
            ) : (
              <EmptyState
                description="This role can view the donor and sponsorship relationships, but not financial amounts or payment history."
                icon={WalletCards}
                title="Financial details restricted"
              />
            )}
          </section>
        </main>

        <aside className="min-w-0 space-y-5">
          <CurrentMonthCard
            canViewFinancials={canViewFinancials}
            currentExpected={currentExpected}
            currentMatches={activeMatches}
            currentPaid={currentPaid}
            currentPayment={currentPayment}
            month={payload.paymentOverview?.currentMonth ?? new Date().toISOString()}
            progress={paymentProgress}
          />

          <section className={surface}>
            <div className="border-b border-[#e8ece8] px-4 py-3.5">
              <h2 className="text-lg font-semibold text-[#111827]">Donor Details</h2>
            </div>
            <div className="divide-y divide-[#edf0ed] px-4">
              <DetailRow
                icon={MessageCircle}
                label="Preferred Contact"
                value={contactMethodLabels[donor.preferredContactMethod]}
              />
              <DetailRow
                icon={HeartHandshake}
                label="Donor Source"
                value={donorSourceLabels[donor.donorSource]}
              />
              <DetailRow
                icon={BadgeCheck}
                label="Google Login"
                value={donor.authUserId ? 'Linked' : 'Pending'}
              />
              <DetailRow
                icon={Clock3}
                label="Last Contact"
                value={
                  payload.contactLogs[0]
                    ? formatDateOnly(payload.contactLogs[0].createdAt)
                    : 'None yet'
                }
              />
            </div>
            {canUpdate ? (
              <button
                className="flex w-full items-center gap-2 border-t border-[#e8ece8] px-4 py-3 text-left text-sm font-semibold text-[#006b4f] transition hover:bg-[#f8faf8]"
                onClick={() => setProfileEditorOpen(true)}
                type="button"
              >
                <Pencil className="h-4 w-4" />
                Edit full profile details
              </button>
            ) : null}
          </section>

          <RecentActivity
            contactLogs={payload.contactLogs}
            currentPayment={currentPayment}
            matches={payload.matches}
          />
        </aside>
      </div>

      <AdministrativeRecords
        canOpenOrphans={canViewOrphans(teamMember)}
        contactLogs={payload.contactLogs}
        convertedRequests={payload.convertedRequests}
        donor={donor}
        historicalMatches={historicalMatches}
      />
    </div>
  );
}

function MetricCard({
  accent = false,
  icon: Icon,
  label,
  value,
}: {
  accent?: boolean;
  icon: typeof UsersRound;
  label: string;
  value: string;
}) {
  return (
    <article
      className={cn(
        surface,
        'flex min-h-24 items-center gap-3.5 px-4 py-4',
        accent && 'border-[#e7c36b] bg-[#fffbf2]',
      )}
    >
      <span
        className={cn(
          'flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-[#dbe7df] bg-[#f2f8f4] text-[#075b43]',
          accent && 'border-[#edcf83] bg-white text-[#b57b00]',
        )}
      >
        <Icon className="h-5.5 w-5.5" strokeWidth={1.8} />
      </span>
      <div className="min-w-0">
        <p className="text-xs font-medium text-[#6b7280] sm:text-sm">{label}</p>
        <p className="mt-1 truncate text-xl font-semibold tracking-[-0.02em] text-[#111827] sm:text-2xl">
          {value}
        </p>
      </div>
    </article>
  );
}

function SupportedOrphanRow({
  canOpenOrphan,
  canViewFinancials,
  match,
}: {
  canOpenOrphan: boolean;
  canViewFinancials: boolean;
  match: SponsorshipMatch;
}) {
  const orphan = match.orphan;

  return (
    <article className="grid gap-3 rounded-lg border border-[#e3e8e3] bg-white p-3.5 transition hover:border-[#cad8cd] sm:grid-cols-[minmax(0,1.35fr)_auto_minmax(10rem,0.75fr)_auto] sm:items-center">
      <div className="flex min-w-0 items-center gap-3">
        {orphan?.profileImageUrl ? (
          <img
            alt=""
            className="h-12 w-12 shrink-0 rounded-full object-cover ring-1 ring-[#dfe5df]"
            src={orphan.profileImageUrl}
          />
        ) : (
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100">
            <UserRound className="h-5 w-5" />
          </span>
        )}
        <div className="min-w-0">
          <p className="truncate font-semibold text-[#111827]">
            {orphan?.fullName ?? 'Orphan profile'}
          </p>
          <p className="mt-0.5 text-xs font-medium text-[#6b7280]">
            {orphan?.orphanCode ?? 'Code unavailable'}
          </p>
          <p className="mt-1 flex items-center gap-1 text-xs text-[#6b7280]">
            <MapPin className="h-3.5 w-3.5" />
            {orphan?.cityArea || 'Location not set'}
          </p>
        </div>
      </div>
      <MatchStatusBadge status={match.status} />
      <div>
        <p className="text-sm font-semibold text-[#111827]">
          {canViewFinancials
            ? `${formatCurrency(match.monthlyAmount)} / month`
            : 'Amount restricted'}
        </p>
        <p className="mt-1 text-xs text-[#6b7280]">Started {formatDateOnly(match.startedAt)}</p>
      </div>
      {canOpenOrphan ? (
        <Link
          className="inline-flex items-center gap-1 text-sm font-semibold text-[#006b4f] hover:underline"
          href={`/admin/orphans/${match.orphanId}`}
        >
          View Profile
          <NavLinkIcon className="h-3.5 w-3.5" icon={ExternalLink} />
        </Link>
      ) : null}
    </article>
  );
}

function PaymentHistoryTable({
  canOpenReceipts,
  entries,
}: {
  canOpenReceipts: boolean;
  entries: DonorPaymentHistoryEntry[];
}) {
  if (entries.length === 0) {
    return (
      <EmptyState
        description="No payment records match the selected year and status."
        icon={ReceiptText}
        title="No payment history found"
      />
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[46rem] text-left text-sm">
        <thead className="bg-[#f8faf8] text-xs font-semibold uppercase tracking-[0.04em] text-[#6b7280]">
          <tr>
            <th className="px-5 py-3">Month</th>
            <th className="px-3 py-3">Expected</th>
            <th className="px-3 py-3">Paid</th>
            <th className="px-3 py-3">Status</th>
            <th className="px-3 py-3">Payment Date</th>
            <th className="px-5 py-3 text-right">Receipt</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#edf0ed]">
          {entries.map((entry) => (
            <tr className="transition hover:bg-[#fbfcfb]" key={entry.month}>
              <td className="px-5 py-3.5 font-semibold text-[#111827]">
                {formatMonth(entry.month)}
              </td>
              <td className="px-3 py-3.5 font-medium text-[#374151]">
                {formatCurrency(entry.expectedAmount)}
              </td>
              <td className="px-3 py-3.5 font-medium text-[#374151]">
                {formatCurrency(entry.paidAmount)}
              </td>
              <td className="px-3 py-3.5">
                <PaymentStatusBadge status={entry.status} />
              </td>
              <td className="px-3 py-3.5 text-[#4b5563]">
                {entry.paymentDate ? formatDateOnly(entry.paymentDate) : '—'}
              </td>
              <td className="px-5 py-3.5 text-right">
                {entry.receiptIds.length === 1 && canOpenReceipts ? (
                  <Link
                    className="font-semibold text-[#006b4f] hover:underline"
                    href={`/admin/receipts/${entry.receiptIds[0]}`}
                  >
                    View
                    <NavLinkSpinner className="ml-1 h-3.5 w-3.5" />
                  </Link>
                ) : (
                  <span className="text-[#6b7280]">
                    {entry.receiptIds.length > 0
                      ? `${entry.receiptIds.length} receipt${entry.receiptIds.length === 1 ? '' : 's'}`
                      : '—'}
                  </span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="border-t border-[#e8ece8] px-5 py-3 text-xs text-[#6b7280]">
        Showing {entries.length} payment {entries.length === 1 ? 'month' : 'months'}
      </div>
    </div>
  );
}

function CurrentMonthCard({
  canViewFinancials,
  currentExpected,
  currentMatches,
  currentPaid,
  currentPayment,
  month,
  progress,
}: {
  canViewFinancials: boolean;
  currentExpected: number;
  currentMatches: SponsorshipMatch[];
  currentPaid: number;
  currentPayment?: DonorPaymentHistoryEntry;
  month: string;
  progress: number;
}) {
  const status = currentPayment?.status ?? 'pending';

  return (
    <section className={surface}>
      <div className="flex items-center justify-between gap-3 border-b border-[#e8ece8] px-4 py-3.5">
        <h2 className="text-lg font-semibold text-[#111827]">This Month</h2>
        <span className="text-sm font-medium text-[#4b5563]">{formatMonth(month)}</span>
      </div>
      {canViewFinancials ? (
        <>
          <div className="p-4">
            <div className="flex items-center gap-3.5">
              <span
                className={cn(
                  'flex h-16 w-16 shrink-0 items-center justify-center rounded-full border-4',
                  status === 'paid'
                    ? 'border-emerald-600 text-emerald-700'
                    : status === 'overdue' || status === 'rejected'
                      ? 'border-red-500 text-red-600'
                      : 'border-amber-400 text-amber-700',
                )}
              >
                {status === 'paid' ? <Check className="h-7 w-7" /> : <Clock3 className="h-6 w-6" />}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-xl font-semibold text-[#111827]">
                  {paymentStatusLabels[status]}
                </p>
                <p className="mt-1 text-sm text-[#4b5563]">
                  {formatCurrency(currentPaid)} of {formatCurrency(currentExpected)}
                </p>
                <div className="mt-3 flex items-center gap-2">
                  <span className="h-2 flex-1 overflow-hidden rounded-full bg-[#e8ece8]">
                    <span
                      className={cn(
                        'block h-full rounded-full',
                        status === 'paid' ? 'bg-emerald-600' : 'bg-amber-500',
                      )}
                      style={{ width: `${progress}%` }}
                    />
                  </span>
                  <span className="text-xs font-semibold text-[#4b5563]">
                    {Math.round(progress)}%
                  </span>
                </div>
              </div>
            </div>
          </div>
          <div className="divide-y divide-[#edf0ed] border-t border-[#e8ece8] px-4">
            {currentMatches.length > 0 ? (
              currentMatches.map((match) => (
                <div
                  className="flex items-center justify-between gap-3 py-2.5 text-sm"
                  key={match.id}
                >
                  <span className="min-w-0 truncate text-[#374151]">
                    {match.orphan?.fullName ?? 'Orphan profile'}
                  </span>
                  <span className="shrink-0 font-semibold text-[#111827]">
                    {formatCurrency(match.monthlyAmount)}
                  </span>
                </div>
              ))
            ) : (
              <p className="py-3 text-sm text-[#6b7280]">No current allocations.</p>
            )}
          </div>
        </>
      ) : (
        <div className="p-4 text-sm leading-relaxed text-[#6b7280]">
          Payment totals are restricted for this role.
        </div>
      )}
    </section>
  );
}

function DetailRow({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof MessageCircle;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3 py-3">
      <Icon className="h-4 w-4 shrink-0 text-[#075b43]" />
      <span className="min-w-0 flex-1 text-sm text-[#6b7280]">{label}</span>
      <span className="text-right text-sm font-medium text-[#374151]">{value}</span>
    </div>
  );
}

function RecentActivity({
  contactLogs,
  currentPayment,
  matches,
}: {
  contactLogs: ContactLog[];
  currentPayment?: DonorPaymentHistoryEntry;
  matches: SponsorshipMatch[];
}) {
  const latestMatch = [...matches].sort((left, right) =>
    right.createdAt.localeCompare(left.createdAt),
  )[0];

  return (
    <section className={surface}>
      <div className="border-b border-[#e8ece8] px-4 py-3.5">
        <h2 className="text-lg font-semibold text-[#111827]">Recent Activity</h2>
      </div>
      <div className="divide-y divide-[#edf0ed] px-4">
        {currentPayment?.paymentDate ? (
          <ActivityRow
            icon={CheckCircle2}
            label="Payment verified"
            value={formatDateOnly(currentPayment.paymentDate)}
          />
        ) : null}
        {contactLogs.slice(0, 2).map((log) => (
          <ActivityRow
            icon={MessageCircle}
            key={log.id}
            label={`${contactLogMethodLabels[log.contactMethod]} · ${outcomeLabels[log.outcome]}`}
            value={formatDateOnly(log.createdAt)}
          />
        ))}
        {latestMatch ? (
          <ActivityRow
            icon={HeartHandshake}
            label={`Match added · ${latestMatch.orphan?.fullName ?? 'Orphan profile'}`}
            value={formatDateOnly(latestMatch.createdAt)}
          />
        ) : null}
        {!currentPayment?.paymentDate && contactLogs.length === 0 && !latestMatch ? (
          <p className="py-5 text-sm text-[#6b7280]">No donor activity recorded yet.</p>
        ) : null}
      </div>
    </section>
  );
}

function ActivityRow({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof MessageCircle;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3 py-3">
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-700">
        <Icon className="h-3.5 w-3.5" />
      </span>
      <span className="min-w-0 flex-1 truncate text-sm font-medium text-[#374151]">{label}</span>
      <span className="shrink-0 text-xs text-[#6b7280]">{value}</span>
    </div>
  );
}

function AdministrativeRecords({
  canOpenOrphans,
  contactLogs,
  convertedRequests,
  donor,
  historicalMatches,
}: {
  canOpenOrphans: boolean;
  contactLogs: ContactLog[];
  convertedRequests: SponsorshipRequest[];
  donor: Donor;
  historicalMatches: SponsorshipMatch[];
}) {
  return (
    <details className={cn(surface, 'group overflow-hidden')}>
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-4 marker:hidden sm:px-5">
        <span className="flex items-center gap-2.5">
          <History className="h-5 w-5 text-[#075b43]" />
          <span>
            <span className="block font-semibold text-[#111827]">Administrative Records</span>
            <span className="mt-0.5 block text-sm font-normal text-[#6b7280]">
              Full contact history, linked requests, login metadata, and previous matches.
            </span>
          </span>
        </span>
        <span className="text-sm font-semibold text-[#006b4f] group-open:hidden">Show</span>
        <span className="hidden text-sm font-semibold text-[#006b4f] group-open:inline">Hide</span>
      </summary>

      <div className="grid gap-5 border-t border-[#e8ece8] bg-[#fbfcfb] p-4 xl:grid-cols-3 sm:p-5">
        <section className="rounded-lg border border-[#e3e8e3] bg-white p-4">
          <h3 className="font-semibold text-[#111827]">Account Metadata</h3>
          <dl className="mt-4 space-y-3 text-sm">
            <RecordPair label="Google login" value={donor.authUserId ? 'Linked' : 'Pending'} />
            <RecordPair label="Auth user ID" value={donor.authUserId ?? 'Not linked yet'} />
            <RecordPair
              label="Created by"
              value={donor.createdByTeamMember?.fullName ?? 'Not recorded'}
            />
            <RecordPair label="Last updated" value={formatDate(donor.updatedAt)} />
          </dl>
        </section>

        <section className="rounded-lg border border-[#e3e8e3] bg-white p-4">
          <h3 className="font-semibold text-[#111827]">Linked Requests</h3>
          <div className="mt-4 space-y-3">
            {convertedRequests.length > 0 ? (
              convertedRequests.map((request) => (
                <div className="rounded-lg border border-[#edf0ed] p-3" key={request.id}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-[#111827]">
                        {request.fullName}
                      </p>
                      <p className="mt-1 truncate text-xs text-[#6b7280]">{request.email}</p>
                    </div>
                    <span className="rounded-full bg-[#fff4d8] px-2 py-1 text-[0.68rem] font-semibold text-[#7a4b00]">
                      {requestStatusLabels[request.status]}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-[#6b7280]">No converted requests are linked.</p>
            )}
          </div>
        </section>

        <section className="rounded-lg border border-[#e3e8e3] bg-white p-4">
          <h3 className="font-semibold text-[#111827]">Previous Matches</h3>
          <div className="mt-4 space-y-3">
            {historicalMatches.length > 0 ? (
              historicalMatches.map((match) => (
                <div className="rounded-lg border border-[#edf0ed] p-3" key={match.id}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      {canOpenOrphans ? (
                        <Link
                          className="truncate text-sm font-semibold text-[#006b4f] hover:underline"
                          href={`/admin/orphans/${match.orphanId}`}
                        >
                          {match.orphan?.fullName ?? 'Orphan profile'}
                        </Link>
                      ) : (
                        <p className="truncate text-sm font-semibold text-[#111827]">
                          {match.orphan?.fullName ?? 'Orphan profile'}
                        </p>
                      )}
                      <p className="mt-1 text-xs text-[#6b7280]">
                        {formatDateOnly(match.startedAt)} – {formatDateOnly(match.endedAt)}
                      </p>
                    </div>
                    <MatchStatusBadge status={match.status} />
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-[#6b7280]">No previous matches.</p>
            )}
          </div>
        </section>

        <section className="rounded-lg border border-[#e3e8e3] bg-white p-4 xl:col-span-3">
          <h3 className="font-semibold text-[#111827]">Full Contact History</h3>
          <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {contactLogs.length > 0 ? (
              contactLogs.map((log) => (
                <article className="rounded-lg border border-[#edf0ed] p-3.5" key={log.id}>
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-sm font-semibold text-[#111827]">
                      {outcomeLabels[log.outcome]}
                    </p>
                    <span className="text-xs text-[#6b7280]">{formatDateOnly(log.createdAt)}</span>
                  </div>
                  <p className="mt-1 text-xs text-[#6b7280]">
                    {directionLabels[log.direction]} via {contactLogMethodLabels[log.contactMethod]}
                    {log.teamMember ? ` · ${log.teamMember.fullName}` : ''}
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-[#4b5563]">{log.summary}</p>
                </article>
              ))
            ) : (
              <p className="text-sm text-[#6b7280]">No donor contact history has been logged.</p>
            )}
          </div>
        </section>
      </div>
    </details>
  );
}

function RecordPair({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[7rem_minmax(0,1fr)] gap-3">
      <dt className="text-[#6b7280]">{label}</dt>
      <dd className="break-words font-medium text-[#374151]">{value}</dd>
    </div>
  );
}

function ProfileEditor({
  activeButtonAllowed,
  donor,
  errors,
  form,
  onActiveChange,
  onChange,
  onClose,
  onSave,
  saving,
  serverError,
}: {
  activeButtonAllowed: boolean;
  donor: Donor;
  errors: Partial<Record<keyof DonorInput, string>>;
  form: DonorInput;
  onActiveChange: (active: boolean) => void;
  onChange: <Key extends keyof DonorInput>(key: Key, value: DonorInput[Key]) => void;
  onClose: () => void;
  onSave: (event?: React.FormEvent<HTMLFormElement>) => void;
  saving: boolean;
  serverError: string;
}) {
  const ActiveChangeIcon = form.active ? UserMinus : UserCheck;

  return (
    <section className={surface}>
      <div className="flex items-center justify-between gap-3 border-b border-[#e8ece8] px-4 py-3.5 sm:px-5">
        <div>
          <h2 className="text-lg font-semibold text-[#111827]">Edit Donor Profile</h2>
          <p className="mt-0.5 text-sm text-[#6b7280]">Update contact and account information.</p>
        </div>
        <button
          aria-label="Close profile editor"
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#d9ded8] text-[#4b5563] transition hover:bg-[#f8faf8]"
          onClick={onClose}
          type="button"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      <form className="p-4 sm:p-5" onSubmit={onSave}>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <TextField
            error={errors.fullName}
            label="Full Name"
            onChange={(value) => onChange('fullName', value)}
            value={form.fullName}
          />
          <TextField
            disabled={Boolean(donor.authUserId)}
            error={errors.email}
            label="Email Address"
            onChange={(value) => onChange('email', value)}
            type="email"
            value={form.email}
          />
          <TextField
            error={errors.phone}
            label="Phone Number"
            onChange={(value) => onChange('phone', value)}
            value={form.phone ?? ''}
          />
          <TextField
            error={errors.address}
            label="Address"
            onChange={(value) => onChange('address', value)}
            value={form.address ?? ''}
          />
          <TextField
            label="City / Country"
            onChange={(value) => onChange('cityCountry', value)}
            value={form.cityCountry ?? ''}
          />
          <SelectField
            error={errors.preferredContactMethod}
            label="Preferred Contact"
            onChange={(value) =>
              onChange('preferredContactMethod', value as DonorPreferredContactMethod)
            }
            value={form.preferredContactMethod}
          >
            {(Object.keys(contactMethodLabels) as DonorPreferredContactMethod[]).map((method) => (
              <option key={method} value={method}>
                {contactMethodLabels[method]}
              </option>
            ))}
          </SelectField>
          <SelectField
            disabled={donor.donorSource === 'converted_request'}
            error={errors.donorSource}
            label="Donor Source"
            onChange={(value) => onChange('donorSource', value as DonorSource)}
            value={form.donorSource}
          >
            {(Object.keys(donorSourceLabels) as DonorSource[]).map((source) => (
              <option key={source} value={source}>
                {donorSourceLabels[source]}
              </option>
            ))}
          </SelectField>
          <label className="block md:col-span-2 xl:col-span-2">
            <span className="text-sm font-medium text-[#374151]">Internal Notes</span>
            <textarea
              className="mt-2 min-h-24 w-full rounded-lg border border-[#d8ded8] bg-white px-3.5 py-3 text-sm font-normal text-[#111827] outline-none transition placeholder:text-[#9ca3af] focus:border-[#0d6b50] focus:ring-4 focus:ring-emerald-700/10"
              onChange={(event) => onChange('notes', event.target.value)}
              value={form.notes ?? ''}
            />
            {errors.notes ? <FieldError>{errors.notes}</FieldError> : null}
          </label>
        </div>

        {donor.authUserId ? (
          <p className="mt-4 rounded-lg border border-[#ead7a2] bg-[#fff8e7] px-4 py-3 text-sm text-[#7a5a0a]">
            This donor has linked Google login. Their email is locked so portal access stays
            consistent.
          </p>
        ) : null}
        {serverError ? (
          <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            {serverError}
          </p>
        ) : null}

        <div className="mt-5 flex flex-col gap-2.5 border-t border-[#e8ece8] pt-4 sm:flex-row sm:items-center">
          <button
            className={cn(primaryButton, 'h-10 px-4 text-sm')}
            disabled={saving}
            type="submit"
          >
            <Save className="h-4 w-4" />
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
          <button
            className={cn(
              secondaryButton,
              'h-10 px-4 text-sm',
              form.active && 'border-red-200 text-red-700 hover:border-red-300 hover:bg-red-50',
            )}
            disabled={saving || !activeButtonAllowed}
            onClick={() => onActiveChange(!form.active)}
            type="button"
          >
            <ActiveChangeIcon className="h-4 w-4" />
            {form.active ? 'Deactivate Donor' : 'Activate Donor'}
          </button>
        </div>
      </form>
    </section>
  );
}

function ContactLogEditor({
  errors,
  form,
  onChange,
  onClose,
  onSave,
  saving,
}: {
  errors: Partial<Record<keyof ContactLogInput, string>>;
  form: ContactLogInput;
  onChange: <Key extends keyof ContactLogInput>(key: Key, value: ContactLogInput[Key]) => void;
  onClose: () => void;
  onSave: (event: React.FormEvent<HTMLFormElement>) => void;
  saving: boolean;
}) {
  return (
    <section className={surface}>
      <div className="flex items-center justify-between gap-3 border-b border-[#e8ece8] px-4 py-3.5 sm:px-5">
        <div>
          <h2 className="text-lg font-semibold text-[#111827]">Log Donor Contact</h2>
          <p className="mt-0.5 text-sm text-[#6b7280]">Record a conversation or follow-up.</p>
        </div>
        <button
          aria-label="Close contact log editor"
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#d9ded8] text-[#4b5563] transition hover:bg-[#f8faf8]"
          onClick={onClose}
          type="button"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      <form className="grid gap-4 p-4 md:grid-cols-2 xl:grid-cols-4 sm:p-5" onSubmit={onSave}>
        <SelectField
          error={errors.contactMethod}
          label="Contact Method"
          onChange={(value) => onChange('contactMethod', value as ContactLogMethod)}
          value={form.contactMethod}
        >
          {(Object.keys(contactLogMethodLabels) as ContactLogMethod[]).map((method) => (
            <option key={method} value={method}>
              {contactLogMethodLabels[method]}
            </option>
          ))}
        </SelectField>
        <SelectField
          error={errors.direction}
          label="Direction"
          onChange={(value) => onChange('direction', value as ContactLogDirection)}
          value={form.direction}
        >
          {(Object.keys(directionLabels) as ContactLogDirection[]).map((direction) => (
            <option key={direction} value={direction}>
              {directionLabels[direction]}
            </option>
          ))}
        </SelectField>
        <SelectField
          error={errors.outcome}
          label="Outcome"
          onChange={(value) => onChange('outcome', value as ContactLogOutcome)}
          value={form.outcome}
        >
          {(Object.keys(outcomeLabels) as ContactLogOutcome[]).map((outcome) => (
            <option key={outcome} value={outcome}>
              {outcomeLabels[outcome]}
            </option>
          ))}
        </SelectField>
        <TextField
          error={errors.nextFollowUpAt}
          label="Next Follow-up"
          onChange={(value) => onChange('nextFollowUpAt', value)}
          type="datetime-local"
          value={form.nextFollowUpAt ?? ''}
        />
        <label className="block md:col-span-2 xl:col-span-4">
          <span className="text-sm font-medium text-[#374151]">Summary</span>
          <textarea
            className={cn(
              'mt-2 min-h-24 w-full rounded-lg border bg-white px-3.5 py-3 text-sm font-normal text-[#111827] outline-none transition placeholder:text-[#9ca3af] focus:ring-4 focus:ring-emerald-700/10',
              errors.summary ? 'border-red-300' : 'border-[#d8ded8] focus:border-[#0d6b50]',
            )}
            onChange={(event) => onChange('summary', event.target.value)}
            placeholder="What happened during this donor conversation?"
            value={form.summary}
          />
          {errors.summary ? <FieldError>{errors.summary}</FieldError> : null}
        </label>
        <button
          className={cn(primaryButton, 'h-10 px-4 text-sm md:w-max')}
          disabled={saving}
          type="submit"
        >
          <Save className="h-4 w-4" />
          {saving ? 'Saving...' : 'Save Contact Log'}
        </button>
      </form>
    </section>
  );
}

function DonorStatusBadge({ donor }: { donor: Donor }) {
  if (!donor.active) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-red-200 bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-700">
        <UserMinus className="h-3.5 w-3.5" />
        Inactive
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-800">
      <CheckCircle2 className="h-3.5 w-3.5" />
      Active
    </span>
  );
}

function MatchStatusBadge({ status }: { status: SponsorshipMatch['status'] }) {
  return (
    <span
      className={cn(
        'inline-flex w-max items-center rounded-full border px-2.5 py-1 text-xs font-semibold',
        status === 'active' && 'border-emerald-200 bg-emerald-50 text-emerald-800',
        status === 'paused' && 'border-amber-200 bg-amber-50 text-amber-800',
        status === 'ended' && 'border-[#d9ded8] bg-white text-[#4b5563]',
        status === 'voided' && 'border-red-200 bg-red-50 text-red-700',
      )}
    >
      {matchStatusLabels[status]}
    </span>
  );
}

function PaymentStatusBadge({ status }: { status: DonorPaymentHistoryStatus }) {
  return (
    <span
      className={cn(
        'inline-flex w-max items-center rounded-full border px-2.5 py-1 text-xs font-semibold',
        paymentStatusClasses[status],
      )}
    >
      {paymentStatusLabels[status]}
    </span>
  );
}

function EmptyState({
  description,
  icon: Icon,
  title,
}: {
  description: string;
  icon: typeof HeartHandshake;
  title: string;
}) {
  return (
    <div className="m-4 flex flex-col items-center justify-center rounded-lg border border-dashed border-[#cfd8d0] bg-[#fbfcfb] px-5 py-10 text-center">
      <span className="flex h-11 w-11 items-center justify-center rounded-full bg-emerald-50 text-emerald-700">
        <Icon className="h-5 w-5" />
      </span>
      <p className="mt-3 font-semibold text-[#111827]">{title}</p>
      <p className="mt-1 max-w-md text-sm leading-relaxed text-[#6b7280]">{description}</p>
    </div>
  );
}

function TextField({
  disabled = false,
  error,
  label,
  onChange,
  type = 'text',
  value,
}: {
  disabled?: boolean;
  error?: string;
  label: string;
  onChange: (value: string) => void;
  type?: string;
  value: string;
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-[#374151]">{label}</span>
      <input
        className={cn(
          'mt-2 h-10 w-full rounded-lg border bg-white px-3.5 text-sm font-normal text-[#111827] outline-none transition disabled:cursor-not-allowed disabled:bg-[#f3f4f3] disabled:text-[#6b7280] focus:ring-4 focus:ring-emerald-700/10',
          error ? 'border-red-300' : 'border-[#d8ded8] focus:border-[#0d6b50]',
        )}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        type={type}
        value={value}
      />
      {error ? <FieldError>{error}</FieldError> : null}
    </label>
  );
}

function SelectField({
  children,
  disabled = false,
  error,
  label,
  onChange,
  value,
}: {
  children: React.ReactNode;
  disabled?: boolean;
  error?: string;
  label: string;
  onChange: (value: string) => void;
  value: string;
}) {
  return (
    <div className="relative block">
      <span className="text-sm font-medium text-[#374151]">{label}</span>
      <CustomSelect
        ariaLabel={label}
        disabled={disabled}
        onChange={onChange}
        triggerClassName={cn(
          'mt-2 h-10 border-[#d8ded8] px-3.5 text-sm text-[#111827]',
          error && 'border-red-300',
        )}
        value={value}
      >
        {children}
      </CustomSelect>
      {error ? <FieldError>{error}</FieldError> : null}
    </div>
  );
}

function FieldError({ children }: { children: React.ReactNode }) {
  return <span className="mt-1 block text-xs font-medium text-red-600">{children}</span>;
}

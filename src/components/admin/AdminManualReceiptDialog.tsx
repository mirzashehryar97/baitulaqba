'use client';

import type React from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';

import { Check, ChevronDown, FilePlus2, Loader2, Search, X } from 'lucide-react';
import useSWR from 'swr';

import { useConfirmation } from '@/components/ui/ConfirmationProvider';
import { CustomSelect } from '@/components/ui/CustomSelect';
import { useToast } from '@/components/ui/ToastProvider';
import { workSurface } from '@/components/ui/work-surface';

import { fetchApiData } from '@/lib/apiFetcher';
import { APP_CURRENCY, formatCurrency } from '@/lib/currency';
import { cn } from '@/lib/utils';

import type {
  AdminManualReceiptMatch,
  AdminManualReceiptOptions,
  AdminReceipt,
} from '@/types/finance';

function monthInputValue(value: string) {
  return value.slice(0, 7);
}

function formatDate(value: string | null) {
  if (!value) return 'Open ended';
  return new Intl.DateTimeFormat('en', { dateStyle: 'medium' }).format(new Date(value));
}

function orphanLabel(match: AdminManualReceiptMatch) {
  return `${match.orphan.orphanCode} · ${match.orphan.fullName}`;
}

function matchCoversMonth(match: AdminManualReceiptMatch, monthValue: string) {
  if (!monthValue) return true;

  const selectedMonth = monthInputValue(monthValue);
  const startedMonth = monthInputValue(match.startedAt);
  const endedMonth = match.endedAt ? monthInputValue(match.endedAt) : null;

  return selectedMonth >= startedMonth && (!endedMonth || selectedMonth <= endedMonth);
}

type DonorWithMatches = {
  email: string;
  fullName: string;
  id: string;
  matches: AdminManualReceiptMatch[];
  phone: string | null;
};

type SearchableSelectOption = {
  label: string;
  sublabel?: string;
  value: string;
};

export function AdminManualReceiptDialog({
  onClose,
  onCreated,
  open,
}: {
  onClose: () => void;
  onCreated: (receipt: AdminReceipt) => Promise<void> | void;
  open: boolean;
}) {
  const toast = useToast();
  const confirm = useConfirmation();
  const [donorId, setDonorId] = useState('');
  const [matchId, setMatchId] = useState('');
  const [donationMonth, setDonationMonth] = useState('');
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState(APP_CURRENCY);
  const [bankAccountId, setBankAccountId] = useState('');
  const [transferDate, setTransferDate] = useState('');
  const [transferReference, setTransferReference] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [financeNotes, setFinanceNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const {
    data: options,
    error: loadError,
    isLoading,
  } = useSWR<AdminManualReceiptOptions>(
    open ? '/api/admin/receipts/manual-options' : null,
    fetchApiData,
    {
      dedupingInterval: 20_000,
      revalidateOnFocus: false,
    },
  );

  const donors = useMemo(() => {
    const donorMap = new Map<string, DonorWithMatches>();

    for (const match of options?.matches ?? []) {
      const existing = donorMap.get(match.donor.id);

      if (existing) {
        existing.matches.push(match);
        continue;
      }

      donorMap.set(match.donor.id, {
        email: match.donor.email,
        fullName: match.donor.fullName,
        id: match.donor.id,
        matches: [match],
        phone: match.donor.phone,
      });
    }

    return Array.from(donorMap.values()).sort((first, second) =>
      first.fullName.localeCompare(second.fullName),
    );
  }, [options?.matches]);
  const selectedDonor = donors.find((donor) => donor.id === donorId) ?? null;
  const donorMatches = useMemo(
    () => selectedDonor?.matches.filter((match) => matchCoversMonth(match, donationMonth)) ?? [],
    [donationMonth, selectedDonor],
  );
  const selectedMatch = donorMatches.find((match) => match.matchId === matchId) ?? null;
  const selectedBankAccount =
    options?.bankAccounts.find((account) => account.id === bankAccountId) ?? null;
  const donorOptions = useMemo(
    () =>
      donors.map((donor) => ({
        label: donor.fullName,
        sublabel: [
          donor.email,
          donor.phone,
          `${donor.matches.length} matched orphan${donor.matches.length === 1 ? '' : 's'}`,
        ]
          .filter(Boolean)
          .join(' · '),
        value: donor.id,
      })),
    [donors],
  );
  const orphanOptions = useMemo(
    () =>
      donorMatches.map((match) => ({
        label: orphanLabel(match),
        sublabel: `${formatCurrency(match.expectedAmount)} · ${match.status} · ${formatDate(
          match.startedAt,
        )} to ${formatDate(match.endedAt)}`,
        value: match.matchId,
      })),
    [donorMatches],
  );

  useEffect(() => {
    if (!open || !options) return;

    setDonorId('');
    setMatchId('');
    setDonationMonth(monthInputValue(options.currentMonth));
    setAmount('');
    setCurrency(APP_CURRENCY);
    setBankAccountId(options.bankAccounts[0]?.id ?? '');
    setTransferDate('');
    setTransferReference('');
    setFile(null);
    setFinanceNotes('');
    setErrors({});
  }, [open, options]);

  useEffect(() => {
    if (!matchId) return;

    if (donorMatches.some((match) => match.matchId === matchId)) {
      return;
    }

    setMatchId('');
    setAmount('');
  }, [donorMatches, matchId]);

  const changeDonor = (nextDonorId: string) => {
    setDonorId(nextDonorId);
    setMatchId('');
    setAmount('');
  };

  const changeMatch = (nextMatchId: string) => {
    const nextMatch = donorMatches.find((match) => match.matchId === nextMatchId) ?? null;

    setMatchId(nextMatchId);
    if (nextMatch) {
      setAmount(String(nextMatch.expectedAmount));
      setCurrency(APP_CURRENCY);
    } else {
      setAmount('');
    }
  };

  const submit = async () => {
    const confirmed = await confirm({
      confirmLabel: 'Create Receipt',
      description:
        'This will upload the receipt image and add it to the finance queue for the selected donor, orphan, and month.',
      title: 'Create manual receipt?',
    });

    if (!confirmed) return;

    setSaving(true);
    setErrors({});

    try {
      const formData = new FormData();
      formData.set('amount', amount);
      formData.set('currency', currency);
      formData.set('donationMonth', donationMonth ? `${donationMonth}-01` : '');
      formData.set('financeNotes', financeNotes);
      formData.set('organizationBankAccountId', bankAccountId);
      formData.set('sponsorshipMatchId', matchId);
      formData.set('transferDate', transferDate);
      formData.set('transferReference', transferReference);
      if (file) formData.set('file', file);

      const response = await fetch('/api/admin/receipts', {
        body: formData,
        method: 'POST',
      });
      const body = (await response.json().catch(() => null)) as {
        data?: AdminReceipt;
        error?: string;
        errors?: Record<string, string>;
      } | null;

      if (!response.ok || !body?.data) {
        setErrors(body?.errors ?? {});
        toast({
          description:
            body?.error ?? Object.values(body?.errors ?? {})[0] ?? 'Review the receipt details.',
          title: 'Receipt not created',
          type: 'error',
        });
        return;
      }

      toast({
        description: 'The receipt is ready for finance review.',
        title: 'Receipt created',
        type: 'success',
      });
      await onCreated(body.data);
      onClose();
    } catch {
      toast({
        description: 'Please check your connection and try again.',
        title: 'Receipt not created',
        type: 'error',
      });
    } finally {
      setSaving(false);
    }
  };

  if (!open) {
    return null;
  }

  return (
    <div
      aria-modal="true"
      className="fixed inset-0 z-[95] flex items-center justify-center bg-emerald-deepest/62 p-4 backdrop-blur-sm"
      role="dialog"
    >
      <button
        aria-label="Close receipt entry"
        className="absolute inset-0 cursor-default"
        disabled={saving}
        onClick={onClose}
        type="button"
      />
      <section className="relative flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-xl border border-gold/22 bg-offwhite shadow-[0_30px_90px_-35px_rgba(0,0,0,0.75)]">
        <div className="flex items-start justify-between gap-4 border-b border-emerald/10 p-5">
          <div>
            <p className="text-sm font-semibold text-ink/60">External Submission</p>
            <h2 className="mt-1 font-display text-2xl font-semibold text-emerald-deep">
              Enter Receipt
            </h2>
          </div>
          <button
            aria-label="Close receipt entry"
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-emerald/10 bg-white text-emerald-deep transition hover:bg-cream"
            disabled={saving}
            onClick={onClose}
            type="button"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="min-h-0 overflow-auto p-5">
          {isLoading ? (
            <div className="flex min-h-56 items-center justify-center gap-2 text-sm font-semibold text-emerald-deep">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading matches...
            </div>
          ) : loadError ? (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
              {loadError instanceof Error ? loadError.message : 'Could not load receipt options.'}
            </div>
          ) : (
            <div className="grid gap-4">
              <Field error={!donorId ? errors.sponsorshipMatchId : undefined} label="Donor">
                <SearchableSelect
                  ariaLabel="Donor"
                  disabled={!donorOptions.length}
                  emptyLabel="No matched donors found."
                  onChange={changeDonor}
                  options={donorOptions}
                  placeholder="Search donor by name, email, or phone..."
                  value={donorId}
                />
              </Field>

              {donorId ? (
                <Field error={errors.sponsorshipMatchId} label="Matched orphan">
                  <SearchableSelect
                    ariaLabel="Matched orphan"
                    disabled={!donorMatches.length}
                    emptyLabel="No matched orphans for this donor and month."
                    onChange={changeMatch}
                    options={orphanOptions}
                    placeholder="Search matched orphan..."
                    value={matchId}
                  />
                </Field>
              ) : null}

              {selectedMatch ? (
                <div className="grid gap-3 rounded-lg border border-[#dfe5df] bg-[#f8faf8] p-4 md:grid-cols-3">
                  <SummaryItem label="Donor" value={selectedMatch.donor.fullName} />
                  <SummaryItem
                    label="Orphan"
                    value={`${selectedMatch.orphan.orphanCode} ${selectedMatch.orphan.fullName}`}
                  />
                  <SummaryItem
                    label="Expected"
                    value={formatCurrency(selectedMatch.expectedAmount)}
                  />
                  <SummaryItem
                    label="Match dates"
                    value={`${formatDate(selectedMatch.startedAt)} to ${formatDate(
                      selectedMatch.endedAt,
                    )}`}
                  />
                  <SummaryItem label="Status" value={selectedMatch.status} />
                  <SummaryItem label="Contact" value={selectedMatch.donor.email} />
                </div>
              ) : null}

              <div className="grid gap-4 md:grid-cols-3">
                <Field error={errors.donationMonth} label="Donation month">
                  <input
                    className={cn(workSurface.field, 'h-12 w-full px-3')}
                    onChange={(event) => setDonationMonth(event.target.value)}
                    type="month"
                    value={donationMonth}
                  />
                </Field>
                <Field error={errors.amount} label="Amount received">
                  <input
                    className={cn(workSurface.field, 'h-12 w-full px-3')}
                    min="1"
                    onChange={(event) => setAmount(event.target.value)}
                    type="number"
                    value={amount}
                  />
                </Field>
                <Field error={errors.currency} label="Currency">
                  <input
                    className={cn(workSurface.field, 'h-12 w-full px-3 font-bold')}
                    readOnly
                    value={APP_CURRENCY}
                  />
                </Field>
              </div>

              <Field error={errors.organizationBankAccountId} label="Bank account received in">
                <CustomSelect
                  ariaLabel="Bank account received in"
                  onChange={setBankAccountId}
                  options={[
                    { label: 'Not specified', value: '' },
                    ...(options?.bankAccounts.map((account) => ({
                      label: `${account.accountLabel} -> ${account.bankName}`,
                      value: account.id,
                    })) ?? []),
                  ]}
                  triggerClassName="h-12 border-[#d8ded8] bg-white text-[#111827]"
                  value={bankAccountId}
                />
              </Field>

              {selectedBankAccount ? (
                <div className="rounded-lg border border-[#dfe5df] bg-white px-4 py-3 text-sm font-medium text-[#4b5563]">
                  <span className="font-semibold text-[#111827]">
                    {selectedBankAccount.accountTitle}
                  </span>{' '}
                  at {selectedBankAccount.bankName}
                </div>
              ) : null}

              <div className="grid gap-4 md:grid-cols-2">
                <Field error={errors.transferDate} label="Transfer date">
                  <input
                    className={cn(workSurface.field, 'h-12 w-full px-3')}
                    onChange={(event) => setTransferDate(event.target.value)}
                    type="date"
                    value={transferDate}
                  />
                </Field>
                <Field error={errors.transferReference} label="Transfer reference">
                  <input
                    className={cn(workSurface.field, 'h-12 w-full px-3')}
                    onChange={(event) => setTransferReference(event.target.value)}
                    placeholder="Transaction ID, Easypaisa ref, note..."
                    value={transferReference}
                  />
                </Field>
              </div>

              <Field error={errors.file} label="Receipt image">
                <input
                  accept="image/jpeg,image/png,image/webp"
                  className="block w-full min-w-0 cursor-pointer rounded-lg border border-[#d8ded8] bg-white px-3 py-3 text-sm font-normal text-[#111827] file:mr-3 file:cursor-pointer file:rounded-lg file:border-0 file:bg-[#006b4f] file:px-3 file:py-2 file:text-sm file:font-semibold file:text-white focus:border-[#0d6b50] focus:ring-4 focus:ring-emerald-700/10"
                  onChange={(event) => setFile(event.target.files?.[0] ?? null)}
                  type="file"
                />
                {file ? (
                  <p className="mt-2 text-xs font-semibold text-[#4b5563]">Selected: {file.name}</p>
                ) : null}
              </Field>

              <Field error={errors.financeNotes} label="Internal note">
                <textarea
                  className={cn(workSurface.field, 'min-h-24 w-full px-3 py-2.5')}
                  onChange={(event) => setFinanceNotes(event.target.value)}
                  placeholder="Where this receipt came from, admin context, follow-up notes..."
                  value={financeNotes}
                />
              </Field>

              {options?.matches.length === 0 ? (
                <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800">
                  No donor-orphan matches are available for receipt entry.
                </div>
              ) : null}
            </div>
          )}
        </div>

        <div className="flex flex-col-reverse gap-3 border-t border-emerald/10 p-5 sm:flex-row sm:justify-end">
          <button
            className="h-11 rounded-lg border border-emerald/10 bg-white px-4 text-sm font-bold text-emerald-deep"
            disabled={saving}
            onClick={onClose}
            type="button"
          >
            Cancel
          </button>
          <button
            className={cn(workSurface.primaryButton, 'h-11 px-5 text-sm')}
            disabled={saving || isLoading || !options?.matches.length}
            onClick={submit}
            type="button"
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <FilePlus2 className="h-4 w-4" />
            )}
            {saving ? 'Creating...' : 'Create Receipt'}
          </button>
        </div>
      </section>
    </div>
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
      <span className="text-sm font-medium text-[#111827]">{label}</span>
      <div className="mt-2 min-w-0">{children}</div>
      {error ? <span className="mt-1 block text-xs font-bold text-red-600">{error}</span> : null}
    </div>
  );
}

function SummaryItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <p className="text-xs font-semibold uppercase text-[#6b7280]">{label}</p>
      <p className="mt-1 truncate text-sm font-semibold text-[#111827]">{value}</p>
    </div>
  );
}

function SearchableSelect({
  ariaLabel,
  disabled = false,
  emptyLabel,
  onChange,
  options,
  placeholder,
  value,
}: {
  ariaLabel: string;
  disabled?: boolean;
  emptyLabel: string;
  onChange: (value: string) => void;
  options: SearchableSelectOption[];
  placeholder: string;
  value: string;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const selectedOption = options.find((option) => option.value === value) ?? null;
  const filteredOptions = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    if (!normalizedQuery) return options;

    return options.filter((option) =>
      `${option.label} ${option.sublabel ?? ''}`.toLowerCase().includes(normalizedQuery),
    );
  }, [options, query]);

  useEffect(() => {
    if (selectedOption) {
      setQuery(selectedOption.label);
      return;
    }

    if (!value && !open) {
      setQuery('');
    }
  }, [open, selectedOption, value]);

  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node;

      if (containerRef.current?.contains(target)) {
        return;
      }

      setOpen(false);
    };

    document.addEventListener('pointerdown', handlePointerDown);

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
    };
  }, [open]);

  return (
    <div className="relative" ref={containerRef}>
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6b7280]" />
        <input
          aria-expanded={open}
          aria-label={ariaLabel}
          className={cn(workSurface.field, 'h-12 w-full px-10')}
          disabled={disabled}
          onChange={(event) => {
            setQuery(event.target.value);
            setOpen(true);

            if (value) {
              onChange('');
            }
          }}
          onFocus={() => setOpen(true)}
          placeholder={placeholder}
          role="combobox"
          value={query}
        />
        <ChevronDown
          className={cn(
            'pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6b7280] transition',
            open ? 'rotate-180' : '',
          )}
        />
      </div>

      {open && !disabled ? (
        <div className="absolute z-[130] mt-2 max-h-72 w-full overflow-auto rounded-xl border border-gold/24 bg-white p-1.5 shadow-[0_22px_55px_-28px_rgba(7,39,29,0.7)]">
          {filteredOptions.length ? (
            filteredOptions.map((option) => {
              const selected = option.value === value;

              return (
                <button
                  aria-selected={selected}
                  className={cn(
                    'flex min-h-11 w-full items-start gap-2 rounded-lg px-2.5 py-2 text-left text-sm font-bold text-emerald-deep outline-none transition hover:bg-gold/12 focus:bg-gold/12',
                    selected ? 'bg-gold/18 text-emerald-deepest' : '',
                  )}
                  key={option.value}
                  onClick={() => {
                    onChange(option.value);
                    setQuery(option.label);
                    setOpen(false);
                  }}
                  role="option"
                  type="button"
                >
                  <Check
                    className={cn(
                      'mt-0.5 h-4 w-4 shrink-0 text-gold',
                      selected ? 'opacity-100' : 'opacity-0',
                    )}
                  />
                  <span className="min-w-0">
                    <span className="block truncate">{option.label}</span>
                    {option.sublabel ? (
                      <span className="mt-0.5 block truncate text-xs font-semibold text-[#6b7280]">
                        {option.sublabel}
                      </span>
                    ) : null}
                  </span>
                </button>
              );
            })
          ) : (
            <div className="px-3 py-3 text-sm font-semibold text-[#6b7280]">{emptyLabel}</div>
          )}
        </div>
      ) : null}
    </div>
  );
}

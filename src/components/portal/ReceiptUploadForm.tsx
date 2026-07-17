'use client';

import { useMemo, useState } from 'react';

import { useRouter, useSearchParams } from 'next/navigation';

import { FileUp } from 'lucide-react';

import { useConfirmation } from '@/components/ui/ConfirmationProvider';
import { CustomSelect } from '@/components/ui/CustomSelect';
import { useToast } from '@/components/ui/ToastProvider';
import { workSurface } from '@/components/ui/work-surface';

import { APP_CURRENCY } from '@/lib/currency';
import { cn } from '@/lib/utils';

import type { DonorPortalSponsorship, OrganizationBankAccount } from '@/types/portal';

function monthInputValue(value: string) {
  return value.slice(0, 7);
}

function getDonationMonthOptions(currentMonth: string) {
  const [year, month] = monthInputValue(currentMonth).split('-').map(Number);
  const startDate = new Date(year, month - 1, 1);

  return Array.from({ length: 12 }).map((_, index) => {
    const date = new Date(startDate.getFullYear(), startDate.getMonth() - index, 1);
    const value = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    const label = new Intl.DateTimeFormat('en', {
      month: 'long',
      year: 'numeric',
    }).format(date);

    return { label, value };
  });
}

export function ReceiptUploadForm({
  bankAccounts,
  currentMonth,
  sponsorships,
}: {
  bankAccounts: OrganizationBankAccount[];
  currentMonth: string;
  sponsorships: DonorPortalSponsorship[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const toast = useToast();
  const confirm = useConfirmation();
  const initialMatchId = searchParams.get('matchId') ?? sponsorships[0]?.matchId ?? '';
  const initialSponsorship = sponsorships.find((item) => item.matchId === initialMatchId);
  const [matchId, setMatchId] = useState(initialMatchId);
  const [amount, setAmount] = useState(String(initialSponsorship?.monthlyAmount ?? ''));
  const [donationMonth, setDonationMonth] = useState(monthInputValue(currentMonth));
  const [bankAccountId, setBankAccountId] = useState(bankAccounts[0]?.id ?? '');
  const [donorNote, setDonorNote] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const donationMonthOptions = useMemo(() => getDonationMonthOptions(currentMonth), [currentMonth]);
  const selectedBankAccount = bankAccounts.find((account) => account.id === bankAccountId) ?? null;

  const submit = async () => {
    const confirmed = await confirm({
      confirmLabel: 'Submit Receipt',
      description:
        'Upload this receipt for finance review. You can only replace it if finance rejects it.',
      title: 'Submit receipt?',
    });

    if (!confirmed) return;

    setSaving(true);
    setErrors({});

    const formData = new FormData();
    formData.set('sponsorshipMatchId', matchId);
    formData.set('amount', amount);
    formData.set('currency', APP_CURRENCY);
    formData.set('donationMonth', `${donationMonth}-01`);
    formData.set('organizationBankAccountId', bankAccountId);
    formData.set('donorNote', donorNote);
    if (file) formData.set('file', file);

    try {
      const response = await fetch('/api/portal/receipts', {
        body: formData,
        method: 'POST',
      });
      const body = (await response.json().catch(() => null)) as {
        error?: string;
        errors?: Record<string, string>;
      } | null;

      if (!response.ok) {
        setErrors(body?.errors ?? {});
        toast({
          description: body?.error ?? 'Please review the receipt details and try again.',
          title: 'Receipt not uploaded',
          type: 'error',
        });
        return;
      }

      toast({
        description: 'Your receipt is ready for admin review.',
        title: 'Receipt uploaded',
        type: 'success',
      });
      router.push('/portal/receipts');
      router.refresh();
    } catch {
      toast({
        description: 'Please check your connection and try again.',
        title: 'Receipt not uploaded',
        type: 'error',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <section
      className={cn(
        workSurface.card,
        'max-w-full overflow-hidden p-4 font-sans text-[#111827] sm:p-5',
      )}
    >
      <div>
        <h1 className={workSurface.title}>Upload Receipt</h1>
        <p className="mt-2 max-w-2xl text-sm font-normal leading-relaxed text-[#6b7280]">
          Upload one receipt per supported orphan each month. The regular upload window is the 1st
          through the 10th.
        </p>
      </div>

      <div className="mt-6 grid min-w-0 gap-5">
        <Field error={errors.sponsorshipMatchId} label="Sponsorship">
          <CustomSelect
            ariaLabel="Sponsorship"
            onChange={(value) => {
              const next = sponsorships.find((item) => item.matchId === value);
              setMatchId(value);
              if (next) {
                setAmount(String(next.monthlyAmount));
              }
            }}
            triggerClassName="h-12 border-[#d8ded8] bg-white text-[#111827]"
            value={matchId}
          >
            <option value="">Choose sponsorship</option>
            {sponsorships.map((sponsorship) => (
              <option key={sponsorship.matchId} value={sponsorship.matchId}>
                {sponsorship.orphan.orphanCode} · {sponsorship.orphan.fullName}
              </option>
            ))}
          </CustomSelect>
        </Field>

        <div className="grid min-w-0 gap-4 md:grid-cols-3">
          <Field error={errors.donationMonth} label="Donation month">
            <CustomSelect
              ariaLabel="Donation month"
              onChange={setDonationMonth}
              triggerClassName="h-12 border-[#d8ded8] bg-white text-[#111827]"
              value={donationMonth}
            >
              {donationMonthOptions.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </CustomSelect>
          </Field>
          <Field error={errors.amount} label="Amount">
            <input
              className={cn(workSurface.field, 'h-12 w-full min-w-0 px-3')}
              min="1"
              onChange={(event) => setAmount(event.target.value)}
              type="number"
              value={amount}
            />
          </Field>
          <Field error={errors.currency} label="Currency">
            <input
              className={cn(workSurface.field, 'h-12 w-full min-w-0 px-3 font-bold')}
              readOnly
              value={APP_CURRENCY}
            />
          </Field>
        </div>

        <Field error={errors.organizationBankAccountId} label="Bank account transferred to">
          <CustomSelect
            ariaLabel="Bank account"
            onChange={setBankAccountId}
            triggerClassName="h-12 border-[#d8ded8] bg-white text-[#111827]"
            value={bankAccountId}
          >
            <option value="">Choose bank account</option>
            {bankAccounts.map((account) => (
              <option key={account.id} value={account.id}>
                {account.accountLabel} · {account.bankName} · {account.accountTitle}
              </option>
            ))}
          </CustomSelect>
        </Field>

        {selectedBankAccount ? (
          <div className="grid min-w-0 gap-3 rounded-lg border border-[#dfe5df] bg-[#f8faf8] px-4 py-4">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase text-[#6b7280]">Title of account</p>
              <p className="mt-1 break-words text-lg font-semibold text-[#111827]">
                {selectedBankAccount.accountTitle}
              </p>
            </div>
            {selectedBankAccount.accountNumber ? (
              <BankDetail label="Account no" value={selectedBankAccount.accountNumber} />
            ) : null}
            {selectedBankAccount.iban ? (
              <BankDetail label="IBAN no" value={selectedBankAccount.iban} />
            ) : null}
            {selectedBankAccount.instructions ? (
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase text-[#6b7280]">Note</p>
                <p className="mt-1 max-w-2xl text-sm font-normal italic leading-relaxed text-[#4b5563]">
                  {selectedBankAccount.instructions}
                </p>
              </div>
            ) : null}
          </div>
        ) : null}

        <Field error={errors.file} label="Receipt file">
          <input
            accept="image/jpeg,image/png,image/webp"
            className="block w-full min-w-0 cursor-pointer rounded-lg border border-[#d8ded8] bg-white px-3 py-3 text-sm font-normal text-[#111827] file:mr-3 file:cursor-pointer file:rounded-lg file:border-0 file:bg-[#006b4f] file:px-3 file:py-2 file:text-sm file:font-semibold file:text-white focus:border-[#0d6b50] focus:ring-4 focus:ring-emerald-700/10"
            onChange={(event) => setFile(event.target.files?.[0] ?? null)}
            type="file"
          />
        </Field>

        <Field label="Note">
          <textarea
            className={cn(workSurface.field, 'min-h-28 w-full min-w-0 px-3 py-2.5')}
            onChange={(event) => setDonorNote(event.target.value)}
            value={donorNote}
          />
        </Field>

        <button
          className={cn(workSurface.primaryButton, 'h-12 w-full px-5 text-sm md:w-max')}
          disabled={saving || sponsorships.length === 0 || bankAccounts.length === 0}
          onClick={submit}
          type="button"
        >
          <FileUp className="h-4 w-4" />
          {saving ? 'Uploading...' : 'Submit Receipt'}
        </button>

        {bankAccounts.length === 0 ? (
          <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            No active bank accounts are configured yet. Please contact the team before uploading.
          </p>
        ) : null}
      </div>
    </section>
  );
}

function BankDetail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase text-[#6b7280]">{label}</p>
      <p className="mt-1 break-all font-mono text-sm font-semibold text-[#111827] sm:text-base">
        {value}
      </p>
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

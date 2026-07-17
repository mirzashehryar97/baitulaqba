'use client';

import { useMemo, useState } from 'react';

import Image from 'next/image';
import Link from 'next/link';

import {
  Archive,
  BadgeCheck,
  Banknote,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Download,
  ExternalLink,
  FilePlus2,
  FileText,
  HeartHandshake,
  LockKeyhole,
  Mail,
  MapPin,
  Pencil,
  Phone,
  ReceiptText,
  Save,
  School,
  Send,
  ShieldCheck,
  Stethoscope,
  UserRound,
  UsersRound,
  WalletCards,
} from 'lucide-react';
import useSWR from 'swr';

import { useAdminAccount } from '@/components/admin/AdminShell';
import BackLink from '@/components/ui/BackLink';
import { useConfirmation } from '@/components/ui/ConfirmationProvider';
import { CustomSelect } from '@/components/ui/CustomSelect';
import { NavLinkIcon, NavLinkSpinner } from '@/components/ui/NavLinkIcon';
import { useToast } from '@/components/ui/ToastProvider';
import { workflowStatus, workSurface } from '@/components/ui/work-surface';

import {
  canApproveOrphans,
  canArchiveOrphans,
  canDownloadOrphanProfilePdf,
  canSubmitOrphansForReview,
  canUpdateOrphans,
  canUploadOrphanDocuments,
  canUploadOrphanProfileImage,
  canViewOrphanDocuments,
} from '@/lib/adminPermissions';
import { fetchApiData } from '@/lib/apiFetcher';
import { formatCertificateNumber } from '@/lib/certificateNumber';
import { cn } from '@/lib/utils';

import type {
  OrphanPaymentRecord,
  OrphanSponsorshipMatchSummary,
  OrphanSponsorshipOverview,
} from '@/types/orphanSponsorship';
import type {
  Document,
  DocumentCategory,
  DocumentInput,
  OrphanGender,
  OrphanProfile,
  OrphanProfileStatus,
  OrphanProfileUpdate,
  OrphanVerificationStatus,
} from '@/types/orphans';
import type { DonorPortalReceiptStatus } from '@/types/portal';

const verificationLabels: Record<OrphanVerificationStatus, string> = {
  documents_received: 'Documents Received',
  field_verified: 'Field Verified',
  needs_more_information: 'Needs More Information',
  rejected: 'Rejected',
  unverified: 'Unverified',
};

const profileStatusLabels: Record<OrphanProfileStatus, string> = {
  approved: 'Approved',
  archived: 'Archived',
  draft: 'Draft',
  matched: 'Matched',
  under_review: 'Under Review',
};

const documentCategoryLabels: Record<DocumentCategory, string> = {
  birth_or_identity_document: 'Birth / Identity Document',
  donation_receipt: 'Donation Receipt',
  guardian_document: 'Guardian Document',
  medical_document: 'Medical Document',
  other: 'Other',
  profile_image: 'Profile Image',
  school_document: 'School Document',
  verification_photo: 'Verification Photo',
};

const receiptStatusLabels: Record<DonorPortalReceiptStatus, string> = {
  money_delivered: 'Verified',
  ready_for_review: 'Ready for Review',
  rejected: 'Rejected',
  reviewed: 'Reviewed',
  submitted: 'Submitted',
  verified: 'Verified',
};

const tabLabels = {
  overview: 'Overview',
  sponsorship: 'Sponsorship & Payments',
  documents: 'Documents',
  activity: 'Activity',
} as const;

type TabKey = keyof typeof tabLabels;
type PaymentFilter = 'all' | 'delivered' | 'in_review' | 'rejected' | 'verified';
type OrphanErrors = Partial<
  Record<keyof OrphanProfileUpdate | 'guardianName' | 'guardianRelationship', string>
>;

const surface = workSurface.card;
const paidStatuses = new Set<DonorPortalReceiptStatus>(['verified', 'money_delivered']);

function formatDate(value: string | null | undefined) {
  if (!value) return 'Not recorded';
  return new Intl.DateTimeFormat('en-PK', { dateStyle: 'medium' }).format(new Date(value));
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat('en-PK', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

function formatMonth(value: string) {
  return new Intl.DateTimeFormat('en-PK', { month: 'short', year: 'numeric' }).format(
    new Date(value),
  );
}

function formatPkr(value: number) {
  return `PKR ${new Intl.NumberFormat('en-PK', { maximumFractionDigits: 0 }).format(value)}`;
}

function getAgeLabel(orphan: OrphanProfile) {
  if (orphan.dateOfBirth) {
    const birth = new Date(orphan.dateOfBirth);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const birthdayPending =
      today.getMonth() < birth.getMonth() ||
      (today.getMonth() === birth.getMonth() && today.getDate() < birth.getDate());
    if (birthdayPending) age -= 1;
    return `${Math.max(0, age)} years old`;
  }

  return orphan.ageEstimate === null ? 'Age not recorded' : `${orphan.ageEstimate} years old`;
}

function getInitials(value: string | null | undefined) {
  return (value ?? '')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');
}

function formatStatusTransition(previous: OrphanProfileStatus | null, next: OrphanProfileStatus) {
  return previous
    ? `${profileStatusLabels[previous]} to ${profileStatusLabels[next]}`
    : profileStatusLabels[next];
}

function formatVerificationTransition(
  previous: OrphanVerificationStatus | null,
  next: OrphanVerificationStatus,
) {
  return previous
    ? `${verificationLabels[previous]} to ${verificationLabels[next]}`
    : verificationLabels[next];
}

export function OrphanDetailPage({
  initialOrphan,
  initialSponsorship,
}: {
  initialOrphan: OrphanProfile;
  initialSponsorship: OrphanSponsorshipOverview;
}) {
  const { teamMember } = useAdminAccount();
  const toast = useToast();
  const confirm = useConfirmation();
  const canUpdate = canUpdateOrphans(teamMember);
  const canSubmit = canSubmitOrphansForReview(teamMember);
  const canApprove = canApproveOrphans(teamMember);
  const canArchive = canArchiveOrphans(teamMember);
  const canUploadDocument = canUploadOrphanDocuments(teamMember);
  const canUploadImage = canUploadOrphanProfileImage(teamMember);
  const canViewDocuments = canViewOrphanDocuments(teamMember);
  const canDownload = canDownloadOrphanProfilePdf(teamMember);

  const { data: orphan = initialOrphan, mutate } = useSWR<OrphanProfile>(
    `/api/admin/orphans/${initialOrphan.id}`,
    fetchApiData,
    { fallbackData: initialOrphan },
  );
  const { data: sponsorship = initialSponsorship } = useSWR<OrphanSponsorshipOverview>(
    `/api/admin/orphans/${initialOrphan.id}/sponsorship`,
    fetchApiData,
    { fallbackData: initialSponsorship },
  );

  const [activeTab, setActiveTab] = useState<TabKey>('sponsorship');
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(() => toForm(orphan));
  const [_errors, setErrors] = useState<OrphanErrors>({});
  const [serverError, setServerError] = useState('');
  const [saving, setSaving] = useState(false);
  const [downloadingProfile, setDownloadingProfile] = useState(false);
  const [archiveReason, setArchiveReason] = useState('');
  const [profileImageFile, setProfileImageFile] = useState<File | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [documentFile, setDocumentFile] = useState<File | null>(null);
  const [documentInputKey, setDocumentInputKey] = useState(0);
  const [uploadingDocument, setUploadingDocument] = useState(false);
  const [documentForm, setDocumentForm] = useState<DocumentInput>({
    documentCategory: 'other',
    fileName: '',
    fileType: '',
    fileUrl: '',
  });

  const updateForm = <Key extends keyof OrphanProfileUpdate>(
    key: Key,
    value: OrphanProfileUpdate[Key],
  ) => {
    setForm((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined }));
  };

  const updateGuardian = (
    key: keyof NonNullable<OrphanProfileUpdate['guardian']>,
    value: string,
  ) => {
    setForm((current) => ({
      ...current,
      guardian: {
        address: current.guardian?.address ?? '',
        guardianName: current.guardian?.guardianName ?? '',
        notes: current.guardian?.notes ?? '',
        phone: current.guardian?.phone ?? '',
        relationship: current.guardian?.relationship ?? '',
        whatsapp: current.guardian?.whatsapp ?? '',
        [key]: value,
      },
    }));
  };

  const save = async () => {
    const confirmed = await confirm({
      confirmLabel: 'Save Profile',
      description: `Save changes to ${orphan.orphanCode}.`,
      title: 'Save orphan profile?',
    });
    if (!confirmed) return;

    setSaving(true);
    setServerError('');

    try {
      const response = await fetch(`/api/admin/orphans/${orphan.id}`, {
        body: JSON.stringify(form),
        headers: { 'Content-Type': 'application/json' },
        method: 'PATCH',
      });
      const body = (await response.json().catch(() => null)) as {
        data?: OrphanProfile;
        error?: string;
        errors?: OrphanErrors;
      } | null;

      if (!response.ok || !body?.data) {
        setErrors(body?.errors ?? {});
        const message = body?.error ?? 'Could not save orphan profile.';
        setServerError(message);
        toast({ description: 'Please review the form.', title: message, type: 'error' });
        return;
      }

      await mutate(body.data, { revalidate: false });
      setForm(toForm(body.data));
      setEditing(false);
      toast({
        description: `${body.data.orphanCode} was updated.`,
        title: 'Profile saved',
        type: 'success',
      });
    } catch {
      toast({ description: 'Please check your connection.', title: 'Save failed', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const uploadProfileImage = async () => {
    if (!profileImageFile) {
      toast({
        description: 'Choose a JPEG, PNG, or WebP image first.',
        title: 'No image selected',
        type: 'error',
      });
      return;
    }

    const confirmed = await confirm({
      confirmLabel: 'Upload Image',
      description: `Replace the profile image for ${orphan.orphanCode}.`,
      title: 'Upload profile image?',
    });
    if (!confirmed) return;

    setUploadingImage(true);
    try {
      const imageFormData = new FormData();
      imageFormData.append('file', profileImageFile);
      const response = await fetch(`/api/admin/orphans/${orphan.id}/profile-image`, {
        body: imageFormData,
        method: 'POST',
      });
      const body = (await response.json().catch(() => null)) as {
        data?: { orphan: OrphanProfile };
        error?: string;
      } | null;

      if (!response.ok || !body?.data?.orphan) {
        toast({
          description: body?.error ?? 'The profile image could not be uploaded.',
          title: 'Upload failed',
          type: 'error',
        });
        return;
      }

      await mutate(body.data.orphan, { revalidate: false });
      setForm(toForm(body.data.orphan));
      setProfileImageFile(null);
      toast({
        description: `${body.data.orphan.orphanCode}'s profile image was updated.`,
        title: 'Image uploaded',
        type: 'success',
      });
    } catch {
      toast({
        description: 'Please check your connection.',
        title: 'Upload failed',
        type: 'error',
      });
    } finally {
      setUploadingImage(false);
    }
  };

  const runAction = async (path: string, title: string, payload?: unknown) => {
    const confirmed = await confirm({
      confirmLabel: title,
      description: `This will update ${orphan.orphanCode}'s profile status.`,
      title: `${title}?`,
      variant: path === 'archive' ? 'destructive' : 'default',
    });
    if (!confirmed) return;

    try {
      const response = await fetch(`/api/admin/orphans/${orphan.id}/${path}`, {
        body: payload ? JSON.stringify(payload) : undefined,
        headers: payload ? { 'Content-Type': 'application/json' } : undefined,
        method: 'POST',
      });
      const body = (await response.json().catch(() => null)) as {
        data?: OrphanProfile;
        error?: string;
      } | null;

      if (!response.ok || !body?.data) {
        toast({
          description: body?.error ?? 'The profile could not be updated.',
          title: `${title} failed`,
          type: 'error',
        });
        return;
      }

      await mutate(body.data, { revalidate: false });
      setForm(toForm(body.data));
      toast({ description: `${body.data.orphanCode} was updated.`, title, type: 'success' });
    } catch {
      toast({
        description: 'Please check your connection.',
        title: `${title} failed`,
        type: 'error',
      });
    }
  };

  const addDocument = async () => {
    if (!documentFile) {
      toast({
        description: 'Choose a PDF, JPEG, PNG, or WebP file first.',
        title: 'No document selected',
        type: 'error',
      });
      return;
    }

    const confirmed = await confirm({
      confirmLabel: 'Upload Document',
      description: `Upload this document to ${orphan.orphanCode}'s profile.`,
      title: 'Upload document?',
    });
    if (!confirmed) return;

    setUploadingDocument(true);
    try {
      const formData = new FormData();
      formData.append('file', documentFile);
      formData.append('fileName', documentForm.fileName || documentFile.name);
      formData.append('documentCategory', documentForm.documentCategory ?? 'other');
      const response = await fetch(`/api/admin/orphans/${orphan.id}/documents`, {
        body: formData,
        method: 'POST',
      });
      const body = (await response.json().catch(() => null)) as {
        data?: Document;
        error?: string;
        errors?: Partial<Record<keyof DocumentInput, string>>;
      } | null;

      if (!response.ok || !body?.data) {
        toast({
          description:
            body?.error ??
            body?.errors?.fileUrl ??
            body?.errors?.fileName ??
            body?.errors?.fileType ??
            body?.errors?.documentCategory ??
            'The document could not be saved.',
          title: 'Document failed',
          type: 'error',
        });
        return;
      }

      await mutate({ ...orphan, documents: [body.data, ...orphan.documents] }, false);
      setDocumentForm({ documentCategory: 'other', fileName: '', fileType: '', fileUrl: '' });
      setDocumentFile(null);
      setDocumentInputKey((current) => current + 1);
      toast({
        description: 'Document was uploaded and added.',
        title: 'Document saved',
        type: 'success',
      });
    } catch {
      toast({
        description: 'Please check your connection.',
        title: 'Document failed',
        type: 'error',
      });
    } finally {
      setUploadingDocument(false);
    }
  };

  const beginEdit = () => {
    setForm(toForm(orphan));
    setServerError('');
    setEditing(true);
    setActiveTab('overview');
  };

  const downloadProfile = async () => {
    setDownloadingProfile(true);

    try {
      const response = await fetch(`/api/admin/orphans/${orphan.id}/profile-pdf`);

      if (!response.ok) {
        const responseBody = (await response.json().catch(() => null)) as {
          error?: string;
        } | null;
        toast({
          description: responseBody?.error ?? 'The profile PDF could not be generated.',
          title: 'Profile not ready',
          type: 'error',
        });
        return;
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const disposition = response.headers.get('Content-Disposition');
      const fileName = disposition?.match(/filename="?([^";]+)"?/i)?.[1];
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = fileName ?? `${orphan.orphanCode}-profile.pdf`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
    } catch {
      toast({
        description: 'Please check your connection and try again.',
        title: 'Download failed',
        type: 'error',
      });
    } finally {
      setDownloadingProfile(false);
    }
  };

  return (
    <div className={workSurface.page}>
      <header>
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div className="min-w-0">
            <BackLink href="/admin/orphans" label="Back to Orphan Profiles" />
            <div className="mt-3 flex min-w-0 items-start gap-4">
              {orphan.profileImageUrl ? (
                <Image
                  alt={`${orphan.fullName} profile`}
                  className="h-20 w-20 shrink-0 rounded-xl border border-[#dfe5df] object-cover shadow-sm sm:h-24 sm:w-24"
                  height={96}
                  src={orphan.profileImageUrl}
                  unoptimized
                  width={96}
                />
              ) : (
                <span className="flex h-20 w-20 shrink-0 items-center justify-center rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-700 sm:h-24 sm:w-24">
                  <UserRound className="h-9 w-9" />
                </span>
              )}
              <div className="min-w-0 pt-0.5">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-2xl font-semibold tracking-[-0.025em] text-[#111827] sm:text-3xl">
                    {orphan.fullName}
                  </h1>
                  <ProfileStatusPill status={orphan.profileStatus} />
                  <VerificationStatusPill status={orphan.verificationStatus} />
                </div>
                <p className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-[#596274]">
                  <span>{orphan.orphanCode}</span>
                  <span aria-hidden="true">•</span>
                  <span>{orphan.cityArea ?? 'Location not recorded'}</span>
                  <span aria-hidden="true">•</span>
                  <span>{getAgeLabel(orphan)}</span>
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 xl:pt-8">
            {canDownload ? (
              <button
                className={cn(
                  workSurface.secondaryButton,
                  'h-10 px-4 text-sm disabled:cursor-wait disabled:opacity-60',
                )}
                disabled={downloadingProfile}
                onClick={downloadProfile}
                type="button"
              >
                <Download className="h-4 w-4" />
                {downloadingProfile ? 'Preparing...' : 'Download Profile'}
              </button>
            ) : null}
            {canUpdate ? (
              <button
                className={cn(
                  editing ? workSurface.secondaryButton : workSurface.primaryButton,
                  'h-10 px-4 text-sm',
                )}
                onClick={() => {
                  if (editing) {
                    setEditing(false);
                    setForm(toForm(orphan));
                  } else {
                    beginEdit();
                  }
                }}
                type="button"
              >
                <Pencil className="h-4 w-4" />
                {editing ? 'Cancel Edit' : 'Edit Profile'}
              </button>
            ) : null}
          </div>
        </div>

        <nav
          aria-label="Orphan profile sections"
          className="mt-5 flex gap-1 overflow-x-auto border-b border-[#dfe5df]"
        >
          {(Object.keys(tabLabels) as TabKey[]).map((tab) => (
            <button
              aria-current={activeTab === tab ? 'page' : undefined}
              className={cn(
                'relative shrink-0 px-4 py-3 text-sm font-medium transition',
                activeTab === tab
                  ? 'text-[#006b4f] after:absolute after:inset-x-2 after:bottom-[-1px] after:h-0.5 after:bg-[#006b4f]'
                  : 'text-[#4b5563] hover:text-[#111827]',
              )}
              key={tab}
              onClick={() => {
                setActiveTab(tab);
                if (tab !== 'overview') setEditing(false);
              }}
              type="button"
            >
              {tabLabels[tab]}
            </button>
          ))}
        </nav>
      </header>

      {activeTab === 'sponsorship' ? (
        <SponsorshipPaymentsTab orphan={orphan} sponsorship={sponsorship} />
      ) : null}

      {activeTab === 'overview' ? (
        <OverviewTab
          archiveReason={archiveReason}
          canApprove={canApprove}
          canArchive={canArchive}
          canSubmit={canSubmit}
          canUploadImage={canUploadImage}
          canUpdate={canUpdate}
          editing={editing}
          form={form}
          onArchiveReasonChange={setArchiveReason}
          onGuardianChange={updateGuardian}
          onProfileImageChange={setProfileImageFile}
          onRunAction={runAction}
          onSave={save}
          onUpdateForm={updateForm}
          onUploadImage={uploadProfileImage}
          orphan={orphan}
          profileImageFile={profileImageFile}
          saving={saving}
          serverError={serverError}
          uploadingImage={uploadingImage}
        />
      ) : null}

      {activeTab === 'documents' ? (
        <DocumentsTab
          canUpload={canUploadDocument}
          canView={canViewDocuments}
          documentFile={documentFile}
          documentForm={documentForm}
          documentInputKey={documentInputKey}
          onAddDocument={addDocument}
          onDocumentFileChange={(file) => {
            setDocumentFile(file);
            setDocumentForm((current) => ({
              ...current,
              fileName: current.fileName || file?.name || '',
            }));
          }}
          onDocumentFormChange={setDocumentForm}
          orphan={orphan}
          uploading={uploadingDocument}
        />
      ) : null}

      {activeTab === 'activity' ? <ActivityTab orphan={orphan} /> : null}
    </div>
  );
}

function SponsorshipPaymentsTab({
  orphan,
  sponsorship,
}: {
  orphan: OrphanProfile;
  sponsorship: OrphanSponsorshipOverview;
}) {
  const { matches, permissions, receipts } = sponsorship;
  const [paymentFilter, setPaymentFilter] = useState<PaymentFilter>('all');
  const [paymentPage, setPaymentPage] = useState(0);
  const currentMatch =
    matches.find((match) => match.status === 'active') ??
    matches.find((match) => match.status === 'paused') ??
    matches[0] ??
    null;
  const paymentSummary = useMemo(() => buildPaymentSummary(matches, receipts), [matches, receipts]);
  const filteredReceipts = useMemo(
    () => (receipts ?? []).filter((receipt) => matchesPaymentFilter(receipt, paymentFilter)),
    [paymentFilter, receipts],
  );
  const pageSize = 5;
  const pageCount = Math.max(1, Math.ceil(filteredReceipts.length / pageSize));
  const safePage = Math.min(paymentPage, pageCount - 1);
  const visibleReceipts = filteredReceipts.slice(
    safePage * pageSize,
    safePage * pageSize + pageSize,
  );
  const fullAccess =
    permissions.canViewSponsorContact &&
    permissions.canViewMonthlyAmount &&
    permissions.canViewPaymentHistory;

  const exportHistory = () => {
    if (!receipts || receipts.length === 0) return;
    const rows = [
      ['Month', 'Paid on', 'Reference', 'Amount', 'Receipt status', 'Delivery'],
      ...receipts.map((receipt) => [
        formatMonth(receipt.donationMonth),
        formatDate(getPaymentDate(receipt)),
        receipt.transferReference ?? '',
        String(receipt.amount),
        receiptStatusLabels[receipt.status],
        receipt.status === 'money_delivered' ? 'Delivered' : 'Pending',
      ]),
    ];
    const csv = rows.map((row) => row.map(csvCell).join(',')).join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `${orphan.orphanCode}-payment-history.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-5">
      <p className="flex items-center gap-2 text-xs font-medium text-[#6b7280]">
        <ShieldCheck className="h-4 w-4 text-[#006b4f]" />
        Financial data
        <span aria-hidden="true">•</span>
        Visible only to roles granted match financials and payment access
      </p>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard icon={UsersRound} label="Current Sponsor">
          {currentMatch ? (
            permissions.canViewSponsorIdentity && currentMatch.donor ? (
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-100 font-semibold text-emerald-900">
                  {getInitials(currentMatch.donor.fullName) || 'D'}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-lg font-semibold text-[#111827]">
                    {currentMatch.donor.fullName}
                  </p>
                  <p className="mt-0.5 text-xs font-medium text-emerald-700">
                    {currentMatch.status === 'active' ? 'Active' : 'Matched'} since{' '}
                    {formatMonth(currentMatch.startedAt)}
                  </p>
                </div>
              </div>
            ) : (
              <RestrictedValue label="Sponsor details restricted" />
            )
          ) : (
            <div>
              <p className="text-lg font-semibold text-[#111827]">Not matched</p>
              <p className="mt-1 text-xs text-[#6b7280]">No sponsorship relationship yet</p>
            </div>
          )}
        </MetricCard>
        <MetricCard icon={CalendarDays} label="Monthly Commitment">
          {permissions.canViewMonthlyAmount && currentMatch?.monthlyAmount !== null ? (
            <p className="text-xl font-semibold tracking-[-0.02em] text-[#111827]">
              {formatPkr(currentMatch?.monthlyAmount ?? 0)}
            </p>
          ) : (
            <RestrictedValue label="Amount restricted" />
          )}
        </MetricCard>
        <MetricCard icon={WalletCards} label="Total Received to Date">
          {permissions.canViewPaymentHistory ? (
            <div>
              <p className="text-xl font-semibold tracking-[-0.02em] text-[#111827]">
                {formatPkr(paymentSummary.totalReceived)}
              </p>
              <p className="mt-2 text-xs text-[#4b5563]">
                {paymentSummary.paidReceiptCount} verified{' '}
                {paymentSummary.paidReceiptCount === 1 ? 'payment' : 'payments'}
              </p>
            </div>
          ) : (
            <RestrictedValue label="Payment totals restricted" />
          )}
        </MetricCard>
        <MetricCard icon={Clock3} label="Payment Coverage">
          {permissions.canViewPaymentHistory ? (
            <div>
              <p className="text-xl font-semibold tracking-[-0.02em] text-[#111827]">
                {paymentSummary.paidPeriods} / {paymentSummary.expectedPeriods}{' '}
                <span className="text-base font-medium">months</span>
              </p>
              <div className="mt-3 flex h-1.5 overflow-hidden rounded-full bg-[#e5e7eb]">
                <span
                  className="rounded-full bg-[#006b4f]"
                  style={{ width: `${paymentSummary.percentage}%` }}
                />
              </div>
              <p
                className={cn(
                  'mt-2 text-xs font-medium',
                  paymentSummary.duePeriods > 0 ? 'text-[#a26a00]' : 'text-emerald-700',
                )}
              >
                {paymentSummary.duePeriods > 0
                  ? `${paymentSummary.duePeriods} ${paymentSummary.duePeriods === 1 ? 'payment' : 'payments'} due`
                  : 'Payments up to date'}
              </p>
            </div>
          ) : (
            <RestrictedValue label="Coverage restricted" />
          )}
        </MetricCard>
      </section>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.75fr)_minmax(18rem,0.65fr)]">
        <main className="min-w-0 space-y-5">
          <CurrentSponsorshipCard match={currentMatch} permissions={permissions} />

          <section className={surface}>
            <div className="flex flex-col gap-3 border-b border-[#e8ece8] px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:px-5">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-lg font-semibold text-[#111827]">Payment History</h2>
                  <span className="inline-flex items-center gap-1 rounded-md border border-[#d9ded8] bg-[#f8faf8] px-2 py-1 text-[0.68rem] font-semibold text-[#4b5563]">
                    <LockKeyhole className="h-3 w-3" />
                    Restricted
                  </span>
                </div>
                <p className="mt-0.5 text-sm text-[#6b7280]">
                  Complete sponsorship payment record · Amounts visible to authorized roles only
                </p>
              </div>
              {permissions.canViewPaymentHistory ? (
                <CustomSelect
                  ariaLabel="Filter payment history"
                  onChange={(value) => {
                    setPaymentFilter(value as PaymentFilter);
                    setPaymentPage(0);
                  }}
                  options={[
                    { label: 'All payments', value: 'all' },
                    { label: 'Verified', value: 'verified' },
                    { label: 'Delivered', value: 'delivered' },
                    { label: 'In review', value: 'in_review' },
                    { label: 'Rejected', value: 'rejected' },
                  ]}
                  triggerClassName="h-9 min-w-36 border-[#d9ded8] px-3 text-sm"
                  value={paymentFilter}
                />
              ) : null}
            </div>

            {permissions.canViewPaymentHistory ? (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[760px] border-collapse text-left">
                    <thead>
                      <tr className="border-b border-[#e8ece8] text-[0.68rem] font-semibold uppercase tracking-[0.05em] text-[#4b5563]">
                        <th className="px-4 py-3 sm:px-5">Month</th>
                        <th className="px-3 py-3">Paid on</th>
                        <th className="px-3 py-3">Reference</th>
                        <th className="px-3 py-3">Amount</th>
                        <th className="px-3 py-3">Receipt status</th>
                        <th className="px-3 py-3">Delivery</th>
                        <th className="px-4 py-3 text-right sm:px-5">Receipt</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#edf0ed]">
                      {visibleReceipts.map((receipt) => (
                        <PaymentRow key={receipt.id} receipt={receipt} />
                      ))}
                    </tbody>
                  </table>
                  {visibleReceipts.length === 0 ? (
                    <div className="px-5 py-12 text-center">
                      <ReceiptText className="mx-auto h-8 w-8 text-[#9ca3af]" />
                      <p className="mt-3 text-sm font-semibold text-[#374151]">No payments found</p>
                      <p className="mt-1 text-sm text-[#6b7280]">
                        No receipt records match this filter.
                      </p>
                    </div>
                  ) : null}
                </div>
                <div className="flex flex-col gap-3 border-t border-[#e8ece8] px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
                  <p className="text-xs text-[#6b7280]">
                    Showing {visibleReceipts.length === 0 ? 0 : safePage * pageSize + 1}–
                    {Math.min((safePage + 1) * pageSize, filteredReceipts.length)} of{' '}
                    {filteredReceipts.length} payments
                  </p>
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      aria-label="Previous payment page"
                      className="flex h-8 w-8 items-center justify-center rounded-md border border-[#d9ded8] text-[#4b5563] transition hover:bg-[#f8faf8] disabled:opacity-35"
                      disabled={safePage === 0}
                      onClick={() => setPaymentPage((page) => Math.max(0, page - 1))}
                      type="button"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    <span className="min-w-8 text-center text-xs font-semibold text-[#374151]">
                      {safePage + 1} / {pageCount}
                    </span>
                    <button
                      aria-label="Next payment page"
                      className="flex h-8 w-8 items-center justify-center rounded-md border border-[#d9ded8] text-[#4b5563] transition hover:bg-[#f8faf8] disabled:opacity-35"
                      disabled={safePage >= pageCount - 1}
                      onClick={() => setPaymentPage((page) => Math.min(pageCount - 1, page + 1))}
                      type="button"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                    <button
                      className={cn(workSurface.secondaryButton, 'ml-1 h-8 px-3 text-xs')}
                      disabled={!receipts || receipts.length === 0}
                      onClick={exportHistory}
                      type="button"
                    >
                      <Download className="h-3.5 w-3.5" />
                      Export history
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <RestrictedPanel
                description="This role can view the orphan profile but does not have Payments & Receipts access. Receipt records and lifetime totals are withheld by the server."
                title="Payment history restricted"
              />
            )}
          </section>
        </main>

        <aside className="min-w-0 space-y-4">
          <PaymentHealthCard permissions={permissions} summary={paymentSummary} />
          <OrphanSnapshotCard orphan={orphan} />
          <AccessPrivacyCard fullAccess={fullAccess} permissions={permissions} />
        </aside>
      </div>
    </div>
  );
}

function MetricCard({
  children,
  icon: Icon,
  label,
}: {
  children: React.ReactNode;
  icon: React.ElementType;
  label: string;
}) {
  return (
    <article className={cn(surface, 'min-h-32 p-4')}>
      <div className="flex items-center justify-between gap-2">
        <p className="text-[0.68rem] font-semibold uppercase tracking-[0.06em] text-[#4b5563]">
          {label}
        </p>
        <Icon className="h-4 w-4 text-[#374151]" />
      </div>
      <div className="mt-4">{children}</div>
    </article>
  );
}

function RestrictedValue({ label }: { label: string }) {
  return (
    <div>
      <p className="flex items-center gap-2 text-sm font-semibold text-[#374151]">
        <LockKeyhole className="h-4 w-4 text-[#6b7280]" />
        Restricted
      </p>
      <p className="mt-1.5 text-xs text-[#6b7280]">{label}</p>
    </div>
  );
}

function CurrentSponsorshipCard({
  match,
  permissions,
}: {
  match: OrphanSponsorshipMatchSummary | null;
  permissions: OrphanSponsorshipOverview['permissions'];
}) {
  if (!match) {
    return (
      <section className={surface}>
        <div className="border-b border-[#e8ece8] px-5 py-3.5">
          <h2 className="text-lg font-semibold text-[#111827]">Current Sponsorship</h2>
        </div>
        <div className="flex flex-col items-center px-5 py-10 text-center">
          <HeartHandshake className="h-9 w-9 text-[#9ca3af]" />
          <p className="mt-3 text-sm font-semibold text-[#374151]">No current sponsor</p>
          <p className="mt-1 max-w-md text-sm text-[#6b7280]">
            This orphan profile is not connected to an active or historical sponsorship match.
          </p>
          {permissions.canOpenMatch ? (
            <Link
              className={cn(workSurface.primaryButton, 'mt-4 h-9 gap-2 px-4 text-sm')}
              href="/admin/matches"
            >
              Open Matches
              <NavLinkSpinner className="h-4 w-4" />
            </Link>
          ) : null}
        </div>
      </section>
    );
  }

  const matchStatus = match.status[0].toUpperCase() + match.status.slice(1);

  return (
    <section className={cn(surface, 'p-4 sm:p-5')}>
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="text-lg font-semibold text-[#111827]">Current Sponsorship</h2>
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700">
          <span className="h-2 w-2 rounded-full bg-emerald-600" />
          {matchStatus}
        </span>
      </div>

      <div className="mt-4 grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(15rem,1.15fr)_auto] lg:items-center">
        <div className="min-w-0">
          {permissions.canViewSponsorIdentity && match.donor ? (
            <div className="flex items-start gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-emerald-100 font-semibold text-emerald-900">
                {getInitials(match.donor.fullName) || 'D'}
              </span>
              <div className="min-w-0">
                <p className="truncate font-semibold text-[#111827]">{match.donor.fullName}</p>
                <p className="mt-0.5 text-xs text-[#6b7280]">
                  Sponsor ID {match.donor.id.slice(0, 8).toUpperCase()}
                </p>
                {permissions.canViewSponsorContact ? (
                  <div className="mt-2 space-y-1 text-xs text-[#4b5563]">
                    <p className="flex items-center gap-1.5">
                      <Mail className="h-3.5 w-3.5" />
                      <span className="truncate">{match.donor.email ?? 'Email not recorded'}</span>
                    </p>
                    <p className="flex items-center gap-1.5">
                      <Phone className="h-3.5 w-3.5" />
                      {match.donor.phone ?? 'Phone not recorded'}
                    </p>
                  </div>
                ) : (
                  <p className="mt-2 flex items-center gap-1.5 text-xs text-[#6b7280]">
                    <LockKeyhole className="h-3.5 w-3.5" />
                    Contact details restricted
                  </p>
                )}
              </div>
            </div>
          ) : (
            <RestrictedValue label="Sponsor identity requires Matches access" />
          )}
          <span className="mt-3 inline-flex items-center gap-1.5 rounded-md border border-[#d9ded8] bg-[#f8faf8] px-2 py-1 text-[0.68rem] font-medium text-[#4b5563]">
            <LockKeyhole className="h-3 w-3" />
            Sensitive contact
          </span>
        </div>

        <dl className="divide-y divide-[#e8ece8] rounded-lg border border-[#e2e7e2] bg-[#fbfcfb] px-3">
          <CompactDetail icon={CalendarDays} label="Started" value={formatDate(match.startedAt)} />
          <CompactDetail
            icon={Banknote}
            label="Monthly"
            value={
              permissions.canViewMonthlyAmount && match.monthlyAmount !== null
                ? formatPkr(match.monthlyAmount)
                : 'Restricted'
            }
          />
          <CompactDetail
            icon={HeartHandshake}
            label="Match ID"
            value={formatCertificateNumber(match)}
          />
        </dl>

        <div className="flex flex-col gap-2 sm:flex-row lg:flex-col">
          {permissions.canOpenDonor && match.donor ? (
            <Link
              className={cn(
                workSurface.secondaryButton,
                'h-9 min-w-32 px-3 text-sm text-[#006b4f]',
              )}
              href={`/admin/donors/${match.donor.id}`}
            >
              <NavLinkIcon className="h-4 w-4" icon={UserRound} />
              View Donor
            </Link>
          ) : null}
          {permissions.canOpenMatch ? (
            <Link
              className={cn(
                workSurface.secondaryButton,
                'h-9 min-w-32 px-3 text-sm text-[#006b4f]',
              )}
              href={`/admin/matches/${match.id}`}
            >
              <NavLinkIcon className="h-4 w-4" icon={HeartHandshake} />
              View Match
            </Link>
          ) : null}
        </div>
      </div>
    </section>
  );
}

function CompactDetail({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
}) {
  return (
    <div className="grid grid-cols-[1fr_1.15fr] items-center gap-3 py-2.5 text-xs">
      <dt className="flex items-center gap-2 text-[#4b5563]">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </dt>
      <dd className="font-medium text-[#374151]">{value}</dd>
    </div>
  );
}

function PaymentRow({ receipt }: { receipt: OrphanPaymentRecord }) {
  const delivered = receipt.status === 'money_delivered';

  return (
    <tr className="text-xs text-[#374151] transition hover:bg-[#fbfcfb]">
      <td className="whitespace-nowrap px-4 py-3 font-medium text-[#111827] sm:px-5">
        {formatMonth(receipt.donationMonth)}
      </td>
      <td className="whitespace-nowrap px-3 py-3">{formatDate(getPaymentDate(receipt))}</td>
      <td className="max-w-36 truncate px-3 py-3 font-mono text-[0.7rem]">
        {receipt.transferReference ?? 'Not provided'}
      </td>
      <td className="whitespace-nowrap px-3 py-3 font-semibold text-[#111827]">
        {formatPkr(receipt.amount)}
      </td>
      <td className="px-3 py-3">
        <ReceiptStatusPill status={receipt.status} />
      </td>
      <td className="px-3 py-3">
        <span
          className={cn(
            'inline-flex rounded-md border px-2 py-1 text-[0.62rem] font-semibold uppercase tracking-[0.03em]',
            delivered
              ? workflowStatus.green
              : receipt.status === 'verified'
                ? workflowStatus.amber
                : workflowStatus.neutral,
          )}
        >
          {delivered ? 'Delivered' : receipt.status === 'verified' ? 'Pending' : '—'}
        </span>
      </td>
      <td className="px-4 py-3 text-right sm:px-5">
        <Link
          className="inline-flex items-center gap-1 font-semibold text-[#006b4f] hover:underline"
          href={`/admin/receipts/${receipt.id}`}
        >
          View
          <NavLinkIcon className="h-3 w-3" icon={ExternalLink} />
        </Link>
      </td>
    </tr>
  );
}

function ReceiptStatusPill({ status }: { status: DonorPortalReceiptStatus }) {
  const className =
    status === 'rejected'
      ? workflowStatus.red
      : paidStatuses.has(status)
        ? workflowStatus.green
        : ['submitted', 'ready_for_review', 'reviewed'].includes(status)
          ? workflowStatus.amber
          : workflowStatus.neutral;

  return (
    <span
      className={cn(
        'inline-flex whitespace-nowrap rounded-md border px-2 py-1 text-[0.62rem] font-semibold uppercase tracking-[0.03em]',
        className,
      )}
    >
      {receiptStatusLabels[status]}
    </span>
  );
}

function PaymentHealthCard({
  permissions,
  summary,
}: {
  permissions: OrphanSponsorshipOverview['permissions'];
  summary: ReturnType<typeof buildPaymentSummary>;
}) {
  return (
    <section className={cn(surface, 'p-4')}>
      <h2 className="text-lg font-semibold text-[#111827]">Payment Health</h2>
      {permissions.canViewPaymentHistory ? (
        <>
          <div className="mt-4 grid grid-cols-[6.5rem_1fr] items-center gap-4">
            <div
              className="relative flex h-24 w-24 items-center justify-center rounded-full"
              style={{
                background: `conic-gradient(#006b4f ${summary.percentage}%, #dcefe6 ${summary.percentage}% 100%)`,
              }}
            >
              <span className="absolute inset-2.5 rounded-full bg-white" />
              <span className="relative text-2xl font-semibold text-[#111827]">
                {summary.percentage}%
              </span>
            </div>
            <dl className="space-y-2.5 text-sm">
              <HealthRow color="bg-emerald-600" label={`${summary.paidPeriods} paid`} />
              <HealthRow color="bg-[#d49b1d]" label={`${summary.duePeriods} due`} />
              <HealthRow color="bg-red-500" label={`${summary.rejectedReceipts} rejected`} />
            </dl>
          </div>
          <div
            className={cn(
              'mt-4 flex items-start gap-2 rounded-lg border px-3 py-2.5 text-xs font-medium',
              summary.duePeriods > 0 ? workflowStatus.amber : workflowStatus.green,
            )}
          >
            <Clock3 className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <span>
              {summary.latestPaidMonth
                ? `${formatMonth(summary.latestPaidMonth)} payment received`
                : 'No verified payment received yet'}
              {summary.nextDueMonth ? ` • Next due ${formatDate(summary.nextDueMonth)}` : ''}
            </span>
          </div>
        </>
      ) : (
        <RestrictedPanel
          compact
          description="Payment health is available to authorized finance roles."
          title="Financial data restricted"
        />
      )}
    </section>
  );
}

function HealthRow({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className={cn('h-2.5 w-2.5 rounded-full', color)} />
      <span className="text-[#374151]">{label}</span>
    </div>
  );
}

function OrphanSnapshotCard({ orphan }: { orphan: OrphanProfile }) {
  return (
    <section className={cn(surface, 'p-4')}>
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-lg font-semibold text-[#111827]">Orphan Snapshot</h2>
        <UserRound className="h-4 w-4 text-[#4b5563]" />
      </div>
      <dl className="mt-3 space-y-2.5 text-xs">
        <SnapshotRow label="Guardian" value={orphan.guardian?.guardianName ?? 'Not recorded'} />
        <SnapshotRow label="Education" value={orphan.educationStatus ?? 'Not recorded'} />
        <SnapshotRow label="Health" value={orphan.healthNotes ?? 'No active concerns recorded'} />
        <SnapshotRow label="Profile approved" value={formatDate(orphan.approvedAt)} />
      </dl>
    </section>
  );
}

function SnapshotRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[6.5rem_1fr] gap-2">
      <dt className="text-[#6b7280]">{label}</dt>
      <dd className="line-clamp-2 font-medium text-[#374151]">{value}</dd>
    </div>
  );
}

function AccessPrivacyCard({
  fullAccess,
  permissions,
}: {
  fullAccess: boolean;
  permissions: OrphanSponsorshipOverview['permissions'];
}) {
  return (
    <section className={cn(surface, 'p-4')}>
      <h2 className="text-lg font-semibold text-[#111827]">Access & Privacy</h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-[7.5rem_1fr] xl:grid-cols-1 2xl:grid-cols-[7.5rem_1fr]">
        <div className="flex flex-col items-center justify-center rounded-lg border border-emerald-100 bg-emerald-50/45 px-3 py-4 text-center">
          <ShieldCheck className="h-10 w-10 text-[#006b4f]" />
          <p className="mt-2 text-[0.68rem] font-medium text-[#374151]">
            {fullAccess ? 'You have Full access' : 'You have Limited access'}
          </p>
        </div>
        <dl className="divide-y divide-[#edf0ed] text-xs">
          <AccessRow
            label="Sponsor details"
            value={
              permissions.canViewSponsorContact
                ? 'Full'
                : permissions.canViewSponsorIdentity
                  ? 'Limited'
                  : 'Restricted'
            }
          />
          <AccessRow
            label="Financial amounts"
            value={permissions.canViewMonthlyAmount ? 'Full' : 'Restricted'}
          />
          <AccessRow
            label="Payment history"
            value={permissions.canViewPaymentHistory ? 'Full' : 'Restricted'}
          />
        </dl>
      </div>
      <p className="mt-3 text-[0.68rem] leading-5 text-[#6b7280]">
        Controls follow Roles & Access permissions. Restricted data is filtered on the server.
      </p>
    </section>
  );
}

function AccessRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 py-2.5 first:pt-0 last:pb-0">
      <dt className="text-[#4b5563]">{label}</dt>
      <dd
        className={
          value === 'Restricted' ? 'font-medium text-[#6b7280]' : 'font-semibold text-[#006b4f]'
        }
      >
        {value}
      </dd>
    </div>
  );
}

function RestrictedPanel({
  compact = false,
  description,
  title,
}: {
  compact?: boolean;
  description: string;
  title: string;
}) {
  return (
    <div className={cn('flex flex-col items-center px-5 text-center', compact ? 'py-7' : 'py-12')}>
      <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#f1f3f1] text-[#6b7280]">
        <LockKeyhole className="h-5 w-5" />
      </span>
      <p className="mt-3 text-sm font-semibold text-[#374151]">{title}</p>
      <p className="mt-1 max-w-lg text-sm leading-6 text-[#6b7280]">{description}</p>
    </div>
  );
}

function OverviewTab({
  archiveReason,
  canApprove,
  canArchive,
  canSubmit,
  canUploadImage,
  canUpdate,
  editing,
  form,
  onArchiveReasonChange,
  onGuardianChange,
  onProfileImageChange,
  onRunAction,
  onSave,
  onUpdateForm,
  onUploadImage,
  orphan,
  profileImageFile,
  saving,
  serverError,
  uploadingImage,
}: {
  archiveReason: string;
  canApprove: boolean;
  canArchive: boolean;
  canSubmit: boolean;
  canUploadImage: boolean;
  canUpdate: boolean;
  editing: boolean;
  form: OrphanProfileUpdate;
  onArchiveReasonChange: (value: string) => void;
  onGuardianChange: (
    key: keyof NonNullable<OrphanProfileUpdate['guardian']>,
    value: string,
  ) => void;
  onProfileImageChange: (file: File | null) => void;
  onRunAction: (path: string, title: string, payload?: unknown) => Promise<void>;
  onSave: () => Promise<void>;
  onUpdateForm: <Key extends keyof OrphanProfileUpdate>(
    key: Key,
    value: OrphanProfileUpdate[Key],
  ) => void;
  onUploadImage: () => Promise<void>;
  orphan: OrphanProfile;
  profileImageFile: File | null;
  saving: boolean;
  serverError: string;
  uploadingImage: boolean;
}) {
  if (editing && canUpdate) {
    return (
      <section className={surface}>
        <div className="border-b border-[#e8ece8] px-4 py-4 sm:px-5">
          <h2 className="text-lg font-semibold text-[#111827]">Edit Profile Information</h2>
          <p className="mt-1 text-sm text-[#6b7280]">
            Update the identity, care, education, and guardian information for this profile.
          </p>
        </div>
        <div className="grid gap-4 border-b border-[#e8ece8] p-4 sm:grid-cols-2 sm:p-5">
          <TextField
            label="Orphan Code"
            onChange={(value) => onUpdateForm('orphanCode', value.toUpperCase())}
            value={form.orphanCode ?? ''}
          />
          <TextField
            label="Full Name"
            onChange={(value) => onUpdateForm('fullName', value)}
            value={form.fullName ?? ''}
          />
          <SelectField
            label="Gender"
            onChange={(value) => onUpdateForm('gender', value as OrphanGender)}
            value={form.gender ?? 'male'}
          >
            <option value="male">Male</option>
            <option value="female">Female</option>
          </SelectField>
          <TextField
            label="Date of Birth"
            onChange={(value) => onUpdateForm('dateOfBirth', value)}
            type="date"
            value={form.dateOfBirth ?? ''}
          />
          <TextField
            label="Age Estimate"
            onChange={(value) =>
              onUpdateForm('ageEstimate', value ? Number.parseInt(value, 10) : null)
            }
            type="number"
            value={form.ageEstimate?.toString() ?? ''}
          />
          <TextField
            label="City / Area"
            onChange={(value) => onUpdateForm('cityArea', value)}
            value={form.cityArea ?? ''}
          />
          <SelectField
            label="Verification Status"
            onChange={(value) =>
              onUpdateForm('verificationStatus', value as OrphanVerificationStatus)
            }
            value={form.verificationStatus ?? 'unverified'}
          >
            {(Object.keys(verificationLabels) as OrphanVerificationStatus[]).map((status) => (
              <option key={status} value={status}>
                {verificationLabels[status]}
              </option>
            ))}
          </SelectField>
        </div>

        {canUploadImage ? (
          <div className="border-b border-[#e8ece8] p-4 sm:p-5">
            <FormLabel label="Replace Profile Image">
              <input
                accept="image/jpeg,image/png,image/webp"
                aria-label="Replace Profile Image"
                className="mt-2 block w-full cursor-pointer rounded-lg border border-[#d8ded8] bg-white px-3 py-2 text-sm text-[#374151] file:mr-3 file:cursor-pointer file:rounded-md file:border-0 file:bg-[#006b4f] file:px-3 file:py-2 file:text-xs file:font-semibold file:text-white"
                onChange={(event) => onProfileImageChange(event.target.files?.[0] ?? null)}
                type="file"
              />
            </FormLabel>
            <button
              className={cn(workSurface.secondaryButton, 'mt-3 h-9 px-3 text-sm')}
              disabled={!profileImageFile || uploadingImage}
              onClick={onUploadImage}
              type="button"
            >
              {uploadingImage ? 'Uploading...' : 'Upload Image'}
            </button>
          </div>
        ) : null}

        <div className="grid gap-4 border-b border-[#e8ece8] p-4 sm:grid-cols-2 sm:p-5">
          <TextArea
            label="Background Summary"
            onChange={(value) => onUpdateForm('backgroundSummary', value)}
            value={form.backgroundSummary ?? ''}
          />
          <TextArea
            label="Health Notes"
            onChange={(value) => onUpdateForm('healthNotes', value)}
            value={form.healthNotes ?? ''}
          />
          <TextArea
            label="Education Status"
            onChange={(value) => onUpdateForm('educationStatus', value)}
            value={form.educationStatus ?? ''}
          />
        </div>

        <div className="grid gap-4 border-b border-[#e8ece8] p-4 sm:grid-cols-2 sm:p-5">
          <TextField
            label="Guardian Name"
            onChange={(value) => onGuardianChange('guardianName', value)}
            value={form.guardian?.guardianName ?? ''}
          />
          <TextField
            label="Relationship"
            onChange={(value) => onGuardianChange('relationship', value)}
            value={form.guardian?.relationship ?? ''}
          />
          <TextField
            label="Phone"
            onChange={(value) => onGuardianChange('phone', value)}
            value={form.guardian?.phone ?? ''}
          />
          <TextField
            label="WhatsApp"
            onChange={(value) => onGuardianChange('whatsapp', value)}
            value={form.guardian?.whatsapp ?? ''}
          />
          <div className="sm:col-span-2">
            <TextArea
              label="Address"
              onChange={(value) => onGuardianChange('address', value)}
              value={form.guardian?.address ?? ''}
            />
          </div>
        </div>

        {serverError ? (
          <div className="mx-4 mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700 sm:mx-5">
            {serverError}
          </div>
        ) : null}

        <div className="flex flex-wrap gap-2 p-4 sm:p-5">
          <button
            className={cn(workSurface.primaryButton, 'h-10 px-4 text-sm')}
            disabled={saving}
            onClick={onSave}
            type="button"
          >
            <Save className="h-4 w-4" />
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </section>
    );
  }

  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1.45fr)_minmax(20rem,0.75fr)]">
      <main className="space-y-5">
        <section className={surface}>
          <div className="border-b border-[#e8ece8] px-5 py-3.5">
            <h2 className="text-lg font-semibold text-[#111827]">Profile Overview</h2>
          </div>
          <div className="grid divide-y divide-[#edf0ed] sm:grid-cols-2 sm:divide-x sm:divide-y-0">
            <div className="divide-y divide-[#edf0ed] px-5">
              <OverviewRow icon={UserRound} label="Gender" value={capitalize(orphan.gender)} />
              <OverviewRow
                icon={CalendarDays}
                label="Date of Birth"
                value={formatDate(orphan.dateOfBirth)}
              />
              <OverviewRow
                icon={MapPin}
                label="City / Area"
                value={orphan.cityArea ?? 'Not recorded'}
              />
            </div>
            <div className="divide-y divide-[#edf0ed] px-5">
              <OverviewRow
                icon={BadgeCheck}
                label="Verification"
                value={verificationLabels[orphan.verificationStatus]}
              />
              <OverviewRow icon={Clock3} label="Created" value={formatDate(orphan.createdAt)} />
              <OverviewRow
                icon={Clock3}
                label="Last Updated"
                value={formatDate(orphan.updatedAt)}
              />
            </div>
          </div>
        </section>

        <section className={surface}>
          <div className="border-b border-[#e8ece8] px-5 py-3.5">
            <h2 className="text-lg font-semibold text-[#111827]">Care & Background</h2>
          </div>
          <div className="grid gap-4 p-5 md:grid-cols-3">
            <NarrativeCard icon={FileText} label="Background" value={orphan.backgroundSummary} />
            <NarrativeCard icon={Stethoscope} label="Health" value={orphan.healthNotes} />
            <NarrativeCard icon={School} label="Education" value={orphan.educationStatus} />
          </div>
        </section>

        {(canSubmit || canApprove) && orphan.profileStatus !== 'archived' ? (
          <section className={cn(surface, 'p-5')}>
            <h2 className="text-lg font-semibold text-[#111827]">Profile Workflow</h2>
            <p className="mt-1 text-sm text-[#6b7280]">
              Only actions permitted for your role and this profile state are shown.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {canSubmit && orphan.profileStatus === 'draft' ? (
                <button
                  className={cn(workSurface.secondaryButton, 'h-10 px-4 text-sm')}
                  onClick={() => onRunAction('submit-for-review', 'Submitted for review')}
                  type="button"
                >
                  <Send className="h-4 w-4" />
                  Submit for Review
                </button>
              ) : null}
              {canApprove && orphan.profileStatus === 'under_review' ? (
                <button
                  className={cn(workSurface.primaryButton, 'h-10 px-4 text-sm')}
                  onClick={() => onRunAction('approve', 'Profile approved')}
                  type="button"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  Approve Profile
                </button>
              ) : null}
            </div>
          </section>
        ) : null}
      </main>

      <aside className="space-y-5">
        <section className={surface}>
          <div className="border-b border-[#e8ece8] px-5 py-3.5">
            <h2 className="text-lg font-semibold text-[#111827]">Guardian</h2>
          </div>
          <div className="divide-y divide-[#edf0ed] px-5">
            <OverviewRow
              icon={UserRound}
              label="Name"
              value={orphan.guardian?.guardianName ?? 'Not recorded'}
            />
            <OverviewRow
              icon={UsersRound}
              label="Relationship"
              value={orphan.guardian?.relationship ?? 'Not recorded'}
            />
            <OverviewRow
              icon={Phone}
              label="Phone"
              value={orphan.guardian?.phone ?? 'Not recorded'}
            />
            <OverviewRow
              icon={MapPin}
              label="Address"
              value={orphan.guardian?.address ?? 'Not recorded'}
            />
          </div>
        </section>

        <section className={surface}>
          <div className="border-b border-[#e8ece8] px-5 py-3.5">
            <h2 className="text-lg font-semibold text-[#111827]">Profile Ownership</h2>
          </div>
          <div className="divide-y divide-[#edf0ed] px-5">
            <OverviewRow
              icon={UserRound}
              label="Added By"
              value={orphan.createdByTeamMember?.fullName ?? 'Not recorded'}
            />
            <OverviewRow
              icon={BadgeCheck}
              label="Approved By"
              value={orphan.approvedByTeamMember?.fullName ?? 'Not recorded'}
            />
          </div>
        </section>

        {canArchive && orphan.profileStatus !== 'archived' ? (
          <section className={cn(surface, 'p-5')}>
            <h2 className="text-lg font-semibold text-[#111827]">Archive Profile</h2>
            <p className="mt-1 text-sm text-[#6b7280]">
              Archiving removes this profile from active operational queues.
            </p>
            <textarea
              className={cn(workSurface.field, 'mt-4 min-h-24 w-full px-3 py-2')}
              onChange={(event) => onArchiveReasonChange(event.target.value)}
              placeholder="Reason for archiving"
              value={archiveReason}
            />
            <button
              className="mt-3 inline-flex h-9 items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 text-sm font-semibold text-red-700 transition hover:bg-red-100"
              onClick={() => onRunAction('archive', 'Profile archived', { archiveReason })}
              type="button"
            >
              <Archive className="h-4 w-4" />
              Archive Profile
            </button>
          </section>
        ) : null}
      </aside>
    </div>
  );
}

function OverviewRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
}) {
  return (
    <div className="grid grid-cols-[1.2fr_1fr] gap-3 py-3.5 text-sm">
      <dt className="flex items-center gap-2 text-[#6b7280]">
        <Icon className="h-4 w-4 shrink-0" />
        {label}
      </dt>
      <dd className="text-right font-medium text-[#374151]">{value}</dd>
    </div>
  );
}

function NarrativeCard({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: string | null;
}) {
  return (
    <article className="rounded-lg border border-[#e2e7e2] bg-[#fbfcfb] p-4">
      <div className="flex items-center gap-2 text-sm font-semibold text-[#374151]">
        <Icon className="h-4 w-4 text-[#006b4f]" />
        {label}
      </div>
      <p className="mt-3 text-sm leading-6 text-[#596274]">{value || 'Not recorded yet.'}</p>
    </article>
  );
}

function DocumentsTab({
  canUpload,
  canView,
  documentFile,
  documentForm,
  documentInputKey,
  onAddDocument,
  onDocumentFileChange,
  onDocumentFormChange,
  orphan,
  uploading,
}: {
  canUpload: boolean;
  canView: boolean;
  documentFile: File | null;
  documentForm: DocumentInput;
  documentInputKey: number;
  onAddDocument: () => Promise<void>;
  onDocumentFileChange: (file: File | null) => void;
  onDocumentFormChange: React.Dispatch<React.SetStateAction<DocumentInput>>;
  orphan: OrphanProfile;
  uploading: boolean;
}) {
  if (!canView) {
    return (
      <section className={surface}>
        <RestrictedPanel
          description="Orphan documents require the dedicated Orphan Documents permission. File names and links are not shown for this role."
          title="Documents restricted"
        />
      </section>
    );
  }

  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1.4fr)_minmax(20rem,0.7fr)]">
      <section className={surface}>
        <div className="border-b border-[#e8ece8] px-5 py-3.5">
          <h2 className="text-lg font-semibold text-[#111827]">Profile Documents</h2>
          <p className="mt-1 text-sm text-[#6b7280]">
            Verification, identity, school, guardian, and medical files.
          </p>
        </div>
        {orphan.documents.length > 0 ? (
          <div className="divide-y divide-[#edf0ed]">
            {orphan.documents.map((document) => (
              <a
                className="flex items-center justify-between gap-4 px-5 py-4 transition hover:bg-[#fbfcfb]"
                href={getDocumentHref(orphan.id, document)}
                key={document.id}
                rel="noreferrer"
                target="_blank"
              >
                <span className="flex min-w-0 items-center gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
                    <FileText className="h-4 w-4" />
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold text-[#374151]">
                      {document.fileName}
                    </span>
                    <span className="mt-0.5 block text-xs text-[#6b7280]">
                      {document.documentCategory
                        ? documentCategoryLabels[document.documentCategory]
                        : 'Document'}{' '}
                      · {formatDate(document.createdAt)}
                    </span>
                  </span>
                </span>
                <ExternalLink className="h-4 w-4 shrink-0 text-[#6b7280]" />
              </a>
            ))}
          </div>
        ) : (
          <div className="px-5 py-12 text-center">
            <FileText className="mx-auto h-9 w-9 text-[#9ca3af]" />
            <p className="mt-3 text-sm font-semibold text-[#374151]">No documents added yet</p>
          </div>
        )}
      </section>

      {canUpload ? (
        <section className={cn(surface, 'h-fit p-5')}>
          <h2 className="text-lg font-semibold text-[#111827]">Add Document</h2>
          <p className="mt-1 text-sm text-[#6b7280]">PDF, JPEG, PNG, or WebP up to 10 MB.</p>
          <div className="mt-4 space-y-4">
            <FormLabel label="Document File">
              <input
                accept="application/pdf,image/jpeg,image/png,image/webp"
                aria-label="Document File"
                className="mt-2 block w-full cursor-pointer rounded-lg border border-[#d8ded8] bg-white px-3 py-2 text-sm text-[#374151] file:mr-3 file:cursor-pointer file:rounded-md file:border-0 file:bg-[#006b4f] file:px-3 file:py-2 file:text-xs file:font-semibold file:text-white"
                key={documentInputKey}
                onChange={(event) => onDocumentFileChange(event.target.files?.[0] ?? null)}
                type="file"
              />
            </FormLabel>
            <TextField
              label="File Name"
              onChange={(value) =>
                onDocumentFormChange((current) => ({ ...current, fileName: value }))
              }
              value={documentForm.fileName}
            />
            <SelectField
              label="Category"
              onChange={(value) =>
                onDocumentFormChange((current) => ({
                  ...current,
                  documentCategory: value as DocumentCategory,
                }))
              }
              value={documentForm.documentCategory ?? 'other'}
            >
              {(Object.keys(documentCategoryLabels) as DocumentCategory[]).map((category) => (
                <option key={category} value={category}>
                  {documentCategoryLabels[category]}
                </option>
              ))}
            </SelectField>
            <button
              className={cn(workSurface.primaryButton, 'h-10 w-full px-4 text-sm')}
              disabled={!documentFile || uploading}
              onClick={onAddDocument}
              type="button"
            >
              <FilePlus2 className="h-4 w-4" />
              {uploading ? 'Uploading...' : 'Add Document'}
            </button>
          </div>
        </section>
      ) : null}
    </div>
  );
}

function ActivityTab({ orphan }: { orphan: OrphanProfile }) {
  const items = useMemo(() => {
    const statusItems = orphan.statusHistory.map((item) => ({
      actor: item.changedByTeamMember?.fullName ?? 'Not recorded',
      date: item.changedAt,
      id: `status-${item.id}`,
      reason: item.reason,
      title: formatStatusTransition(item.previousStatus, item.newStatus),
      type: 'Profile status',
    }));
    const verificationItems = orphan.verificationHistory.map((item) => ({
      actor: item.changedByTeamMember?.fullName ?? 'Not recorded',
      date: item.changedAt,
      id: `verification-${item.id}`,
      reason: item.reason,
      title: formatVerificationTransition(item.previousStatus, item.newStatus),
      type: 'Verification',
    }));
    return [...statusItems, ...verificationItems].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    );
  }, [orphan.statusHistory, orphan.verificationHistory]);

  return (
    <section className={surface}>
      <div className="border-b border-[#e8ece8] px-5 py-3.5">
        <h2 className="text-lg font-semibold text-[#111827]">Profile Activity</h2>
        <p className="mt-1 text-sm text-[#6b7280]">
          Verification and profile status changes in one chronological record.
        </p>
      </div>
      {items.length > 0 ? (
        <div className="divide-y divide-[#edf0ed]">
          {items.map((item) => (
            <article className="grid gap-3 px-5 py-4 sm:grid-cols-[2.5rem_1fr_auto]" key={item.id}>
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-50 text-emerald-700">
                <Clock3 className="h-4 w-4" />
              </span>
              <div>
                <p className="text-sm font-semibold text-[#374151]">{item.title}</p>
                <p className="mt-1 text-xs text-[#6b7280]">
                  {item.type} · Changed by {item.actor}
                </p>
                {item.reason ? (
                  <p className="mt-2 text-sm leading-6 text-[#596274]">{item.reason}</p>
                ) : null}
              </div>
              <time className="text-xs text-[#6b7280]" dateTime={item.date}>
                {formatDateTime(item.date)}
              </time>
            </article>
          ))}
        </div>
      ) : (
        <div className="px-5 py-12 text-center">
          <Clock3 className="mx-auto h-9 w-9 text-[#9ca3af]" />
          <p className="mt-3 text-sm font-semibold text-[#374151]">No activity recorded yet</p>
        </div>
      )}
    </section>
  );
}

function ProfileStatusPill({ status }: { status: OrphanProfileStatus }) {
  const className =
    status === 'matched'
      ? workflowStatus.green
      : status === 'approved'
        ? workflowStatus.blue
        : status === 'under_review'
          ? workflowStatus.amber
          : workflowStatus.neutral;

  return (
    <span
      className={cn(
        'rounded-md border px-2 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.04em]',
        className,
      )}
    >
      {profileStatusLabels[status]}
    </span>
  );
}

function VerificationStatusPill({ status }: { status: OrphanVerificationStatus }) {
  const className =
    status === 'rejected'
      ? workflowStatus.red
      : status === 'needs_more_information'
        ? workflowStatus.amber
        : status === 'field_verified'
          ? workflowStatus.green
          : status === 'documents_received'
            ? workflowStatus.blue
            : workflowStatus.neutral;

  return (
    <span
      className={cn(
        'rounded-md border px-2 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.04em]',
        className,
      )}
    >
      {verificationLabels[status]}
    </span>
  );
}

function TextField({
  label,
  onChange,
  type = 'text',
  value,
}: {
  label: string;
  onChange: (value: string) => void;
  type?: string;
  value: string;
}) {
  return (
    <FormLabel label={label}>
      <input
        aria-label={label}
        className={cn(workSurface.field, 'mt-2 h-10 w-full px-3')}
        onChange={(event) => onChange(event.target.value)}
        type={type}
        value={value}
      />
    </FormLabel>
  );
}

function TextArea({
  label,
  onChange,
  value,
}: {
  label: string;
  onChange: (value: string) => void;
  value: string;
}) {
  return (
    <FormLabel label={label}>
      <textarea
        aria-label={label}
        className={cn(workSurface.field, 'mt-2 min-h-28 w-full px-3 py-2')}
        onChange={(event) => onChange(event.target.value)}
        value={value}
      />
    </FormLabel>
  );
}

function SelectField({
  children,
  label,
  onChange,
  value,
}: {
  children: React.ReactNode;
  label: string;
  onChange: (value: string) => void;
  value: string;
}) {
  return (
    <FormLabel label={label}>
      <select
        aria-label={label}
        className={cn(workSurface.field, 'mt-2 h-10 w-full px-3')}
        onChange={(event) => onChange(event.target.value)}
        value={value}
      >
        {children}
      </select>
    </FormLabel>
  );
}

function FormLabel({ children, label }: { children: React.ReactNode; label: string }) {
  return (
    <div className="block">
      <span className="text-sm font-medium text-[#374151]">{label}</span>
      {children}
    </div>
  );
}

function toForm(orphan: OrphanProfile): OrphanProfileUpdate {
  return {
    ageEstimate: orphan.ageEstimate,
    backgroundSummary: orphan.backgroundSummary ?? '',
    cityArea: orphan.cityArea ?? '',
    dateOfBirth: orphan.dateOfBirth ?? '',
    educationStatus: orphan.educationStatus ?? '',
    fullName: orphan.fullName,
    gender: orphan.gender,
    guardian: {
      address: orphan.guardian?.address ?? '',
      guardianName: orphan.guardian?.guardianName ?? '',
      notes: orphan.guardian?.notes ?? '',
      phone: orphan.guardian?.phone ?? '',
      relationship: orphan.guardian?.relationship ?? '',
      whatsapp: orphan.guardian?.whatsapp ?? '',
    },
    healthNotes: orphan.healthNotes ?? '',
    orphanCode: orphan.orphanCode,
    profileImageUrl: orphan.profileImageUrl,
    verificationStatus: orphan.verificationStatus,
  };
}

function getDocumentHref(orphanId: string, document: Document) {
  if (/^https?:\/\//.test(document.fileUrl)) return document.fileUrl;
  return `/api/admin/orphans/${orphanId}/documents/${document.id}/file`;
}

function matchesPaymentFilter(receipt: OrphanPaymentRecord, filter: PaymentFilter) {
  if (filter === 'all') return true;
  if (filter === 'delivered') return receipt.status === 'money_delivered';
  if (filter === 'verified') return paidStatuses.has(receipt.status);
  if (filter === 'in_review') {
    return ['submitted', 'ready_for_review', 'reviewed'].includes(receipt.status);
  }
  return receipt.status === 'rejected';
}

function getPaymentDate(receipt: OrphanPaymentRecord) {
  return (
    receipt.transferDate ?? receipt.moneyDeliveredAt ?? receipt.verifiedAt ?? receipt.submittedAt
  );
}

function monthIndex(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.getUTCFullYear() * 12 + date.getUTCMonth();
}

function monthDateFromIndex(index: number) {
  const year = Math.floor(index / 12);
  const month = index % 12;
  return new Date(Date.UTC(year, month, 1)).toISOString().slice(0, 10);
}

function buildPaymentSummary(
  matches: OrphanSponsorshipMatchSummary[],
  receipts: OrphanPaymentRecord[] | null,
) {
  if (!receipts) {
    return {
      duePeriods: 0,
      expectedPeriods: 0,
      latestPaidMonth: null as string | null,
      nextDueMonth: null as string | null,
      paidPeriods: 0,
      paidReceiptCount: 0,
      percentage: 0,
      rejectedReceipts: 0,
      totalReceived: 0,
    };
  }

  const current = new Date();
  const currentMonthIndex = current.getUTCFullYear() * 12 + current.getUTCMonth();
  const expectedPeriodKeys = new Set<string>();

  for (const match of matches) {
    if (match.status === 'voided') continue;
    const start = monthIndex(match.startedAt);
    const ended = match.endedAt ? monthIndex(match.endedAt) : currentMonthIndex;
    const end = Math.min(ended ?? currentMonthIndex, currentMonthIndex);
    if (start === null || end < start) continue;
    for (let index = start; index <= end && index - start < 600; index += 1) {
      expectedPeriodKeys.add(`${match.id}:${index}`);
    }
  }

  const paidReceipts = receipts.filter((receipt) => paidStatuses.has(receipt.status));
  const paidPeriodKeys = new Set(
    paidReceipts
      .map((receipt) => {
        const index = monthIndex(receipt.donationMonth);
        return index === null ? null : `${receipt.matchId}:${index}`;
      })
      .filter((value): value is string => Boolean(value)),
  );
  const paidExpectedPeriods = [...expectedPeriodKeys].filter((key) =>
    paidPeriodKeys.has(key),
  ).length;
  const dueKeys = [...expectedPeriodKeys].filter((key) => !paidPeriodKeys.has(key));
  const nextDueIndex = dueKeys
    .map((key) => Number(key.split(':').at(-1)))
    .filter(Number.isFinite)
    .sort((a, b) => a - b)[0];
  const expectedPeriods = expectedPeriodKeys.size;
  const percentage =
    expectedPeriods === 0
      ? 0
      : Math.min(100, Math.round((paidExpectedPeriods / expectedPeriods) * 100));
  const latestPaidMonth =
    paidReceipts
      .map((receipt) => receipt.donationMonth)
      .sort()
      .at(-1) ?? null;

  return {
    duePeriods: Math.max(0, expectedPeriods - paidExpectedPeriods),
    expectedPeriods,
    latestPaidMonth,
    nextDueMonth: Number.isFinite(nextDueIndex) ? monthDateFromIndex(nextDueIndex) : null,
    paidPeriods: paidExpectedPeriods,
    paidReceiptCount: paidReceipts.length,
    percentage,
    rejectedReceipts: receipts.filter((receipt) => receipt.status === 'rejected').length,
    totalReceived: paidReceipts.reduce((total, receipt) => total + receipt.amount, 0),
  };
}

function csvCell(value: string) {
  return `"${value.replaceAll('"', '""')}"`;
}

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

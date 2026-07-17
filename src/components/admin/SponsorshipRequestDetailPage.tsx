'use client';

import { useEffect, useState } from 'react';

import Link from 'next/link';

import {
  BadgeCheck,
  CalendarDays,
  Check,
  CheckCircle2,
  Clock3,
  ExternalLink,
  Mail,
  MessageCircle,
  MessageSquareText,
  Phone,
  Save,
  UserRound,
  UsersRound,
} from 'lucide-react';
import useSWR from 'swr';

import { useAdminAccount } from '@/components/admin/AdminShell';
import BackLink from '@/components/ui/BackLink';
import { useConfirmation } from '@/components/ui/ConfirmationProvider';
import { CustomSelect } from '@/components/ui/CustomSelect';
import { NavLinkIcon } from '@/components/ui/NavLinkIcon';
import { useToast } from '@/components/ui/ToastProvider';
import { workflowStatus, workSurface } from '@/components/ui/work-surface';

import {
  canAssignSponsorshipRequests,
  canConvertSponsorshipRequestsToDonor,
  canCreateContactLogs,
  canUpdateSponsorshipRequests,
} from '@/lib/adminPermissions';
import { fetchApiData } from '@/lib/apiFetcher';
import {
  getNextSponsorshipRequestStatus,
  getSponsorshipRequestStatusIndex,
} from '@/lib/sponsorshipStatus';
import { cn } from '@/lib/utils';

import type {
  ContactLog,
  ContactLogDirection,
  ContactLogInput,
  ContactLogMethod,
  ContactLogOutcome,
  PreferredContactMethod,
  RequestSource,
  SponsorshipRequest,
  SponsorshipRequestStatus,
  TeamMemberSummary,
} from '@/types/sponsorship';

const statusOptions: Array<{ label: string; value: SponsorshipRequestStatus }> = [
  { label: 'New request', value: 'new' },
  { label: 'Contacted', value: 'contacted' },
  { label: 'Profiles prepared', value: 'profiles_prepared' },
  { label: 'Profiles shared', value: 'profiles_shared' },
  { label: 'Converted to donor', value: 'converted_to_donor' },
  { label: 'Sponsorship confirmed', value: 'closed' },
];

const methodOptions: Array<{ label: string; value: PreferredContactMethod }> = [
  { label: 'WhatsApp', value: 'whatsapp' },
  { label: 'Phone Call', value: 'phone' },
  { label: 'Email', value: 'email' },
];

const requestSourceOptions: Array<{ label: string; value: RequestSource }> = [
  { label: 'Public form', value: 'public_form' },
  { label: 'Admin created', value: 'admin_created' },
  { label: 'WhatsApp', value: 'whatsapp' },
  { label: 'Phone call', value: 'phone' },
  { label: 'Email', value: 'email' },
  { label: 'Referral', value: 'referral' },
  { label: 'Walk-in', value: 'walk_in' },
  { label: 'Other', value: 'other' },
];

const contactMethodOptions: Array<{ label: string; value: ContactLogMethod }> = [
  ...methodOptions,
  { label: 'SMS', value: 'sms' },
  { label: 'In person', value: 'in_person' },
  { label: 'Other', value: 'other' },
];

const contactDirectionOptions: Array<{ label: string; value: ContactLogDirection }> = [
  { label: 'Outbound', value: 'outbound' },
  { label: 'Inbound', value: 'inbound' },
  { label: 'Internal note', value: 'internal_note' },
];

const contactOutcomeOptions: Array<{ label: string; value: ContactLogOutcome }> = [
  { label: 'Logged', value: 'logged' },
  { label: 'Reached', value: 'reached' },
  { label: 'No response', value: 'no_response' },
  { label: 'Follow-up needed', value: 'follow_up_needed' },
  { label: 'Not interested', value: 'not_interested' },
];

const statusStyles: Record<SponsorshipRequestStatus, string> = {
  closed: workflowStatus.neutral,
  contacted: workflowStatus.amber,
  converted_to_donor: workflowStatus.green,
  new: workflowStatus.blue,
  profiles_prepared: workflowStatus.amber,
  profiles_shared: workflowStatus.blue,
};

type ContactForm = ContactLogInput & { nextFollowUpAt: string };

export function SponsorshipRequestDetailPage({
  initialAssignees,
  initialContactLogs,
  initialRequest,
}: {
  initialAssignees: TeamMemberSummary[];
  initialContactLogs: ContactLog[];
  initialRequest: SponsorshipRequest;
}) {
  const { teamMember } = useAdminAccount();
  const confirm = useConfirmation();
  const toast = useToast();
  const canAssign = canAssignSponsorshipRequests(teamMember);
  const canConvert = canConvertSponsorshipRequestsToDonor(teamMember);
  const canCreateLog = canCreateContactLogs(teamMember);
  const canEdit = canUpdateSponsorshipRequests(teamMember);

  const { data: request = initialRequest, mutate: mutateRequest } = useSWR<SponsorshipRequest>(
    `/api/admin/sponsorship-requests/${initialRequest.id}`,
    fetchApiData,
    { fallbackData: initialRequest },
  );
  const { data: contactLogs = initialContactLogs, mutate: mutateContactLogs } = useSWR<
    ContactLog[]
  >(`/api/admin/sponsorship-requests/${initialRequest.id}/contact-logs`, fetchApiData, {
    fallbackData: initialContactLogs,
  });

  const [status, setStatus] = useState(request.status);
  const [assignedTeamMemberId, setAssignedTeamMemberId] = useState(
    request.assignedTeamMemberId ?? '',
  );
  const [nextFollowUpAt, setNextFollowUpAt] = useState(
    toDateTimeInputValue(request.nextFollowUpAt),
  );
  const [adminNotes, setAdminNotes] = useState(request.adminNotes ?? '');
  const [saving, setSaving] = useState(false);
  const [converting, setConverting] = useState(false);
  const [logging, setLogging] = useState(false);
  const [logError, setLogError] = useState('');
  const [contactForm, setContactForm] = useState<ContactForm>(() => ({
    contactMethod: request.preferredContactMethod,
    direction: 'outbound',
    nextFollowUpAt: '',
    outcome: 'logged',
    summary: '',
  }));

  useEffect(() => {
    setStatus(request.status);
    setAssignedTeamMemberId(request.assignedTeamMemberId ?? '');
    setNextFollowUpAt(toDateTimeInputValue(request.nextFollowUpAt));
    setAdminNotes(request.adminNotes ?? '');
  }, [
    request.adminNotes,
    request.assignedTeamMemberId,
    request.id,
    request.nextFollowUpAt,
    request.status,
  ]);

  const latestContact = contactLogs[0] ?? null;
  const requestAge = getRequestAge(request.createdAt);
  const followUpState = getFollowUpState(request.nextFollowUpAt);
  const requestNumber = formatRequestNumber(request);
  const whatsappHref = getWhatsappHref(request.phone);

  const saveRequest = async () => {
    if (!canEdit) return;

    const confirmed = await confirm({
      confirmLabel: 'Save Request',
      description: `Save changes to ${request.fullName}'s sponsorship request.`,
      title: 'Save sponsorship request?',
    });
    if (!confirmed) return;

    setSaving(true);
    try {
      const response = await fetch(`/api/admin/sponsorship-requests/${request.id}`, {
        body: JSON.stringify({
          adminNotes,
          ...(canAssign ? { assignedTeamMemberId: assignedTeamMemberId || null } : {}),
          nextFollowUpAt: fromDateTimeInputValue(nextFollowUpAt),
          status,
        }),
        headers: { 'Content-Type': 'application/json' },
        method: 'PATCH',
      });
      const body = (await response.json().catch(() => null)) as {
        data?: SponsorshipRequest;
        error?: string;
      } | null;

      if (!response.ok || !body?.data) {
        toast({
          description: body?.error ?? 'The request could not be updated.',
          title: 'Update failed',
          type: 'error',
        });
        return;
      }

      await mutateRequest(body.data, { revalidate: false });
      toast({
        description: `${body.data.fullName}'s request was updated.`,
        title: 'Request updated',
        type: 'success',
      });
    } catch {
      toast({
        description: 'Please check your connection and try again.',
        title: 'Update failed',
        type: 'error',
      });
    } finally {
      setSaving(false);
    }
  };

  const logContact = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!contactForm.summary.trim()) {
      setLogError('Add a short summary before saving this contact note.');
      return;
    }

    setLogError('');
    setLogging(true);
    try {
      const response = await fetch(`/api/admin/sponsorship-requests/${request.id}/contact-logs`, {
        body: JSON.stringify({
          contactMethod: contactForm.contactMethod,
          direction: contactForm.direction,
          nextFollowUpAt: fromDateTimeInputValue(contactForm.nextFollowUpAt),
          outcome: contactForm.outcome,
          summary: contactForm.summary.trim(),
        }),
        headers: { 'Content-Type': 'application/json' },
        method: 'POST',
      });
      const body = (await response.json().catch(() => null)) as {
        data?: ContactLog;
        error?: string;
      } | null;

      if (!response.ok || !body?.data) {
        const message = body?.error ?? 'The contact note could not be saved.';
        setLogError(message);
        toast({ description: message, title: 'Contact log failed', type: 'error' });
        return;
      }

      await mutateContactLogs((current) => [body.data as ContactLog, ...(current ?? [])], {
        revalidate: false,
      });
      await mutateRequest();
      setContactForm((current) => ({
        ...current,
        nextFollowUpAt: '',
        outcome: 'logged',
        summary: '',
      }));
      toast({
        description: 'The contact note was added to this request.',
        title: 'Contact logged',
        type: 'success',
      });
    } catch {
      const message = 'Please check your connection and try again.';
      setLogError(message);
      toast({ description: message, title: 'Contact log failed', type: 'error' });
    } finally {
      setLogging(false);
    }
  };

  const convertToDonor = async () => {
    const confirmed = await confirm({
      confirmLabel: 'Convert to Donor',
      description: `Create or link a donor profile for ${request.fullName}. The request history will be preserved.`,
      title: 'Convert request to donor?',
    });
    if (!confirmed) return;

    setConverting(true);
    try {
      const response = await fetch(
        `/api/admin/sponsorship-requests/${request.id}/convert-to-donor`,
        { method: 'POST' },
      );
      const body = (await response.json().catch(() => null)) as {
        data?: { request: SponsorshipRequest };
        error?: string;
      } | null;

      if (!response.ok || !body?.data?.request) {
        toast({
          description: body?.error ?? 'The request could not be converted.',
          title: 'Conversion failed',
          type: 'error',
        });
        return;
      }

      await mutateRequest(body.data.request, { revalidate: false });
      await mutateContactLogs();
      toast({
        description: `${body.data.request.fullName} is now linked to a donor profile.`,
        title: 'Request converted',
        type: 'success',
      });
    } catch {
      toast({
        description: 'Please check your connection and try again.',
        title: 'Conversion failed',
        type: 'error',
      });
    } finally {
      setConverting(false);
    }
  };

  return (
    <div className={workSurface.page}>
      <header className="space-y-4">
        <BackLink href="/admin/sponsorship-requests" label="Back to Sponsorship Requests" />
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className={workSurface.title}>Sponsorship Request</h1>
              <StatusPill request={request} />
            </div>
            <p className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-[#596274]">
              <span>{requestNumber}</span>
              <span aria-hidden="true">·</span>
              <span>Submitted {formatDate(request.createdAt)}</span>
              <span aria-hidden="true">·</span>
              <span>{getRequestSourceLabel(request)}</span>
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <a
              className={cn(workSurface.secondaryButton, 'h-10 px-4 text-sm')}
              href={`mailto:${request.email}`}
            >
              <Mail className="h-4 w-4" />
              Email Sponsor
            </a>
            {whatsappHref ? (
              <a
                className={cn(workSurface.secondaryButton, 'h-10 px-4 text-sm')}
                href={whatsappHref}
                rel="noreferrer"
                target="_blank"
              >
                <MessageCircle className="h-4 w-4" />
                WhatsApp
              </a>
            ) : null}
          </div>
        </div>
      </header>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard icon={CalendarDays} label="Request Age">
          <p className="text-xl font-semibold text-[#111827]">{requestAge}</p>
          <p className="mt-1 text-xs text-[#6b7280]">Submitted {formatDate(request.createdAt)}</p>
        </SummaryCard>
        <SummaryCard icon={MessageCircle} label="Last Contact">
          <p className="text-xl font-semibold text-[#111827]">
            {request.lastContactedAt
              ? formatRelativeTime(request.lastContactedAt)
              : 'Not contacted'}
          </p>
          <p className="mt-1 text-xs text-[#6b7280]">
            {latestContact
              ? `${getContactMethodLabel(latestContact.contactMethod)} · ${getContactOutcomeLabel(latestContact.outcome)}`
              : 'No contact notes yet'}
          </p>
        </SummaryCard>
        <SummaryCard icon={Clock3} label="Next Follow-up" tone="amber">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-lg font-semibold text-[#111827]">
              {request.nextFollowUpAt ? formatDateTime(request.nextFollowUpAt) : 'Not scheduled'}
            </p>
            {followUpState ? <FollowUpPill state={followUpState} /> : null}
          </div>
        </SummaryCard>
        <SummaryCard icon={UserRound} label="Assigned To">
          <p className="text-xl font-semibold text-[#111827]">
            {request.assignedTeamMember?.fullName ?? request.assignedTo ?? 'Unassigned'}
          </p>
          <p className="mt-1 text-xs text-[#6b7280]">
            {request.assignedTeamMember
              ? formatRole(request.assignedTeamMember.role)
              : 'No owner assigned'}
          </p>
        </SummaryCard>
      </section>

      <WorkflowCard request={request} />

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.75fr)_minmax(20rem,0.85fr)] xl:items-start">
        <main className="min-w-0 space-y-5">
          <SponsorInformationCard request={request} whatsappHref={whatsappHref} />

          <section className={cn(workSurface.card, 'p-5')}>
            <div className="flex items-center gap-2">
              <MessageSquareText className="h-5 w-5 text-[#006b4f]" />
              <h2 className="text-lg font-semibold text-[#111827]">Message / Request Notes</h2>
            </div>
            <p className="mt-3 rounded-lg border border-[#e8ece8] bg-[#fafbf9] p-4 text-sm leading-6 text-[#4b5563]">
              {request.message || 'No message was provided with this request.'}
            </p>
          </section>

          <ContactHistoryCard contactLogs={contactLogs} request={request} />
        </main>

        <aside className="min-w-0 space-y-5">
          <RequestManagementCard
            adminNotes={adminNotes}
            assignedTeamMemberId={assignedTeamMemberId}
            assignees={initialAssignees}
            canAssign={canAssign}
            canConvert={canConvert}
            canEdit={canEdit}
            converting={converting}
            nextFollowUpAt={nextFollowUpAt}
            onAdminNotesChange={setAdminNotes}
            onAssignedTeamMemberIdChange={setAssignedTeamMemberId}
            onConvert={convertToDonor}
            onNextFollowUpAtChange={setNextFollowUpAt}
            onSave={saveRequest}
            onStatusChange={setStatus}
            request={request}
            saving={saving}
            status={status}
          />

          {canCreateLog ? (
            <LogContactCard
              error={logError}
              form={contactForm}
              logging={logging}
              onChange={setContactForm}
              onSubmit={logContact}
            />
          ) : null}
        </aside>
      </div>

      <p className="text-xs text-[#6b7280]">
        Created by {getCreatedByLabel(request)}
        <span className="px-2" aria-hidden="true">
          ·
        </span>
        Last updated {formatDateTime(request.updatedAt)}
      </p>
    </div>
  );
}

function SummaryCard({
  children,
  icon: Icon,
  label,
  tone = 'green',
}: {
  children: React.ReactNode;
  icon: React.ElementType;
  label: string;
  tone?: 'amber' | 'green';
}) {
  return (
    <article className={cn(workSurface.card, 'flex min-h-28 items-start gap-3 p-4')}>
      <span
        className={cn(
          'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg',
          tone === 'amber' ? workSurface.amberIcon : workSurface.greenIcon,
        )}
      >
        <Icon className="h-5 w-5" />
      </span>
      <div className="min-w-0">
        <p className="mb-2 text-[0.68rem] font-semibold uppercase tracking-[0.08em] text-[#6b7280]">
          {label}
        </p>
        {children}
      </div>
    </article>
  );
}

function WorkflowCard({ request }: { request: SponsorshipRequest }) {
  const currentIndex = getSponsorshipRequestStatusIndex(request.status);

  return (
    <section className={cn(workSurface.card, 'overflow-hidden p-5')}>
      <div className="flex items-center gap-2">
        <BadgeCheck className="h-5 w-5 text-[#006b4f]" />
        <h2 className="text-lg font-semibold text-[#111827]">Request Progress</h2>
      </div>
      <div className="mt-5 overflow-x-auto pb-2">
        <div className="grid min-w-[760px] grid-cols-6">
          {statusOptions.map((step, index) => {
            const date = getStatusStepDate(request, step.value);
            const complete = index < currentIndex || Boolean(date && index <= currentIndex);
            const current = index === currentIndex;

            return (
              <div className="relative px-2 text-center" key={step.value}>
                {index > 0 ? (
                  <span
                    className={cn(
                      'absolute right-1/2 top-4 h-px w-full',
                      index <= currentIndex ? 'bg-[#0d8a67]' : 'bg-[#d8ded8]',
                    )}
                  />
                ) : null}
                <span
                  className={cn(
                    'relative z-10 mx-auto flex h-8 w-8 items-center justify-center rounded-full border-2 text-xs font-semibold',
                    current
                      ? 'border-[#0d8a67] bg-white text-[#006b4f]'
                      : complete
                        ? 'border-[#0d8a67] bg-[#0d8a67] text-white'
                        : 'border-[#d8ded8] bg-white text-[#9ca3af]',
                  )}
                >
                  {complete && !current ? <Check className="h-4 w-4" /> : index + 1}
                </span>
                <p className={cn('mt-2 text-xs font-semibold', current ? 'text-[#006b4f]' : '')}>
                  {step.label}
                </p>
                <p className="mt-1 text-xs text-[#6b7280]">
                  {date ? formatShortDate(date) : 'Pending'}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function SponsorInformationCard({
  request,
  whatsappHref,
}: {
  request: SponsorshipRequest;
  whatsappHref: string | null;
}) {
  return (
    <section className={cn(workSurface.card, 'p-5')}>
      <div className="flex items-center gap-2">
        <UserRound className="h-5 w-5 text-[#006b4f]" />
        <h2 className="text-lg font-semibold text-[#111827]">Sponsor Information</h2>
      </div>
      <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-start">
        <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-lg font-semibold text-emerald-800">
          {getInitials(request.fullName)}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-xl font-semibold text-[#111827]">{request.fullName}</h3>
            {request.convertedDonorId ? (
              <span
                className={cn(
                  'rounded-md border px-2 py-1 text-xs font-semibold',
                  workflowStatus.green,
                )}
              >
                Donor profile linked
              </span>
            ) : null}
          </div>
          <dl className="mt-4 grid gap-x-8 gap-y-4 sm:grid-cols-2">
            <InfoItem label="Email" value={request.email} />
            <InfoItem label="Phone / WhatsApp" value={request.phone} />
            <InfoItem label="City / Country" value={request.cityCountry || 'Not provided'} />
            <InfoItem
              label="Preferred Contact"
              value={getMethodLabel(request.preferredContactMethod)}
            />
            <InfoItem label="Request Source" value={getRequestSourceLabel(request)} />
            <div>
              <dt className="text-xs font-medium text-[#6b7280]">Minimum Amount</dt>
              <dd className="mt-1">
                <span
                  className={cn(
                    'inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs font-semibold',
                    request.confirmedMinimumAmount ? workflowStatus.green : workflowStatus.amber,
                  )}
                >
                  {request.confirmedMinimumAmount ? <Check className="h-3.5 w-3.5" /> : null}
                  {request.confirmedMinimumAmount ? 'Confirmed' : 'Not confirmed'}
                </span>
              </dd>
            </div>
          </dl>
          <div className="mt-5 flex flex-wrap gap-4 border-t border-[#edf0ed] pt-4 text-sm font-semibold text-[#006b4f]">
            <a
              className="inline-flex items-center gap-2 hover:underline"
              href={`mailto:${request.email}`}
            >
              <Mail className="h-4 w-4" />
              Send email
            </a>
            {whatsappHref ? (
              <a
                className="inline-flex items-center gap-2 hover:underline"
                href={whatsappHref}
                rel="noreferrer"
                target="_blank"
              >
                <MessageCircle className="h-4 w-4" />
                Open WhatsApp
              </a>
            ) : null}
            {request.convertedDonorId ? (
              <Link
                className="inline-flex items-center gap-2 hover:underline"
                href={`/admin/donors/${request.convertedDonorId}`}
              >
                View donor profile
                <NavLinkIcon className="h-3.5 w-3.5" icon={ExternalLink} />
              </Link>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}

function ContactHistoryCard({
  contactLogs,
  request,
}: {
  contactLogs: ContactLog[];
  request: SponsorshipRequest;
}) {
  return (
    <section className={workSurface.card}>
      <div className="border-b border-[#e8ece8] px-5 py-4">
        <h2 className="text-lg font-semibold text-[#111827]">Contact History</h2>
        <p className="mt-1 text-sm text-[#6b7280]">
          All conversations and follow-up notes for this request.
        </p>
      </div>
      <div className="px-5 py-1">
        {contactLogs.map((log) => (
          <article
            className="relative flex gap-3 border-b border-[#edf0ed] py-4 last:border-0"
            key={log.id}
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-700">
              {log.contactMethod === 'phone' ? (
                <Phone className="h-4 w-4" />
              ) : (
                <MessageCircle className="h-4 w-4" />
              )}
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <p className="text-sm font-semibold text-[#111827]">
                  {getContactMethodLabel(log.contactMethod)} · {getContactOutcomeLabel(log.outcome)}
                </p>
                <time className="text-xs text-[#6b7280]" dateTime={log.createdAt}>
                  {formatDateTime(log.createdAt)}
                </time>
              </div>
              <p className="mt-1.5 text-sm leading-6 text-[#4b5563]">{log.summary}</p>
              <p className="mt-2 text-xs text-[#6b7280]">
                {log.teamMember?.fullName ?? 'Team member'} · {formatDirection(log.direction)}
              </p>
              {log.nextFollowUpAt ? (
                <p className="mt-1 text-xs font-medium text-[#7a4b00]">
                  Follow-up: {formatDateTime(log.nextFollowUpAt)}
                </p>
              ) : null}
            </div>
          </article>
        ))}
        <article className="flex gap-3 py-4">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#f3f4f6] text-[#6b7280]">
            <CheckCircle2 className="h-4 w-4" />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <p className="text-sm font-semibold text-[#111827]">Request submitted</p>
              <time className="text-xs text-[#6b7280]" dateTime={request.createdAt}>
                {formatDateTime(request.createdAt)}
              </time>
            </div>
            <p className="mt-1.5 text-sm text-[#4b5563]">
              Submitted through {getRequestSourceLabel(request).toLowerCase()}.
            </p>
            <p className="mt-2 text-xs text-[#6b7280]">System</p>
          </div>
        </article>
      </div>
    </section>
  );
}

function RequestManagementCard({
  adminNotes,
  assignedTeamMemberId,
  assignees,
  canAssign,
  canConvert,
  canEdit,
  converting,
  nextFollowUpAt,
  onAdminNotesChange,
  onAssignedTeamMemberIdChange,
  onConvert,
  onNextFollowUpAtChange,
  onSave,
  onStatusChange,
  request,
  saving,
  status,
}: {
  adminNotes: string;
  assignedTeamMemberId: string;
  assignees: TeamMemberSummary[];
  canAssign: boolean;
  canConvert: boolean;
  canEdit: boolean;
  converting: boolean;
  nextFollowUpAt: string;
  onAdminNotesChange: (value: string) => void;
  onAssignedTeamMemberIdChange: (value: string) => void;
  onConvert: () => void;
  onNextFollowUpAtChange: (value: string) => void;
  onSave: () => void;
  onStatusChange: (value: SponsorshipRequestStatus) => void;
  request: SponsorshipRequest;
  saving: boolean;
  status: SponsorshipRequestStatus;
}) {
  const nextStatus = getNextSponsorshipRequestStatus(request.status, request.convertedDonorId);

  return (
    <section className={cn(workSurface.card, 'p-5')} id="request-management">
      <div className="flex items-center gap-2">
        <UsersRound className="h-5 w-5 text-[#006b4f]" />
        <h2 className="text-lg font-semibold text-[#111827]">Request Management</h2>
      </div>
      {canEdit ? (
        <div className="mt-4 space-y-4">
          <FieldLabel label="Status">
            <CustomSelect
              ariaLabel="Status"
              disabled={saving}
              onChange={(value) => onStatusChange(value as SponsorshipRequestStatus)}
              options={statusOptions.map((option) => ({
                ...option,
                disabled: option.value !== request.status && option.value !== nextStatus,
              }))}
              triggerClassName="mt-2 font-medium text-[#111827]"
              value={status}
            />
          </FieldLabel>
          <FieldLabel label="Assign to">
            {canAssign ? (
              <CustomSelect
                ariaLabel="Assign to"
                disabled={saving}
                onChange={onAssignedTeamMemberIdChange}
                options={[
                  { label: 'Unassigned', value: '' },
                  ...assignees.map((assignee) => ({
                    label: assignee.fullName,
                    value: assignee.id,
                  })),
                ]}
                triggerClassName="mt-2 font-medium text-[#111827]"
                value={assignedTeamMemberId}
              />
            ) : (
              <div className="mt-2 flex h-10 items-center rounded-lg border border-[#d8ded8] bg-[#f8faf8] px-3 text-sm text-[#4b5563]">
                {request.assignedTeamMember?.fullName ?? request.assignedTo ?? 'Unassigned'}
              </div>
            )}
          </FieldLabel>
          {!canAssign ? (
            <p className="text-xs text-[#6b7280]">Your role cannot reassign this request.</p>
          ) : null}
          <FieldLabel label="Next follow-up">
            <input
              className={cn(workSurface.field, 'mt-2 h-10 w-full px-3')}
              disabled={saving}
              onChange={(event) => onNextFollowUpAtChange(event.target.value)}
              type="datetime-local"
              value={nextFollowUpAt}
            />
          </FieldLabel>
          <FieldLabel label="Admin notes">
            <textarea
              className={cn(workSurface.field, 'mt-2 min-h-24 w-full p-3 leading-6')}
              onChange={(event) => onAdminNotesChange(event.target.value)}
              placeholder="Add follow-up notes for the team..."
              value={adminNotes}
            />
          </FieldLabel>
          <button
            className={cn(workSurface.primaryButton, 'h-10 w-full px-4 text-sm')}
            disabled={saving}
            onClick={onSave}
            type="button"
          >
            <Save className="h-4 w-4" />
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
          {canConvert && request.status === 'profiles_shared' && !request.convertedDonorId ? (
            <button
              className={cn(
                workSurface.secondaryButton,
                'h-10 w-full border-[#0d6b50] px-4 text-sm text-[#006b4f]',
              )}
              disabled={converting}
              onClick={onConvert}
              type="button"
            >
              <UserRound className="h-4 w-4" />
              {converting ? 'Converting...' : 'Convert to Donor'}
            </button>
          ) : null}
        </div>
      ) : (
        <div className="mt-4 rounded-lg border border-[#f1d894] bg-[#fff4d8] p-4">
          <p className="text-sm font-semibold text-[#7a4b00]">Read-only access</p>
          <p className="mt-2 text-sm leading-6 text-[#596274]">
            You can view this request and its history, but your role cannot update it.
          </p>
        </div>
      )}
    </section>
  );
}

function LogContactCard({
  error,
  form,
  logging,
  onChange,
  onSubmit,
}: {
  error: string;
  form: ContactForm;
  logging: boolean;
  onChange: React.Dispatch<React.SetStateAction<ContactForm>>;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <section className={cn(workSurface.card, 'p-5')}>
      <div className="flex items-center gap-2">
        <MessageCircle className="h-5 w-5 text-[#006b4f]" />
        <h2 className="text-lg font-semibold text-[#111827]">Log Contact</h2>
      </div>
      <form className="mt-4 space-y-4" onSubmit={onSubmit}>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
          <FieldLabel label="Method">
            <CustomSelect
              ariaLabel="Method"
              onChange={(value) =>
                onChange((current) => ({ ...current, contactMethod: value as ContactLogMethod }))
              }
              options={contactMethodOptions}
              triggerClassName="mt-2 font-medium text-[#111827]"
              value={form.contactMethod}
            />
          </FieldLabel>
          <FieldLabel label="Outcome">
            <CustomSelect
              ariaLabel="Outcome"
              onChange={(value) =>
                onChange((current) => ({ ...current, outcome: value as ContactLogOutcome }))
              }
              options={contactOutcomeOptions}
              triggerClassName="mt-2 font-medium text-[#111827]"
              value={form.outcome}
            />
          </FieldLabel>
          <FieldLabel label="Direction">
            <CustomSelect
              ariaLabel="Direction"
              onChange={(value) =>
                onChange((current) => ({ ...current, direction: value as ContactLogDirection }))
              }
              options={contactDirectionOptions}
              triggerClassName="mt-2 font-medium text-[#111827]"
              value={form.direction}
            />
          </FieldLabel>
          <FieldLabel label="Next follow-up">
            <input
              className={cn(workSurface.field, 'mt-2 h-10 w-full px-3')}
              onChange={(event) =>
                onChange((current) => ({ ...current, nextFollowUpAt: event.target.value }))
              }
              type="datetime-local"
              value={form.nextFollowUpAt}
            />
          </FieldLabel>
        </div>
        <FieldLabel label="Summary">
          <textarea
            className={cn(workSurface.field, 'mt-2 min-h-24 w-full p-3 leading-6')}
            onChange={(event) =>
              onChange((current) => ({ ...current, summary: event.target.value }))
            }
            placeholder="What happened during this contact?"
            value={form.summary}
          />
        </FieldLabel>
        {error ? <p className="text-sm font-medium text-red-700">{error}</p> : null}
        <button
          className={cn(
            workSurface.secondaryButton,
            'h-10 w-full border-[#0d6b50] px-4 text-sm text-[#006b4f]',
          )}
          disabled={logging}
          type="submit"
        >
          <MessageCircle className="h-4 w-4" />
          {logging ? 'Saving note...' : 'Add Contact Note'}
        </button>
      </form>
    </section>
  );
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-medium text-[#6b7280]">{label}</dt>
      <dd className="mt-1 break-words text-sm font-medium text-[#111827]">{value}</dd>
    </div>
  );
}

function FieldLabel({ children, label }: { children: React.ReactNode; label: string }) {
  return (
    <div className="block">
      <span className="text-xs font-medium text-[#4b5563]">{label}</span>
      {children}
    </div>
  );
}

function StatusPill({ request }: { request: SponsorshipRequest }) {
  return (
    <span
      className={cn(
        'rounded-md border px-2.5 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.04em]',
        statusStyles[request.status],
      )}
    >
      {getStatusLabel(request.status, request.convertedDonorId)}
    </span>
  );
}

function FollowUpPill({ state }: { state: 'due_soon' | 'overdue' }) {
  return (
    <span
      className={cn(
        'rounded-md border px-2 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.04em]',
        state === 'overdue' ? workflowStatus.red : workflowStatus.amber,
      )}
    >
      {state === 'overdue' ? 'Overdue' : 'Due soon'}
    </span>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('en-PK', { dateStyle: 'medium' }).format(new Date(value));
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat('en-PK', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

function formatShortDate(value: string) {
  return new Intl.DateTimeFormat('en-PK', { day: 'numeric', month: 'short' }).format(
    new Date(value),
  );
}

function formatRelativeTime(value: string) {
  const difference = Date.now() - new Date(value).getTime();
  const days = Math.max(0, Math.floor(difference / 86_400_000));
  if (days === 0) return 'Today';
  if (days === 1) return '1 day ago';
  return `${days} days ago`;
}

function getRequestAge(value: string) {
  const difference = Math.max(0, Date.now() - new Date(value).getTime());
  const days = Math.floor(difference / 86_400_000);
  return `${days} ${days === 1 ? 'day' : 'days'}`;
}

function getFollowUpState(value: string | null) {
  if (!value) return null;
  const difference = new Date(value).getTime() - Date.now();
  if (difference < 0) return 'overdue' as const;
  if (difference <= 48 * 60 * 60 * 1000) return 'due_soon' as const;
  return null;
}

function getStatusLabel(status: SponsorshipRequestStatus, convertedDonorId?: string | null) {
  if (status === 'closed' && convertedDonorId) return 'Matched & Closed';
  return statusOptions.find((option) => option.value === status)?.label ?? status;
}

function getStatusStepDate(request: SponsorshipRequest, status: SponsorshipRequestStatus) {
  if (status === 'new') return request.createdAt;
  if (status === 'contacted') return request.contactedAt;
  if (status === 'profiles_prepared') return request.profilesPreparedAt;
  if (status === 'profiles_shared') return request.profilesSharedAt;
  if (status === 'converted_to_donor') return request.convertedAt;
  return request.closedAt;
}

function getMethodLabel(method: PreferredContactMethod) {
  return methodOptions.find((option) => option.value === method)?.label ?? method;
}

function getContactMethodLabel(method: ContactLogMethod) {
  return contactMethodOptions.find((option) => option.value === method)?.label ?? method;
}

function getContactOutcomeLabel(outcome: ContactLogOutcome) {
  return contactOutcomeOptions.find((option) => option.value === outcome)?.label ?? outcome;
}

function getRequestSourceLabel(request: SponsorshipRequest) {
  const label =
    requestSourceOptions.find((option) => option.value === request.requestSource)?.label ??
    request.requestSource;
  if (request.requestSource === 'admin_created' && request.createdByTeamMember) {
    return `${label} by ${request.createdByTeamMember.fullName}`;
  }
  return label;
}

function getCreatedByLabel(request: SponsorshipRequest) {
  return request.createdByTeamMember?.fullName ?? getRequestSourceLabel(request);
}

function formatRequestNumber(request: SponsorshipRequest) {
  const year = new Date(request.createdAt).getFullYear();
  const shortId = request.id.replaceAll('-', '').slice(0, 6).toUpperCase();
  return `REQ-${year}-${shortId}`;
}

function formatRole(value: string) {
  return value
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function formatDirection(value: ContactLogDirection) {
  return contactDirectionOptions.find((option) => option.value === value)?.label ?? value;
}

function getInitials(value: string) {
  return value
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('');
}

function getWhatsappHref(value: string) {
  const phone = value.replace(/\D/g, '');
  return phone ? `https://wa.me/${phone}` : null;
}

function toDateTimeInputValue(value: string | null | undefined) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const offsetMs = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offsetMs).toISOString().slice(0, 16);
}

function fromDateTimeInputValue(value: string) {
  return value ? new Date(value).toISOString() : null;
}

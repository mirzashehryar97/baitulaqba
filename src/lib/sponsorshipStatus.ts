import type { SponsorshipRequestStatus } from '@/types/sponsorship';

export const SPONSORSHIP_REQUEST_STATUSES: SponsorshipRequestStatus[] = [
  'new',
  'contacted',
  'profiles_prepared',
  'profiles_shared',
  'converted_to_donor',
  'closed',
];

export const POST_CONVERSION_SPONSORSHIP_REQUEST_STATUSES: SponsorshipRequestStatus[] = [
  'converted_to_donor',
  'closed',
];

export const SPONSORSHIP_REQUEST_STATUS_FLOW: SponsorshipRequestStatus[] = [
  'new',
  'contacted',
  'profiles_prepared',
  'profiles_shared',
  'converted_to_donor',
  'closed',
];

export function getSponsorshipRequestStatusIndex(status: SponsorshipRequestStatus) {
  return SPONSORSHIP_REQUEST_STATUS_FLOW.indexOf(status);
}

export function getNextSponsorshipRequestStatus(
  currentStatus: SponsorshipRequestStatus,
  convertedDonorId: string | null,
): SponsorshipRequestStatus | null {
  if (currentStatus === 'new') {
    return 'contacted';
  }

  if (currentStatus === 'contacted') {
    return 'profiles_prepared';
  }

  if (currentStatus === 'profiles_prepared') {
    return 'profiles_shared';
  }

  if (currentStatus === 'converted_to_donor' && convertedDonorId) {
    return 'closed';
  }

  return null;
}

export function isAllowedSponsorshipRequestStatusTransition({
  convertedDonorId,
  currentStatus,
  nextStatus,
}: {
  convertedDonorId: string | null;
  currentStatus: SponsorshipRequestStatus;
  nextStatus: SponsorshipRequestStatus;
}) {
  if (currentStatus === nextStatus) {
    return true;
  }

  return getNextSponsorshipRequestStatus(currentStatus, convertedDonorId) === nextStatus;
}

export function isPostConversionSponsorshipRequestStatus(status: SponsorshipRequestStatus) {
  return POST_CONVERSION_SPONSORSHIP_REQUEST_STATUSES.includes(status);
}

export function getEffectiveSponsorshipRequestStatus(
  status: SponsorshipRequestStatus,
  convertedDonorId: string | null,
) {
  if (convertedDonorId && !isPostConversionSponsorshipRequestStatus(status)) {
    return 'converted_to_donor';
  }

  if (!convertedDonorId && status === 'converted_to_donor') {
    return 'profiles_shared';
  }

  return status;
}

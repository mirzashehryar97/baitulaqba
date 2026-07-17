import type { SponsorshipMatch } from '@/types/matches';

/**
 * Human-readable certificate number, e.g. `MATCH-2026-0001`. Pure (no Node/PDF
 * dependencies) so it is safe to import from client components as well as the
 * server-only certificate generator.
 */
export function formatCertificateNumber(
  match: Pick<SponsorshipMatch, 'certificateSeq' | 'createdAt' | 'startedAt'>,
) {
  const year = new Date(match.startedAt || match.createdAt).getFullYear();
  const seq = match.certificateSeq ?? 0;
  return `MATCH-${year}-${String(seq).padStart(4, '0')}`;
}

import { readFileSync } from 'node:fs';
import path from 'node:path';

import { formatCertificateNumber } from '@/lib/certificateNumber';
import {
  containsArabic,
  drawRoundedImage,
  fetchPdfImageBuffer,
  formatPdfDate,
  PDF_COLORS,
  PDF_FONT_BUFFERS,
  PDFDocument,
  registerPdfFonts,
} from '@/lib/pdfKit';

import type { Donor } from '@/types/accounts';
import type { SponsorshipMatch } from '@/types/matches';
import type { OrphanProfile } from '@/types/orphans';

export { formatCertificateNumber } from '@/lib/certificateNumber';

const PDF_TEMPLATE_IMAGE = readFileSync(
  path.join(process.cwd(), 'public', 'images', 'pdf', 'match-certificate-template.png'),
);

// The template raster is 1536x1024; the PDF page uses the same coordinate space so
// the values below map 1:1 onto the artwork.
const PDF_CERT_SIZE: [number, number] = [1536, 1024];

type FieldPosition = { x: number; y: number; width: number };

/**
 * Placement of every dynamic value overlaid on the blank certificate template,
 * in template-pixel coordinates. Exported so a preview script can render the
 * same positions onto the template PNG for visual alignment checks.
 */
export const MATCH_CERT_LAYOUT = {
  photo: { x: 158, y: 388, width: 226, height: 362, radius: 12 },
  // Single font size for every value on the certificate.
  valueFontSize: 18,
  // Each `y` is the text top, positioned so the baseline lands a few px above the
  // template's underline (underline y minus Inter's ~17px ascent minus a ~5px gap).
  orphan: {
    name: { x: 726, y: 382, width: 669 } satisfies FieldPosition,
    id: { x: 726, y: 420, width: 669 } satisfies FieldPosition,
    guardian: { x: 726, y: 458, width: 669 } satisfies FieldPosition,
    birthday: { x: 726, y: 498, width: 669 } satisfies FieldPosition,
    guardianPhone: { x: 726, y: 538, width: 669 } satisfies FieldPosition,
    location: { x: 726, y: 577, width: 669 } satisfies FieldPosition,
  },
  donor: {
    name: { x: 726, y: 703, width: 669 } satisfies FieldPosition,
    phone: { x: 726, y: 742, width: 669 } satisfies FieldPosition,
    address: { x: 726, y: 782, width: 669 } satisfies FieldPosition,
  },
  footer: {
    certificateId: { x: 500, y: 884, width: 255 } satisfies FieldPosition,
    issuedDate: { x: 1012, y: 884, width: 385 } satisfies FieldPosition,
  },
};

export type MatchCertificateData = {
  donor: Donor;
  match: SponsorshipMatch;
  orphan: OrphanProfile;
};

export function collectMissingMatchCertificateFields({
  donor,
  orphan,
}: Pick<MatchCertificateData, 'donor' | 'orphan'>) {
  const missing: string[] = [];
  const isBlank = (value: string | null | undefined) => !value || !value.trim();

  if (isBlank(orphan.fullName)) missing.push('Orphan name');
  if (isBlank(orphan.orphanCode)) missing.push('Orphan ID');
  if (isBlank(orphan.profileImageUrl)) missing.push('Orphan photo');
  if (isBlank(orphan.guardian?.guardianName)) missing.push('Guardian name');
  if (isBlank(orphan.dateOfBirth)) missing.push('Birthday');
  if (isBlank(orphan.guardian?.phone)) missing.push('Guardian phone');
  if (isBlank(orphan.cityArea)) missing.push('Location');
  if (isBlank(donor.fullName)) missing.push('Donor name');
  if (isBlank(donor.phone)) missing.push('Donor phone');
  if (isBlank(donor.address)) missing.push('Donor address');

  return missing;
}

export async function generateMatchCertificatePdf({ donor, match, orphan }: MatchCertificateData) {
  const imageBuffer = await fetchPdfImageBuffer(orphan.profileImageUrl);

  return new Promise<Buffer>((resolve, reject) => {
    const doc = new PDFDocument({
      font: PDF_FONT_BUFFERS.inter as unknown as string,
      margin: 0,
      size: PDF_CERT_SIZE,
    });
    const chunks: Buffer[] = [];

    doc.on('data', (chunk: Buffer) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    drawCertificate(doc, { donor, match, orphan }, imageBuffer);
    doc.end();
  });
}

function drawCertificate(
  doc: PDFKit.PDFDocument,
  { donor, match, orphan }: MatchCertificateData,
  imageBuffer: Buffer | null,
) {
  registerPdfFonts(doc);
  doc.image(PDF_TEMPLATE_IMAGE, 0, 0, { height: doc.page.height, width: doc.page.width });

  const { photo } = MATCH_CERT_LAYOUT;
  drawRoundedImage(doc, imageBuffer, photo.x, photo.y, photo.width, photo.height, {
    border: false,
    radius: photo.radius,
  });

  const orphanFields = MATCH_CERT_LAYOUT.orphan;
  drawValue(doc, orphan.fullName, orphanFields.name, { arabic: containsArabic(orphan.fullName) });
  drawValue(doc, orphan.orphanCode, orphanFields.id);
  drawValue(doc, orphan.guardian?.guardianName ?? '—', orphanFields.guardian);
  drawValue(doc, formatBirthday(orphan.dateOfBirth), orphanFields.birthday);
  drawValue(doc, orphan.guardian?.phone ?? '—', orphanFields.guardianPhone);
  drawValue(doc, orphan.cityArea ?? '—', orphanFields.location);

  const donorFields = MATCH_CERT_LAYOUT.donor;
  drawValue(doc, donor.fullName, donorFields.name, { arabic: containsArabic(donor.fullName) });
  drawValue(doc, donor.phone ?? '—', donorFields.phone);
  drawValue(doc, donor.address ?? '—', donorFields.address);

  const { footer } = MATCH_CERT_LAYOUT;
  drawValue(doc, formatCertificateNumber(match), footer.certificateId, {
    color: PDF_COLORS.emerald,
  });
  drawValue(doc, formatPdfDate(new Date().toISOString()), footer.issuedDate);
}

function drawValue(
  doc: PDFKit.PDFDocument,
  value: string,
  position: FieldPosition,
  options: { arabic?: boolean; color?: string } = {},
) {
  const fontSize = MATCH_CERT_LAYOUT.valueFontSize;

  // Every value uses the same font size. Each value line spans nearly the full
  // width of the certificate, so values stay on a single line; the height +
  // ellipsis constraint truncates the rare value that would still overflow
  // rather than wrapping into the next row.
  doc
    .font(options.arabic ? 'Amiri-Bold' : 'Inter-SemiBold')
    .fillColor(options.color ?? PDF_COLORS.ink)
    .fontSize(fontSize)
    .text(value, position.x, position.y, {
      ellipsis: true,
      height: fontSize * 1.4,
      lineBreak: true,
      width: position.width,
    });
}

function formatBirthday(dateOfBirth: string | null) {
  if (!dateOfBirth) {
    return '—';
  }

  const date = new Date(dateOfBirth);
  return Number.isNaN(date.getTime()) ? '—' : formatPdfDate(dateOfBirth);
}

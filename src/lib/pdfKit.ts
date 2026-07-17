import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';

import type PDFDocumentConstructor from 'pdfkit';
import sharp from 'sharp';

import { createSupabaseAdminClient } from '@/lib/supabase/server';

const require = createRequire(import.meta.url);
const PDFKitModule = require('pdfkit') as
  | typeof PDFDocumentConstructor
  | { default: typeof PDFDocumentConstructor };

/** pdfkit's CommonJS/ESM interop resolved to a usable constructor. */
export const PDFDocument = typeof PDFKitModule === 'function' ? PDFKitModule : PDFKitModule.default;

const fontFile = (packageName: string, fileName: string) =>
  path.join(process.cwd(), 'node_modules', '@fontsource', packageName, 'files', fileName);

/** Self-hosted font buffers shared by every generated PDF. */
export const PDF_FONT_BUFFERS = {
  amiri: readFileSync(fontFile('amiri', 'amiri-arabic-400-normal.woff')),
  amiriBold: readFileSync(fontFile('amiri', 'amiri-arabic-700-normal.woff')),
  inter: readFileSync(fontFile('inter', 'inter-latin-400-normal.woff')),
  interBold: readFileSync(fontFile('inter', 'inter-latin-700-normal.woff')),
  interSemiBold: readFileSync(fontFile('inter', 'inter-latin-600-normal.woff')),
};

/** Brand palette shared across PDF documents. */
export const PDF_COLORS = {
  cream: '#f8f3e6',
  emerald: '#0f4f33',
  emeraldDark: '#082f22',
  gold: '#d7a928',
  goldDeep: '#a77116',
  ink: '#1e241f',
  muted: '#68756d',
  offWhite: '#fffdf6',
  panel: '#fdf3e1',
};

const ORPHAN_PHOTO_BUCKET = 'orphan-photos';

export function registerPdfFonts(doc: PDFKit.PDFDocument) {
  doc.registerFont('Inter', PDF_FONT_BUFFERS.inter);
  doc.registerFont('Inter-SemiBold', PDF_FONT_BUFFERS.interSemiBold);
  doc.registerFont('Inter-Bold', PDF_FONT_BUFFERS.interBold);
  doc.registerFont('Amiri', PDF_FONT_BUFFERS.amiri);
  doc.registerFont('Amiri-Bold', PDF_FONT_BUFFERS.amiriBold);
}

const ARABIC_PATTERN = new RegExp('[\\u0600-\\u06FF]');

export function containsArabic(value: string) {
  return ARABIC_PATTERN.test(value);
}

export function formatPdfDate(value: string) {
  return new Intl.DateTimeFormat('en', { dateStyle: 'medium' }).format(new Date(value));
}

/**
 * Download an orphan profile image and normalize it (auto-rotate, flatten onto
 * the off-white PDF background, re-encode as JPEG) for embedding in a PDF.
 * Returns `null` when the image can't be fetched so callers can fall back to a
 * placeholder. Works with both Supabase Storage public URLs and arbitrary URLs.
 */
export async function fetchPdfImageBuffer(url: string) {
  try {
    const image = await fetchImageBytes(url);

    if (!image) {
      return null;
    }

    return await sharp(image)
      .rotate()
      .flatten({ background: PDF_COLORS.offWhite })
      .jpeg({ quality: 88 })
      .toBuffer();
  } catch {
    return null;
  }
}

async function fetchImageBytes(url: string) {
  const storagePath = getProfileImageStoragePath(url);

  if (storagePath) {
    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase.storage.from(ORPHAN_PHOTO_BUCKET).download(storagePath);

    if (!error && data) {
      return Buffer.from(await data.arrayBuffer());
    }
  }

  const response = await fetch(url);

  if (!response.ok) {
    return null;
  }

  return Buffer.from(await response.arrayBuffer());
}

function getProfileImageStoragePath(value: string) {
  try {
    const url = new URL(value);
    const marker = `/storage/v1/object/public/${ORPHAN_PHOTO_BUCKET}/`;
    const markerIndex = url.pathname.indexOf(marker);

    if (markerIndex === -1) {
      return null;
    }

    return decodeURIComponent(url.pathname.slice(markerIndex + marker.length));
  } catch {
    return null;
  }
}

/**
 * Draw an image clipped to a rounded rectangle, cover-fitted into the box.
 * Falls back to a labeled placeholder when no image is available. When
 * `border` is true a thin off-white rounded border is stroked on top (used by
 * the orphan card, whose template has no photo frame of its own).
 */
export function drawRoundedImage(
  doc: PDFKit.PDFDocument,
  imageBuffer: Buffer | null,
  x: number,
  y: number,
  width: number,
  height: number,
  options: { border?: boolean; radius?: number } = {},
) {
  const radius = options.radius ?? 18;
  const border = options.border ?? true;

  if (imageBuffer) {
    let imageStateSaved = false;

    try {
      doc.save();
      imageStateSaved = true;
      doc.roundedRect(x, y, width, height, radius).clip();
      doc.image(imageBuffer, x, y, {
        align: 'center',
        cover: [width, height],
        valign: 'center',
      });
      doc.restore();
      imageStateSaved = false;
    } catch {
      if (imageStateSaved) {
        doc.restore();
      }

      drawImagePlaceholder(doc, x, y, width, height);
    }
  } else {
    drawImagePlaceholder(doc, x, y, width, height);
  }

  if (border) {
    doc.roundedRect(x, y, width, height, radius).lineWidth(2).stroke(PDF_COLORS.offWhite);
  }
}

function drawImagePlaceholder(
  doc: PDFKit.PDFDocument,
  x: number,
  y: number,
  width: number,
  height: number,
) {
  doc.roundedRect(x, y, width, height, 18).fill('#e8efe8');
  doc
    .fillColor('#0f4f33')
    .font('Inter-Bold')
    .fontSize(15)
    .text('Profile Image', x, y + height / 2 - 18, { align: 'center', width });
  doc
    .fillColor('#68756d')
    .font('Inter')
    .fontSize(9)
    .text('Preview unavailable in PDF', x, y + height / 2 + 4, { align: 'center', width });
}

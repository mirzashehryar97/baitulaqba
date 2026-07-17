import fs from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

import puppeteer from 'puppeteer-core';
import sharp from 'sharp';

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const inputDirectory = process.argv[2];
const outputDirectory = process.argv[3];
const fractions = (process.env.FRACTIONS || '0.18,0.36,0.58,0.8')
  .split(',')
  .map(Number)
  .filter((value) => value > 0 && value < 1);
const selectedCodes = new Set((process.env.CODES || '').split(',').filter(Boolean));
const maxDimension = Number(process.env.MAX_DIMENSION || 900);

if (!inputDirectory || !outputDirectory) {
  throw new Error('Usage: node scripts/extract-official-video-frames.mjs <input-dir> <output-dir>');
}

await fs.mkdir(outputDirectory, { recursive: true });

const videoFiles = (await fs.readdir(inputDirectory))
  .filter((file) => file.endsWith('.mp4'))
  .filter((file) => selectedCodes.size === 0 || selectedCodes.has(path.basename(file, '.mp4')))
  .sort();

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: 'new',
  args: [
    '--allow-file-access-from-files',
    '--autoplay-policy=no-user-gesture-required',
    '--no-sandbox',
  ],
});

const frameFiles = [];

try {
  for (const videoFile of videoFiles) {
    const page = await browser.newPage();
    const videoPath = path.join(inputDirectory, videoFile);
    const code = path.basename(videoFile, '.mp4');

    await page.goto(pathToFileURL(videoPath).href, {
      waitUntil: 'domcontentloaded',
      timeout: 60_000,
    });
    await page.waitForFunction(() => {
      const video = document.querySelector('video');
      return video && Number.isFinite(video.duration) && video.duration > 0;
    });

    const metadata = await page.evaluate(() => {
      const video = document.querySelector('video');
      return {
        duration: video.duration,
        height: video.videoHeight,
        width: video.videoWidth,
      };
    });

    const scale = Math.min(1, maxDimension / Math.max(metadata.width, metadata.height));
    const width = Math.max(1, Math.round(metadata.width * scale));
    const height = Math.max(1, Math.round(metadata.height * scale));
    await page.setViewport({ width, height, deviceScaleFactor: 1 });
    await page.evaluate(
      ({ height, width }) => {
        document.documentElement.style.background = '#000';
        document.body.style.cssText = 'margin:0;overflow:hidden;background:#000';
        const video = document.querySelector('video');
        video.controls = false;
        video.style.cssText = `display:block;width:${width}px;height:${height}px;object-fit:contain`;
      },
      { height, width },
    );

    for (const fraction of fractions) {
      const time = Math.min(metadata.duration - 0.1, metadata.duration * fraction);
      await page.evaluate(
        (seekTime) =>
          new Promise((resolve, reject) => {
            const video = document.querySelector('video');
            const timeout = setTimeout(() => reject(new Error('Timed out seeking video')), 15_000);
            video.addEventListener(
              'seeked',
              () => {
                clearTimeout(timeout);
                resolve();
              },
              { once: true },
            );
            video.currentTime = seekTime;
          }),
        time,
      );

      const suffix = String(Math.round(fraction * 100)).padStart(2, '0');
      const framePath = path.join(outputDirectory, `${code}-${suffix}.png`);
      await page.screenshot({ path: framePath, clip: { x: 0, y: 0, width, height } });
      frameFiles.push({ code, fraction: suffix, path: framePath });
    }

    await page.close();
  }
} finally {
  await browser.close();
}

const tileWidth = 280;
const tileHeight = 210;
const columns = 4;
const rows = Math.ceil(frameFiles.length / columns);
const composites = [];

for (const [index, frame] of frameFiles.entries()) {
  const image = await sharp(frame.path)
    .resize(tileWidth, tileHeight, { fit: 'cover', position: 'attention' })
    .composite([
      {
        input: Buffer.from(
          `<svg width="${tileWidth}" height="${tileHeight}">
            <rect x="0" y="174" width="${tileWidth}" height="36" fill="rgba(0,0,0,.72)" />
            <text x="12" y="198" fill="white" font-family="Arial" font-size="17">${frame.code} · ${frame.fraction}%</text>
          </svg>`,
        ),
      },
    ])
    .png()
    .toBuffer();

  composites.push({
    input: image,
    left: (index % columns) * tileWidth,
    top: Math.floor(index / columns) * tileHeight,
  });
}

await sharp({
  create: {
    width: columns * tileWidth,
    height: rows * tileHeight,
    channels: 3,
    background: '#101814',
  },
})
  .composite(composites)
  .jpeg({ quality: 88 })
  .toFile(path.join(outputDirectory, 'contact-sheet.jpg'));

console.log(`Extracted ${frameFiles.length} frames from ${videoFiles.length} videos.`);

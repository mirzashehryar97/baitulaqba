import puppeteer from 'puppeteer-core';

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const BASE_URL = process.env.BASE_URL || 'http://localhost:3001';

const routes = [
  '/',
  '/mosques-schools',
  '/portal/login',
  '/admin/login',
  '/admin',
  '/admin/donors',
  '/admin/orphans',
  '/admin/matches',
  '/admin/team',
];

function isOAuthButton(text) {
  return /google|sign in|continue/i.test(text);
}

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: 'new',
  defaultViewport: { width: 1440, height: 900, deviceScaleFactor: 1 },
  args: ['--no-sandbox'],
});

const page = await browser.newPage();
const browserIssues = [];
const results = [];

page.on('console', (message) => {
  if (['error', 'warning'].includes(message.type())) {
    browserIssues.push(`${message.type()}: ${message.text()}`);
  }
});

page.on('pageerror', (error) => {
  browserIssues.push(`pageerror: ${error.message}`);
});

for (const route of routes) {
  const response = await page.goto(`${BASE_URL}${route}`, {
    waitUntil: 'networkidle2',
    timeout: 60000,
  });

  const title = await page.title();
  const finalUrl = page.url().replace(BASE_URL, '');
  const controls = await page.$$eval('a[href], button, [role="button"]', (elements) =>
    elements
      .filter((element) => {
        const rect = element.getBoundingClientRect();
        const styles = window.getComputedStyle(element);
        return rect.width > 0 && rect.height > 0 && styles.visibility !== 'hidden';
      })
      .map((element, index) => ({
        index,
        tag: element.tagName.toLowerCase(),
        text: (element.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 80),
        href: element.getAttribute('href'),
        disabled:
          element.hasAttribute('disabled') || element.getAttribute('aria-disabled') === 'true',
      })),
  );

  results.push({
    route,
    status: response?.status() ?? null,
    finalUrl,
    title,
    controls: controls.length,
    disabledControls: controls.filter((control) => control.disabled).length,
    sampleControls: controls.slice(0, 8),
  });

  for (const control of controls.slice(0, 8)) {
    if (control.disabled || isOAuthButton(control.text)) continue;
    const before = page.url();
    try {
      const handles = await page.$$('a[href], button, [role="button"]');
      const handle = handles[control.index];
      if (!handle) continue;
      await handle.click();
      await new Promise((resolve) => setTimeout(resolve, 350));
      if (page.url() !== before) {
        await page.goto(`${BASE_URL}${route}`, { waitUntil: 'networkidle2', timeout: 60000 });
      }
    } catch (error) {
      browserIssues.push(`click failed on ${route} "${control.text}": ${error.message}`);
    }
  }
}

console.log(JSON.stringify({ baseUrl: BASE_URL, results, browserIssues }, null, 2));

await browser.close();

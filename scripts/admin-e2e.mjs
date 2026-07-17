import fs from 'node:fs';

import { createClient } from '@supabase/supabase-js';

const roles = [
  'super_admin',
  'admin',
  'sponsorship_manager',
  'orphan_coordinator',
  'finance_manager',
  'support_coordinator',
  'viewer',
];

const command = process.argv[2] || 'help';
const runId =
  process.env.E2E_RUN_ID ||
  `E2E-${new Date().toISOString().replace(/[-:]/g, '').replace(/\..+/, '').replace('T', '-')}`;
const attemptId = process.env.E2E_ATTEMPT_ID || Date.now().toString(36);
const password = process.env.E2E_PASSWORD || `BaitulAqba-${runId}-Passw0rd!`;
let recordCounter = 0;
const roleCookieCache = new Map();

function loadEnvFile(path = '.env.local') {
  if (!fs.existsSync(path)) return;
  const content = fs.readFileSync(path, 'utf8');
  for (const line of content.split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
    if (!match) continue;
    const [, key, rawValue] = match;
    if (process.env[key]) continue;
    process.env[key] = rawValue.replace(/^['"]|['"]$/g, '');
  }
}

function requireEnv(name) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing ${name}`);
  return value;
}

function getConfig() {
  loadEnvFile();
  const supabaseUrl = process.env.SUPABASE_URL || requireEnv('NEXT_PUBLIC_SUPABASE_URL');
  const anonKey = requireEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY');
  const serviceRoleKey = requireEnv('SUPABASE_SERVICE_ROLE_KEY');
  return { anonKey, serviceRoleKey, supabaseUrl };
}

function roleEmail(role) {
  return `e2e+${runId.toLowerCase()}-${role.replaceAll('_', '-')}@baitulaqba.test`;
}

function roleName(role) {
  return `${runId} ${role
    .split('_')
    .map((part) => part[0].toUpperCase() + part.slice(1))
    .join(' ')}`;
}

function projectRef(supabaseUrl) {
  return new URL(supabaseUrl).hostname.split('.')[0];
}

function base64Url(value) {
  return Buffer.from(value, 'utf8').toString('base64url');
}

function createCookieChunks(key, value, chunkSize = 3180) {
  const encodedValue = encodeURIComponent(value);
  if (encodedValue.length <= chunkSize) {
    return [{ name: key, value }];
  }

  const chunks = [];
  let rest = encodedValue;

  while (rest.length > 0) {
    let head = rest.slice(0, chunkSize);
    const lastEscape = head.lastIndexOf('%');
    if (lastEscape > chunkSize - 3) {
      head = head.slice(0, lastEscape);
    }

    let decoded = '';
    while (head.length > 0) {
      try {
        decoded = decodeURIComponent(head);
        break;
      } catch {
        head = head.slice(0, -1);
      }
    }

    chunks.push(decoded);
    rest = rest.slice(head.length);
  }

  return chunks.map((chunk, index) => ({ name: `${key}.${index}`, value: chunk }));
}

function sessionCookies(supabaseUrl, session) {
  const key = `sb-${projectRef(supabaseUrl)}-auth-token`;
  const value = `base64-${base64Url(JSON.stringify(session))}`;
  return createCookieChunks(key, value);
}

async function getRoleSessionCookies(role) {
  if (!roles.includes(role)) {
    throw new Error(`Unknown role ${role}`);
  }

  if (roleCookieCache.has(role)) {
    return roleCookieCache.get(role);
  }

  const { anonKey, supabaseUrl } = getConfig();
  const client = createClient(supabaseUrl, anonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { data, error } = await client.auth.signInWithPassword({
    email: roleEmail(role),
    password,
  });

  if (error) throw error;
  const cookies = sessionCookies(supabaseUrl, data.session);
  roleCookieCache.set(role, cookies);
  return cookies;
}

async function findAuthUserByEmail(admin, email) {
  const perPage = 100;
  for (let page = 1; page <= 20; page += 1) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage });
    if (error) throw error;
    const user = data.users.find((item) => item.email?.toLowerCase() === email.toLowerCase());
    if (user) return user;
    if (data.users.length < perPage) return null;
  }
  return null;
}

async function ensureAuthUser(admin, email) {
  const existing = await findAuthUserByEmail(admin, email);
  if (existing) {
    const { data, error } = await admin.auth.admin.updateUserById(existing.id, {
      email_confirm: true,
      password,
      user_metadata: { e2eRunId: runId },
    });
    if (error) throw error;
    return data.user;
  }

  const { data, error } = await admin.auth.admin.createUser({
    email,
    email_confirm: true,
    password,
    user_metadata: { e2eRunId: runId },
  });
  if (error) throw error;
  return data.user;
}

async function seedRoles() {
  const { serviceRoleKey, supabaseUrl } = getConfig();
  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const seeded = [];

  for (const role of roles) {
    const email = roleEmail(role);
    const authUser = await ensureAuthUser(admin, email);
    const { data, error } = await admin
      .from('team_members')
      .upsert(
        {
          active: true,
          auth_user_id: authUser.id,
          email,
          full_name: roleName(role),
          notes: `${runId} test team member`,
          phone: '+10000000000',
          role,
        },
        { onConflict: 'email' },
      )
      .select('id, email, role, active, auth_user_id')
      .single();

    if (error) throw error;
    seeded.push(data);
  }

  console.log(
    JSON.stringify(
      {
        runId,
        seededTeamMembers: seeded.map(({ active, email, id, role }) => ({
          active,
          email,
          id,
          role,
        })),
      },
      null,
      2,
    ),
  );
}

async function createRoleSession(role) {
  const cookies = await getRoleSessionCookies(role);
  console.log(
    JSON.stringify(
      {
        cookieCount: cookies.length,
        email: roleEmail(role),
        role,
        runId,
      },
      null,
      2,
    ),
  );
}

async function dashboardScreenshot(
  baseUrl = 'http://localhost:3001',
  outputPath = '/tmp/baitulaqba-admin-dashboard.png',
) {
  const puppeteer = await import('puppeteer-core');
  const chrome =
    process.env.CHROME || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
  const browser = await puppeteer.default.launch({
    executablePath: chrome,
    headless: 'new',
    defaultViewport: { width: 1536, height: 1024, deviceScaleFactor: 1 },
    args: ['--no-sandbox', '--hide-scrollbars'],
  });

  try {
    const page = await browser.newPage();
    await page.goto(`${baseUrl}/admin/login`, { waitUntil: 'networkidle2', timeout: 60000 });
    const cookies = await getRoleSessionCookies('super_admin');
    await page.setCookie(
      ...cookies.map((cookie) => ({
        name: cookie.name,
        path: '/',
        sameSite: 'Lax',
        url: baseUrl,
        value: cookie.value,
      })),
    );
    await page.goto(`${baseUrl}/admin`, { waitUntil: 'networkidle2', timeout: 60000 });
    await new Promise((resolve) => setTimeout(resolve, 1200));
    await page.screenshot({ path: outputPath, fullPage: true });
    console.log(JSON.stringify({ outputPath, url: page.url() }, null, 2));
  } finally {
    await browser.close();
  }
}

async function browserCheckpoint(baseUrl = 'http://localhost:3001') {
  const puppeteer = await import('puppeteer-core');
  const chrome =
    process.env.CHROME || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
  const routes = [
    '/admin',
    '/admin/team',
    '/admin/team/roles',
    '/admin/donors',
    '/admin/orphans',
    '/admin/matches',
  ];
  const browser = await puppeteer.default.launch({
    executablePath: chrome,
    headless: 'new',
    defaultViewport: { width: 1440, height: 900, deviceScaleFactor: 1 },
    args: ['--no-sandbox'],
  });

  const output = [];

  try {
    for (const role of roles) {
      const page = await browser.newPage();
      const issues = [];
      page.on('console', (message) => {
        if (['error', 'warning'].includes(message.type())) {
          issues.push(`${message.type()}: ${message.text()}`);
        }
      });
      page.on('pageerror', (error) => issues.push(`pageerror: ${error.message}`));

      await page.goto(`${baseUrl}/admin/login`, { waitUntil: 'networkidle2', timeout: 60000 });
      const cookies = await getRoleSessionCookies(role);
      await page.setCookie(
        ...cookies.map((cookie) => ({
          name: cookie.name,
          path: '/',
          sameSite: 'Lax',
          url: baseUrl,
          value: cookie.value,
        })),
      );

      const sessionResponse = await page.evaluate(async () => {
        const response = await fetch('/api/admin/session');
        return { body: await response.json().catch(() => null), status: response.status };
      });

      const routeResults = [];
      for (const route of routes) {
        const response = await page.goto(`${baseUrl}${route}`, {
          waitUntil: 'networkidle2',
          timeout: 60000,
        });
        const pageSummary = await page.evaluate(() => {
          const visible = (element) => {
            const rect = element.getBoundingClientRect();
            const style = getComputedStyle(element);
            return rect.width > 0 && rect.height > 0 && style.visibility !== 'hidden';
          };
          const controls = [...document.querySelectorAll('a[href], button, [role="button"]')]
            .filter(visible)
            .map((element) => ({
              aria: element.getAttribute('aria-label'),
              text: (element.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 80),
              type: element.tagName.toLowerCase(),
            }));
          const dropdowns = [...document.querySelectorAll('[data-custom-select-trigger="true"]')]
            .filter(visible)
            .map((element) => ({
              aria: element.getAttribute('aria-label'),
              text: (element.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 80),
            }));
          return {
            controls: controls.length,
            dropdowns,
            h1: document.querySelector('h1')?.textContent?.replace(/\s+/g, ' ').trim() || null,
            sampleControls: controls.slice(0, 10),
          };
        });
        routeResults.push({
          finalUrl: page.url().replace(baseUrl, ''),
          route,
          status: response?.status() ?? null,
          ...pageSummary,
        });
      }

      output.push({
        issues,
        role,
        sessionRole: sessionResponse.body?.data?.teamMember?.role ?? null,
        sessionStatus: sessionResponse.status,
        routes: routeResults,
      });
      await page.close();
    }
  } finally {
    await browser.close();
  }

  const report = { baseUrl, results: output, runId };
  const path = writeReport('browser-checkpoint', report);
  console.log(
    JSON.stringify(
      {
        path,
        roles: output.map((result) => ({
          issueCount: result.issues.length,
          role: result.role,
          sessionRole: result.sessionRole,
        })),
        runId,
      },
      null,
      2,
    ),
  );
}

async function dropdownCheckpoint(baseUrl = 'http://localhost:3001') {
  const puppeteer = await import('puppeteer-core');
  const chrome =
    process.env.CHROME || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
  const browser = await puppeteer.default.launch({
    executablePath: chrome,
    headless: 'new',
    defaultViewport: { width: 1440, height: 900, deviceScaleFactor: 1 },
    args: ['--no-sandbox'],
  });

  const page = await browser.newPage();
  const issues = [];
  page.on('console', (message) => {
    if (['error', 'warning'].includes(message.type()))
      issues.push(`${message.type()}: ${message.text()}`);
  });
  page.on('pageerror', (error) => issues.push(`pageerror: ${error.message}`));

  const pages = [
    { path: '/admin', openers: ['New Request', 'Create Request'] },
    { path: '/admin/donors', openers: [] },
    { path: '/admin/donors/new', openers: [] },
    { path: '/admin/orphans', openers: [] },
    { path: '/admin/orphans/new', openers: [] },
    { path: '/admin/matches', openers: ['New Match'] },
    { path: '/admin/team/new', openers: [] },
  ];
  const checks = [];

  try {
    await page.goto(`${baseUrl}/admin/login`, { waitUntil: 'domcontentloaded', timeout: 60000 });
    const cookies = await getRoleSessionCookies('super_admin');
    await page.setCookie(
      ...cookies.map((cookie) => ({
        name: cookie.name,
        path: '/',
        sameSite: 'Lax',
        url: baseUrl,
        value: cookie.value,
      })),
    );

    for (const item of pages) {
      await page.goto(`${baseUrl}${item.path}`, { waitUntil: 'domcontentloaded', timeout: 60000 });
      await new Promise((resolve) => setTimeout(resolve, 1800));

      for (const opener of item.openers) {
        await page.evaluate((text) => {
          const button = [...document.querySelectorAll('button, a')].find((element) =>
            (element.textContent || '').replace(/\s+/g, ' ').trim().includes(text),
          );
          button?.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
        }, opener);
        await new Promise((resolve) => setTimeout(resolve, 900));
      }

      const triggerCount = await page.$$eval(
        '[data-custom-select-trigger="true"]',
        (elements) =>
          elements.filter((element) => {
            const rect = element.getBoundingClientRect();
            const style = getComputedStyle(element);
            return rect.width > 0 && rect.height > 0 && style.visibility !== 'hidden';
          }).length,
      );

      for (let index = 0; index < triggerCount; index += 1) {
        const label = await page.$$eval(
          '[data-custom-select-trigger="true"]',
          (elements, currentIndex) => {
            const visible = elements.filter((element) => {
              const rect = element.getBoundingClientRect();
              const style = getComputedStyle(element);
              return rect.width > 0 && rect.height > 0 && style.visibility !== 'hidden';
            });
            const element = visible[currentIndex];
            return {
              aria: element?.getAttribute('aria-label') || null,
              disabled: element?.hasAttribute('disabled') || false,
              text: (element?.textContent || '').replace(/\s+/g, ' ').trim(),
            };
          },
          index,
        );

        if (label.disabled) {
          checks.push({ label, ok: true, page: item.path, skipped: 'disabled' });
          continue;
        }

        const result = await page
          .$$('[data-custom-select-trigger="true"]')
          .then(async (handles) => {
            const visibleHandles = [];
            for (const handle of handles) {
              const visible = await handle.evaluate((element) => {
                const rect = element.getBoundingClientRect();
                const style = getComputedStyle(element);
                return rect.width > 0 && rect.height > 0 && style.visibility !== 'hidden';
              });
              if (visible) visibleHandles.push(handle);
            }
            const handle = visibleHandles[index];
            if (!handle) return { ok: false, reason: 'trigger disappeared' };
            await handle.evaluate((element) =>
              element.scrollIntoView({ block: 'center', inline: 'center' }),
            );
            await handle.evaluate((element) => element.click());
            await page.waitForSelector('[role="listbox"]', { timeout: 3000 });
            const optionCount = await page.$$eval(
              '[role="listbox"] [role="option"]',
              (options) => options.length,
            );
            await page.keyboard.press('Escape');
            await new Promise((resolve) => setTimeout(resolve, 150));
            return { ok: optionCount > 0, optionCount };
          })
          .catch((error) => ({ ok: false, reason: error.message }));

        checks.push({ label, page: item.path, ...result });
      }
    }
  } finally {
    await browser.close();
  }

  const report = { baseUrl, checks, issues, runId };
  const path = writeReport('checkpoint-6-dropdowns-browser', report);
  console.log(
    JSON.stringify(
      {
        failed: checks.filter((check) => !check.ok),
        issueCount: issues.length,
        passed: checks.filter((check) => check.ok).length,
        path,
        runId,
        total: checks.length,
      },
      null,
      2,
    ),
  );
}

function writeReport(name, report) {
  fs.mkdirSync('test-results', { recursive: true });
  const path = `test-results/${runId}-${name}.json`;
  fs.writeFileSync(path, `${JSON.stringify(report, null, 2)}\n`);
  return path;
}

function cookieHeader(cookies) {
  return cookies.map((cookie) => `${cookie.name}=${encodeURIComponent(cookie.value)}`).join('; ');
}

async function apiRequest(baseUrl, role, method, path, body) {
  const cookies = await getRoleSessionCookies(role);
  const response = await fetch(`${baseUrl}${path}`, {
    body: body === undefined ? undefined : JSON.stringify(body),
    headers: {
      Cookie: cookieHeader(cookies),
      ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
    },
    method,
  });
  const json = await response.json().catch(() => null);
  return { body: json, status: response.status };
}

function expectStatus(status, allowed) {
  return allowed.includes(status);
}

async function apiCheckpoint1(baseUrl = 'http://localhost:3001') {
  const checks = [];

  for (const role of roles) {
    const session = await apiRequest(baseUrl, role, 'GET', '/api/admin/session');
    checks.push({
      actual: session.status,
      expected: [200],
      name: `${role} can read own admin session`,
      ok: expectStatus(session.status, [200]),
    });

    const teamList = await apiRequest(baseUrl, role, 'GET', '/api/admin/team-members');
    const canViewTeam = ['super_admin', 'admin'].includes(role);
    checks.push({
      actual: teamList.status,
      expected: canViewTeam ? [200] : [403],
      name: `${role} team member list permission`,
      ok: expectStatus(teamList.status, canViewTeam ? [200] : [403]),
    });
  }

  const superCreatesAdmin = await apiRequest(
    baseUrl,
    'super_admin',
    'POST',
    '/api/admin/team-members',
    {
      active: true,
      email: `e2e+${runId.toLowerCase()}-created-admin@baitulaqba.test`,
      fullName: `${runId} Created Admin`,
      notes: `${runId} API checkpoint created admin`,
      phone: '+10000000001',
      role: 'admin',
    },
  );
  checks.push({
    actual: superCreatesAdmin.status,
    expected: [201],
    name: 'super_admin can create admin team member',
    ok: expectStatus(superCreatesAdmin.status, [201]),
  });

  const adminCreatesViewer = await apiRequest(baseUrl, 'admin', 'POST', '/api/admin/team-members', {
    active: true,
    email: `e2e+${runId.toLowerCase()}-admin-created-viewer@baitulaqba.test`,
    fullName: `${runId} Admin Created Viewer`,
    notes: `${runId} API checkpoint admin-created viewer`,
    phone: '+10000000002',
    role: 'viewer',
  });
  checks.push({
    actual: adminCreatesViewer.status,
    expected: [201],
    name: 'admin can create non-admin team member',
    ok: expectStatus(adminCreatesViewer.status, [201]),
  });

  const adminCreatesAdmin = await apiRequest(baseUrl, 'admin', 'POST', '/api/admin/team-members', {
    active: true,
    email: `e2e+${runId.toLowerCase()}-admin-created-admin@baitulaqba.test`,
    fullName: `${runId} Admin Created Admin`,
    notes: `${runId} should be forbidden`,
    phone: '+10000000003',
    role: 'admin',
  });
  checks.push({
    actual: adminCreatesAdmin.status,
    expected: [403],
    name: 'admin cannot create admin team member',
    ok: expectStatus(adminCreatesAdmin.status, [403]),
  });

  for (const role of roles.filter((item) => !['super_admin', 'admin'].includes(item))) {
    const response = await apiRequest(baseUrl, role, 'POST', '/api/admin/team-members', {
      active: true,
      email: `e2e+${runId.toLowerCase()}-${role}-created-viewer@baitulaqba.test`,
      fullName: `${runId} ${role} Created Viewer`,
      notes: `${runId} should be forbidden`,
      phone: '+10000000004',
      role: 'viewer',
    });
    checks.push({
      actual: response.status,
      expected: [403],
      name: `${role} cannot create team member`,
      ok: expectStatus(response.status, [403]),
    });
  }

  const report = { baseUrl, checks, runId };
  const path = writeReport('checkpoint-1-api', report);
  console.log(
    JSON.stringify(
      {
        failed: checks.filter((check) => !check.ok),
        passed: checks.filter((check) => check.ok).length,
        path,
        runId,
        total: checks.length,
      },
      null,
      2,
    ),
  );
}

function requestPayload(label, overrides = {}) {
  recordCounter += 1;
  const suffix = `${runId.toLowerCase()}-${attemptId}-${recordCounter}-${label}`.replace(
    /[^a-z0-9-]/g,
    '-',
  );
  return {
    adminNotes: `${runId} ${label} admin notes`,
    cityCountry: 'Test City',
    confirmedMinimumAmount: true,
    email: `e2e+${suffix}@baitulaqba.test`,
    fullName: `${runId} ${label}`,
    message: `${runId} ${label} message`,
    phone: '+10000001000',
    preferredContactMethod: 'whatsapp',
    requestSource: 'admin_created',
    status: 'new',
    ...overrides,
  };
}

function contactLogPayload(label, overrides = {}) {
  return {
    contactMethod: 'whatsapp',
    direction: 'outbound',
    outcome: 'reached',
    summary: `${runId} ${label} contact summary`,
    ...overrides,
  };
}

function donorPayload(label, overrides = {}) {
  recordCounter += 1;
  const suffix = `${runId.toLowerCase()}-${attemptId}-${recordCounter}-${label}`.replace(
    /[^a-z0-9-]/g,
    '-',
  );
  return {
    active: true,
    cityCountry: 'Test City',
    donorSource: 'admin_created',
    email: `e2e+${suffix}@baitulaqba.test`,
    fullName: `${runId} ${label}`,
    notes: `${runId} ${label} donor notes`,
    phone: '+10000002000',
    preferredContactMethod: 'whatsapp',
    ...overrides,
  };
}

function orphanPayload(label, overrides = {}) {
  recordCounter += 1;
  const numeric = String(Date.now()).slice(-6) + String(recordCounter).padStart(3, '0');
  return {
    ageEstimate: 9,
    backgroundSummary: `${runId} ${label} background summary`,
    cityArea: 'Test Area',
    codeMode: 'manual',
    educationStatus: 'Grade 3',
    fullName: `${runId} ${label}`,
    gender: 'male',
    guardian: {
      address: 'Test Address',
      guardianName: `${runId} Guardian ${label}`,
      notes: `${runId} guardian notes`,
      phone: '+10000003000',
      relationship: 'Uncle',
      whatsapp: '+10000003000',
    },
    healthNotes: 'No known issues',
    orphanCode: `OR${numeric}`,
    profileImageUrl: 'https://images.unsplash.com/photo-1542810634-71277d95dcbb?w=800',
    verificationStatus: 'documents_received',
    ...overrides,
  };
}

async function roleTeamMemberId(baseUrl, role) {
  const session = await apiRequest(baseUrl, role, 'GET', '/api/admin/session');
  return session.body?.data?.teamMember?.id ?? null;
}

async function createRequestAs(baseUrl, role, label, overrides = {}) {
  return apiRequest(
    baseUrl,
    role,
    'POST',
    '/api/admin/sponsorship-requests',
    requestPayload(label, overrides),
  );
}

async function apiCheckpoint2(baseUrl = 'http://localhost:3001') {
  const checks = [];
  const supportId = await roleTeamMemberId(baseUrl, 'support_coordinator');

  for (const role of roles) {
    const list = await apiRequest(baseUrl, role, 'GET', '/api/admin/sponsorship-requests');
    checks.push({
      actual: list.status,
      expected: [200],
      name: `${role} can list sponsorship requests according to scoped visibility`,
      ok: expectStatus(list.status, [200]),
    });
  }

  for (const role of roles) {
    const canCreate = [
      'super_admin',
      'admin',
      'sponsorship_manager',
      'support_coordinator',
    ].includes(role);
    const response = await createRequestAs(baseUrl, role, `create-${role}`);
    checks.push({
      actual: response.status,
      expected: canCreate ? [201] : [403],
      name: `${role} sponsorship request create permission`,
      ok: expectStatus(response.status, canCreate ? [201] : [403]),
    });
  }

  const assigned = await createRequestAs(baseUrl, 'sponsorship_manager', 'assigned-to-support', {
    assignedTeamMemberId: supportId,
  });
  checks.push({
    actual: assigned.status,
    expected: [201],
    name: 'sponsorship_manager can create assigned request',
    ok: expectStatus(assigned.status, [201]),
  });

  const unassigned = await createRequestAs(
    baseUrl,
    'sponsorship_manager',
    'unassigned-for-support',
  );
  checks.push({
    actual: unassigned.status,
    expected: [201],
    name: 'sponsorship_manager can create unassigned request',
    ok: expectStatus(unassigned.status, [201]),
  });
  const unassignedId = unassigned.body?.data?.id;

  const supportAssignedList = await apiRequest(
    baseUrl,
    'support_coordinator',
    'GET',
    '/api/admin/sponsorship-requests',
  );
  const supportSeesAssignedOnly =
    Array.isArray(supportAssignedList.body?.data) &&
    supportAssignedList.body.data.every((item) => item.assignedTeamMemberId === supportId);
  checks.push({
    actual: supportSeesAssignedOnly ? 200 : 500,
    expected: [200],
    name: 'support_coordinator list is scoped to assigned requests',
    ok: supportAssignedList.status === 200 && supportSeesAssignedOnly,
  });

  for (const role of roles) {
    const canAssign = ['super_admin', 'admin', 'sponsorship_manager'].includes(role);
    const response = await apiRequest(
      baseUrl,
      role,
      'PATCH',
      `/api/admin/sponsorship-requests/${unassignedId}`,
      {
        assignedTeamMemberId: supportId,
      },
    );
    checks.push({
      actual: response.status,
      expected: canAssign ? [200] : [403],
      name: `${role} assignment update permission`,
      ok: expectStatus(response.status, canAssign ? [200] : [403]),
    });
  }

  const mutable = await createRequestAs(baseUrl, 'sponsorship_manager', 'status-and-notes', {
    assignedTeamMemberId: supportId,
  });
  const mutableId = mutable.body?.data?.id;
  checks.push({
    actual: mutable.status,
    expected: [201],
    name: 'created mutable request for status/contact tests',
    ok: expectStatus(mutable.status, [201]),
  });

  for (const role of roles) {
    const canUpdate = [
      'super_admin',
      'admin',
      'sponsorship_manager',
      'support_coordinator',
    ].includes(role);
    const response = await apiRequest(
      baseUrl,
      role,
      'PATCH',
      `/api/admin/sponsorship-requests/${mutableId}`,
      {
        adminNotes: `${runId} updated by ${role}`,
      },
    );
    checks.push({
      actual: response.status,
      expected: canUpdate ? [200] : [403],
      name: `${role} request notes update permission`,
      ok: expectStatus(response.status, canUpdate ? [200] : [403]),
    });
  }

  for (const role of roles) {
    const canCreateLog = [
      'super_admin',
      'admin',
      'sponsorship_manager',
      'support_coordinator',
    ].includes(role);
    const response = await apiRequest(
      baseUrl,
      role,
      'POST',
      `/api/admin/sponsorship-requests/${mutableId}/contact-logs`,
      contactLogPayload(`request-log-${role}`),
    );
    checks.push({
      actual: response.status,
      expected: canCreateLog ? [201] : [403],
      name: `${role} request contact log create permission`,
      ok: expectStatus(response.status, canCreateLog ? [201] : [403]),
    });
  }

  const conversion = await createRequestAs(baseUrl, 'sponsorship_manager', 'conversion-happy-path');
  const conversionId = conversion.body?.data?.id;
  checks.push({
    actual: conversion.status,
    expected: [201],
    name: 'created request for conversion happy path',
    ok: expectStatus(conversion.status, [201]),
  });

  for (const status of ['contacted', 'profiles_prepared', 'profiles_shared']) {
    const response = await apiRequest(
      baseUrl,
      'sponsorship_manager',
      'PATCH',
      `/api/admin/sponsorship-requests/${conversionId}`,
      {
        status,
      },
    );
    checks.push({
      actual: response.status,
      expected: [200],
      name: `sponsorship_manager can transition request to ${status}`,
      ok: expectStatus(response.status, [200]),
    });
  }

  const convert = await apiRequest(
    baseUrl,
    'sponsorship_manager',
    'POST',
    `/api/admin/sponsorship-requests/${conversionId}/convert-to-donor`,
  );
  checks.push({
    actual: convert.status,
    expected: [200],
    name: 'sponsorship_manager can convert profiles_shared request to donor',
    ok: expectStatus(convert.status, [200]),
  });

  const duplicateConvert = await apiRequest(
    baseUrl,
    'sponsorship_manager',
    'POST',
    `/api/admin/sponsorship-requests/${conversionId}/convert-to-donor`,
  );
  checks.push({
    actual: duplicateConvert.status,
    expected: [200, 409],
    name: 'duplicate conversion does not create an extra donor',
    ok: expectStatus(duplicateConvert.status, [200, 409]),
  });

  const blockedConversion = await createRequestAs(
    baseUrl,
    'sponsorship_manager',
    'conversion-blocked-role',
    {
      status: 'profiles_shared',
    },
  );
  const blockedConversionId = blockedConversion.body?.data?.id;
  for (const role of ['orphan_coordinator', 'finance_manager', 'support_coordinator', 'viewer']) {
    const response = await apiRequest(
      baseUrl,
      role,
      'POST',
      `/api/admin/sponsorship-requests/${blockedConversionId}/convert-to-donor`,
    );
    checks.push({
      actual: response.status,
      expected: [403],
      name: `${role} cannot convert request to donor`,
      ok: expectStatus(response.status, [403]),
    });
  }

  const report = { baseUrl, checks, runId };
  const path = writeReport('checkpoint-2-sponsorship-requests-api', report);
  console.log(
    JSON.stringify(
      {
        failed: checks.filter((check) => !check.ok),
        passed: checks.filter((check) => check.ok).length,
        path,
        runId,
        total: checks.length,
      },
      null,
      2,
    ),
  );
}

async function createDonorAs(baseUrl, role, label, overrides = {}) {
  return apiRequest(baseUrl, role, 'POST', '/api/admin/donors', donorPayload(label, overrides));
}

async function apiCheckpoint3(baseUrl = 'http://localhost:3001') {
  const checks = [];
  const supportId = await roleTeamMemberId(baseUrl, 'support_coordinator');

  for (const role of roles) {
    const canView = [
      'super_admin',
      'admin',
      'sponsorship_manager',
      'finance_manager',
      'support_coordinator',
      'viewer',
    ].includes(role);
    const list = await apiRequest(baseUrl, role, 'GET', '/api/admin/donors');
    checks.push({
      actual: list.status,
      expected: canView ? [200] : [403],
      name: `${role} donor list permission`,
      ok: expectStatus(list.status, canView ? [200] : [403]),
    });
  }

  for (const role of roles) {
    const canCreate = ['super_admin', 'admin', 'sponsorship_manager'].includes(role);
    const response = await createDonorAs(baseUrl, role, `create-donor-${role}`);
    checks.push({
      actual: response.status,
      expected: canCreate ? [201] : [403],
      name: `${role} donor create permission`,
      ok: expectStatus(response.status, canCreate ? [201] : [403]),
    });
  }

  const mutable = await createDonorAs(baseUrl, 'sponsorship_manager', 'mutable-donor');
  const mutableId = mutable.body?.data?.id;
  checks.push({
    actual: mutable.status,
    expected: [201],
    name: 'created mutable donor',
    ok: expectStatus(mutable.status, [201]),
  });

  for (const role of roles) {
    const canView = [
      'super_admin',
      'admin',
      'sponsorship_manager',
      'finance_manager',
      'viewer',
    ].includes(role);
    const expected = role === 'support_coordinator' ? [404] : canView ? [200] : [403];
    const response = await apiRequest(baseUrl, role, 'GET', `/api/admin/donors/${mutableId}`);
    checks.push({
      actual: response.status,
      expected,
      name: `${role} donor detail permission`,
      ok: expectStatus(response.status, expected),
    });
  }

  const supportBlocked = await apiRequest(
    baseUrl,
    'support_coordinator',
    'GET',
    `/api/admin/donors/${mutableId}`,
  );
  checks.push({
    actual: supportBlocked.status,
    expected: [404],
    name: 'support_coordinator cannot view donor outside assigned converted requests',
    ok: expectStatus(supportBlocked.status, [404]),
  });

  for (const role of roles) {
    const canUpdate = ['super_admin', 'admin', 'sponsorship_manager'].includes(role);
    const response = await apiRequest(baseUrl, role, 'PATCH', `/api/admin/donors/${mutableId}`, {
      notes: `${runId} donor updated by ${role}`,
      preferredContactMethod: 'email',
    });
    checks.push({
      actual: response.status,
      expected: canUpdate ? [200] : [403],
      name: `${role} donor update permission`,
      ok: expectStatus(response.status, canUpdate ? [200] : [403]),
    });
  }

  const deactivate = await apiRequest(
    baseUrl,
    'sponsorship_manager',
    'PATCH',
    `/api/admin/donors/${mutableId}`,
    {
      active: false,
    },
  );
  checks.push({
    actual: deactivate.status,
    expected: [200],
    name: 'sponsorship_manager can deactivate donor',
    ok: expectStatus(deactivate.status, [200]),
  });

  const reactivate = await apiRequest(baseUrl, 'admin', 'PATCH', `/api/admin/donors/${mutableId}`, {
    active: true,
  });
  checks.push({
    actual: reactivate.status,
    expected: [200],
    name: 'admin can reactivate donor',
    ok: expectStatus(reactivate.status, [200]),
  });

  const invalid = await createDonorAs(baseUrl, 'sponsorship_manager', 'invalid-donor', {
    email: '',
    fullName: '',
    preferredContactMethod: 'fax',
  });
  checks.push({
    actual: invalid.status,
    expected: [400],
    name: 'donor create validation rejects invalid fields/dropdown values',
    ok: expectStatus(invalid.status, [400]),
  });

  const supportRequest = await createRequestAs(
    baseUrl,
    'sponsorship_manager',
    'support-scoped-donor-request',
    {
      assignedTeamMemberId: supportId,
    },
  );
  const supportRequestId = supportRequest.body?.data?.id;
  checks.push({
    actual: supportRequest.status,
    expected: [201],
    name: 'created support-assigned request for donor scope test',
    ok: expectStatus(supportRequest.status, [201]),
  });
  for (const status of ['contacted', 'profiles_prepared', 'profiles_shared']) {
    const response = await apiRequest(
      baseUrl,
      'sponsorship_manager',
      'PATCH',
      `/api/admin/sponsorship-requests/${supportRequestId}`,
      {
        status,
      },
    );
    checks.push({
      actual: response.status,
      expected: [200],
      name: `prepared support-scoped donor request as ${status}`,
      ok: expectStatus(response.status, [200]),
    });
  }
  const supportConversion = await apiRequest(
    baseUrl,
    'sponsorship_manager',
    'POST',
    `/api/admin/sponsorship-requests/${supportRequestId}/convert-to-donor`,
  );
  const supportDonorId = supportConversion.body?.data?.donor?.id;
  checks.push({
    actual: supportConversion.status,
    expected: [200],
    name: 'converted support-assigned request to donor',
    ok: expectStatus(supportConversion.status, [200]) && Boolean(supportDonorId),
  });
  const supportAllowed = await apiRequest(
    baseUrl,
    'support_coordinator',
    'GET',
    `/api/admin/donors/${supportDonorId}`,
  );
  checks.push({
    actual: supportAllowed.status,
    expected: [200],
    name: 'support_coordinator can view donor from assigned converted request',
    ok: expectStatus(supportAllowed.status, [200]),
  });

  for (const role of roles) {
    const canCreateLog = [
      'super_admin',
      'admin',
      'sponsorship_manager',
      'support_coordinator',
    ].includes(role);
    const donorIdForRole = role === 'support_coordinator' ? supportDonorId : mutableId;
    const response = await apiRequest(
      baseUrl,
      role,
      'POST',
      `/api/admin/donors/${donorIdForRole}/contact-logs`,
      contactLogPayload(`donor-log-${role}`, { contactMethod: 'email', direction: 'inbound' }),
    );
    checks.push({
      actual: response.status,
      expected: canCreateLog ? [201] : [403],
      name: `${role} donor contact log create permission`,
      ok: expectStatus(response.status, canCreateLog ? [201] : [403]),
    });
  }

  const duplicate = await createDonorAs(baseUrl, 'sponsorship_manager', 'duplicate-donor', {
    email: mutable.body?.data?.email,
  });
  checks.push({
    actual: duplicate.status,
    expected: [409],
    name: 'duplicate donor email is rejected',
    ok: expectStatus(duplicate.status, [409]),
  });

  const report = { baseUrl, checks, runId };
  const path = writeReport('checkpoint-3-donors-api', report);
  console.log(
    JSON.stringify(
      {
        failed: checks.filter((check) => !check.ok),
        passed: checks.filter((check) => check.ok).length,
        path,
        runId,
        total: checks.length,
      },
      null,
      2,
    ),
  );
}

async function createOrphanAs(baseUrl, role, label, overrides = {}) {
  return apiRequest(baseUrl, role, 'POST', '/api/admin/orphans', orphanPayload(label, overrides));
}

async function createApprovedOrphan(baseUrl, label, overrides = {}) {
  const created = await createOrphanAs(baseUrl, 'orphan_coordinator', label, {
    verificationStatus: 'field_verified',
    ...overrides,
  });
  const id = created.body?.data?.id;
  if (!id) return created;
  await apiRequest(
    baseUrl,
    'orphan_coordinator',
    'POST',
    `/api/admin/orphans/${id}/submit-for-review`,
  );
  return apiRequest(baseUrl, 'admin', 'POST', `/api/admin/orphans/${id}/approve`);
}

async function apiCheckpoint4(baseUrl = 'http://localhost:3001') {
  const checks = [];

  for (const role of roles) {
    const list = await apiRequest(baseUrl, role, 'GET', '/api/admin/orphans');
    checks.push({
      actual: list.status,
      expected: [200],
      name: `${role} orphan list permission`,
      ok: expectStatus(list.status, [200]),
    });
  }

  for (const role of roles) {
    const canCreate = ['super_admin', 'admin', 'orphan_coordinator'].includes(role);
    const response = await createOrphanAs(baseUrl, role, `create-orphan-${role}`);
    checks.push({
      actual: response.status,
      expected: canCreate ? [201] : [403],
      name: `${role} orphan create permission`,
      ok: expectStatus(response.status, canCreate ? [201] : [403]),
    });
  }

  const mutable = await createOrphanAs(baseUrl, 'orphan_coordinator', 'mutable-orphan');
  const mutableId = mutable.body?.data?.id;
  checks.push({
    actual: mutable.status,
    expected: [201],
    name: 'created mutable orphan',
    ok: expectStatus(mutable.status, [201]),
  });

  for (const role of roles) {
    const response = await apiRequest(baseUrl, role, 'GET', `/api/admin/orphans/${mutableId}`);
    checks.push({
      actual: response.status,
      expected: [200],
      name: `${role} orphan detail permission`,
      ok: expectStatus(response.status, [200]),
    });
  }

  for (const role of roles) {
    const canUpdate = ['super_admin', 'admin', 'orphan_coordinator'].includes(role);
    const response = await apiRequest(baseUrl, role, 'PATCH', `/api/admin/orphans/${mutableId}`, {
      backgroundSummary: `${runId} orphan updated by ${role}`,
      verificationStatus: 'field_verified',
    });
    checks.push({
      actual: response.status,
      expected: canUpdate ? [200] : [403],
      name: `${role} orphan update permission`,
      ok: expectStatus(response.status, canUpdate ? [200] : [403]),
    });
  }

  const review = await createOrphanAs(baseUrl, 'orphan_coordinator', 'review-flow-orphan', {
    verificationStatus: 'field_verified',
  });
  const reviewId = review.body?.data?.id;
  checks.push({
    actual: review.status,
    expected: [201],
    name: 'created orphan for review flow',
    ok: expectStatus(review.status, [201]),
  });

  const submit = await apiRequest(
    baseUrl,
    'orphan_coordinator',
    'POST',
    `/api/admin/orphans/${reviewId}/submit-for-review`,
  );
  checks.push({
    actual: submit.status,
    expected: [200],
    name: 'orphan_coordinator can submit orphan for review',
    ok: expectStatus(submit.status, [200]),
  });

  const approve = await apiRequest(
    baseUrl,
    'admin',
    'POST',
    `/api/admin/orphans/${reviewId}/approve`,
  );
  checks.push({
    actual: approve.status,
    expected: [200],
    name: 'admin can approve orphan profile',
    ok: expectStatus(approve.status, [200]),
  });

  const coordinatorEditApproved = await apiRequest(
    baseUrl,
    'orphan_coordinator',
    'PATCH',
    `/api/admin/orphans/${reviewId}`,
    {
      backgroundSummary: `${runId} should be blocked on approved profile`,
    },
  );
  checks.push({
    actual: coordinatorEditApproved.status,
    expected: [403],
    name: 'orphan_coordinator cannot edit approved orphan profile',
    ok: expectStatus(coordinatorEditApproved.status, [403]),
  });

  const archive = await apiRequest(
    baseUrl,
    'super_admin',
    'POST',
    `/api/admin/orphans/${reviewId}/archive`,
    {
      archiveReason: `${runId} archive reason`,
    },
  );
  checks.push({
    actual: archive.status,
    expected: [200],
    name: 'super_admin can archive orphan profile',
    ok: expectStatus(archive.status, [200]),
  });

  const blockedApprove = await createOrphanAs(
    baseUrl,
    'orphan_coordinator',
    'blocked-approval-orphan',
    {
      verificationStatus: 'field_verified',
    },
  );
  const blockedApproveId = blockedApprove.body?.data?.id;
  await apiRequest(
    baseUrl,
    'orphan_coordinator',
    'POST',
    `/api/admin/orphans/${blockedApproveId}/submit-for-review`,
  );
  for (const role of [
    'sponsorship_manager',
    'orphan_coordinator',
    'finance_manager',
    'support_coordinator',
    'viewer',
  ]) {
    const response = await apiRequest(
      baseUrl,
      role,
      'POST',
      `/api/admin/orphans/${blockedApproveId}/approve`,
    );
    checks.push({
      actual: response.status,
      expected: [403],
      name: `${role} cannot approve orphan profile`,
      ok: expectStatus(response.status, [403]),
    });
  }

  for (const role of roles) {
    const canViewDocs = ['super_admin', 'admin', 'orphan_coordinator'].includes(role);
    const response = await apiRequest(
      baseUrl,
      role,
      'GET',
      `/api/admin/orphans/${mutableId}/documents`,
    );
    checks.push({
      actual: response.status,
      expected: canViewDocs ? [200] : [403],
      name: `${role} orphan document list permission`,
      ok: expectStatus(response.status, canViewDocs ? [200] : [403]),
    });
  }

  for (const role of roles) {
    const canDownloadPdf = [
      'super_admin',
      'admin',
      'sponsorship_manager',
      'orphan_coordinator',
    ].includes(role);
    const response = await apiRequest(
      baseUrl,
      role,
      'GET',
      `/api/admin/orphans/${mutableId}/profile-pdf`,
    );
    checks.push({
      actual: response.status,
      expected: canDownloadPdf ? [200] : [403],
      name: `${role} orphan profile PDF permission`,
      ok: expectStatus(response.status, canDownloadPdf ? [200] : [403]),
    });
  }

  const invalid = await createOrphanAs(baseUrl, 'orphan_coordinator', 'invalid-orphan', {
    fullName: '',
    orphanCode: 'BAD',
    profileImageUrl: '',
  });
  checks.push({
    actual: invalid.status,
    expected: [400],
    name: 'orphan create validation rejects invalid fields/dropdown values',
    ok: expectStatus(invalid.status, [400]),
  });

  const report = { baseUrl, checks, runId };
  const path = writeReport('checkpoint-4-orphans-api', report);
  console.log(
    JSON.stringify(
      {
        failed: checks.filter((check) => !check.ok),
        passed: checks.filter((check) => check.ok).length,
        path,
        runId,
        total: checks.length,
      },
      null,
      2,
    ),
  );
}

function matchPayload(donorId, orphanId, overrides = {}) {
  return {
    currency: 'PKR',
    donorId,
    monthlyAmount: 55,
    notes: `${runId} match notes`,
    orphanId,
    startedAt: '2026-07-09',
    ...overrides,
  };
}

async function createEligibleMatchFixture(
  baseUrl,
  label,
  donorOverrides = {},
  orphanOverrides = {},
) {
  const donor = await createDonorAs(
    baseUrl,
    'sponsorship_manager',
    `${label}-donor`,
    donorOverrides,
  );
  const orphan = await createApprovedOrphan(baseUrl, `${label}-orphan`, orphanOverrides);
  return {
    donor,
    donorId: donor.body?.data?.id,
    orphan,
    orphanId: orphan.body?.data?.id,
  };
}

async function createMatchAs(baseUrl, role, label, donorOverrides = {}, orphanOverrides = {}) {
  const fixture = await createEligibleMatchFixture(baseUrl, label, donorOverrides, orphanOverrides);
  const response = await apiRequest(
    baseUrl,
    role,
    'POST',
    '/api/admin/matches',
    matchPayload(fixture.donorId, fixture.orphanId),
  );
  return { fixture, response };
}

async function apiCheckpoint5(baseUrl = 'http://localhost:3001') {
  const checks = [];

  for (const role of roles) {
    const list = await apiRequest(baseUrl, role, 'GET', '/api/admin/matches');
    checks.push({
      actual: list.status,
      expected: [200],
      name: `${role} match list permission`,
      ok: expectStatus(list.status, [200]),
    });
  }

  for (const role of roles) {
    const canCreate = ['super_admin', 'admin', 'sponsorship_manager'].includes(role);
    const { response } = await createMatchAs(baseUrl, role, `create-match-${role}`);
    checks.push({
      actual: response.status,
      expected: canCreate ? [201] : [403],
      name: `${role} match create permission`,
      ok: expectStatus(response.status, canCreate ? [201] : [403]),
    });
  }

  const managed = await createMatchAs(baseUrl, 'sponsorship_manager', 'managed-match');
  const matchId = managed.response.body?.data?.id;
  checks.push({
    actual: managed.response.status,
    expected: [201],
    name: 'created managed active match',
    ok: expectStatus(managed.response.status, [201]),
  });

  for (const role of roles) {
    const detail = await apiRequest(baseUrl, role, 'GET', `/api/admin/matches/${matchId}`);
    checks.push({
      actual: detail.status,
      expected: [200],
      name: `${role} match detail permission`,
      ok: expectStatus(detail.status, [200]),
    });
  }

  for (const role of roles) {
    const canUpdate = ['super_admin', 'admin', 'sponsorship_manager'].includes(role);
    const response = await apiRequest(baseUrl, role, 'PATCH', `/api/admin/matches/${matchId}`, {
      notes: `${runId} match updated by ${role}`,
    });
    checks.push({
      actual: response.status,
      expected: canUpdate ? [200] : [403],
      name: `${role} match update permission`,
      ok: expectStatus(response.status, canUpdate ? [200] : [403]),
    });
  }

  const pause = await apiRequest(
    baseUrl,
    'sponsorship_manager',
    'POST',
    `/api/admin/matches/${matchId}/pause`,
    {
      reason: `${runId} pause reason`,
    },
  );
  checks.push({
    actual: pause.status,
    expected: [200],
    name: 'sponsorship_manager can pause active match',
    ok: expectStatus(pause.status, [200]),
  });

  const resume = await apiRequest(
    baseUrl,
    'sponsorship_manager',
    'POST',
    `/api/admin/matches/${matchId}/resume`,
  );
  checks.push({
    actual: resume.status,
    expected: [200],
    name: 'sponsorship_manager can resume paused match',
    ok: expectStatus(resume.status, [200]),
  });

  const end = await apiRequest(baseUrl, 'admin', 'POST', `/api/admin/matches/${matchId}/end`, {
    endedAt: '2026-07-10',
    reason: `${runId} end reason`,
  });
  checks.push({
    actual: end.status,
    expected: [200],
    name: 'admin can end active match',
    ok: expectStatus(end.status, [200]),
  });

  const resumeEnded = await apiRequest(
    baseUrl,
    'admin',
    'POST',
    `/api/admin/matches/${matchId}/resume`,
  );
  checks.push({
    actual: resumeEnded.status,
    expected: [400],
    name: 'ended match cannot be resumed',
    ok: expectStatus(resumeEnded.status, [400]),
  });

  const voidable = await createMatchAs(baseUrl, 'sponsorship_manager', 'voidable-match');
  const voidableId = voidable.response.body?.data?.id;
  const sponsorVoid = await apiRequest(
    baseUrl,
    'sponsorship_manager',
    'POST',
    `/api/admin/matches/${voidableId}/void`,
    {
      reason: `${runId} sponsor should not void`,
    },
  );
  checks.push({
    actual: sponsorVoid.status,
    expected: [403],
    name: 'sponsorship_manager cannot void match',
    ok: expectStatus(sponsorVoid.status, [403]),
  });

  const adminVoid = await apiRequest(
    baseUrl,
    'admin',
    'POST',
    `/api/admin/matches/${voidableId}/void`,
    {
      reason: `${runId} admin void reason`,
    },
  );
  checks.push({
    actual: adminVoid.status,
    expected: [200],
    name: 'admin can void active match',
    ok: expectStatus(adminVoid.status, [200]),
  });

  const inactiveFixture = await createEligibleMatchFixture(baseUrl, 'inactive-donor-match', {
    active: false,
  });
  const inactive = await apiRequest(
    baseUrl,
    'sponsorship_manager',
    'POST',
    '/api/admin/matches',
    matchPayload(inactiveFixture.donorId, inactiveFixture.orphanId),
  );
  checks.push({
    actual: inactive.status,
    expected: [400],
    name: 'inactive donor cannot be matched',
    ok: expectStatus(inactive.status, [400]),
  });

  const draftDonor = await createDonorAs(
    baseUrl,
    'sponsorship_manager',
    'draft-orphan-match-donor',
  );
  const draftOrphan = await createOrphanAs(baseUrl, 'orphan_coordinator', 'draft-orphan-match', {
    verificationStatus: 'field_verified',
  });
  const draft = await apiRequest(
    baseUrl,
    'sponsorship_manager',
    'POST',
    '/api/admin/matches',
    matchPayload(draftDonor.body?.data?.id, draftOrphan.body?.data?.id),
  );
  checks.push({
    actual: draft.status,
    expected: [400],
    name: 'draft orphan cannot be matched',
    ok: expectStatus(draft.status, [400]),
  });

  const alreadyFixture = await createEligibleMatchFixture(baseUrl, 'already-matched');
  const first = await apiRequest(
    baseUrl,
    'sponsorship_manager',
    'POST',
    '/api/admin/matches',
    matchPayload(alreadyFixture.donorId, alreadyFixture.orphanId),
  );
  const secondDonor = await createDonorAs(
    baseUrl,
    'sponsorship_manager',
    'already-matched-second-donor',
  );
  const second = await apiRequest(
    baseUrl,
    'sponsorship_manager',
    'POST',
    '/api/admin/matches',
    matchPayload(secondDonor.body?.data?.id, alreadyFixture.orphanId),
  );
  checks.push({
    actual: first.status,
    expected: [201],
    name: 'created first active match for race/duplicate eligibility test',
    ok: expectStatus(first.status, [201]),
  });
  checks.push({
    actual: second.status,
    expected: [400, 409],
    name: 'already matched orphan cannot receive second active match',
    ok: expectStatus(second.status, [400, 409]),
  });

  const report = { baseUrl, checks, runId };
  const path = writeReport('checkpoint-5-matches-api', report);
  console.log(
    JSON.stringify(
      {
        failed: checks.filter((check) => !check.ok),
        passed: checks.filter((check) => check.ok).length,
        path,
        runId,
        total: checks.length,
      },
      null,
      2,
    ),
  );
}

async function main() {
  if (command === 'seed-roles') {
    await seedRoles();
    return;
  }

  if (command === 'session') {
    await createRoleSession(process.argv[3]);
    return;
  }

  if (command === 'browser-checkpoint') {
    await browserCheckpoint(process.argv[3]);
    return;
  }

  if (command === 'dashboard-screenshot') {
    await dashboardScreenshot(process.argv[3], process.argv[4]);
    return;
  }

  if (command === 'dropdown-checkpoint') {
    await dropdownCheckpoint(process.argv[3]);
    return;
  }

  if (command === 'api-checkpoint-1') {
    await apiCheckpoint1(process.argv[3]);
    return;
  }

  if (command === 'api-checkpoint-2') {
    await apiCheckpoint2(process.argv[3]);
    return;
  }

  if (command === 'api-checkpoint-3') {
    await apiCheckpoint3(process.argv[3]);
    return;
  }

  if (command === 'api-checkpoint-4') {
    await apiCheckpoint4(process.argv[3]);
    return;
  }

  if (command === 'api-checkpoint-5') {
    await apiCheckpoint5(process.argv[3]);
    return;
  }

  console.log(`Usage:
  node scripts/admin-e2e.mjs seed-roles
  node scripts/admin-e2e.mjs session <role>
  node scripts/admin-e2e.mjs browser-checkpoint [baseUrl]
  node scripts/admin-e2e.mjs dashboard-screenshot [baseUrl] [outputPath]
  node scripts/admin-e2e.mjs dropdown-checkpoint [baseUrl]
  node scripts/admin-e2e.mjs api-checkpoint-1 [baseUrl]
  node scripts/admin-e2e.mjs api-checkpoint-2 [baseUrl]
  node scripts/admin-e2e.mjs api-checkpoint-3 [baseUrl]
  node scripts/admin-e2e.mjs api-checkpoint-4 [baseUrl]
  node scripts/admin-e2e.mjs api-checkpoint-5 [baseUrl]

Environment:
  E2E_RUN_ID      Optional stable run id
  E2E_PASSWORD    Optional stable password for generated auth users
`);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});

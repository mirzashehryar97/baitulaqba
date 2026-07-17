# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Bait ul Aqba: a Next.js 15 (App Router) + React 19 + TypeScript site with three surfaces:

- Public marketing site (`/`, `/mosques-schools`) with a sponsor-an-orphan lead form.
- `/admin` panel for internal team members (role-based access, orphan/donor/match/receipt management).
- `/portal` for donors (view sponsorships, upload receipts, see contribution stats).

Backend is Supabase (Postgres + Auth). See "Backend persistence pattern" below for the rule that governs how new data flows are built.

## Commands

```bash
npm run dev          # start dev server (Next.js, turbopack)
npm run build        # production build
npm run start         # run production build
npm run lint          # biome check, errors only
npm run lint:fix      # biome check --write (auto-fix)
npm run format         # biome format .
npm run type-check     # tsc --noEmit
```

There is no unit test runner (no jest/vitest) configured. Verification is done via:

```bash
node scripts/browser-smoke.mjs   # puppeteer-core smoke test across key routes (local Chrome, BASE_URL env var)
node scripts/admin-e2e.mjs <command>   # scripted E2E against a real Supabase test project; run with no args for usage
```

`scripts/admin-e2e.mjs` creates real Supabase Auth users/rows prefixed with an `E2E-<timestamp>` run id (see `docs/admin-platform-e2e-checkpoints.md` for the checkpoint list it's meant to satisfy) — it talks to whatever Supabase project is configured in `.env.local`, so only point it at a test project.

Linting/formatting is Biome (`biome.json`), not ESLint/Prettier. Biome enforces import-group ordering (node → react → next → packages → `@/components` → `@/data` → `@/lib` → `@/styles` → `@/*` → relative), single quotes, and strict a11y rules (`noAutofocus`, `useAltText`, `noSvgWithoutTitle` off, etc.). `noExplicitAny` is an error. Run `lint` before considering a change done.

## Backend persistence pattern (from AGENTS.md)

For any user-submitted data: **Next.js UI → Next.js API route/server action → Supabase Postgres**, never a client component talking to Supabase directly for core business workflows. This is deliberate — the plan is to eventually swap Supabase for a Django + Postgres backend, so API route names and payload shapes should stay portable (e.g. `/api/sponsorship-requests` is intended to survive that migration unchanged).

## Path alias

`@/*` → `src/*` (configured in both `tsconfig.json` and `next.config.mjs`'s webpack/turbopack resolvers).

## Auth & authorization architecture

Both `/admin` and `/portal` use Supabase Auth (Google OAuth), but **authentication alone does not grant access** — a Google login only works if a matching row exists in `team_members` or `donors` with `active = true`. `middleware.ts` only refreshes the Supabase session cookie on every request (except static assets); it does not do route gating itself.

The authorization stack, bottom to top:

1. **`src/lib/supabase/{server,browser,config}.ts`** — `createSupabaseAdminClient()` (service-role key, bypasses RLS, server-only) vs `createSupabaseServerClient()` (anon key + cookies, user-session-aware, used for `auth.getUser()`).
2. **`src/lib/adminAuth.ts`** — `getCurrentAuthUser()`, `getCurrentTeamMember()` / `getCurrentDonor()` (looks up by `auth_user_id` first, falls back to email match and links `auth_user_id` on first login), `requireTeamMember(allowedRoles?)` / `requireDonor()` which throw `UnauthorizedError` (401) / `ForbiddenError` (403).
3. **`src/lib/adminPermissions.ts`** — the single source of truth for what each `TeamMemberRole` can see/do. Two maps: `pagePermissions` (which `AdminPageKey` a role can open) and `actionPermissions` (which `AdminActionKey` a role can perform), plus derived `canX()` helper functions (e.g. `canApproveOrphans`, `canVerifyReceipts`). When adding a new admin capability, add the key to the relevant union type and both maps here rather than hardcoding a role check elsewhere.
4. **`src/lib/adminPageAccess.ts`** — `getAdminPageContext(pageKeyOrAllowedRoles?)` is called from admin server components/layouts; it redirects to `/admin/login` or `/admin/forbidden` as needed and returns `{ teamMember, donorProfile }`.

Roles (`TeamMemberRole`, see `src/types/accounts.ts`): `super_admin`, `admin`, `sponsorship_manager`, `orphan_coordinator`, `finance_manager`, `support_coordinator`, `viewer`. Full per-role capability matrix is documented in `docs/admin-donor-platform-plan.md`.

A single Google account can have both a `team_members` profile and a `donors` profile. When both are active, the admin panel is the default landing area; the admin shell exposes a "switch to donor portal" affordance. Don't assume admin/donor are mutually exclusive.

## API route pattern

Routes under `src/app/api/admin/**` and `src/app/api/portal/**` follow a consistent shape — look at `src/app/api/admin/orphans/route.ts` as the canonical example:

1. Validate/parse the request body first (before touching auth), returning `400` with field errors if invalid.
2. `requireTeamMember()` or `requireDonor()` to authenticate.
3. Check the relevant `canX(role)` permission from `adminPermissions.ts`; throw `ForbiddenError` if not allowed.
4. Delegate the actual work to a domain module in `src/lib/*.ts` (e.g. `orphans.ts`, `donors.ts`, `sponsorshipMatches.ts`, `sponsorshipRequests.ts`, `finance.ts`, `teamMembers.ts`, `portal.ts`). These modules own the Supabase queries and the snake_case row ↔ camelCase type mapping (`*Row` types in `src/types/*.ts` vs the mapped domain type).
5. Catch-all `catch (error)` calls a `handleXApiError(error, fallbackMessage)` helper (`orphanApiErrors.ts`, `financeApiErrors.ts`, `matchApiErrors.ts`) that maps `UnauthorizedError`/`ForbiddenError`/`MissingSupabaseConfigError`/domain-specific `Error` messages (e.g. duplicate-key text, missing-schema text) to the right HTTP status and JSON shape. Follow this pattern rather than inlining status-code logic in the route handler.

## Database

`supabase/schema.sql` is the single source of truth for the schema and is applied manually via the Supabase SQL editor — there is no migration tool. It's written to be idempotent and re-runnable: new columns/constraints are added via `create table if not exists` followed by `alter table ... add column if not exists` / `drop constraint if exists` + `add constraint`. When changing the schema, extend this file in the same style rather than writing a separate migration.

## Planning docs

- `docs/admin-donor-platform-plan.md` is the authoritative blueprint for the admin/donor platform — role definitions, permission matrix, planned pages, database plan, and phased workflows. It explicitly says features should be built in approved phases, not all at once — check it before assuming a planned page/feature already exists or before scope-creeping an admin feature.
- `docs/admin-platform-e2e-checkpoints.md` lists the pass criteria each checkpoint of the admin platform must meet, keyed to what `scripts/admin-e2e.mjs` exercises.

## Styling

Tailwind v4 via `@tailwindcss/postcss` (no `tailwind.config.js` — theme tokens are defined in `@theme` blocks in `src/app/globals.css`, e.g. `--color-emerald`, `--color-gold`, `--font-serif`/`--font-sans`). Fonts are self-hosted via `@fontsource/amiri` and `@fontsource/inter`. Framer Motion variants shared across sections live in `src/lib/motion.ts` (`fadeUp`, `fadeIn`, `staggerContainer`, `scaleIn`, `viewportOnce`). Shared inline style tokens for the admin/portal work surfaces (cards, buttons, status pills) live in `src/components/ui/work-surface.ts` (`workSurface`, `workflowStatus`) — reuse these instead of re-deriving colors per component.

## Route structure notes

- `src/app/admin/(panel)/...` is a route group wrapping all authenticated admin pages with one shared layout/auth check (`(panel)/layout.tsx`, `dynamic = 'force-dynamic'`); `(requests)`, `(list)` etc. are route groups used purely for file organization and don't appear in the URL.
- `src/app/portal/(donor)/...` mirrors this for the donor portal.
- Public site content (copy, stats, initiative cards) is centralized in `src/data/content.ts` and consumed by section components in `src/components/sections/`.

## Conventions

- **One component per file.** The existing codebase does not consistently follow this yet — that's legacy debt, not precedent. Don't add a new component to a file that already exports another component, and don't use an existing multi-component file as justification for adding more to it.
- **DRY.** Before writing new logic (a validation, a permission check, a status-badge mapping, a Supabase row-mapping function, etc.), check whether an existing helper in `src/lib/*.ts` or a shared component in `src/components/ui/` already does it. Extend/reuse it rather than duplicating it inline — this codebase already has a lot of near-duplicate per-domain modules (`orphanApiErrors.ts`, `financeApiErrors.ts`, `matchApiErrors.ts`, etc.); don't add another copy-pasted variant when the existing pattern can be reused or generalized.
- **After every code change**, in this order:
  1. `npm run lint:fix` — auto-fix what Biome can fix.
  2. `npm run lint` — review and manually fix whatever remains.
  3. `npm run type-check` — fix any type errors.
  4. Do **not** run `npm run build` unless explicitly asked to.

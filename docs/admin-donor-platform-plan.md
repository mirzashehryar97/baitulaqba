# Admin And Donor Platform Plan

This document is the planning blueprint for the future Bait ul Aqba sponsorship management system.
It is not an implementation checklist that should be coded all at once. Build it in phases, and only
start implementation after explicit approval.

## Current MVP State

Already implemented:

- Public sponsor form modal.
- Form submit API route: `POST /api/sponsorship-requests`.
- Supabase server client using `SUPABASE_SERVICE_ROLE_KEY`.
- Supabase table for `sponsorship_requests`.
- Supabase tables for `team_members` and `donors`.
- Google OAuth admin login through Supabase Auth.
- First `super_admin` bootstrap record for `mirzashehryar97@gmail.com`.
- Basic `/admin` sponsorship requests dashboard.
- `/admin/team` team member management.
- `/admin/team/new` team member creation.
- `/admin/team/[id]` team member detail/edit page.
- `/admin/team/roles` roles and access overview.
- Admin can view, search, filter, and update sponsorship requests.
- Admin can edit request status, internal notes, next follow-up date, and real team-member
  assignment.
- Admin can create manual sponsorship requests from the admin panel.
- Contact logs can be created and viewed inside sponsorship request details.
- Sponsorship requests can be converted into donor records without creating duplicate donors.
- Support Coordinator request visibility is scoped to assigned requests server-side.
- Phase 4 API routes exist for request creation, assignment lists, contact logs, and conversion.
- Super Admin/Admin team-member controls are partially enforced in UI and API.

Current limitations:

- Legacy `assigned_to` is still kept in the database for fallback display, but the app writes
  `assigned_team_member_id` for new assignments.
- Contact logs currently live inside request details; a separate `/admin/contact-logs` page is still
  optional future work.
- Sidebar items like orphan profiles, sponsors, reports, and settings are placeholders.
- Central role/page/action permission mapping is not complete yet.
- Some planned admin pages do not exist yet.
- Donor/user portal does not exist yet.

## Product Direction

The system should eventually have two separate account areas:

- Admin panel for internal team members.
- Donor portal for sponsors/donors.

Both account areas should use Supabase Auth with Google login, but access must be controlled by
database records. Random Google users should not gain access just because they can authenticate.

One Google account may intentionally have both profiles:

- A `team_members` profile for internal/admin access.
- A `donors` profile for donor portal access.

When a user has both active profiles, the app should prefer the admin panel after login. The admin
sidebar should show a "Switch to Donor Portal" option so they can intentionally view their donor
profile.

## Account Types

### Internal Team Accounts

Internal users are stored in `team_members`.

Initial bootstrap admin:

- `mirzashehryar97@gmail.com`

When Phase 1 is implemented, this email should be inserted into `team_members` with role
`super_admin` and `active = true`, so it can login through Google and create the rest of the team.

Login rule:

1. User clicks "Continue with Google" on the admin login page.
2. Supabase Auth verifies the Google account.
3. App checks whether the Google email exists in `team_members`.
4. App checks that `team_members.active = true`.
5. App links the Supabase Auth user id to the team member record if not already linked.
6. Role permissions decide what the user can see and do.
7. If the same Google account also has an active donor profile, admin remains the default area.

### Donor Accounts

Donors are stored in `donors`.

Login rule:

1. Donor clicks "Continue with Google" on the donor portal login page.
2. Supabase Auth verifies the Google account.
3. App checks whether the Google email exists in `donors`.
4. App checks that `donors.active = true`.
5. App links the Supabase Auth user id to the donor record if not already linked.
6. Donor can only see their own sponsorships, receipts, and contribution stats.

Dual-profile rule:

- Donor-only users go directly to the donor portal.
- Users who are both internal team members and donors default to the admin panel.
- Dual-profile users can enter the donor portal through the admin sidebar switch.

## Internal Roles

### `super_admin`

Highest control of the system.

Can:

- Manage team members.
- Assign any role, including admin roles.
- Activate/deactivate any team member, including admins.
- View and edit all data.
- Access settings.
- View audit logs.
- Override assignments and statuses.

### `admin`

Full operational control of the system, except protected admin-account controls.

Can:

- Manage non-admin team members.
- Assign non-admin roles.
- Activate/deactivate non-admin users.
- View and edit all data.
- Access settings.
- View audit logs.
- Override assignments and statuses.

Cannot:

- Change their own role or account status.
- Change another admin's role or account status.
- Assign admin or super admin roles.

### `sponsorship_manager`

Owns sponsor/donor relationship and matching workflow.

Can:

- Manage sponsorship requests.
- Add and edit donor records.
- Assign donors to approved orphan profiles.
- Update sponsor communication notes.
- View orphan profiles.
- View payment status.

Cannot:

- Manage team members.
- Change global settings.
- Verify finance receipts unless explicitly expanded later.

### `orphan_coordinator`

Owns orphan profile entry and profile maintenance.

Can:

- Add orphan details.
- Edit orphan profile drafts.
- Add guardian/caretaker details.
- Upload profile documents/photos.
- Submit profiles for review.

Cannot:

- Assign donors to orphans.
- Manage donor records.
- Verify receipts.
- Manage team members.

### `finance_manager`

Owns receipt verification and contribution tracking.

Can:

- View donors and sponsorship matches.
- Review uploaded receipts.
- Verify or reject receipts.
- Manage monthly contribution records.
- View financial reports.

Cannot:

- Add team members.
- Add orphan profile details.
- Assign donors to orphans by default.

### `support_coordinator`

Owns day-to-day follow-up and communication.

Can:

- View assigned requests.
- Add contact logs.
- Update follow-up notes.
- View donor and orphan summary information needed for support.

Cannot:

- Add team members.
- Assign donors to orphans.
- Verify receipts.
- Edit sensitive orphan profile fields, except limited notes if approved.

### `viewer`

Read-only trusted role.

Can:

- View dashboards and reports allowed by policy.
- View records without editing.

Cannot:

- Create, update, assign, verify, or delete records.

## Donor Role

Donor is not an internal admin role. Donors use the donor portal.

Donors can:

- View their assigned orphan or orphans.
- View sponsorship start date and monthly amount.
- Upload monthly donation receipts.
- View receipt status: pending, verified, or rejected.
- View total contributed.
- View monthly/yearly contribution charts.
- Update their own basic contact profile.

Donors cannot:

- Access the admin panel unless the same Google account also has an active `team_members` profile.
- View other donors.
- View unassigned orphan profiles.
- Edit orphan details.
- Approve receipts.
- See internal notes.

## Admin Pages

Planned admin routes:

- `/admin/login`
- `/admin`
- `/admin/sponsorship-requests`
- `/admin/sponsorship-requests/[id]`
- `/admin/orphans`
- `/admin/orphans/new`
- `/admin/orphans/[id]`
- `/admin/donors`
- `/admin/donors/new`
- `/admin/donors/[id]`
- `/admin/matches`
- `/admin/payments`
- `/admin/receipts`
- `/admin/contact-logs`
- `/admin/reports`
- `/admin/team`
- `/admin/settings`
- `/admin/audit-logs`

## Donor Portal Pages

Planned donor routes:

- `/portal/login`
- `/portal`
- `/portal/my-orphans`
- `/portal/my-orphans/[id]`
- `/portal/receipts`
- `/portal/receipts/upload`
- `/portal/contributions`
- `/portal/stats`
- `/portal/profile`

## Permission Matrix

| Page / Feature | Super Admin | Admin | Sponsorship Manager | Orphan Coordinator | Finance Manager | Support Coordinator | Viewer |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Dashboard | Yes | Yes | Yes | Yes | Yes | Yes | Yes |
| Sponsorship Requests | Yes | Yes | Yes | View | View | Assigned only | View |
| Request Details | Yes | Yes | Yes | View | View | Assigned only | View |
| Assign Requests | Yes | Yes | Yes | No | No | No | No |
| Add/Edit Donor | Yes | Yes | Yes | No | View | No | No |
| Assign Orphan To Donor | Yes | Yes | Yes | No | No | No | No |
| Orphan Profiles | Yes | Yes | View | Yes | View | View | View |
| Add Orphan Profile | Yes | Yes | No | Yes | No | No | No |
| Edit Orphan Profile | Yes | Yes | No | Yes | No | Limited notes | No |
| Approve/Publish Orphan Profile | Yes | Yes | Yes | No or draft only | No | No | No |
| Sponsors/Donors | Yes | Yes | View | View | Assigned only | View |
| Matches | Yes | Yes | View | View | No | View |
| Payments | Yes | View | No | Yes | No | View |
| Receipts | Yes | View | No | Yes | No | View |
| Verify Receipt | Yes | No | No | Yes | No | No |
| Contact Logs | Yes | Yes | View | View | Yes | View |
| Reports | Yes | Yes | Yes | Yes | View | View |
| Team Members | Yes | No | No | No | No | No |
| Settings | Yes | No | No | No | No | No |
| Audit Logs | Yes | View | No | View | No | View |

## Core Workflows

### Team Member Creation

1. Admin opens `/admin/team`.
2. Admin adds full name, email, phone number, role, and active status.
3. Team member receives instructions to login with Google using the same email.
4. On first login, the app links `team_members.auth_user_id` to Supabase Auth user id.
5. The team member sees only pages allowed by their role.

### Donor Creation And Login

1. Sponsorship Manager or Admin opens `/admin/donors/new`.
2. They add donor full name, email, phone number, country/city, and notes.
3. Donor receives instructions to login with Google using the same email.
4. On first login, the app links `donors.auth_user_id` to Supabase Auth user id.
5. Donor can access `/portal`.

### Orphan Profile Creation

1. Orphan Coordinator or Admin opens `/admin/orphans/new`.
2. They add orphan details and guardian/caretaker details.
3. They upload documents/photos if needed.
4. Profile starts as `draft`.
5. Profile can move to `under_review`.
6. Admin or Sponsorship Manager approves profile.
7. Approved profile becomes available for matching.

### Sponsorship Request To Donor Flow

1. A user submits the public sponsor form.
2. A record is saved in `sponsorship_requests`.
3. Sponsorship Manager reviews the request.
4. If valid, they create or link a `donors` record.
5. They mark the request as contacted/converted.
6. They assign an approved orphan profile to the donor through `sponsorship_matches`.

### Matching Donor To Orphan

1. Sponsorship Manager opens `/admin/matches`.
2. Selects donor.
3. Selects an approved orphan profile.
4. Sets monthly amount and sponsorship start date.
5. Creates a `sponsorship_matches` record.
6. Donor can now see the orphan in their portal.

### Receipt Upload And Verification

1. Donor opens `/portal/receipts/upload`.
2. Donor selects month, amount, and uploads receipt image/PDF.
3. Receipt is saved as `pending`.
4. Finance Manager opens `/admin/receipts`.
5. Finance Manager verifies or rejects the receipt.
6. Verified receipts count toward donor contribution stats.

### Contribution Stats

Donor portal should show:

- Total contributed.
- Contributions this year.
- Current month status.
- Monthly graph.
- Yearly graph.
- Receipt verification history.

Stats should be calculated from verified receipts or normalized monthly contribution records.

## Database Plan

### `team_members`

Purpose: internal admin/team accounts.

Key fields:

- `id`
- `auth_user_id`
- `full_name`
- `email`
- `phone`
- `role`
- `active`
- `created_by_team_member_id`
- `created_at`
- `updated_at`

Role values:

- `super_admin`
- `admin`
- `sponsorship_manager`
- `orphan_coordinator`
- `finance_manager`
- `support_coordinator`
- `viewer`

### `donors`

Purpose: sponsor/donor accounts for donor portal.

Key fields:

- `id`
- `auth_user_id`
- `full_name`
- `email`
- `phone`
- `city_country`
- `active`
- `notes`
- `created_by_team_member_id`
- `created_at`
- `updated_at`

### `sponsorship_requests`

Purpose: public sponsor form submissions.

Current table exists, but should later be expanded.

Future key fields:

- `id`
- `full_name`
- `email`
- `phone`
- `city_country`
- `preferred_contact_method`
- `message`
- `confirmed_minimum_amount`
- `status`
- `assigned_team_member_id`
- `converted_donor_id`
- `admin_notes`
- `created_at`
- `updated_at`

Migration note:

- Replace current `assigned_to text` with `assigned_team_member_id uuid references team_members(id)`.

### `orphan_profiles`

Purpose: orphan profile records.

Key fields:

- `id`
- `orphan_code`
- `full_name`
- `profile_image_url`
- `gender`
- `date_of_birth`
- `age_estimate`
- `city_area`
- `health_notes`
- `education_status`
- `background_summary`
- `verification_status`
- `profile_status`
- `created_by_team_member_id`
- `approved_by_team_member_id`
- `approved_at`
- `created_at`
- `updated_at`

Suggested `profile_status` values:

- `draft`
- `under_review`
- `approved`
- `matched`
- `archived`

### `orphan_guardians`

Purpose: caretaker/guardian information.

Key fields:

- `id`
- `orphan_id`
- `guardian_name`
- `relationship`
- `phone`
- `whatsapp`
- `address`
- `notes`
- `created_at`
- `updated_at`

### `sponsorship_matches`

Purpose: links donor to orphan.

Key fields:

- `id`
- `donor_id`
- `orphan_id`
- `monthly_amount`
- `status`
- `started_at`
- `ended_at`
- `created_by_team_member_id`
- `created_at`
- `updated_at`

Suggested `status` values:

- `active`
- `paused`
- `ended`

### `donation_receipts`

Purpose: donor receipt uploads and verification.

Key fields:

- `id`
- `donor_id`
- `sponsorship_match_id`
- `amount`
- `donation_month`
- `receipt_file_url`
- `status`
- `submitted_at`
- `verified_by_team_member_id`
- `verified_at`
- `rejection_reason`
- `created_at`
- `updated_at`

Suggested `status` values:

- `pending`
- `verified`
- `rejected`

### `monthly_contributions`

Purpose: normalized contribution records for reporting and graphs.

This can either be stored directly after receipt verification or calculated from verified receipts.
Start with calculated stats unless reporting becomes slow or complex.

Key fields if stored:

- `id`
- `donor_id`
- `sponsorship_match_id`
- `amount`
- `month`
- `source_receipt_id`
- `created_at`

### `contact_logs`

Purpose: communication history with donors and sponsorship requests.

Key fields:

- `id`
- `related_request_id`
- `donor_id`
- `team_member_id`
- `contact_method`
- `direction`
- `summary`
- `follow_up_at`
- `created_at`

Suggested `contact_method` values:

- `whatsapp`
- `phone`
- `email`
- `in_person`
- `other`

### `documents`

Purpose: uploaded orphan profile documents and donor receipts metadata.

Receipts may also stay in `donation_receipts`, but a shared documents table helps later.

Key fields:

- `id`
- `owner_type`
- `owner_id`
- `file_url`
- `file_name`
- `file_type`
- `uploaded_by_team_member_id`
- `uploaded_by_donor_id`
- `created_at`

### `audit_logs`

Purpose: track sensitive changes.

Key fields:

- `id`
- `actor_type`
- `actor_team_member_id`
- `actor_donor_id`
- `action`
- `entity_type`
- `entity_id`
- `metadata`
- `created_at`

Examples:

- team member added
- role changed
- orphan profile approved
- donor created
- match created
- receipt verified
- receipt rejected

## Storage Buckets

Future Supabase Storage buckets:

- `orphan-documents`
- `orphan-photos`
- `donation-receipts`

Access rules:

- Donors can upload their own receipts.
- Donors can view their own uploaded receipts.
- Donors should not browse other donors' files.
- Team members can access files according to role.
- Sensitive orphan documents should not be public.

## Security Rules

Important rules:

- Never rely only on hiding buttons in the UI.
- Every API route must check the current user's role.
- Donors can only access their own records.
- Team members can only perform actions allowed by role.
- Service role key must stay server-side only.
- Add audit logs for important changes.
- Keep RLS enabled where practical.

Initial approach:

- Use Next.js server routes for all reads/writes.
- Use Supabase service role only inside server code.
- Centralize permission checks in a shared helper.

Future stronger approach:

- Add Supabase RLS policies for donor-owned data.
- Keep admin/team write operations through server routes.

## Implementation Phases

### Phase 1: Auth Foundation

- Configure Supabase Google OAuth.
- Replace password admin login with Supabase Auth.
- Add `team_members`.
- Seed `mirzashehryar97@gmail.com` as the first active `super_admin` team member.
- Add `donors`.
- Add server helpers for current user lookup.
- Add role/permission helper.

### Phase 2: Team Members

- Build `/admin/team`.
- Super Admin can add, edit, deactivate all team members.
- Admin can add, edit, deactivate non-admin team members.
- Super Admin can assign all roles, including admin roles.
- Admin can assign non-admin roles.
- Team members login with Google using allowlisted email.

### Phase 3: Role-Based Admin Shell

Goal: make the admin area permission-aware end to end before adding more operational pages.
Phase 1 and Phase 2 created authenticated team members and roles. Phase 3 should make those roles
drive navigation, route access, API access, and user feedback consistently.

Phase 3 should not add donor management, orphan profile management, matching, receipts, or reporting
features yet. Those remain later phases. Phase 3 is the permission foundation those pages will use.

#### Phase 3.1: Central Permission Model

Create one shared permission source for the admin app.

Implement:

- A central role permission map, probably in `src/lib/adminPermissions.ts`.
- Page-level permission helpers:
  - `canAccessAdminPage(role, pageKey)`
  - `getAllowedAdminNavItems(role)`
  - `requireAdminPageAccess(role, pageKey)`
- Action-level permission helpers:
  - `canManageTeamMembers(actorRole)`
  - `canManageAdminAccounts(actorRole)`
  - `canManageSponsorshipRequests(actorRole)`
  - `canAssignSponsorshipRequests(actorRole)`
  - `canViewAssignedOnly(actorRole, featureKey)`
  - `canViewReports(actorRole)`
- A typed list of admin page keys, matching the sidebar and planned routes.
- A typed list of admin feature/action keys, so future pages can reuse the same checks.

Design rule:

- UI permissions and server/API permissions must use the same source of truth.
- Hiding a button is never enough. The API route must also reject unauthorized actions.
- Role checks should not be duplicated as loose string comparisons across components.
- Every future module must be implemented with role-based permissions at the same time as the module
  itself. For example, a role with view-only access can see records but cannot add, edit, delete,
  approve, assign, verify, upload, or export unless that action is explicitly allowed.

Expected page keys for Phase 3:

- `dashboard`
- `sponsorship_requests`
- `orphan_profiles`
- `sponsors`
- `contact_logs`
- `reports`
- `team_members`
- `roles_access`
- `settings`

#### Phase 3.2: Role-Aware Sidebar And Header

Update the admin shell so the sidebar only shows pages the current team member can access.

Implement:

- Render sidebar items from the central permission map.
- Keep active route highlighting correct after filtering items.
- Preserve the existing desktop collapsed sidebar behavior.
- Preserve the existing mobile sidebar drawer behavior.
- Keep the global header stable during navigation.
- Keep the admin identity in the header from the real logged-in team member, never placeholders.
- Show "Switch to Donor Portal" only when the same Google account also has an active donor profile.
- Hide pages that are not implemented yet or show them as clearly disabled placeholders, depending on
  the selected UX decision.

Recommended UX decision:

- For Phase 3, hide pages the user cannot access.
- For pages that are planned but not implemented, either hide them or route to a polished "Coming
  soon" state. Do not show blank placeholder pages.
- Keep `/admin/team` visible only to `super_admin` and `admin`.
- Keep `/admin/team/roles` visible only to `super_admin` and `admin` for now.

#### Phase 3.3: Server Route Guards For Admin Pages

Update admin route layouts/pages so role restrictions are enforced before rendering protected UI.

Implement:

- A reusable server helper for page access checks.
- Page-level guards for current existing admin pages:
  - `/admin`
  - `/admin/team`
  - `/admin/team/new`
  - `/admin/team/[id]`
  - `/admin/team/roles`
- A future-ready guard pattern for planned admin pages.
- Redirect unauthenticated users to `/admin/login`.
- Redirect authenticated but unauthorized team members to a forbidden page.
- Keep a clear difference between:
  - not logged in
  - logged in but inactive
  - logged in but role is not allowed
  - missing Supabase/admin setup

Recommended routes:

- `/admin/login` for unauthenticated users.
- `/admin/forbidden` for authenticated team members without permission.
- `/admin/setup-required` or existing setup notice for missing environment/database setup.

Forbidden page requirements:

- Show a calm, branded message that access is not available for this role.
- Show the current user's role.
- Provide a button back to the first page they are allowed to access.
- Provide sign out.
- Do not expose sensitive page details in the message.

#### Phase 3.4: API Route Guards

Every admin API route must use central permission helpers.

Implement or verify guards for:

- `GET /api/admin/session`
- `DELETE /api/admin/session`
- `GET /api/admin/team-members`
- `POST /api/admin/team-members`
- `GET /api/admin/team-members/[id]`
- `PATCH /api/admin/team-members/[id]`
- `GET /api/admin/sponsorship-requests`
- `PATCH /api/admin/sponsorship-requests/[id]`

Rules:

- `super_admin` can manage all team members except changing their own role or deactivating their own
  account.
- `admin` can manage non-admin team members only.
- `admin` cannot change another admin or super admin role/status.
- `sponsorship_manager` can manage sponsorship requests.
- `support_coordinator` should eventually see assigned sponsorship requests only.
- `viewer` should be read-only.
- API responses should use consistent status codes:
  - `401` for not authenticated.
  - `403` for authenticated but forbidden.
  - `404` when a record does not exist or must not be revealed.
  - `400` for validation errors.

Phase 3 data-scope note:

- Assigned-only scoping can be introduced as helper support now, even if request assignment is still
  free text until Phase 4.
- Do not redesign the sponsorship request database in Phase 3.

#### Phase 3.5: Admin Navigation Targets And Safe Fallbacks

Define where each role lands after login and what fallback page they see when a page is unavailable.

Suggested default landing pages:

- `super_admin`: `/admin`
- `admin`: `/admin`
- `sponsorship_manager`: `/admin`
- `orphan_coordinator`: first accessible orphan profile page once implemented; until then `/admin`
- `finance_manager`: first accessible finance/receipt page once implemented; until then `/admin`
- `support_coordinator`: `/admin`
- `viewer`: `/admin`

Until future pages exist:

- Roles with limited future pages can still land on `/admin` if they have dashboard access.
- Dashboard cards/actions should only show what the role can access.
- Sidebar should not send users to unfinished dead ends.

#### Phase 3.6: Dashboard Adaptation By Role

The dashboard should become role-aware without building new business modules yet.

Implement:

- Hide "New Request" if the role cannot create or manage requests.
- Hide assignment/status controls if the role cannot update requests.
- Show read-only request data for viewer-like roles.
- Prepare the dashboard to support assigned-only views.
- Keep cached/stale data behavior using SWR.
- Keep skeletons scoped to first load only.

Do not implement:

- Real team-member request assignment.
- Request-to-donor conversion.
- Contact logs.

Those belong to Phase 4.

#### Phase 3.7: UX States

Add consistent admin states:

- Unauthorized/forbidden page.
- Empty allowed navigation state, in case a role has no enabled pages.
- "Coming soon" page for planned-but-disabled routes if those routes remain visible.
- No-access tooltip or disabled action styling where showing disabled controls is better than hiding
  them.
- Toast messages for failed permission-sensitive actions.

UX rules:

- Do not let users click into pages they cannot use.
- If an action is disabled because of role, explain why with nearby text or a title/tooltip.
- Use the existing admin visual system: off-white surfaces, emerald text, gold accents, restrained
  shadows.
- Keep mobile sidebar usable with the same filtered navigation.

#### Phase 3.8: Audit And Security Preparation

Phase 3 should prepare for audit logs without fully building the audit log feature.

Implement:

- A small shared `adminAction` naming convention for future audit events.
- Add TODO markers or helper stubs only where they will be used soon.
- Keep sensitive checks server-side.
- Do not expose service role keys or direct Supabase writes to the browser.

Possible future audit event names:

- `team_member.created`
- `team_member.updated`
- `team_member.activated`
- `team_member.deactivated`
- `team_member.role_changed`
- `sponsorship_request.status_changed`
- `sponsorship_request.notes_updated`

Full audit log storage and UI remain Phase 10 unless needed earlier.

#### Phase 3.9: Tests And Verification

Manual verification:

- Super Admin can see dashboard, sponsorship requests, team members, roles/access, and allowed admin
  controls.
- Admin can manage non-admin team members but cannot edit admin/super-admin role/status.
- Admin cannot change their own role/status.
- Non-admin roles do not see Team Members or Roles & Access.
- Direct URL access to blocked pages redirects to forbidden.
- Blocked API requests return `403`.
- Unauthenticated API requests return `401`.
- Sidebar filtering works on desktop expanded, desktop collapsed, and mobile drawer.
- Header identity does not flicker to placeholder values during navigation.
- SWR stale data remains visible on navigation and does not force full-page loading skeletons.

Automated or code-level checks:

- Type-check permission helpers.
- Unit-test role/page permission maps if a test setup is available.
- Add targeted API guard tests later if the project gets a test runner.
- Run `npm run type-check`.
- Run targeted lint/format checks for touched files.

#### Phase 3.10: Acceptance Criteria

Phase 3 is complete when:

- Admin navigation is generated from role permissions.
- Existing admin pages are server-protected by role.
- Existing admin API routes are protected by role through shared helpers.
- A branded forbidden page exists.
- The dashboard and team pages do not expose actions the current role cannot perform.
- Direct URL entry cannot bypass role restrictions.
- Non-admin roles have a clean, understandable admin experience.
- No Phase 4 database changes are required to complete Phase 3.

#### Standing Rule For Future Phases

For Phase 4 and every later module, permissions are part of the feature definition.

When a new module is implemented, it must include:

- Sidebar/page visibility rules for each role.
- Server page guards for every new page.
- API route guards for every read/write action.
- UI action visibility or disabled states for create, edit, delete, assign, approve, verify, upload,
  and export actions.
- Read-only handling for roles that can view data but cannot modify it.
- Direct URL/API protection so users cannot bypass the UI.
- Manual verification for at least one allowed role and one blocked role.

Examples:

- If `viewer` can access orphan profiles, they can view profiles but cannot create or edit them.
- If `finance_manager` can verify receipts, other roles with receipt view access still cannot verify
  or reject receipts unless explicitly allowed.
- If `orphan_coordinator` can create orphan profiles, that does not automatically mean they can
  assign donors to orphans.
- If `support_coordinator` can view assigned requests, they should not see unassigned or unrelated
  records unless a future permission explicitly grants broader access.

### Phase 4: Upgrade Sponsorship Requests

Goal: turn the current sponsorship request dashboard into a real operational follow-up workflow.
Phase 4 should upgrade the existing `/admin` sponsorship requests experience without building the
full donor management module, orphan profile module, matching module, donor portal, receipts, or
reports.

Phase 4 should answer four practical questions for every request:

- Who on the team owns the follow-up?
- What has happened with this requester so far?
- What is the next action?
- When the requester is ready, can we create/link the donor record cleanly?

#### Phase 4.1: Scope Boundaries

Implement in Phase 4:

- Real request assignment to a `team_members` record.
- Request-level follow-up status and next-action fields.
- Manual sponsorship request creation from the admin panel.
- Contact logs connected to sponsorship requests.
- Contact log creation from the request detail panel.
- A contact log list page or route if useful for support follow-up.
- Conversion from sponsorship request to donor record.
- Role-aware filtering so support users see only assigned work when appropriate.
- API guards and UI action guards for all new actions.

Do not implement in Phase 4:

- Full `/admin/donors` donor management screens. That is Phase 5.
- Full donor detail pages. That is Phase 5.
- Orphan profile creation or approval. That is Phase 6.
- Donor-to-orphan matching. That is Phase 7.
- Donor portal dashboard. That is Phase 8.
- Receipt uploads or finance verification. That is Phase 9.
- Full audit log UI. That remains Phase 10 unless needed earlier.

Important product boundary:

- "Convert to donor" in Phase 4 means creating or linking a donor account record from a verified
  sponsorship request. It does not mean assigning that donor to an orphan yet.
- After conversion, the donor can exist in `donors`, but their full management page can remain a
  later Phase 5 feature.

#### Phase 4.2: Database Changes

Update `supabase/schema.sql` with additive, safe changes. Avoid destructive migrations.

Add request assignment and conversion fields:

- `sponsorship_requests.created_by_team_member_id uuid references public.team_members(id) on delete set null`
- `sponsorship_requests.request_source text not null default 'public_form'`
- `sponsorship_requests.assigned_team_member_id uuid references public.team_members(id) on delete set null`
- `sponsorship_requests.converted_donor_id uuid references public.donors(id) on delete set null`
- `sponsorship_requests.converted_by_team_member_id uuid references public.team_members(id) on delete set null`
- `sponsorship_requests.converted_at timestamptz`
- `sponsorship_requests.last_contacted_at timestamptz`
- `sponsorship_requests.next_follow_up_at timestamptz`

Keep the current `assigned_to text` column for now as legacy data:

- Do not delete `assigned_to` in Phase 4.
- Display it as "Legacy assignee" only if no real assigned team member exists.
- Once production data is clean, a later migration can remove or archive it.

Update request status check values carefully:

- Keep existing statuses:
  - `new`
  - `contacted`
  - `profiles_prepared`
  - `profiles_shared`
  - `matched`
  - `closed`
- Add a Phase 4 conversion status:
  - `converted_to_donor`

Status meaning:

- `new`: submitted and not meaningfully followed up yet.
- `contacted`: team has reached or attempted to reach the requester.
- `profiles_prepared`: team is preparing suitable verified orphan profiles.
- `profiles_shared`: profile details have been privately shared with the requester.
- `converted_to_donor`: requester has been confirmed and linked to a donor record.
- `matched`: reserved for the future donor-to-orphan match workflow.
- `closed`: request will not proceed or was closed for another reason.

Recommended `request_source` values:

- `public_form`
- `admin_created`
- `whatsapp`
- `phone`
- `email`
- `referral`
- `walk_in`
- `other`

Manual request creation note:

- Phase 4 can keep `full_name`, `email`, and `phone` required to match the current public form and
  make donor conversion safer.
- If the team regularly receives WhatsApp-only requests without email, a later migration can loosen
  `email not null` and update donor conversion to require email only at conversion time.

Add `contact_logs` table:

- `id uuid primary key default gen_random_uuid()`
- `sponsorship_request_id uuid references public.sponsorship_requests(id) on delete cascade`
- `donor_id uuid references public.donors(id) on delete set null`
- `team_member_id uuid references public.team_members(id) on delete set null`
- `contact_method text not null`
- `direction text not null default 'outbound'`
- `outcome text not null default 'logged'`
- `summary text not null`
- `next_follow_up_at timestamptz`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`

Recommended `contact_method` values:

- `whatsapp`
- `phone`
- `email`
- `sms`
- `in_person`
- `other`

Recommended `direction` values:

- `outbound`
- `inbound`
- `internal_note`

Recommended `outcome` values:

- `logged`
- `reached`
- `no_response`
- `follow_up_needed`
- `not_interested`
- `converted`

Add indexes:

- `sponsorship_requests_assigned_team_member_id_idx`
- `sponsorship_requests_created_by_team_member_id_idx`
- `sponsorship_requests_request_source_idx`
- `sponsorship_requests_converted_donor_id_idx`
- `sponsorship_requests_next_follow_up_at_idx`
- `contact_logs_sponsorship_request_id_idx`
- `contact_logs_team_member_id_idx`
- `contact_logs_donor_id_idx`
- `contact_logs_created_at_idx`

Enable RLS:

- Enable RLS on `contact_logs`.
- Do not create anonymous policies.
- Continue using Next.js server routes with the service role key for admin reads/writes.

#### Phase 4.3: Data Migration Strategy

Migration should be safe for existing local and production data.

Steps:

1. Add new nullable columns and the `contact_logs` table.
2. Keep `assigned_to` untouched.
3. Do not auto-map legacy `assigned_to` text to a team member unless there is an exact, reliable
   match.
4. If useful, add a one-time optional SQL update that maps exact email matches from `assigned_to` to
   `team_members.email`.
5. Update the app to write only `assigned_team_member_id` going forward.
6. Continue reading `assigned_to` only as a legacy fallback display.

Conversion safety:

- `donors.email` is unique, so conversion must handle an existing donor with the same email.
- If a donor with the request email already exists, link to that donor instead of creating a
  duplicate.
- If the existing donor is inactive, the conversion flow should warn the admin and require explicit
  confirmation before reactivating or linking.
- If the request is already converted, the API should return the existing linked donor instead of
  creating another record.

#### Phase 4.4: Types And Data Access

Update TypeScript types:

- `SponsorshipRequestRow`
- `SponsorshipRequest`
- `SponsorshipRequestUpdate`
- `SponsorshipRequestCreateInput`
- `SponsorshipRequestStatus`
- New `ContactLogRow`
- New `ContactLog`
- New `ContactLogInput`

Recommended frontend shape for requests:

- `assignedTeamMemberId`
- `assignedTeamMember`
  - `id`
  - `fullName`
  - `email`
  - `role`
- `convertedDonorId`
- `convertedDonor`
  - `id`
  - `fullName`
  - `email`
- `convertedAt`
- `lastContactedAt`
- `nextFollowUpAt`
- `createdByTeamMemberId`
- `requestSource`
- `legacyAssignedTo`

Data access helpers:

- `listSponsorshipRequests(options)`
- `getSponsorshipRequestById(id)`
- `createSponsorshipRequest(input, createdByTeamMemberId)`
- `updateSponsorshipRequest(id, input)`
- `assignSponsorshipRequest(id, teamMemberId)`
- `listAssignableTeamMembers()`
- `listContactLogsForRequest(requestId)`
- `createContactLog(input)`
- `convertSponsorshipRequestToDonor(requestId, options)`

The data layer should map Supabase rows to camelCase app objects consistently.

#### Phase 4.5: API Routes

Update existing routes:

- `GET /api/admin/sponsorship-requests`
  - Returns requests with assignment and conversion summary.
  - Supports query filters:
    - `status`
    - `assignedTo`
    - `assignedTo=me`
    - `assignedTo=unassigned`
    - `method`
    - `city`
    - `followUp=due`
    - `search`
  - Applies role scope server-side.

- `PATCH /api/admin/sponsorship-requests/[id]`
  - Updates status, admin notes, next follow-up date, and assignment.
  - Rejects assignment changes unless role can assign requests.
  - Rejects status/note changes unless role can update the request.
  - For assigned-only roles, rejects updates to requests not assigned to them.

Add routes:

- `POST /api/admin/sponsorship-requests`
  - Creates a request from the admin panel.
  - Uses the same core fields as the public sponsor form:
    - full name
    - email
    - phone / WhatsApp
    - city / country
    - preferred contact method
    - message / notes
    - minimum amount confirmation
  - Adds admin-only fields:
    - source
    - initial status
    - assigned team member
    - internal notes
    - next follow-up date
  - Sets `created_by_team_member_id` to the current team member.
  - Sets `request_source` to `admin_created` or the selected source.

- `GET /api/admin/sponsorship-requests/assignees`
  - Returns active team members who can receive request assignments.
  - Suggested assignable roles:
    - `super_admin`
    - `admin`
    - `sponsorship_manager`
    - `support_coordinator`
  - Only roles that can assign requests should call this route.

- `GET /api/admin/sponsorship-requests/[id]/contact-logs`
  - Returns contact logs for the request.
  - View permission follows the request view permission and assignment scope.

- `POST /api/admin/sponsorship-requests/[id]/contact-logs`
  - Creates a contact log.
  - Updates `last_contacted_at` and optionally `next_follow_up_at` on the request.
  - If outcome is `reached` or `follow_up_needed`, status can move from `new` to `contacted`.

- `POST /api/admin/sponsorship-requests/[id]/convert-to-donor`
  - Creates or links a donor from the request.
  - Sets `converted_donor_id`, `converted_by_team_member_id`, `converted_at`, and status
    `converted_to_donor`.
  - Creates a contact log with outcome `converted`.
  - Returns the linked donor summary.

Optional route if building a separate contact log page:

- `GET /api/admin/contact-logs`
  - Returns contact logs across requests.
  - Supports filters:
    - `teamMemberId`
    - `method`
    - `outcome`
    - `dateFrom`
    - `dateTo`
    - `search`

#### Phase 4.6: Permission Rules

Add Phase 4 action keys to the central permission helper.

Suggested action keys:

- `sponsorship_requests.view`
- `sponsorship_requests.create`
- `sponsorship_requests.update`
- `sponsorship_requests.assign`
- `sponsorship_requests.convert_to_donor`
- `contact_logs.view`
- `contact_logs.create`
- `contact_logs.view_all`

Role behavior:

- `super_admin`
  - View all requests.
  - Create manual requests.
  - Update all requests.
  - Assign all requests.
  - Convert requests to donors.
  - View and create all contact logs.

- `admin`
  - Same operational request permissions as `super_admin`.
  - Cannot override protected team-member rules from Phase 3.

- `sponsorship_manager`
  - View all requests.
  - Create manual requests.
  - Update all requests.
  - Assign requests.
  - Convert requests to donors.
  - View and create contact logs.

- `support_coordinator`
  - View assigned requests only.
  - Can create a manual request only if the organization wants support intake handled by this role.
    Default recommendation: allow create, auto-assign the request to themselves, and restrict later
    updates to their assigned requests.
  - Add contact logs only for assigned requests.
  - Update follow-up notes and next follow-up only for assigned requests.
  - Cannot assign requests.
  - Cannot convert requests to donors.

- `orphan_coordinator`
  - View requests if needed for profile-preparation context.
  - Cannot assign, convert, or edit request ownership.
  - Can remain read-only in Phase 4.

- `finance_manager`
  - View requests if needed for future donor/payment context.
  - Cannot assign, convert, or edit request ownership.
  - Can remain read-only in Phase 4.

- `viewer`
  - View-only access.
  - Cannot add logs, assign, convert, or update.

Server-side rule:

- Every API route must call central permission helpers.
- Assigned-only scoping must happen in the API, not only in the UI.
- If a user directly requests a record they cannot see, return `404` or `403` consistently based on
  the chosen API pattern.

#### Phase 4.7: Admin Sidebar And Routes

Sponsorship Requests:

- Keep `/admin` as the main sponsorship requests dashboard for now.
- Keep "Sponsorship Requests" visible to roles with request view permission.
- Show edit controls only to roles with request update permission.

Contact Logs:

- If a separate contact logs page is implemented, add `/admin/contact-logs`.
- Enable the "Contact Logs" sidebar item only when the page exists and the role can access
  `contact_logs.view`.
- If not implementing the separate page in Phase 4, keep contact logs inside request details only and
  leave the sidebar item hidden.

Important note:

- Sidebar items should only appear when they have a working route. Do not show dead-end placeholder
  pages.

#### Phase 4.8: Sponsorship Requests UI

Upgrade the existing dashboard while keeping the same visual language.

Top KPI cards:

- New Requests
- Assigned To Me
- Follow-ups Due
- Converted Donors

Filters:

- Search by name, email, phone, city.
- Status.
- Assigned team member.
- "Assigned to me".
- "Unassigned".
- Preferred contact method.
- Follow-up due.
- Converted/not converted.

Request table:

- Name and email.
- Phone/contact method.
- City/country.
- Assigned team member.
- Status.
- Last contacted.
- Next follow-up.
- Submitted date.

Request details panel:

- Donor/requester information.
- Assignment dropdown using real team members.
- Status dropdown.
- Admin/internal notes.
- Next follow-up date/time.
- Contact timeline.
- Add contact log form.
- Convert to donor action.
- Linked donor summary after conversion.

New Request flow:

1. Admin clicks "New Request".
2. Open a right-side drawer on desktop and bottom sheet on mobile, matching the member details
   pattern.
3. Form sections:
   - requester information
   - contact preference
   - source
   - assignment
   - initial notes
   - next follow-up
4. Required fields:
   - full name
   - email
   - phone / WhatsApp
   - preferred contact method
   - source
5. Optional fields:
   - city / country
   - message
   - internal notes
   - assigned team member
   - next follow-up
6. On successful creation:
   - close the drawer
   - show success toast
   - insert the new request into the SWR list
   - select/open the new request detail panel
7. On validation failure:
   - keep the drawer open
   - show field errors and a red toast

New Request permissions:

- Show the button only to roles that can create sponsorship requests.
- If support coordinators are allowed to create requests, auto-assign their created requests to
  themselves unless an admin/sponsorship manager changes it later.
- Do not show the button to viewer roles.

Add contact log form:

- Contact method.
- Direction.
- Outcome.
- Summary.
- Next follow-up date/time.
- Optional checkbox:
  - "Move request to Contacted"

Convert to donor flow:

1. Admin clicks "Convert to Donor".
2. Show confirmation dialog.
3. Show donor details that will be created:
   - full name
   - email
   - phone
   - city/country
4. If donor exists, show "Link existing donor" instead of "Create donor".
5. On success, show toast and update request detail panel.
6. Request row should show converted state and donor link/summary.

UX states:

- Empty requests.
- Empty contact timeline.
- Assignee loading.
- Save/update failure.
- Permission-denied toast if stale UI attempts a blocked action.
- Conversion conflict if donor email already exists but is inactive.

#### Phase 4.9: Contact Logs Page Option

If implementing `/admin/contact-logs` in Phase 4, keep it focused and operational.

Page goals:

- Let admins and support users review communication activity across requests.
- Help support users find follow-ups due today.
- Avoid becoming a full CRM too early.

Page layout:

- KPI row:
  - Logs Today
  - Follow-ups Due
  - No Response
  - Converted This Month
- Filters:
  - method
  - outcome
  - team member
  - date range
  - assigned to me
- Table:
  - requester/donor
  - request status
  - method
  - outcome
  - summary preview
  - logged by
  - next follow-up
  - created at
- Detail drawer:
  - full summary
  - linked request
  - linked donor if converted
  - follow-up metadata

Mobile behavior:

- Table becomes stacked cards.
- Detail panel opens as bottom sheet.

#### Phase 4.10: SWR And Caching

Keep the Phase 3 stale-data behavior.

Use SWR keys like:

- `/api/admin/sponsorship-requests?...filters`
- `/api/admin/sponsorship-requests/assignees`
- `/api/admin/sponsorship-requests/${id}/contact-logs`
- `/api/admin/contact-logs?...filters`

Rules:

- Show skeletons only on first load when no cached/fallback data exists.
- Keep stale request rows visible during background revalidation.
- After mutation, optimistically update only the affected request/log where safe.
- Revalidate request list and contact logs after:
  - assignment change
  - contact log creation
  - conversion to donor
  - status change

#### Phase 4.11: Notifications Preparation

Do not build full notification automation yet, but leave the workflow ready.

Future notification hooks:

- When a request is assigned to a team member.
- When a follow-up is due.
- When a request is converted to donor.

Phase 4 can add TODO/event names:

- `sponsorship_request.assigned`
- `sponsorship_request.follow_up_created`
- `sponsorship_request.converted_to_donor`
- `contact_log.created`

Actual WhatsApp/email/admin notification delivery can be a later phase or a small independent
feature after Phase 4.

#### Phase 4.12: Validation Rules

Request update validation:

- Manual creation must include full name, email, phone, preferred contact method, and source.
- Assignment must reference an active team member.
- Status must be one of the allowed statuses.
- `next_follow_up_at` must be a valid timestamp or null.
- Assigned-only users cannot update unassigned or other users' requests.

Contact log validation:

- `summary` is required.
- `summary` should have a reasonable max length.
- `contact_method` must be allowed.
- `direction` must be allowed.
- `outcome` must be allowed.
- `next_follow_up_at` is optional.

Conversion validation:

- Request must have valid name and email.
- Request must not already be converted unless returning existing link.
- Existing donor email should be linked rather than duplicated.
- Inactive donor conflict should require explicit confirmation.

#### Phase 4.13: Testing And Verification

Manual verification:

- Super Admin can assign any request to an active assignable team member.
- Admin can assign and update requests.
- Sponsorship Manager can assign, update, log contact, and convert to donor.
- Support Coordinator sees only assigned requests.
- Support Coordinator can add contact logs only to assigned requests.
- Support Coordinator cannot assign requests or convert to donor.
- Viewer can see request data but cannot update, assign, log contact, or convert.
- Roles with create permission can add a request through the New Request drawer.
- A newly created request appears immediately in the request list and opens in the detail panel.
- Direct API calls for blocked actions return `403`.
- Unauthenticated API calls return `401`.
- Request conversion creates or links exactly one donor.
- Re-converting an already converted request does not create duplicates.
- Contact log creation updates request timeline and last-contacted fields.
- Follow-up due filter works.
- Mobile request detail and contact log forms remain usable.

Automated or code-level checks:

- Run `npm run type-check`.
- Run targeted Biome checks on touched files.
- Add unit tests for permission helpers if a test runner is introduced.
- Add API tests later if the project adopts route-handler testing.

#### Phase 4.14: Acceptance Criteria

Phase 4 is complete when:

- `assigned_team_member_id` is used for new request assignment.
- Legacy `assigned_to` text is no longer written by the app.
- The New Request button opens a working manual request creation flow.
- Manual requests are saved with `created_by_team_member_id` and `request_source`.
- Request assignment dropdown uses real active team members.
- Contact logs can be created and viewed per request.
- The request details panel shows a contact timeline.
- Requests can be converted to donor records without duplicates.
- Converted requests link back to their donor record.
- Support Coordinator request visibility is scoped to assigned requests.
- Viewer and other read-only roles cannot mutate requests through UI or API.
- Sidebar only shows Phase 4 pages that actually exist.
- SWR stale data behavior remains smooth after mutations.
- Type-check and targeted lint checks pass.

### Phase 5: Donor Management

Goal: build the internal donor management module so the team can create, view, edit, and follow up
with donors after a sponsorship request has been converted or when a donor is added manually.

Phase 5 should not build orphan profiles, donor-to-orphan matching, donor portal dashboards, receipt
uploads, finance verification, contribution charts, or reports. Those remain later phases. A donor
can exist in Phase 5 without being assigned to an orphan yet.

Phase 5 should answer five practical questions:

- Who are our donors?
- How did each donor enter the system?
- Can this donor login later with Google using the donor email?
- What request or contact history belongs to this donor?
- Which team roles can view or manage this donor record?

#### Phase 5.1: Scope Boundaries

Implement in Phase 5:

- `/admin/donors`
- `/admin/donors/new`
- `/admin/donors/[id]`
- Donor directory with search, filters, KPI cards, and responsive table/card layouts.
- Donor creation from the admin panel.
- Donor detail and edit experience.
- Donor active/inactive account controls.
- Donor contact logs using existing `contact_logs.donor_id`.
- Links from donor detail to converted sponsorship requests.
- Role-aware donor page visibility and API guards.
- SWR caching with stale data shown during background revalidation.

Do not implement in Phase 5:

- Assigning an orphan to a donor.
- `sponsorship_matches` UI or matching workflow.
- Orphan profile creation or approval.
- Donation receipt uploads.
- Finance receipt verification.
- Donor portal dashboard.
- Contribution reports or charts.

Important product boundary:

- "Donor management" means managing the donor account/profile and communication history.
- It does not mean the donor is already sponsoring a specific orphan. That starts in Phase 7.
- Donor portal login compatibility should be preserved, but the donor portal UI remains Phase 8.

#### Phase 5.2: Database Changes

Update `supabase/schema.sql` with additive, safe changes. Avoid destructive migrations.

The current `donors` table already has:

- `id`
- `auth_user_id`
- `full_name`
- `email`
- `phone`
- `city_country`
- `active`
- `notes`
- `created_by_team_member_id`
- `created_at`
- `updated_at`

Add donor management fields:

- `preferred_contact_method text not null default 'whatsapp'`
- `donor_source text not null default 'admin_created'`

Recommended `preferred_contact_method` values:

- `whatsapp`
- `phone`
- `email`

Recommended `donor_source` values:

- `converted_request`
- `admin_created`
- `whatsapp`
- `phone`
- `email`
- `referral`
- `other`

Add constraints:

- `donors_preferred_contact_method_check`
- `donors_donor_source_check`

Add indexes:

- `donors_created_at_idx`
- `donors_created_by_team_member_id_idx`
- `donors_donor_source_idx`
- `donors_preferred_contact_method_idx`

Migration behavior:

1. Add the new columns with defaults.
2. For donors linked from `sponsorship_requests.converted_donor_id`, set `donor_source =
   'converted_request'`.
3. Leave other existing donors as `admin_created`.
4. Keep `email` unique and lowercase-normalized in server code.
5. Keep `auth_user_id` as the Google login link.
6. Do not delete or reshape current donor fields in Phase 5.

RLS:

- Keep RLS enabled on `donors`.
- Continue admin donor reads/writes through Next.js server routes using the service role key.
- Do not create anonymous donor policies in Phase 5.

#### Phase 5.3: Types And Data Access

Update account types:

- `DonorRow`
- `Donor`
- `DonorInput`
- `DonorUpdate`
- `DonorSource`
- `DonorPreferredContactMethod`

Recommended frontend donor shape:

- `id`
- `authUserId`
- `fullName`
- `email`
- `phone`
- `cityCountry`
- `preferredContactMethod`
- `donorSource`
- `active`
- `notes`
- `createdByTeamMemberId`
- `createdByTeamMember`
- `createdAt`
- `updatedAt`

Add donor data helpers:

- `listDonors(options)`
- `getDonorById(id)`
- `createDonor(input, createdByTeamMemberId)`
- `updateDonor(id, input)`
- `listDonorContactLogs(donorId)`
- `createDonorContactLog(donorId, input)`
- `listConvertedRequestsForDonor(donorId)`

Data rules:

- Map Supabase rows to camelCase app objects consistently.
- Normalize donor emails to lowercase before insert/update.
- If a donor has `auth_user_id`, treat email changes as blocked in Phase 5 so Google login access is
  not accidentally broken.
- A donor can have no converted request and no match yet.

#### Phase 5.4: API Routes

Add admin donor routes:

- `GET /api/admin/donors`
  - Returns donors with summary data.
  - Supports query filters:
    - `search`
    - `status`
    - `source`
    - `preferredContactMethod`
    - `loginStatus`
  - Applies role scope server-side.

- `POST /api/admin/donors`
  - Creates a donor from the admin panel.
  - Required fields:
    - full name
    - email
    - phone
    - preferred contact method
    - source
  - Optional fields:
    - city/country
    - notes
    - active status
  - Sets `created_by_team_member_id` to the current team member.
  - Rejects duplicate email.

- `GET /api/admin/donors/[id]`
  - Returns donor profile, Google login status, linked converted requests, and recent contact logs.
  - Applies donor visibility scope server-side.

- `PATCH /api/admin/donors/[id]`
  - Updates donor profile fields.
  - Updates active/inactive status when the role has permission.
  - Blocks email change if `auth_user_id` is already linked.
  - Rejects updates from read-only roles.

- `GET /api/admin/donors/[id]/contact-logs`
  - Returns contact logs where `contact_logs.donor_id = donor.id`.
  - Applies donor visibility scope server-side.

- `POST /api/admin/donors/[id]/contact-logs`
  - Creates a donor-level contact log.
  - Uses existing contact log fields:
    - contact method
    - direction
    - outcome
    - summary
    - next follow-up date
  - Does not require a linked sponsorship request.

Validation:

- Full name is required.
- Email is required and must be valid enough for Google login.
- Phone is required.
- Preferred contact method must be one of the allowed values.
- Source must be one of the allowed values.
- Notes and summaries should have reasonable max lengths.

Error behavior:

- `401` for unauthenticated.
- `403` for authenticated but forbidden.
- `404` when a donor does not exist or must not be revealed.
- `400` for validation errors.
- Duplicate email should return a helpful `409` or `400` response.

#### Phase 5.5: Permission Rules

Add Phase 5 page/action keys to the central permission helper.

Page key:

- Continue using existing `sponsors` page key for now, but label it as `Donors` or
  `Sponsors/Donors` in the sidebar.

Suggested action keys:

- `donors.view`
- `donors.create`
- `donors.update`
- `donors.activate`
- `donors.deactivate`
- `donor_contact_logs.view`
- `donor_contact_logs.create`

Role behavior:

- `super_admin`
  - View all donors.
  - Create donors.
  - Edit donors.
  - Activate/deactivate donors.
  - View and create donor contact logs.

- `admin`
  - Same donor management access as `super_admin`.
  - Still follows protected team-member rules from earlier phases.

- `sponsorship_manager`
  - View all donors.
  - Create donors.
  - Edit donor contact/profile details.
  - Activate/deactivate donors if operationally needed.
  - View and create donor contact logs.

- `finance_manager`
  - View donors for future payment/receipt context.
  - Cannot create, edit, activate, deactivate, or add contact logs in Phase 5.

- `support_coordinator`
  - View donors linked to sponsorship requests assigned to them.
  - Create donor contact logs only for scoped donors.
  - Cannot create donors manually.
  - Cannot activate/deactivate donors.

- `orphan_coordinator`
  - No donor directory access in Phase 5 by default.

- `viewer`
  - View donor directory and detail if donor page access is granted.
  - Cannot create, update, activate/deactivate, or add contact logs.

Server-side rule:

- Every donor API route must call central permission helpers.
- Scoped donor visibility must happen in the API, not only in the UI.
- Read-only roles must not be able to mutate donors through direct API calls.

#### Phase 5.6: Admin Sidebar And Routes

Sidebar:

- Add a working sidebar item only after `/admin/donors` exists.
- Prefer the label `Donors` for clarity, even if the internal page key remains `sponsors`.
- Hide the donor item for roles with no donor page access.
- Do not show a dead-end placeholder route.

Routes:

- `/admin/donors`
  - Donor directory.
- `/admin/donors/new`
  - New donor form.
- `/admin/donors/[id]`
  - Donor detail/edit page.

Access guards:

- Protect all donor pages using the shared admin page guard.
- Redirect unauthorized users to the existing forbidden page.

#### Phase 5.7: Donor Directory UI

Build the donor directory using the same admin visual language as Team Members and Sponsorship
Requests.

Top KPI cards:

- Total Donors
- Active Donors
- Pending First Login
- Inactive

Filters:

- Search by name, email, phone, city/country.
- Status:
  - all
  - active
  - inactive
- Source.
- Preferred contact method.
- Login status:
  - all
  - linked
  - pending first login

Table columns:

- Donor
- Contact
- City/Country
- Preferred Method
- Source
- Login Status
- Created

Row behavior:

- Clicking donor name opens donor detail.
- Donor name should show underline on hover.
- On desktop, donor quick detail can open as a right-side drawer.
- On mobile/smaller screens, donor quick detail opens as a bottom sheet.
- Direct route `/admin/donors/[id]` opens the full detail/edit page.

Empty states:

- No donors yet.
- No donors match current filters.
- Read-only role with no create permission should not see the New Donor button.

#### Phase 5.8: New Donor Flow

New donor form sections:

- Profile information.
- Contact preference.
- Source.
- Internal notes.
- Account access status.

Required fields:

- Full name.
- Email address.
- Phone number.
- Preferred contact method.
- Source.

Optional fields:

- City/country.
- Notes.
- Active status.

On successful creation:

- Show green success toast.
- Revalidate donor SWR list.
- Navigate to or open the created donor detail.

On validation failure:

- Keep the form open.
- Show field errors.
- Show red failure toast.

Google login note:

- Adding a donor does not send an invite in Phase 5.
- The donor can login later with Google only if they use the same email stored on the donor record.

#### Phase 5.9: Donor Detail And Edit UI

Donor detail should show:

- Donor profile:
  - full name
  - email
  - phone
  - city/country
  - preferred contact method
  - source
  - active/inactive status
- Google login status:
  - pending first login when `auth_user_id` is null
  - linked when `auth_user_id` exists
- Created metadata:
  - created date
  - created by team member when available
- Linked sponsorship requests:
  - requests where `converted_donor_id = donor.id`
  - request status
  - assigned team member
  - converted date
- Contact timeline:
  - donor-level contact logs
  - linked request contact logs may be shown separately or as a secondary section.
- Internal notes.

Editable fields:

- Full name.
- Phone.
- City/country.
- Preferred contact method.
- Source.
- Notes.
- Active status.

Email behavior:

- If `auth_user_id` is null, roles with update permission may edit email.
- If `auth_user_id` exists, email is read-only in Phase 5.
- Show helper text explaining that email is tied to Google login once linked.

Actions:

- Save Changes.
- Activate Donor or Deactivate Donor with confirmation dialog.
- Add Contact Log.

Do not show:

- Assign orphan action.
- Upload receipt action.
- Contribution stats.

#### Phase 5.10: Donor Contact Logs

Use the existing `contact_logs` table.

Donor contact log creation:

- Sets `donor_id`.
- Leaves `sponsorship_request_id` null unless the log is explicitly tied to a converted request.
- Sets `team_member_id` to the current team member.

Form fields:

- Contact method.
- Direction.
- Outcome.
- Summary.
- Next follow-up date/time.

Timeline display:

- Method icon.
- Direction.
- Outcome.
- Summary preview/full text.
- Logged by.
- Created date.
- Next follow-up date if present.

Permissions:

- Only roles with `donor_contact_logs.create` can add logs.
- Read-only roles can view logs if they have donor view permission.

#### Phase 5.11: SWR And Caching

Use SWR keys like:

- `/api/admin/donors?...filters`
- `/api/admin/donors/${id}`
- `/api/admin/donors/${id}/contact-logs`

Rules:

- Show skeletons only on first load when no cached data exists.
- Keep stale donor rows visible during background revalidation.
- Revalidate donor list and donor detail after:
  - donor creation
  - donor update
  - activation/deactivation
  - contact log creation
- Optimistically update simple donor edits where safe.

#### Phase 5.12: Testing And Verification

Manual verification:

- Super Admin can create, edit, activate, and deactivate donors.
- Admin can create, edit, activate, and deactivate donors.
- Sponsorship Manager can create and edit donors.
- Finance Manager can view donors but cannot mutate them.
- Viewer cannot mutate donors.
- Support Coordinator only sees scoped donors and cannot create donors manually.
- Duplicate donor email is rejected clearly.
- Donor email is read-only after Google auth is linked.
- Donor contact logs save and appear in the donor timeline.
- Converted sponsorship requests appear on linked donor profiles.
- Sidebar shows Donors only to roles with donor page access.
- Direct blocked donor page/API access returns forbidden or hidden state correctly.
- Mobile donor detail opens as a bottom sheet.
- SWR keeps stale data visible while revalidating.

Automated or code-level checks:

- Run `npm run type-check`.
- Run targeted Biome checks on touched files.
- Add permission helper tests later if a test runner is introduced.

#### Phase 5.13: Acceptance Criteria

Phase 5 is complete when:

- `/admin/donors` is a working donor directory.
- `/admin/donors/new` can create donor records through a Next.js API route.
- `/admin/donors/[id]` can view and edit donor records.
- Donor source and preferred contact method are stored.
- Donor Google login status is visible.
- Donor active/inactive status can be managed by allowed roles.
- Donor contact logs can be created and viewed.
- Converted sponsorship requests link back to donor profiles.
- Role permissions are enforced in sidebar, pages, UI actions, and API routes.
- Read-only roles cannot mutate donors through direct API calls.
- No orphan matching, receipts, or donor portal dashboard are included in Phase 5.
- Type-check and targeted lint checks pass.

### Phase 6: Orphan Profiles

Goal: build the internal orphan profile module so the team can create, verify, review, approve, and
maintain orphan records before they become available for donor matching.

Phase 6 should not build donor-to-orphan matching, donor portal orphan views, receipt uploads,
finance verification, contribution charts, or reports. Those remain later phases. An approved orphan
can exist in Phase 6 without being assigned to a donor yet.

Phase 6 should answer eight practical questions:

- Who are the children currently being prepared for sponsorship?
- What existing orphan code, such as `OR507` or `OR508`, does the team and donor already know this
  child by?
- Does every orphan profile have the required identity, guardian, education, health, and background
  information?
- Does every orphan profile have a clear profile image of the orphan?
- Which profiles are drafts, under review, approved, matched, or archived?
- Which team member created, submitted, reviewed, or approved the profile?
- Which roles can view, create, edit, submit, approve, archive, or upload files for orphan profiles?
- Can the team download a donor-shareable orphan profile PDF/card without manually recreating it?

#### Phase 6.1: Scope Boundaries

Implement in Phase 6:

- `/admin/orphans`
- `/admin/orphans/new`
- `/admin/orphans/[id]`
- Orphan directory with search, filters, KPI cards, and responsive table/card layouts.
- Orphan profile creation from the admin panel.
- Orphan detail and edit experience.
- Existing orphan code preservation, for example `OR507`, as a first-class external identifier.
- Required orphan profile image field.
- Guardian/caretaker details.
- Profile status lifecycle from draft to review to approved.
- Document/photo metadata and storage upload flow for orphan profile files.
- Download Profile button that generates a donor-shareable PDF/card from approved profile data.
- Role-aware orphan page visibility and API guards.
- SWR caching with stale data shown during background revalidation.

Do not implement in Phase 6:

- Assigning an orphan to a donor.
- `sponsorship_matches` UI or matching workflow.
- Donor portal orphan display.
- Donor receipt uploads.
- Finance receipt verification.
- Contribution reports or charts.

Important product boundary:

- "Orphan profile management" means preparing and approving records for future matching.
- It does not mean the orphan is sponsored yet. Sponsorship begins only after Phase 7 creates an
  active `sponsorship_matches` record.
- Approved profiles should be available for matching later, but Phase 6 should not expose an "Assign
  donor" action.

#### Phase 6.2: Database Changes

Update `supabase/schema.sql` with additive, safe changes. Avoid destructive migrations.

Add `orphan_profiles`:

- `id uuid primary key default gen_random_uuid()`
- `orphan_code text not null unique`
- `full_name text not null`
- `profile_image_url text not null`
- `gender text not null`
- `date_of_birth date`
- `age_estimate integer`
- `city_area text`
- `health_notes text`
- `education_status text`
- `background_summary text`
- `verification_status text not null default 'unverified'`
- `profile_status text not null default 'draft'`
- `created_by_team_member_id uuid references public.team_members(id) on delete set null`
- `submitted_by_team_member_id uuid references public.team_members(id) on delete set null`
- `submitted_at timestamptz`
- `approved_by_team_member_id uuid references public.team_members(id) on delete set null`
- `approved_at timestamptz`
- `archived_by_team_member_id uuid references public.team_members(id) on delete set null`
- `archived_at timestamptz`
- `archive_reason text`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`

Orphan code rule:

- Keep the database `id` as the internal immutable UUID.
- Add `orphan_code` as the human-facing/public code the team already uses with donors, for example
  `OR507`.
- Existing orphan records must keep their current code exactly when imported or entered manually.
- Donors, downloadable PDFs, admin search, matching screens, and donor portal views should show
  `orphan_code`, not the internal UUID.
- `orphan_code` must be unique and should be validated in the API.
- For new orphans that do not already have an existing historical code, auto-generate the next
  available code starting at `OR1100`.
- Reserve codes below `OR1100` for existing/historical orphan records so the team can enter or
  import codes like `OR507` and `OR508` without conflict.
- Auto-generation should use uppercase `OR` followed by the next available numeric value, for
  example `OR1100`, `OR1101`, `OR1102`.
- Do not ask the team to abandon existing codes. Those codes are already part of donor
  communication and should be treated as stable external references.

Profile image rule:

- Every orphan must have `profile_image_url`.
- The value should point to the primary image in the `orphan-photos` storage bucket or a document
  metadata row marked as the primary profile image.
- New orphan profile creation must reject submissions without a profile image.
- Profile image replacement should keep the orphan record stable and update only the image URL and
  related document metadata.
- Donor-facing use of this image starts in Phase 8, but the required field must be created in Phase
  6 so profile approval always includes a usable image.

Recommended `gender` values:

- `male`
- `female`

Recommended `verification_status` values:

- `unverified`
- `documents_received`
- `field_verified`
- `needs_more_information`
- `rejected`

Recommended `profile_status` values:

- `draft`
- `under_review`
- `approved`
- `matched`
- `archived`

Add `orphan_guardians`:

- `id uuid primary key default gen_random_uuid()`
- `orphan_id uuid not null references public.orphan_profiles(id) on delete cascade`
- `guardian_name text not null`
- `relationship text not null`
- `phone text`
- `whatsapp text`
- `address text`
- `notes text`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`

Use the existing planned `documents` table, or add it in Phase 6 if it does not exist yet:

- `id uuid primary key default gen_random_uuid()`
- `owner_type text not null`
- `owner_id uuid not null`
- `file_url text not null`
- `file_name text not null`
- `file_type text not null`
- `document_category text`
- `is_primary_profile_image boolean not null default false`
- `uploaded_by_team_member_id uuid references public.team_members(id) on delete set null`
- `uploaded_by_donor_id uuid references public.donors(id) on delete set null`
- `created_at timestamptz not null default now()`

Recommended `document_category` values for orphan profiles:

- `profile_image`
- `birth_or_identity_document`
- `guardian_document`
- `school_document`
- `medical_document`
- `verification_photo`
- `other`

Add constraints:

- `orphan_profiles_orphan_code_unique`
- `orphan_profiles_orphan_code_format_check`
- `orphan_profiles_gender_check`
- `orphan_profiles_verification_status_check`
- `orphan_profiles_profile_status_check`
- `orphan_profiles_profile_image_url_required_check`
- `documents_owner_type_check`
- `documents_document_category_check`

Add indexes:

- `orphan_profiles_orphan_code_idx`
- `orphan_profiles_profile_status_idx`
- `orphan_profiles_verification_status_idx`
- `orphan_profiles_created_by_team_member_id_idx`
- `orphan_profiles_approved_by_team_member_id_idx`
- `orphan_profiles_created_at_idx`
- `orphan_profiles_full_name_idx`
- `orphan_guardians_orphan_id_idx`
- `documents_owner_type_owner_id_idx`
- `documents_document_category_idx`
- `documents_uploaded_by_team_member_id_idx`

RLS:

- Enable RLS on `orphan_profiles`, `orphan_guardians`, and `documents`.
- Do not create anonymous policies.
- Continue admin orphan reads/writes through Next.js server routes using the service role key.
- Keep sensitive orphan documents private by default.

#### Phase 6.3: Storage And File Handling

Create or configure Supabase Storage buckets:

- `orphan-photos`
- `orphan-documents`

Rules:

- Profile images belong in `orphan-photos`.
- Identity, guardian, school, medical, and verification documents belong in `orphan-documents`.
- Uploads must go through project-owned Next.js API routes or server actions first.
- Client components must not write directly to Supabase for the core orphan workflow.
- File URLs saved to `orphan_profiles.profile_image_url` and `documents.file_url` should remain
  portable enough to migrate to Django + Postgres later.
- Sensitive documents should not be public.
- If profile images are public or signed URLs, choose one consistent approach and document it before
  Phase 8 donor portal work begins.

Recommended upload validation:

- Profile image file types: JPEG, PNG, WebP.
- Document file types: PDF, JPEG, PNG, WebP.
- Enforce practical file size limits in both UI and API.
- Generate stable storage paths, for example:
  - `orphans/{orphan_id}/profile/{timestamp}-{safe_file_name}`
  - `orphans/{orphan_id}/documents/{timestamp}-{safe_file_name}`
- Sanitize file names before storage.
- Store metadata in `documents` after upload succeeds.
- If database insert fails after upload, clean up the uploaded file where practical.

#### Phase 6.4: Data Migration Strategy

Migration should be safe for local and production data.

Steps:

1. Add `orphan_profiles`, `orphan_guardians`, and `documents` only if they do not already exist.
2. Add storage buckets and policies without exposing private documents publicly.
3. Keep the initial orphan module independent from donors and matches.
4. Do not backfill orphan data from sponsorship requests.
5. Import or manually enter existing orphan records with their current `orphan_code` values, such as
   `OR507` or `OR508`.
6. If any manual orphan records already exist outside the app, import them only after agreeing on
   required fields, especially `orphan_code` and `profile_image_url`.

Existing orphan code handling:

- Before launch, collect the current orphan list and codes from the team.
- Preserve codes exactly, including numeric portions, so donors can continue referencing the same
  child by the same code.
- If two historical records accidentally share the same code, block import and resolve manually
  before the records become active.
- Add an admin search filter for `orphan_code`.
- For existing records, let an allowed admin enter the current historical code manually.
- For brand-new records without an existing code, auto-suggest the next available code beginning at
  `OR1100`.
- The API must still check uniqueness before insert, even when the code was auto-generated.

Required image handling:

- Because every orphan must have `profile_image_url`, imported orphan records must include a real
  profile image before they can be inserted as active records.
- If historical records are missing images, import them as a separate offline cleanup task or use a
  temporary `draft` import only if the database constraint allows it. Default recommendation: require
  the image for all rows from day one.

#### Phase 6.5: Types And Data Access

Add TypeScript types:

- `OrphanProfileRow`
- `OrphanProfile`
- `OrphanProfileInput`
- `OrphanProfileUpdate`
- `OrphanProfileStatus`
- `OrphanVerificationStatus`
- `OrphanGender`
- `OrphanProfilePdfOptions`
- `OrphanGuardianRow`
- `OrphanGuardian`
- `OrphanGuardianInput`
- `DocumentRow`
- `Document`
- `DocumentInput`
- `DocumentCategory`

Recommended frontend orphan shape:

- `id`
- `orphanCode`
- `fullName`
- `profileImageUrl`
- `gender`
- `dateOfBirth`
- `ageEstimate`
- `cityArea`
- `healthNotes`
- `educationStatus`
- `backgroundSummary`
- `verificationStatus`
- `profileStatus`
- `guardian`
- `documents`
- `createdByTeamMemberId`
- `createdByTeamMember`
- `submittedByTeamMemberId`
- `submittedAt`
- `approvedByTeamMemberId`
- `approvedAt`
- `archivedByTeamMemberId`
- `archivedAt`
- `archiveReason`
- `createdAt`
- `updatedAt`

Add orphan data helpers:

- `listOrphanProfiles(options)`
- `getOrphanProfileById(id)`
- `createOrphanProfile(input, createdByTeamMemberId)`
- `updateOrphanProfile(id, input)`
- `submitOrphanProfileForReview(id, submittedByTeamMemberId)`
- `approveOrphanProfile(id, approvedByTeamMemberId)`
- `archiveOrphanProfile(id, archivedByTeamMemberId, reason)`
- `restoreOrphanProfileToDraft(id)`
- `listOrphanDocuments(orphanId)`
- `uploadOrphanProfileImage(orphanId, file, uploadedByTeamMemberId)`
- `uploadOrphanDocument(orphanId, file, metadata, uploadedByTeamMemberId)`
- `deleteOrphanDocument(orphanId, documentId)`
- `generateOrphanProfilePdf(orphanId, options)`

Data rules:

- Map Supabase rows to camelCase app objects consistently.
- Keep `orphanCode` visible in list, detail, matching-ready views, and downloaded PDFs.
- Never expose internal UUIDs as the primary donor-facing identifier.
- Validate all status transitions in the server data layer, not only in UI.
- Profile approval must require a profile image, required orphan fields, and guardian information.
- Do not expose sensitive document URLs to roles that cannot view documents.
- Do not allow orphan deletion in Phase 6. Use `archived` status instead.

#### Phase 6.6: API Routes

Add admin orphan routes:

- `GET /api/admin/orphans`
  - Returns orphan profiles with summary data.
  - Supports query filters:
    - `search`
    - `orphanCode`
    - `profileStatus`
    - `verificationStatus`
    - `gender`
    - `cityArea`
    - `createdBy`
  - Applies role scope server-side.

- `POST /api/admin/orphans`
  - Creates an orphan profile.
  - Required fields:
    - orphan code, or an explicit request to auto-generate the next code
    - full name
    - profile image
    - gender
    - guardian name
    - guardian relationship
  - Optional but recommended fields:
    - date of birth or age estimate
    - city/area
    - health notes
    - education status
    - background summary
    - guardian phone/WhatsApp/address
  - Sets `created_by_team_member_id` to the current team member.
  - Starts profile status as `draft` unless explicitly submitted by an allowed role.

- `GET /api/admin/orphans/[id]`
  - Returns orphan profile, guardian details, document metadata, review metadata, and status history
    if available.
  - Applies orphan visibility scope server-side.

- `PATCH /api/admin/orphans/[id]`
  - Updates profile and guardian fields.
  - Rejects edits from read-only roles.
  - Rejects sensitive field edits unless the role can edit orphan profiles.
  - Blocks ordinary edits once a profile is approved unless the role has approval/override access or
    the profile is moved back to draft by an allowed role.

- `POST /api/admin/orphans/[id]/submit-for-review`
  - Moves `draft` or `needs_more_information` profiles to `under_review`.
  - Requires required fields, guardian details, and `profile_image_url`.
  - Sets `submitted_by_team_member_id` and `submitted_at`.

- `POST /api/admin/orphans/[id]/approve`
  - Moves `under_review` profiles to `approved`.
  - Requires approval permission.
  - Requires complete required fields, profile image, guardian details, and acceptable verification
    status.
  - Sets `approved_by_team_member_id` and `approved_at`.

- `POST /api/admin/orphans/[id]/archive`
  - Moves a profile to `archived`.
  - Requires archive permission.
  - Requires archive reason.
  - Sets `archived_by_team_member_id`, `archived_at`, and `archive_reason`.

- `POST /api/admin/orphans/[id]/profile-image`
  - Uploads or replaces the required profile image.
  - Updates `orphan_profiles.profile_image_url`.
  - Creates or updates a `documents` metadata row with `document_category = 'profile_image'` and
    `is_primary_profile_image = true`.

- `GET /api/admin/orphans/[id]/documents`
  - Returns document metadata for the orphan.
  - Applies document visibility permissions.

- `POST /api/admin/orphans/[id]/documents`
  - Uploads an orphan document.
  - Stores metadata in `documents`.
  - Rejects file types and sizes outside policy.

- `DELETE /api/admin/orphans/[id]/documents/[documentId]`
  - Deletes or soft-removes document metadata and storage object if allowed.
  - Must not allow deleting the only primary profile image unless another image is promoted first.

- `GET /api/admin/orphans/[id]/profile-pdf`
  - Generates and downloads a donor-shareable orphan profile PDF/card.
  - Uses `orphan_code`, profile image, orphan name, and approved public profile fields.
  - Excludes internal notes, private guardian contact details, sensitive documents, audit data, and
    unpublished review information.
  - Requires orphan view permission and a separate download/export permission if added.
  - Should work for approved profiles by default. Draft/under-review downloads should be limited to
    admins for preview and clearly watermarked as preview if supported.

Validation:

- Orphan code is required unless the API is explicitly auto-generating it.
- Orphan code must be unique.
- Auto-generated orphan codes must start at `OR1100` or higher.
- Full name is required.
- Profile image is required for every orphan profile.
- Gender must be one of the allowed values.
- At least one of `date_of_birth` or `age_estimate` should be provided before approval.
- Guardian name and relationship are required.
- Status values must be allowed.
- Profile status transitions must follow the lifecycle rules.
- Notes and summaries should have reasonable max lengths.

Error behavior:

- `401` for unauthenticated.
- `403` for authenticated but forbidden.
- `404` when an orphan profile does not exist or must not be revealed.
- `400` for validation errors.
- Upload failures should return a clear field-level error where possible.

#### Phase 6.7: Permission Rules

Add Phase 6 page/action keys to the central permission helper.

Page key:

- `orphan_profiles`

Suggested action keys:

- `orphans.view`
- `orphans.create`
- `orphans.update`
- `orphans.submit_for_review`
- `orphans.approve`
- `orphans.archive`
- `orphans.upload_profile_image`
- `orphans.upload_documents`
- `orphans.view_documents`
- `orphans.delete_documents`
- `orphans.download_profile_pdf`

Role behavior:

- `super_admin`
  - View all orphan profiles.
  - Create and edit orphan profiles.
  - Upload and view documents/photos.
  - Submit, approve, archive, and restore profiles.
  - Download donor-shareable profile PDFs.

- `admin`
  - Same orphan profile access as `super_admin`, unless a later policy reserves final approval for
    `super_admin`.

- `orphan_coordinator`
  - View orphan profiles.
  - Create orphan profiles.
  - Edit draft profiles they created or profiles assigned to them, depending on the chosen scope.
  - Upload profile images and documents.
  - Submit profiles for review.
  - Download profile PDFs for profiles they can view if the organization allows coordinators to
    share drafts internally.
  - Cannot approve profiles by default.
  - Cannot archive approved profiles by default.

- `sponsorship_manager`
  - View approved and under-review profiles needed for sponsorship preparation.
  - Approve profiles if the organization wants sponsorship managers to own approval; default
    recommendation: allow approval only to `super_admin` and `admin` until the review workflow is
    mature.
  - Cannot create or edit orphan identity/guardian fields by default.
  - Cannot upload sensitive documents by default unless explicitly allowed.
  - Can download profile PDFs for approved profiles if they are preparing donor communication.

- `support_coordinator`
  - View limited orphan summary information when needed for support.
  - Cannot create, edit, approve, archive, or upload documents.
  - Should not see sensitive documents unless a future permission explicitly grants access.

- `finance_manager`
  - View limited orphan summary information for future payment context.
  - Cannot create, edit, approve, archive, or upload documents.

- `viewer`
  - View orphan profiles if page access is granted.
  - Cannot create, edit, submit, approve, archive, upload, or delete files.

Server-side rule:

- Every orphan API route must call central permission helpers.
- Sensitive document visibility must be enforced in the API.
- Read-only roles must not be able to mutate orphan profiles through direct API calls.
- Downloaded profile PDFs must follow the same data visibility rules as the API response.

#### Phase 6.8: Admin Sidebar And Routes

Sidebar:

- Add a working `Orphan Profiles` sidebar item only after `/admin/orphans` exists.
- Hide the item for roles with no orphan page access.
- Do not show a dead-end placeholder route.

Routes:

- `/admin/orphans`
  - Orphan directory.
- `/admin/orphans/new`
  - New orphan profile form.
- `/admin/orphans/[id]`
  - Orphan detail/edit/review page.

Access guards:

- Protect all orphan pages using the shared admin page guard.
- Redirect unauthorized users to the existing forbidden page.
- Direct URL access must not bypass role restrictions.

#### Phase 6.9: Orphan Directory UI

Build the orphan directory using the existing admin visual language.

Top KPI cards:

- Total Profiles
- Drafts
- Under Review
- Approved
- Archived

Filters:

- Search by orphan code, name, guardian name, phone, city/area.
- Profile status:
  - all
  - draft
  - under review
  - approved
  - matched
  - archived
- Verification status.
- Gender.
- City/area.
- Created by.

Table columns:

- Orphan Code
- Orphan
- Profile Image
- Guardian
- City/Area
- Verification
- Profile Status
- Created
- Last Updated

Row behavior:

- Clicking orphan name opens orphan detail.
- Orphan code should be visible and copyable because donors may already know codes like `OR507`.
- Show the profile image as a small thumbnail.
- If somehow an image is missing, show a warning state instead of silently hiding the problem.
- On desktop, quick detail may open as a right-side drawer.
- On mobile/smaller screens, quick detail opens as a bottom sheet.
- Direct route `/admin/orphans/[id]` opens the full detail/edit/review page.

Empty states:

- No orphan profiles yet.
- No profiles match current filters.
- Read-only role with no create permission should not see the New Orphan button.

#### Phase 6.10: New Orphan Flow

New orphan form sections:

- Orphan code mode.
- Profile image.
- Basic identity.
- Location.
- Education.
- Health.
- Background.
- Guardian/caretaker.
- Supporting documents.

Required fields for creation:

- Orphan code, or auto-generate code confirmation.
- Profile image.
- Full name.
- Gender.
- Guardian name.
- Guardian relationship.

Required fields before approval:

- Profile image.
- Full name.
- Gender.
- Date of birth or age estimate.
- City/area.
- Background summary.
- Guardian name.
- Guardian relationship.
- At least one guardian contact method when available.
- Verification status must not be `unverified`.

On successful creation:

- Show green success toast.
- Revalidate orphan SWR list.
- Navigate to or open the created orphan profile detail.

On validation failure:

- Keep the form open.
- Show field errors.
- Show red failure toast.

Orphan code mode UX:

- Add an `Orphan Code Mode` segmented control or toggle near the top of the form.
- Options:
  - `Auto-generate new code`
  - `Enter existing code`
- Default to `Auto-generate new code` for brand-new orphan profiles.
- When `Auto-generate new code` is selected, hide the editable code input and show helper text such
  as `The next available code will be assigned automatically starting at OR1100`.
- When `Enter existing code` is selected, show the `orphan_code` input for historical records like
  `OR507` or `OR508`.
- Validate duplicate codes before saving and show a clear field error if the code is already in use.
- The API must receive the selected mode and enforce the same rules server-side.

Profile image UX:

- Put the image upload at the top of the form.
- Show preview before save.
- Allow replacement by roles with upload permission.
- Explain accepted file types and size limit briefly.
- Do not allow submitting the create form without an image.

#### Phase 6.11: Orphan Detail, Edit, And Review UI

Orphan detail should show:

- Profile image.
- Orphan code.
- Basic identity:
  - full name
  - gender
  - date of birth
  - age estimate
  - city/area
- Education status.
- Health notes.
- Background summary.
- Guardian/caretaker details.
- Profile status and verification status.
- Created/submitted/approved/archived metadata.
- Supporting documents and photos.

Editable fields:

- Profile image.
- Full name.
- Gender.
- Date of birth.
- Age estimate.
- City/area.
- Health notes.
- Education status.
- Background summary.
- Guardian/caretaker fields.
- Verification status.

Actions:

- Save Changes.
- Upload/Replace Profile Image.
- Upload Document.
- Download Profile.
- Submit For Review.
- Approve Profile.
- Move Back To Draft or Request More Information.
- Archive Profile.

Do not show:

- Assign donor action.
- Sponsorship match action.
- Receipt or payment actions.
- Donor portal preview as a functional workflow.

Review behavior:

- `draft` profiles can be edited by allowed creators/editors.
- `under_review` profiles should make required-field gaps obvious.
- `approved` profiles should be mostly locked except for roles with approval/override access.
- `matched` status is reserved for Phase 7 and should not be set manually in Phase 6 except through
  a future matching workflow.
- `archived` profiles should be read-only unless restored by an allowed role.

Download Profile behavior:

- Show the button to roles with `orphans.download_profile_pdf`.
- Default file name should include the orphan code and safe orphan name, for example
  `OR507-farid-salem-profile.pdf`.
- If the profile is not approved, either hide the button from non-admin roles or label the generated
  PDF as a preview.
- The PDF should not include internal notes, private guardian phone numbers, sensitive verification
  documents, or database UUIDs.

#### Phase 6.12: Status Lifecycle

Recommended lifecycle:

1. `draft`
   - Profile is being created or corrected.
   - Orphan Coordinator/Admin can edit.

2. `under_review`
   - Required fields are present.
   - Profile image is present.
   - Guardian information is present.
   - Awaiting approval.

3. `approved`
   - Reviewed by an allowed role.
   - Available for Phase 7 matching.
   - Should not be freely edited by ordinary roles.

4. `matched`
   - Reserved for Phase 7.
   - Means the orphan has an active sponsorship match.

5. `archived`
   - No longer active for matching.
   - Requires reason.

Allowed transitions in Phase 6:

- `draft` -> `under_review`
- `under_review` -> `draft`
- `under_review` -> `approved`
- `draft` -> `archived`
- `under_review` -> `archived`
- `approved` -> `archived`
- `archived` -> `draft` only by `super_admin` or `admin`

Do not allow in Phase 6:

- Manual `approved` -> `matched`
- Manual `matched` changes, because matching belongs to Phase 7.

#### Phase 6.13: Donor-Shareable Profile PDF

Add a `Download Profile` action on orphan detail pages.

Reference format:

- The attached sample is a one-page donor-shareable sponsorship card.
- It uses organization branding at the top, Arabic/RTL copy, a large orphan image, a prominent orphan
  name block, and a footer with campaign/location/date information.
- Phase 6 should generate a similar donor-ready PDF from stored data instead of asking the team to
  rebuild profile cards manually.

Recommended content:

- Organization logo/branding.
- Title such as orphan sponsorship card/profile.
- Orphan profile image.
- Orphan name.
- Orphan code, for example `OR507`.
- Age or date of birth if approved for sharing.
- City/area or country if approved for sharing.
- Short public background summary.
- Education summary if approved for sharing.
- Health summary only if approved for sharing and not sensitive.
- Campaign/footer text and generated date.

PDF generation approach:

- Prefer a server-side HTML-to-PDF or template-based PDF route owned by the project.
- Keep the template in the codebase so branding, Arabic RTL layout, and field visibility can be
  reviewed.
- Use embedded or bundled fonts that support Arabic text correctly.
- Use the required `profile_image_url` as the main visual.
- Avoid screenshots of admin pages; generate a clean donor-facing document.
- Return `application/pdf` with a download-friendly filename.
- Cache generated PDFs only if the cache is invalidated after profile image/name/code/public fields
  change.

Privacy rules:

- The PDF is meant for donors, so it must use a donor-safe field allowlist.
- Do not include internal admin notes.
- Do not include private guardian contact details.
- Do not include sensitive documents or verification notes.
- Do not include Supabase/internal UUIDs.
- Show `orphan_code` as the donor-facing identifier.

#### Phase 6.14: SWR And Caching

Use SWR keys like:

- `/api/admin/orphans?...filters`
- `/api/admin/orphans/${id}`
- `/api/admin/orphans/${id}/documents`
- `/api/admin/orphans/${id}/profile-pdf`

Rules:

- Show skeletons only on first load when no cached data exists.
- Keep stale orphan rows visible during background revalidation.
- Revalidate orphan list and detail after:
  - orphan creation
  - orphan update
  - profile image upload/replacement
  - document upload/delete
  - orphan code change
  - submit for review
  - approval
  - archive/restore
- Optimistically update simple text edits where safe.
- Avoid optimistic updates for file uploads and approval transitions unless error rollback is clear.

#### Phase 6.15: Audit And Notifications Preparation

Add audit events for sensitive orphan changes if the audit helper exists by Phase 6. If full audit
storage is still deferred, keep event names consistent for Phase 10.

Recommended event names:

- `orphan_profile.created`
- `orphan_profile.updated`
- `orphan_profile.profile_image_uploaded`
- `orphan_profile.document_uploaded`
- `orphan_profile.document_deleted`
- `orphan_profile.pdf_downloaded`
- `orphan_profile.submitted_for_review`
- `orphan_profile.approved`
- `orphan_profile.archived`
- `orphan_profile.restored_to_draft`

Future notification hooks:

- When an orphan profile is submitted for review.
- When an orphan profile is approved.
- When an approved profile becomes available for matching.

Actual WhatsApp/email/admin notification delivery can remain a later feature.

#### Phase 6.16: Testing And Verification

Manual verification:

- Super Admin can create, edit, submit, approve, archive, and restore orphan profiles.
- Admin can create, edit, submit, approve, and archive orphan profiles.
- Orphan Coordinator can create and edit draft profiles.
- Orphan Coordinator can upload profile images and documents.
- Orphan Coordinator can submit profiles for review.
- Orphan Coordinator cannot approve profiles unless explicitly granted.
- Sponsorship Manager can view approved/under-review profiles but cannot mutate identity fields by
  default.
- Finance Manager and Support Coordinator only see allowed summary information.
- Viewer cannot mutate orphan profiles.
- Existing orphan codes like `OR507` can be entered and preserved.
- Duplicate orphan codes are rejected clearly.
- New orphan code auto-generation, if enabled, suggests the next available code starting at `OR1100`
  and still validates uniqueness server-side.
- Creating an orphan without a profile image is rejected.
- Replacing a profile image updates the orphan detail and directory thumbnail.
- Deleting documents cannot remove the only required primary profile image without replacement.
- Profile approval is blocked until required fields, guardian details, profile image, and verification
  status are complete.
- Direct blocked page/API access returns forbidden or hidden state correctly.
- Download Profile generates a donor-shareable PDF with the orphan code, profile image, and public
  fields only.
- Downloaded PDFs do not include internal notes, private guardian contacts, sensitive documents, or
  internal UUIDs.
- Mobile orphan detail and upload flows remain usable.
- SWR keeps stale data visible while revalidating.

Automated or code-level checks:

- Run `npm run type-check`.
- Run targeted Biome checks on touched files.
- Add permission helper tests later if a test runner is introduced.
- Add route-handler tests later for status transitions and image-required validation.
- Add route-handler or snapshot tests later for donor-safe PDF field inclusion/exclusion.

#### Phase 6.17: Acceptance Criteria

Phase 6 is complete when:

- `/admin/orphans` is a working orphan profile directory.
- `/admin/orphans/new` can create orphan records through a Next.js API route.
- `/admin/orphans/[id]` can view, edit, and review orphan records.
- Existing donor-facing orphan codes such as `OR507` are stored in `orphan_code`, unique, searchable,
  and visible in admin screens.
- New orphan code creation has a clear manual path for historical codes and an auto-generated path
  that starts at `OR1100` for brand-new records.
- Every orphan profile stores a required `profile_image_url`.
- Orphan profile images can be uploaded/replaced by allowed roles.
- A Download Profile button generates a donor-shareable PDF/card similar in purpose to the attached
  sample.
- Downloaded PDFs include the orphan code and profile image but exclude internal/private fields.
- Guardian/caretaker details are stored and displayed.
- Supporting document/photo metadata can be uploaded and viewed by allowed roles.
- Profile status lifecycle is enforced server-side.
- Approved profiles are available for future Phase 7 matching.
- Role permissions are enforced in sidebar, pages, UI actions, and API routes.
- Read-only roles cannot mutate orphan profiles through direct API calls.
- No donor matching, receipts, or donor portal orphan display are included in Phase 6.
- Type-check and targeted lint checks pass.

### Phase 7: Matching

Goal: build the donor-to-orphan matching workflow that starts an actual sponsorship relationship.
Phase 7 connects the Phase 5 donor module to the Phase 6 orphan profile module through
`sponsorship_matches`.

Phase 7 should not build donation receipt upload, finance verification, contribution charts,
automated monthly billing, or the full donor portal dashboard. Those remain Phase 8 and Phase 9.
Phase 7 may expose enough match data for the future donor portal, but it should keep donor-facing UI
minimal until Phase 8.

Phase 7 should answer eight practical questions:

- Which donors are ready to sponsor an orphan now?
- Which approved orphans are available for sponsorship now?
- Which donor status can be matched with which orphan status?
- Can one donor sponsor more than one orphan?
- Can one orphan have more than one active sponsor?
- What happens when a match is paused, ended, transferred, or created by mistake?
- Which roles can create, pause, resume, end, or view matches?
- How does the donor portal know which orphan or orphans belong to the donor?

#### Phase 7.1: Scope Boundaries

Implement in Phase 7:

- `/admin/matches`
- `/admin/matches/new` if a dedicated creation route is cleaner than a drawer.
- `/admin/matches/[id]` if match details need a full page.
- Match directory with search, filters, KPI cards, and responsive table/card layouts.
- Match creation between an eligible donor and an eligible orphan profile.
- Match status lifecycle.
- Monthly amount, currency, sponsorship start date, and optional end date.
- Server-side validation that prevents invalid donor/orphan status combinations.
- Automatic orphan `profile_status` update from `approved` to `matched` when an active match is
  created.
- Automatic orphan `profile_status` return from `matched` to `approved` when the last active match
  ends or is voided, unless the orphan is archived.
- Donor detail should show current and historical matches.
- Orphan detail should show current and historical matches.
- Role-aware match page visibility and API guards.
- Audit event names for match creation and status changes.
- SWR caching with stale data shown during background revalidation.

Do not implement in Phase 7:

- Receipt uploads.
- Receipt verification.
- Finance dashboards.
- Contribution charts.
- Automated payment reminders.
- Public donor portal dashboard beyond reading match data needed later.
- Direct client-side Supabase writes from matching UI.

Important product boundary:

- `donors.active` is an account-access flag, not the full sponsorship lifecycle.
- Phase 7 should introduce a match-level lifecycle in `sponsorship_matches.status`.
- If the team needs richer donor readiness, add explicit donor sponsorship fields rather than
  overloading `donors.active`.

#### Phase 7.2: Status Model

Current implemented donor status:

- `active`: donor account is enabled and can login when linked to Google.
- `pending_first_login`: derived UI state where `donors.active = true` and `auth_user_id is null`.
- `inactive`: donor account is disabled and should not receive new sponsorship activity.

Recommended Phase 7 donor sponsorship readiness:

- Keep `donors.active` as the account flag.
- Derive basic readiness from the donor record and current matches.
- Add explicit fields only if needed:
  - `donors.sponsorship_status text not null default 'ready'`
  - or keep sponsorship status derived from `sponsorship_matches`.

Recommended donor sponsorship states for the matching UI:

- `ready`
  - Active donor with required contact data.
  - Has no blocking issue.
  - May or may not have completed first Google login.

- `pending_first_login`
  - Active donor who has not linked Google yet.
  - Can be matched if the team has confirmed sponsorship offline.
  - Donor portal access will not work until first login is linked.

- `already_sponsoring`
  - Active donor with at least one active match.
  - Can be matched to another orphan only if multi-sponsorship is allowed.
  - Default recommendation: allow multiple active matches per donor.

- `paused`
  - Donor has only paused matches or has a donor-level sponsorship pause if that field is added.
  - Should not receive new matches unless an Admin/Sponsorship Manager explicitly resumes or
    overrides.

- `inactive`
  - `donors.active = false`.
  - Cannot receive new active matches.

Current implemented orphan statuses:

- `verification_status`
  - `unverified`
  - `documents_received`
  - `field_verified`
  - `needs_more_information`
  - `rejected`

- `profile_status`
  - `draft`
  - `under_review`
  - `approved`
  - `matched`
  - `archived`

Recommended match statuses:

- `active`
  - Sponsorship is currently running.
  - Donor portal can show this orphan as sponsored by the donor.

- `paused`
  - Sponsorship is temporarily paused.
  - Keep the relationship visible internally.
  - Donor portal may show paused state in Phase 8 if useful.

- `ended`
  - Sponsorship ended normally.
  - Historical record remains.

- `voided`
  - Created by mistake or canceled before sponsorship began.
  - Does not count as a historical sponsorship for donor stats unless explicitly needed.

Optional future statuses:

- `pending_start`
  - Match is confirmed but starts on a future date.
  - Use this only if future-dated matches become common.

- `transferred`
  - Sponsorship moved to a different donor or different orphan.
  - Default recommendation: use `ended` on the old match plus `active` on the new match, with notes.

#### Phase 7.3: Donor-Orphan Match Eligibility Matrix

The safest default rule:

- A new active match can be created only when:
  - donor account is `active`;
  - donor sponsorship state is `ready`, `pending_first_login`, or allowed `already_sponsoring`;
  - orphan `profile_status = approved`;
  - orphan `verification_status = field_verified`;
  - orphan has no existing active match, unless co-sponsorship is explicitly enabled.

Donor account/readiness vs orphan profile status:

| Donor state | `draft` orphan | `under_review` orphan | `approved` orphan | `matched` orphan | `archived` orphan |
| --- | --- | --- | --- | --- | --- |
| `ready` active donor | No | No | Yes, if `field_verified` | No by default; only if co-sponsorship enabled | No |
| `pending_first_login` active donor | No | No | Yes, if team confirmed offline and orphan is `field_verified` | No by default; only if co-sponsorship enabled | No |
| `already_sponsoring` active donor | No | No | Yes, if multi-sponsorship allowed and orphan is `field_verified` | No by default; only if co-sponsorship enabled | No |
| `paused` donor | No | No | No by default; resume donor first | No | No |
| `inactive` donor | No | No | No | No | No |

Donor account/readiness vs orphan verification status:

| Donor state | `unverified` | `documents_received` | `field_verified` | `needs_more_information` | `rejected` |
| --- | --- | --- | --- | --- | --- |
| `ready` active donor | No | No | Yes, only when profile is `approved` | No | No |
| `pending_first_login` active donor | No | No | Yes, only when profile is `approved` and sponsor is confirmed offline | No | No |
| `already_sponsoring` active donor | No | No | Yes, only when profile is `approved` and multi-sponsorship is allowed | No | No |
| `paused` donor | No | No | No by default | No | No |
| `inactive` donor | No | No | No | No | No |

Operational interpretation:

- `draft` orphan profiles are never matchable.
- `under_review` orphan profiles are never matchable, even if they look complete.
- `approved` orphan profiles are matchable only when `verification_status = field_verified`.
- `matched` orphan profiles are not matchable by default because one orphan should have one active
  sponsor relationship at a time.
- `archived` orphan profiles are never matchable.
- `unverified`, `documents_received`, `needs_more_information`, and `rejected` verification statuses
  block matching, regardless of profile status.
- Active donors who have not completed first Google login can still be matched if the sponsorship was
  confirmed through WhatsApp, phone, or another offline channel.
- Inactive donors cannot receive new matches, even if they previously sponsored an orphan.

Default business policy:

- One donor may sponsor multiple orphans.
- One orphan may have only one active sponsor/match.
- Multiple historical matches for the same orphan are allowed over time, but only one can be active.
- Co-sponsorship for one orphan should be a future explicit feature, not the default Phase 7
  behavior.

#### Phase 7.4: Match Lifecycle

Recommended lifecycle:

1. `active`
   - Created after donor and orphan eligibility checks pass.
   - Sets the orphan profile to `matched`.
   - Appears as the donor's current sponsorship.

2. `paused`
   - Temporary interruption.
   - Keeps the orphan profile as `matched` by default because the sponsorship may resume.
   - Does not make the orphan available for a new donor unless Admin explicitly ends the match.

3. `ended`
   - Sponsorship relationship has finished.
   - If no other active match exists for the orphan, set orphan profile back to `approved`.
   - Historical record remains visible on donor and orphan detail.

4. `voided`
   - Match was created by mistake.
   - If no other active match exists for the orphan, set orphan profile back to `approved`.
   - Requires a reason.

Allowed transitions:

- `active` -> `paused`
- `active` -> `ended`
- `active` -> `voided`
- `paused` -> `active`
- `paused` -> `ended`
- `paused` -> `voided`

Do not allow:

- `ended` -> `active`
- `voided` -> `active`
- New active match for an orphan that already has an active match, unless co-sponsorship is enabled.
- New active match for an inactive donor.
- New active match for a non-approved or non-field-verified orphan.

#### Phase 7.5: Database Changes

Add `sponsorship_matches`:

- `id uuid primary key default gen_random_uuid()`
- `donor_id uuid not null references public.donors(id) on delete restrict`
- `orphan_id uuid not null references public.orphan_profiles(id) on delete restrict`
- `monthly_amount numeric(12,2) not null`
- `currency text not null default 'PKR'`
- `status text not null default 'active'`
- `started_at date not null`
- `ended_at date`
- `status_reason text`
- `notes text`
- `created_by_team_member_id uuid references public.team_members(id) on delete set null`
- `updated_by_team_member_id uuid references public.team_members(id) on delete set null`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`

Recommended `status` values:

- `active`
- `paused`
- `ended`
- `voided`

Add constraints:

- `sponsorship_matches_status_check`
- `sponsorship_matches_monthly_amount_positive_check`
- `sponsorship_matches_currency_check`
- `sponsorship_matches_dates_check`

Add indexes:

- `sponsorship_matches_donor_id_idx`
- `sponsorship_matches_orphan_id_idx`
- `sponsorship_matches_status_idx`
- `sponsorship_matches_started_at_idx`
- `sponsorship_matches_created_at_idx`
- Partial unique index to prevent more than one active match per orphan:
  - `unique (orphan_id) where status = 'active'`

Optional future index if donor multi-sponsorship is not allowed:

- Partial unique index on `donor_id where status = 'active'`.
- Default recommendation: do not add this because one donor may sponsor multiple orphans.

RLS:

- Enable RLS on `sponsorship_matches`.
- Continue admin reads/writes through Next.js server routes using the service role key.
- Donor portal reads in Phase 8 should still go through project-owned server routes first, so donor
  visibility can be enforced independently of Supabase.

#### Phase 7.6: Data Access And Types

Add TypeScript types:

- `SponsorshipMatchStatus`
- `SponsorshipMatchRow`
- `SponsorshipMatch`
- `SponsorshipMatchInput`
- `SponsorshipMatchUpdate`
- `MatchableDonor`
- `MatchableOrphan`

Recommended frontend match shape:

- `id`
- `donorId`
- `donor`
  - `id`
  - `fullName`
  - `email`
  - `phone`
  - `active`
- `orphanId`
- `orphan`
  - `id`
  - `orphanCode`
  - `fullName`
  - `profileImageUrl`
  - `profileStatus`
  - `verificationStatus`
- `monthlyAmount`
- `currency`
- `status`
- `startedAt`
- `endedAt`
- `statusReason`
- `notes`
- `createdByTeamMemberId`
- `createdByTeamMember`
- `updatedByTeamMemberId`
- `createdAt`
- `updatedAt`

Add data helpers:

- `listSponsorshipMatches(options)`
- `getSponsorshipMatchById(id)`
- `listMatchesForDonor(donorId)`
- `listMatchesForOrphan(orphanId)`
- `listMatchableDonors(options)`
- `listMatchableOrphans(options)`
- `createSponsorshipMatch(input, createdByTeamMemberId)`
- `updateSponsorshipMatch(id, input, updatedByTeamMemberId)`
- `pauseSponsorshipMatch(id, reason, updatedByTeamMemberId)`
- `resumeSponsorshipMatch(id, updatedByTeamMemberId)`
- `endSponsorshipMatch(id, reason, endedAt, updatedByTeamMemberId)`
- `voidSponsorshipMatch(id, reason, updatedByTeamMemberId)`
- `assertDonorCanBeMatched(donorId, options)`
- `assertOrphanCanBeMatched(orphanId, options)`

Data rules:

- Match creation and orphan status update should happen in one reliable server-side operation.
- Use a database transaction or Postgres RPC if multiple Supabase calls cannot be made atomically.
- The API must re-check donor and orphan eligibility immediately before insert.
- The API must rely on the partial unique index to prevent race-condition double matching.
- Do not trust stale frontend matchable lists.

#### Phase 7.7: API Routes

Add admin match routes:

- `GET /api/admin/matches`
  - Returns matches with donor and orphan summaries.
  - Supports query filters:
    - `search`
    - `status`
    - `donorId`
    - `orphanId`
    - `startedFrom`
    - `startedTo`
    - `createdBy`
  - Applies role scope server-side.

- `POST /api/admin/matches`
  - Creates a new match.
  - Required fields:
    - donor id
    - orphan id
    - monthly amount
    - currency
    - start date
  - Optional fields:
    - notes
    - status reason
  - Re-checks donor and orphan eligibility server-side.
  - Sets `created_by_team_member_id`.
  - Updates orphan `profile_status` to `matched` when status is `active`.

- `GET /api/admin/matches/[id]`
  - Returns match detail, donor summary, orphan summary, and status history if available.

- `PATCH /api/admin/matches/[id]`
  - Updates editable fields such as amount, notes, and dates when allowed.
  - Does not silently change donor or orphan ids after creation.

- `POST /api/admin/matches/[id]/pause`
  - Moves `active` to `paused`.
  - Requires reason.

- `POST /api/admin/matches/[id]/resume`
  - Moves `paused` to `active`.
  - Re-checks donor and orphan eligibility.
  - Fails if another active match now exists for the orphan.

- `POST /api/admin/matches/[id]/end`
  - Moves `active` or `paused` to `ended`.
  - Requires end date and reason.
  - Makes the orphan `approved` again if no other active match exists and the orphan is not
    archived.

- `POST /api/admin/matches/[id]/void`
  - Moves `active` or `paused` to `voided`.
  - Requires reason.
  - Makes the orphan `approved` again if no other active match exists and the orphan is not
    archived.

- `GET /api/admin/matches/matchable-donors`
  - Returns active donors that can be selected for a match.
  - Includes derived donor state:
    - ready
    - pending first login
    - already sponsoring
  - Excludes inactive donors by default.

- `GET /api/admin/matches/matchable-orphans`
  - Returns orphans with `profile_status = approved` and `verification_status = field_verified`.
  - Excludes archived, draft, under-review, rejected, and already-active matched orphans by default.

Validation:

- Donor id must exist.
- Donor must be active.
- Orphan id must exist.
- Orphan must be `approved`.
- Orphan verification must be `field_verified`.
- Orphan must not already have an active match unless co-sponsorship is enabled.
- Monthly amount must be positive.
- Currency must be allowed.
- Start date must be valid.
- End date, if present, must not be before start date.
- Pause/end/void actions require a reason.

Error behavior:

- `401` for unauthenticated.
- `403` for authenticated but forbidden.
- `404` when a donor, orphan, or match does not exist or must not be revealed.
- `400` for validation errors.
- `409` for race conflicts, such as another admin matching the orphan first.

#### Phase 7.8: Permission Rules

Add Phase 7 page/action keys to the central permission helper.

Page key:

- `matches`

Suggested action keys:

- `matches.view`
- `matches.create`
- `matches.update`
- `matches.pause`
- `matches.resume`
- `matches.end`
- `matches.void`
- `matches.view_financial_amount`

Role behavior:

- `super_admin`
  - View all matches.
  - Create matches.
  - Update match amount, start date, notes, and status.
  - Pause, resume, end, or void matches.
  - Override conflicts only through explicit audited actions.

- `admin`
  - Same operational match access as `super_admin`, except any future protected override can be
    reserved for `super_admin`.

- `sponsorship_manager`
  - View all matches.
  - Create matches.
  - Update operational notes.
  - Pause, resume, and end matches.
  - Void matches only if policy allows; default recommendation: require Admin/Super Admin for void.

- `finance_manager`
  - View matches for payment and receipt context.
  - View monthly amount.
  - Cannot create, pause, resume, end, or void matches in Phase 7.

- `orphan_coordinator`
  - View matches connected to orphan profiles if needed.
  - Cannot create or change matches.

- `support_coordinator`
  - View assigned/scoped donor-orphan summary if needed for communication.
  - Cannot create or change matches.

- `viewer`
  - View matches only if page access is granted.
  - Cannot mutate matches.

Server-side rule:

- Every match API route must call central permission helpers.
- Matchable donor and orphan APIs must enforce the same visibility rules as the full match APIs.
- Read-only roles must not be able to mutate matches through direct API calls.

#### Phase 7.9: Admin Sidebar And Routes

Sidebar:

- Add a working `Matches` sidebar item only after `/admin/matches` exists.
- Hide the item for roles with no match page access.
- Do not show a dead-end placeholder route.

Routes:

- `/admin/matches`
  - Match directory.
- `/admin/matches/new`
  - Optional dedicated match creation page.
- `/admin/matches/[id]`
  - Optional match detail/status page.

Access guards:

- Protect all match pages using the shared admin page guard.
- Redirect unauthorized users to the existing forbidden page.
- Direct URL access must not bypass role restrictions.

#### Phase 7.10: Match Directory UI

Build the match directory using the existing admin visual language.

Top KPI cards:

- Active Matches
- Paused Matches
- New This Month
- Orphans Available

Filters:

- Search by donor name, donor email, donor phone, orphan name, orphan code.
- Match status.
- Donor.
- Orphan.
- Start date range.
- Created by team member.

Table columns:

- Donor
- Orphan Code
- Orphan
- Monthly Amount
- Status
- Started
- Created By
- Updated

Row behavior:

- Clicking donor opens donor detail.
- Clicking orphan opens orphan detail.
- Clicking match row opens match detail or drawer.
- On mobile, rows become stacked cards.

Empty states:

- No matches yet.
- No matches match current filters.
- No approved field-verified orphan profiles are available.
- No active donors are ready for matching.

#### Phase 7.11: New Match Flow

Recommended UX:

1. Sponsorship Manager clicks `New Match`.
2. Choose donor from a searchable selector.
3. Choose orphan from a searchable selector.
4. Show eligibility badges for both records.
5. Enter monthly amount, currency, and start date.
6. Add optional internal notes.
7. Confirm creation in a dialog showing:
   - donor name and contact
   - orphan code and orphan name
   - monthly amount
   - start date
   - warning that the orphan will become `matched`
8. On success:
   - create `sponsorship_matches` record;
   - update orphan status to `matched`;
   - revalidate match, donor, and orphan SWR keys;
   - show success toast;
   - open the created match detail or return to match list.

Donor selector:

- Shows active donors.
- Shows pending first login clearly.
- Shows existing active match count.
- Hides inactive donors by default.
- Has an admin-only "include inactive" option for viewing/searching, but inactive donors remain
  blocked from match creation.

Orphan selector:

- Shows `approved` + `field_verified` orphans.
- Shows orphan code, name, age, city/area, profile image thumbnail, and approved date.
- Hides matched and archived orphans by default.
- If a user searches an unavailable orphan, show why it cannot be matched.

Eligibility warning examples:

- "This donor is inactive and cannot receive a new match."
- "This donor has not logged in yet. Matching is allowed only if sponsorship was confirmed offline."
- "This orphan is under review and must be approved first."
- "This orphan is approved but not field verified."
- "This orphan already has an active sponsor."

#### Phase 7.12: Donor And Orphan Detail Integration

Donor detail additions:

- Current sponsorships section.
- Historical sponsorships section.
- Match status, orphan code, orphan name, start date, amount, and end date.
- `Create Match` action when the donor is eligible and the role can create matches.
- Link to match detail.

Orphan detail additions:

- Sponsorship status section.
- Current donor if active match exists.
- Historical donors/matches.
- Match status, donor name, start date, amount, and end date.
- `Create Match` action when the orphan is eligible and the role can create matches.
- Link to match detail.

Do not expose:

- Donor private notes on orphan detail to roles without donor permissions.
- Sensitive orphan documents on match detail to roles without orphan document permissions.

#### Phase 7.13: Donor Portal Preparation

Phase 7 should make the data ready for Phase 8.

Add or prepare donor portal route behavior:

- Donor portal APIs should later read active matches where `sponsorship_matches.donor_id` is the
  current donor.
- Donor portal should show only:
  - active matches by default;
  - paused or ended matches only if the product wants a history view.
- Donor portal should never reveal other donors or unassigned orphan profiles.
- Donor portal orphan display should use donor-safe orphan fields and `orphan_code`, not internal
  UUIDs.

Phase 7 may add a server helper like:

- `listCurrentSponsorshipsForDonor(donorId)`

But the full donor portal UI remains Phase 8.

#### Phase 7.14: Audit And Notifications Preparation

Recommended audit event names:

- `sponsorship_match.created`
- `sponsorship_match.updated`
- `sponsorship_match.paused`
- `sponsorship_match.resumed`
- `sponsorship_match.ended`
- `sponsorship_match.voided`
- `orphan_profile.marked_matched`
- `orphan_profile.marked_available`

Future notification hooks:

- Notify donor when a match is created.
- Notify donor when sponsorship starts.
- Notify internal finance when a match is created and monthly receipt tracking should begin.
- Notify orphan/sponsorship team when a match is paused or ended.

Actual email/WhatsApp delivery can remain a later feature.

#### Phase 7.15: SWR And Caching

Use SWR keys like:

- `/api/admin/matches?...filters`
- `/api/admin/matches/${id}`
- `/api/admin/matches/matchable-donors?...filters`
- `/api/admin/matches/matchable-orphans?...filters`
- `/api/admin/donors/${id}`
- `/api/admin/orphans/${id}`

Rules:

- Show skeletons only on first load when no cached data exists.
- Keep stale match rows visible during background revalidation.
- Revalidate match list, donor detail, orphan detail, and matchable lists after:
  - match creation
  - match pause/resume/end/void
  - amount/date update
  - donor activation/deactivation
  - orphan approval/archive/status change
- Avoid optimistic updates for match creation because eligibility can race.
- Optimistically update simple notes only where rollback is clear.

#### Phase 7.16: Testing And Verification

Manual verification:

- Super Admin can create, pause, resume, end, and void matches.
- Admin can create and manage matches.
- Sponsorship Manager can create and manage ordinary match statuses.
- Finance Manager can view matches and monthly amounts but cannot mutate them.
- Viewer cannot mutate matches.
- Inactive donors cannot be matched.
- Active donors pending first login can be matched only with clear confirmation/warning.
- Active donors with existing active matches can sponsor another orphan if multi-sponsorship is
  enabled.
- Draft, under-review, archived, rejected, and needs-more-information orphans cannot be matched.
- Approved but not field-verified orphans cannot be matched.
- Approved and field-verified orphans can be matched.
- An orphan with an active match cannot receive a second active match by default.
- Creating a match sets orphan `profile_status` to `matched`.
- Ending or voiding the last active match returns orphan `profile_status` to `approved`.
- Pausing a match keeps the orphan unavailable for a new donor by default.
- Race condition: two admins cannot create active matches for the same orphan at the same time.
- Donor detail shows current and historical matches.
- Orphan detail shows current and historical matches.
- Direct blocked page/API access returns forbidden or hidden state correctly.
- Mobile match creation and detail flows remain usable.
- SWR keeps stale data visible while revalidating.

Automated or code-level checks:

- Run `npm run type-check`.
- Run targeted Biome checks on touched files.
- Add route-handler tests later for donor/orphan eligibility.
- Add data-layer tests later for match status transitions.
- Add database-level verification for the partial unique index on active orphan matches.

#### Phase 7.17: Acceptance Criteria

Phase 7 is complete when:

- `/admin/matches` is a working match directory.
- Allowed roles can create a match through project-owned Next.js API routes.
- Match creation stores donor, orphan, monthly amount, currency, start date, creator, and status.
- Donor-orphan eligibility is enforced server-side using the matrix in Phase 7.3.
- Only active donors can receive new matches.
- Only `approved` and `field_verified` orphans can receive new matches.
- One orphan cannot have more than one active match by default.
- One donor can sponsor multiple orphans unless policy later changes.
- Match lifecycle actions are guarded by role permissions.
- Creating an active match updates the orphan to `matched`.
- Ending or voiding the final active match makes the orphan available again as `approved`.
- Donor and orphan detail pages show match history.
- Donor portal data helpers can read the donor's active matches for Phase 8.
- Role permissions are enforced in sidebar, pages, UI actions, and API routes.
- Read-only roles cannot mutate matches through direct API calls.
- No receipt upload, receipt verification, finance reporting, or contribution charts are included in
  Phase 7.
- Type-check and targeted lint checks pass.

### Phase 8: Donor Portal

Goal: build the donor-facing portal where sponsors can login, see the orphan or orphans they support,
track their monthly sponsorship responsibility, upload monthly money-transfer receipts, and understand
their contribution history.

Phase 8 connects the donor account work from Phase 5 and the donor-orphan matching work from Phase 7
to a real donor experience. The donor portal must remain decoupled from Supabase client writes:

```txt
Donor Portal UI -> Next.js API route/server action -> Supabase Postgres/Storage
```

Phase 8 should include donor-side receipt submission because uploading proof of monthly transfer is a
core donor workflow. Phase 9 should own admin-side receipt verification, finance review queues,
delivery confirmation, and finance reporting.

Phase 8 should answer eleven practical questions:

- Can the donor login with Google only if their email exists as an active donor record?
- Which orphan or orphans am I currently supporting?
- What is my required monthly amount for each active sponsorship?
- If I support multiple orphans, what is due for each orphan this month?
- Have I submitted this month's receipt yet?
- Which organization bank account did I transfer money to?
- Is my receipt pending, ready for admin review, reviewed, rejected, or confirmed as delivered?
- How much have I contributed to date?
- What does my monthly/yearly contribution history look like?
- Which approved orphans are not currently matched, if the team wants donors to discover more
  sponsorship opportunities?
- How can I update my own basic profile/contact information without seeing internal admin data?

#### Phase 8.1: Scope Boundaries

Implement in Phase 8:

- `/portal/login`
- `/portal`
- `/portal/sponsorships`
- `/portal/sponsorships/[id]`
- `/portal/receipts`
- `/portal/receipts/upload`
- `/portal/contributions`
- `/portal/available-orphans`
- `/portal/profile`
- Donor Google login and donor profile linking.
- Donor portal route guards.
- Header profile switcher for users who have both admin/team and donor profiles.
- Donor dashboard with current month payment status.
- Current supported orphan list and detail views.
- Multi-orphan donor experience where one donor can support several active orphan sponsorships.
- Donor-safe orphan profile display.
- Monthly receipt upload between the 1st and 10th of each month.
- Bank account dropdown during receipt upload.
- Donor receipt history and status timeline.
- Contribution totals and simple charts based on submitted and verified/delivered receipts.
- Donor profile/contact update through project-owned API routes.
- Optional interest flow for available unmatched orphans.
- SWR caching with stale data shown during background revalidation.

Do not implement in Phase 8:

- Admin receipt verification queue. That is Phase 9.
- Finance reports. That is Phase 9 and Phase 10.
- Admin-side payment reconciliation. That is Phase 9.
- Automated WhatsApp/email reminders. Prepare hooks only.
- Donor self-matching to an orphan without admin approval.
- Direct donor access to sensitive orphan documents, guardian addresses, internal notes, other donors,
  or admin-only data.

Important product boundary:

- Donor receipt upload is donor-side Phase 8 work.
- Receipt verification and money-delivery confirmation are admin/finance Phase 9 work.
- Available unmatched orphan browsing should be donor-safe discovery only. Donors can express
  interest, but only admins or sponsorship managers can create matches.

#### Phase 8.2: Donor Portal Navigation

Recommended sidebar labels:

- `Dashboard`
- `My Sponsorships`
- `Receipts`
- `Contributions`
- `Available Orphans`
- `Profile`

Naming recommendation:

- Use `My Sponsorships` instead of `My Orphans` in the sidebar. It is warmer and more accurate
  because the relationship is a sponsorship, not ownership.
- Inside the page, use headings like "Children You Support" or "Supported Orphans" where helpful.
- Design every sponsorship list, receipt upload flow, and contribution view for one donor supporting
  multiple orphans. A donor with one orphan should see a simple experience; a donor with multiple
  orphans should see clear per-orphan monthly status, totals, and upload actions.

Header profile switcher:

- Show the current donor identity in the portal header.
- If the same Google account also has an active `team_members` profile, show a profile switcher.
- The switcher should include:
  - `Donor Portal`
  - `Admin Panel`
- Switching to `Admin Panel` routes the user to their allowed admin landing page.
- Switching back to `Donor Portal` routes the user to `/portal`.
- Do not show the switcher to donor-only users.
- The admin header should mirror this with a `Switch to Donor Portal` option when the same account
  has an active donor profile.

Mobile behavior:

- Sidebar collapses into a bottom or slide-out navigation.
- The current month payment status should remain easy to reach from the first screen.
- Receipt upload should be usable on phone browsers because donors may upload screenshots from
  mobile banking or WhatsApp.

#### Phase 8.3: Status Model

The donor portal needs a monthly payment status for each active sponsorship match.

Recommended donor-facing monthly statuses:

- `pending`
  - No receipt has been submitted for the current month.
  - Show from the 1st of the month until the donor uploads a receipt.

- `due_soon`
  - Derived UI status from the 1st through 10th when no receipt has been submitted.
  - Helps the dashboard explain that the upload window is open.

- `overdue`
  - Derived UI status after the 10th when no receipt has been submitted.
  - The donor can still upload if policy allows late uploads, but the receipt should be marked late.

- `submitted`
  - Donor uploaded a receipt.
  - Receipt is saved but may still be processing or awaiting review.

- `ready_for_review`
  - Receipt has enough required data and file upload succeeded.
  - Admin/finance can review it in Phase 9.

- `reviewed`
  - Admin/finance has checked the receipt.
  - This can be shown when the team wants a separate reviewed state before confirming money delivery.

- `verified`
  - Transfer proof is accepted by finance.
  - Counts toward verified contribution totals.

- `rejected`
  - Receipt was rejected and donor must upload a corrected receipt.
  - Show rejection reason if finance provided one.

- `money_delivered`
  - Finance/team confirms money was delivered or allocated to the orphan support workflow.
  - This is the strongest completion state for a month and can feed "delivered" contribution totals.

Recommended internal receipt statuses:

- `submitted`
- `ready_for_review`
- `reviewed`
- `verified`
- `rejected`
- `money_delivered`

Derived statuses should not necessarily be stored:

- `pending`, `due_soon`, and `overdue` can be calculated from the active match, current month, receipt
  existence, and the 1st-10th upload window.

Current month logic:

- Each active sponsorship match expects one receipt per month.
- A donor with multiple active matches must submit one receipt per orphan/sponsorship per month,
  unless the product later supports one combined transfer for multiple matches.
- If combined transfers are introduced later, the receipt model must explicitly support allocating one
  receipt amount across multiple `sponsorship_matches`. Do not infer allocation from a free-text note.
- The regular upload window is the 1st through 10th day of the month.
- If the donor submits after the 10th, allow upload only if the product policy allows late
  submission; default recommendation: allow late upload but mark `submitted_late = true`.
- Donor should not be able to upload duplicate receipts for the same match/month unless the previous
  receipt was rejected or the API explicitly supports replacing a pending receipt.

#### Phase 8.4: Database Changes

Update `supabase/schema.sql` with additive, safe changes. Avoid destructive migrations.

Add organization bank accounts:

- `organization_bank_accounts`
  - `id uuid primary key default gen_random_uuid()`
  - `account_label text not null`
  - `bank_name text not null`
  - `account_title text not null`
  - `account_number text`
  - `iban text`
  - `currency text not null default 'PKR'`
  - `country text`
  - `instructions text`
  - `sort_order integer not null default 0`
  - `active boolean not null default true`
  - `created_at timestamptz not null default now()`
  - `updated_at timestamptz not null default now()`

Bank account examples:

- Bank name.
- Account title.
- Account number or IBAN.
- Currency.
- Short donor-facing instructions, such as whether to include donor name or orphan code in the bank
  transfer note.

Update `donation_receipts` or create it if it does not exist yet:

- `id uuid primary key default gen_random_uuid()`
- `donor_id uuid not null references public.donors(id) on delete restrict`
- `sponsorship_match_id uuid not null references public.sponsorship_matches(id) on delete restrict`
- `organization_bank_account_id uuid references public.organization_bank_accounts(id) on delete set null`
- `amount numeric(12,2) not null`
- `currency text not null default 'PKR'`
- `donation_month date not null`
- `receipt_file_url text not null`
- `receipt_file_name text`
- `receipt_file_type text`
- `receipt_file_size integer`
- `transfer_reference text`
- `transfer_date date`
- `donor_note text`
- `status text not null default 'ready_for_review'`
- `submitted_late boolean not null default false`
- `submitted_at timestamptz not null default now()`
- `reviewed_by_team_member_id uuid references public.team_members(id) on delete set null`
- `reviewed_at timestamptz`
- `verified_by_team_member_id uuid references public.team_members(id) on delete set null`
- `verified_at timestamptz`
- `money_delivered_by_team_member_id uuid references public.team_members(id) on delete set null`
- `money_delivered_at timestamptz`
- `rejection_reason text`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`

Recommended `status` values:

- `submitted`
- `ready_for_review`
- `reviewed`
- `verified`
- `rejected`
- `money_delivered`

Add constraints:

- `donation_receipts_status_check`
- `donation_receipts_amount_positive_check`
- `donation_receipts_currency_check`
- `donation_receipts_month_check`

Add indexes:

- `organization_bank_accounts_active_sort_order_idx`
- `donation_receipts_donor_id_idx`
- `donation_receipts_sponsorship_match_id_idx`
- `donation_receipts_bank_account_id_idx`
- `donation_receipts_donation_month_idx`
- `donation_receipts_status_idx`
- `donation_receipts_submitted_at_idx`
- Unique active-month protection:
  - unique on `(sponsorship_match_id, donation_month)` for receipts whose status is not `rejected`.

Storage:

- Use the `donation-receipts` Supabase Storage bucket.
- Receipt files should not be public.
- Donor uploads should go through a signed upload URL or a server route that writes the file.
- Store receipts under a path that does not expose private meaning casually, for example:
  - `donors/{donor_id}/matches/{match_id}/{yyyy-mm}/{receipt_id}`

RLS:

- Enable RLS on `organization_bank_accounts` and `donation_receipts`.
- Donor portal should still use project-owned Next.js API routes first.
- Do not let donors query Supabase directly for receipt records in Phase 8.

#### Phase 8.5: Data Access And Types

Add TypeScript types:

- `DonorPortalSession`
- `DonorPortalProfile`
- `DonorPortalSponsorship`
- `DonorPortalOrphan`
- `DonorPortalReceipt`
- `DonorPortalReceiptStatus`
- `DonorMonthlyPaymentStatus`
- `OrganizationBankAccount`
- `ReceiptUploadInput`
- `ContributionSummary`
- `AvailableOrphanSummary`

Recommended donor portal sponsorship shape:

- `matchId`
- `orphanId`
- `orphanCode`
- `orphanName`
- `profileImageUrl`
- `age`
- `cityArea`
- `educationStatus`
- `backgroundSummary`
- `monthlyAmount`
- `currency`
- `startedAt`
- `matchStatus`
- `currentMonth`
- `currentMonthStatus`
- `currentMonthReceipt`
- `totalVerifiedContributed`
- `totalDeliveredContributed`
- `lastReceiptStatus`

Recommended receipt shape:

- `id`
- `matchId`
- `orphanCode`
- `orphanName`
- `amount`
- `currency`
- `donationMonth`
- `bankAccount`
- `transferReference`
- `transferDate`
- `status`
- `submittedLate`
- `submittedAt`
- `reviewedAt`
- `verifiedAt`
- `moneyDeliveredAt`
- `rejectionReason`

Add donor portal data helpers:

- `getCurrentDonorPortalSession()`
- `requireCurrentDonor()`
- `linkAuthUserToDonorIfNeeded(authUser)`
- `listPortalSponsorshipsForCurrentDonor(donorId)`
- `getPortalSponsorshipByMatchId(donorId, matchId)`
- `listPortalReceipts(donorId, options)`
- `getCurrentMonthReceiptStatus(donorId, matchId, month)`
- `listActiveOrganizationBankAccounts()`
- `createPortalReceiptUpload(donorId, input)`
- `getContributionSummaryForDonor(donorId)`
- `listAvailableOrphansForPortal(options)`
- `updateDonorPortalProfile(donorId, input)`

Data rules:

- All donor portal queries must filter by current `donor_id`.
- Never accept `donor_id` from the browser as the source of truth.
- Donor-safe orphan shapes must exclude internal notes, guardian private address, sensitive documents,
  team member metadata, and other donor information.
- Contribution totals should clearly distinguish submitted, verified, and delivered money.

#### Phase 8.6: API Routes

Add donor portal session routes:

- `GET /api/portal/session`
  - Returns current donor profile if authenticated and active.
  - If the same Google account also has an active team member profile, include `canSwitchToAdmin`.
  - Include the admin landing route or enough profile-switch metadata for the header switcher.
  - Links `donors.auth_user_id` on first donor login when email matches and is active.

- `DELETE /api/portal/session`
  - Signs out the current user.

Add donor portal data routes:

- `GET /api/portal/dashboard`
  - Returns summary cards, current month payment statuses, recent receipts, and contribution chart
    data.

- `GET /api/portal/sponsorships`
  - Returns active and optionally paused/ended sponsorship matches for the current donor.

- `GET /api/portal/sponsorships/[matchId]`
  - Returns one donor-safe sponsorship detail.
  - Must reject access if the match does not belong to the current donor.

- `GET /api/portal/receipts`
  - Returns receipt history for the current donor.
  - Supports filters:
    - `status`
    - `matchId`
    - `monthFrom`
    - `monthTo`

- `GET /api/portal/receipts/upload-options`
  - Returns active sponsorships that need or allow receipt upload.
  - Returns active organization bank accounts for the dropdown.
  - Returns current upload window state.

- `POST /api/portal/receipts`
  - Creates a donor receipt record and stores the receipt file.
  - Required fields:
    - sponsorship match id
    - donation month
    - amount
    - currency
    - organization bank account id
    - receipt file
  - Optional fields:
    - transfer reference
    - transfer date
    - donor note
  - Sets status to `ready_for_review` after successful validation and upload.
  - Sets `submitted_late = true` if submitted after the 10th of the donation month.
  - Rejects duplicate non-rejected receipt for the same sponsorship/month.

- `GET /api/portal/contributions`
  - Returns totals and chart data for the current donor.
  - Includes:
    - lifetime submitted
    - lifetime verified
    - lifetime delivered
    - this year verified/delivered
    - monthly series
    - per-orphan totals

- `GET /api/portal/available-orphans`
  - Returns donor-safe approved and currently unmatched orphan profiles if this feature is enabled.
  - Excludes archived, under-review, matched, and sensitive records.

- `POST /api/portal/available-orphans/[id]/interest`
  - Optional.
  - Lets donor express interest in supporting an available orphan.
  - Creates an internal sponsorship request/contact signal for admin follow-up.
  - Does not create a match automatically.

- `GET /api/portal/profile`
  - Returns current donor profile.

- `PATCH /api/portal/profile`
  - Lets donor update allowed profile fields:
    - full name
    - phone
    - city/country
    - preferred contact method
  - Email remains read-only once linked to Google.

Error behavior:

- `401` for unauthenticated.
- `403` for authenticated but inactive or not a donor.
- `404` when a match, receipt, or orphan does not exist or does not belong to the donor.
- `400` for validation errors.
- `409` for duplicate monthly receipt conflict.

#### Phase 8.7: Donor Login And Access Rules

Login flow:

1. Donor opens `/portal/login`.
2. Donor clicks "Continue with Google".
3. Supabase Auth verifies Google identity.
4. App checks whether the Google email exists in `donors`.
5. App checks `donors.active = true`.
6. App links `donors.auth_user_id` if empty.
7. Donor enters `/portal`.

Access rules:

- Random Google users cannot access the portal.
- Inactive donors cannot access the portal.
- Donor can see only their own profile, matches, receipts, and contribution stats.
- If the donor also has an active `team_members` profile, show a header profile switcher with access
  back to admin.
- Admin default-after-login behavior can remain admin-first, but `/portal/login` should still allow
  intentional donor portal entry for dual-profile users.

#### Phase 8.8: Dashboard UI

The dashboard should be useful in the first five seconds.

Top summary cards:

- Current Month Status
- Total Verified Contributed
- Total Delivered
- Active Sponsorships

Current month panel:

- Show one row/card per active sponsorship.
- Include orphan photo, orphan code, orphan name, monthly amount, and status.
- For donors supporting multiple orphans, show an aggregate status first and then a per-orphan list:
  - all submitted
  - some pending
  - overdue
  - rejected needs correction
- Show the upload window:
  - "Upload open: 1-10 July 2026" style copy using the actual month.
  - If after the 10th and no receipt exists, show overdue state.
- Primary action:
  - `Upload Receipt` when receipt is pending/due/overdue.
  - `View Receipt` when submitted or later.
  - `Upload Corrected Receipt` when rejected.

Contribution chart:

- Start with a simple monthly bar chart for the current year.
- Use verified or delivered receipts as the default metric.
- Allow a small toggle:
  - `Verified`
  - `Delivered`
  - `Submitted`

Recent activity:

- Recent receipt submissions.
- Verification/rejection/delivery status updates.
- New match started.
- Match paused/ended if relevant.

Empty dashboard states:

- Donor exists but has no active sponsorship yet.
- Donor has sponsorships but no receipts yet.
- Donor has only ended sponsorships.
- Donor is inactive or access was revoked.

#### Phase 8.9: My Sponsorships UI

`/portal/sponsorships` should show all orphan sponsorships connected to the donor.

Tabs:

- `Active`
- `Paused`
- `History`

Card/table fields:

- Orphan photo.
- Orphan code.
- Orphan name.
- Age.
- City/area.
- Monthly amount.
- Sponsorship start date.
- Current month receipt status.
- Last receipt status.

Detail page `/portal/sponsorships/[matchId]`:

- Donor-safe orphan profile.
- Sponsorship details:
  - monthly amount
  - currency
  - start date
  - current status
- Current month payment status.
- Receipt history for this orphan.
- Contribution total for this sponsorship.
- Profile PDF/card download if Phase 6 generated donor-safe PDFs.

Do not show:

- Guardian private address.
- Sensitive documents.
- Internal verification notes.
- Other donors.
- Admin-only match notes.

#### Phase 8.10: Receipt Upload UI

Receipt upload is the core monthly action.

Upload rules:

- Donor chooses the sponsorship/orphan.
- Donor chooses the donation month.
- Default month should be the current month.
- Donor enters amount.
- Donor selects the organization bank account they transferred to from a dropdown.
- Donor uploads receipt image or PDF.
- Donor can enter transfer reference and transfer date if available.
- Donor can add a short note.

Bank account dropdown:

- Show account label, bank name, account title, and masked/account details as appropriate.
- Only show active organization bank accounts.
- Preserve the selected bank account on the receipt record for finance verification.
- If only one bank account is active, preselect it but still show it.

Upload window behavior:

- From the 1st through the 10th:
  - Show normal upload state.
  - Encourage timely receipt submission.

- After the 10th:
  - Show late submission notice.
  - Default recommendation: allow upload, mark it late, and let admin/finance handle follow-up.

- Before the 1st for a future month:
  - Block future-month upload unless admins explicitly enable early receipt submission.

File rules:

- Accept common image formats and PDF.
- Enforce max file size.
- Show file preview/name before submit.
- Show upload progress.
- Keep failed upload form data where possible.

Post-submit behavior:

- Show success toast.
- Route to receipt detail or receipt history.
- Update current month dashboard status to `ready_for_review`.
- Revalidate dashboard, receipts, and sponsorships SWR keys.

#### Phase 8.11: Receipts UI

`/portal/receipts` should give donors a simple payment history.

Filters:

- Status.
- Sponsorship/orphan.
- Year.
- Month range.

Receipt list fields:

- Donation month.
- Orphan/sponsorship.
- Amount.
- Bank account transferred to.
- Status.
- Submitted date.
- Late badge if submitted after the 10th.

Receipt detail:

- Receipt file preview/download if allowed.
- Bank account selected.
- Transfer reference.
- Transfer date.
- Status timeline:
  - submitted
  - ready for review
  - reviewed
  - verified
  - money delivered
  - rejected, when applicable
- Rejection reason and corrected upload action if rejected.

#### Phase 8.12: Contributions UI

`/portal/contributions` should make the donor feel confident about their giving history.

Summary cards:

- Lifetime Submitted
- Lifetime Verified
- Lifetime Delivered
- This Year
- Current Month Expected

Charts:

- Monthly contribution bar chart for current year.
- Year-over-year compact chart when there is more than one year of data.
- Per-sponsored-orphan totals if the donor supports multiple orphans.

Table:

- Month.
- Expected amount.
- Submitted amount.
- Verified amount.
- Delivered amount.
- Status.

Calculation rules:

- Submitted totals include receipts in submitted/review states.
- Verified totals include `verified` and `money_delivered`.
- Delivered totals include only `money_delivered`.
- Rejected receipts do not count toward contribution totals.
- If a donor uploads a replacement after rejection, only the accepted/reviewable receipt should count.

#### Phase 8.13: Available Orphans UI

This is optional but useful if the organization wants donors to discover more sponsorship
opportunities.

Recommended route:

- `/portal/available-orphans`

Purpose:

- Show approved, field-verified, currently unmatched orphan profiles.
- Let existing donors express interest in sponsoring another orphan.
- Keep final matching controlled by admin/sponsorship manager.

Display fields:

- Orphan photo.
- Orphan code.
- First name or donor-safe display name, depending on privacy policy.
- Age.
- City/area.
- Education status.
- Short donor-safe background summary.
- Suggested monthly amount if policy supports it.

Actions:

- `Express Interest`
- `Request More Information`

Interest behavior:

- Creates an internal record or sponsorship request linked to the donor.
- Notifies or queues admin follow-up in a later notification phase.
- Does not reserve the orphan.
- Does not create a match.

Privacy:

- Do not show sensitive documents.
- Do not show guardian contact details.
- Do not show full private address.
- Do not show internal verification fields.

Feature flag recommendation:

- Make `Available Orphans` easy to hide if the team wants all matching to remain fully internal.

#### Phase 8.14: Donor Profile UI

`/portal/profile` should let donors maintain basic contact data.

Show:

- Full name.
- Email.
- Phone.
- City/country.
- Preferred contact method.
- Google login linked status.

Editable:

- Full name.
- Phone.
- City/country.
- Preferred contact method.

Read-only:

- Email after Google login is linked.
- Donor account status.
- Internal notes.

Optional later:

- Notification preferences.
- Preferred receipt reminders.
- WhatsApp opt-in.

#### Phase 8.15: Admin Preparation For Phase 9

Phase 8 should leave admin/finance work ready without building the full queue.

Add or prepare:

- Receipt statuses that Phase 9 can verify/reject/deliver.
- Bank account records that admins can later manage from settings.
- Audit event names for donor uploads.
- Notification event names for receipt submission and overdue states.

Recommended event names:

- `donor_portal.login_linked`
- `donation_receipt.submitted`
- `donation_receipt.submitted_late`
- `donation_receipt.replacement_submitted`
- `donor_available_orphan.interest_created`

Phase 9 can add:

- `donation_receipt.reviewed`
- `donation_receipt.verified`
- `donation_receipt.rejected`
- `donation_receipt.money_delivered`

#### Phase 8.16: SWR And Caching

Use SWR keys like:

- `/api/portal/session`
- `/api/portal/dashboard`
- `/api/portal/sponsorships`
- `/api/portal/sponsorships/${matchId}`
- `/api/portal/receipts?...filters`
- `/api/portal/receipts/upload-options`
- `/api/portal/contributions`
- `/api/portal/available-orphans?...filters`
- `/api/portal/profile`

Rules:

- Show skeletons only on first load when no cached data exists.
- Keep stale dashboard and receipt data visible during background revalidation.
- Revalidate dashboard, sponsorships, receipts, and contributions after receipt upload.
- Revalidate profile after profile update.
- Do not optimistically mark money as verified or delivered from donor-side actions.

#### Phase 8.17: Validation Rules

Receipt upload validation:

- Match id must belong to the current donor.
- Match must be active unless policy allows receipts for paused/recently ended matches.
- Donation month must be the current month or an allowed past month.
- Future months are blocked by default.
- Amount must be positive.
- Amount may be more than the expected monthly amount.
- Amount must not be less than the expected monthly amount unless an admin-approved exception is
  explicitly added later.
- Currency must match the match or selected bank account policy.
- Organization bank account id must be active.
- Receipt file is required.
- File type must be allowed.
- File size must be under the configured limit.
- Duplicate non-rejected receipt for the same match/month is blocked.

Profile update validation:

- Full name is required.
- Phone should be required if the organization relies on WhatsApp follow-up.
- Preferred contact method must be allowed.
- Email cannot be changed from the donor portal in Phase 8.

Available orphan interest validation:

- Orphan must be approved, field verified, and currently unmatched.
- Donor must be active.
- Duplicate open interest for the same donor/orphan should be blocked or merged.

#### Phase 8.18: Testing And Verification

Manual verification:

- Active donor can login with Google using the donor email.
- Random Google user cannot access `/portal`.
- Inactive donor cannot access `/portal`.
- Donor sees only their own sponsorships.
- Donor cannot open another donor's match or receipt by direct URL/API call.
- Donor with multiple active orphan sponsorships sees per-orphan monthly payment status.
- Dashboard shows current month status for each active sponsorship.
- The 1st-10th upload window displays correctly.
- After the 10th, missing receipt shows overdue and late upload is marked late if allowed.
- Donor with multiple active orphan sponsorships can upload a separate receipt for each
  sponsorship/month.
- Donor can select a bank account from active organization bank accounts.
- Donor can upload a receipt image/PDF for the current month.
- Duplicate receipt for the same sponsorship/month is blocked unless previous receipt was rejected.
- Rejected receipt allows corrected upload.
- Receipt history shows selected bank account and status timeline.
- Contribution totals exclude rejected receipts.
- Verified and delivered totals are clearly distinguished.
- Available Orphans page shows only approved, field-verified, unmatched donor-safe profiles.
- Express Interest does not create a match automatically.
- Donor profile update works for allowed fields.
- Dual-profile user sees the header profile switcher and can move between Admin Panel and Donor
  Portal.
- Mobile receipt upload is usable.
- SWR keeps stale portal data visible while revalidating.

Automated or code-level checks:

- Run `npm run type-check`.
- Run targeted Biome checks on touched files.
- Add route-handler tests later for donor scoping and receipt duplicate prevention.
- Add storage upload tests later if the project gets integration test coverage.

#### Phase 8.19: Acceptance Criteria

Phase 8 is complete when:

- `/portal/login` authenticates active donors through Google.
- Donor portal access is controlled by the `donors` table, not Google login alone.
- `/portal` shows a useful donor dashboard with current month payment status.
- `/portal/sponsorships` shows only the donor's own current and historical sponsorships.
- Donors with multiple active orphan sponsorships see clear per-orphan monthly statuses, receipt
  actions, and contribution totals.
- Donor-safe orphan detail pages are available for supported orphans.
- Donors can upload one monthly receipt per active sponsorship/month through a project-owned API
  route.
- Receipt upload requires selecting the organization bank account used for the transfer.
- Receipt uploads respect the 1st-10th monthly window and mark late submissions.
- Receipt history shows pending/review statuses and later Phase 9 verification/delivery statuses.
- Contribution totals and charts distinguish submitted, verified, and delivered amounts.
- `/portal/available-orphans` can show unmatched approved orphans safely if enabled.
- Donors can express interest in an available orphan without self-creating a match.
- Donor profile update works for allowed fields.
- Dual admin/donor accounts can switch profiles from the portal header, and the admin header exposes
  the matching switch back to the donor portal.
- Donors cannot access other donors, unmatched sensitive orphan data, internal notes, or admin APIs.
- No admin finance verification queue is required to complete Phase 8.
- Type-check and targeted lint checks pass.

### Phase 9: Finance Workflow

Goal: give the internal team a reliable finance operations area for reviewing donor-submitted
receipts, verifying transfers, rejecting incorrect submissions, confirming money delivery/allocation,
and seeing contribution health without exposing finance controls to the wrong roles.

Phase 9 consumes receipt uploads from Phase 8. It should not ask donors to write directly to
Supabase, and it should not make admin pages write directly from client components:

```txt
Admin Finance UI -> Next.js API route/server action -> Supabase Postgres/Storage
```

Phase 9 should answer ten practical questions:

- Which receipts are waiting for finance review?
- Which donor, orphan, match, month, amount, and bank account does each receipt belong to?
- Can finance inspect the uploaded receipt file safely?
- Is the submitted amount at least the expected monthly sponsorship amount?
- Was the receipt submitted late, duplicated, incomplete, under the expected amount, or against the
  wrong bank account?
- Should this receipt be verified, rejected, or marked reviewed but not verified yet?
- Has verified money been delivered or allocated according to the organization's internal process?
- Which donors or sponsored orphans are overdue for the current month?
- What contribution totals should the admin and donor portal show as submitted, verified, and
  delivered?
- Which roles can view finance data, and which roles can perform finance actions?

#### Phase 9.1: Scope Boundaries

Implement in Phase 9:

- `/admin/receipts`
- `/admin/receipts/[id]`
- `/admin/payments` or a clearly named finance overview route if useful.
- Admin-side receipt queue with filters, sorting, and detail review.
- Secure receipt file preview/download for allowed team roles.
- Receipt status transitions:
  - `ready_for_review` to `reviewed`
  - `ready_for_review` or `reviewed` to `verified`
  - `ready_for_review` or `reviewed` to `rejected`
  - `verified` to `money_delivered`
- Rejection reason capture and donor-visible rejection message.
- Finance notes that stay internal.
- Overdue monthly sponsorship view based on active matches with no accepted receipt for the month.
- Contribution summaries for admin finance use.
- Audit events for every finance decision.
- Role/page/action permissions for finance routes and APIs.

Do not implement in Phase 9:

- Full organization-wide report builder. That remains Phase 10.
- Public donor-facing redesign. Donor pages should only consume the new statuses.
- Automated WhatsApp/email reminders. Phase 9 can expose overdue data and event names for a later
  notification phase.
- Direct bank statement import or automatic bank reconciliation, unless explicitly approved later.
- Donor self-service verification, delivery confirmation, or finance notes.

Important product boundary:

- Donors submit evidence.
- Finance/Admin verifies evidence.
- Finance/Admin confirms money delivery or allocation.
- Donor portal can display finance outcomes, but donors cannot change them.

#### Phase 9.2: Role Visibility And Permissions

Phase 9 must explicitly define who can see finance pages and who can act.

Page visibility:

- `super_admin`
  - Can see `/admin/receipts`, `/admin/receipts/[id]`, `/admin/payments`, and finance summary cards.
  - Can perform every finance action.
- `admin`
  - Can see `/admin/receipts`, `/admin/receipts/[id]`, `/admin/payments`, and finance summary cards.
  - Can verify, reject, mark reviewed, mark money delivered, and export finance data unless policy
    later limits exports to `super_admin`.
- `finance_manager`
  - Primary owner of Phase 9.
  - Can see `/admin/receipts`, `/admin/receipts/[id]`, `/admin/payments`, and finance summary cards.
  - Can verify, reject, mark reviewed, mark money delivered, add finance notes, and view secure
    receipt files.
- `sponsorship_manager`
  - Can see receipt status summaries connected to donors and matches they manage.
  - Can view receipt detail in read-only mode if needed for donor follow-up.
  - Cannot verify, reject, mark money delivered, edit finance notes, or export finance data by
    default.
- `support_coordinator`
  - Can see limited receipt status for assigned requests/donors only when needed for follow-up.
  - Cannot access the full finance queue by default.
  - Cannot view sensitive finance notes unless explicitly allowed later.
  - Cannot verify, reject, mark money delivered, or export.
- `orphan_coordinator`
  - Should not see `/admin/receipts` or `/admin/payments` by default.
  - May see high-level sponsorship/payment status on orphan profiles later, but not finance files or
    review actions.
- `viewer`
  - Can see finance reports or receipt summaries only if the central permission map allows it.
  - Default recommendation: read-only access to summary/report views, no receipt file access, no
    finance queue actions, and no exports unless explicitly approved.
- Donors
  - Cannot access any `/admin/*` finance route unless the same Google account also has an active
    allowed `team_members` role.
  - Can only see their own receipt statuses and rejection reasons in the donor portal.

Action permissions:

- `canViewFinanceQueue`: `super_admin`, `admin`, `finance_manager`.
- `canViewReceiptDetail`: `super_admin`, `admin`, `finance_manager`; read-only for
  `sponsorship_manager` if product policy wants donor follow-up context.
- `canViewReceiptFile`: `super_admin`, `admin`, `finance_manager`; optional read-only for
  `sponsorship_manager`; false for `viewer` by default.
- `canMarkReceiptReviewed`: `super_admin`, `admin`, `finance_manager`.
- `canVerifyReceipt`: `super_admin`, `admin`, `finance_manager`.
- `canRejectReceipt`: `super_admin`, `admin`, `finance_manager`.
- `canMarkMoneyDelivered`: `super_admin`, `admin`, `finance_manager`.
- `canBulkMarkMoneyDelivered`: `super_admin`, `admin`, `finance_manager`.
- `canEditFinanceNotes`: `super_admin`, `admin`, `finance_manager`.
- `canExportFinanceData`: default `super_admin`, `admin`, `finance_manager`; make this easy to
  tighten to `super_admin` only.

Navigation rules:

- Add `Receipts` to the admin sidebar only for roles with `canViewFinanceQueue`.
- Add `Payments` or `Finance` only for roles that can view finance summaries.
- If read-only receipt context is exposed to `sponsorship_manager`, link it from donor/match detail
  pages rather than showing the full finance queue in the sidebar.
- `finance_manager` should land on `/admin/receipts` after login once Phase 9 exists.

#### Phase 9.3: Finance Status Model

Use the receipt statuses introduced in Phase 8:

- `submitted`
- `ready_for_review`
- `reviewed`
- `verified`
- `rejected`
- `money_delivered`

Recommended queue interpretation:

- `submitted`
  - File/metadata exists but may still need processing or validation.
  - If Phase 8 already normalizes successful uploads to `ready_for_review`, this can remain a rare
    transitional state.
- `ready_for_review`
  - Primary finance inbox state.
  - Receipt is complete enough for a finance decision.
- `reviewed`
  - Finance looked at it, but verification is intentionally deferred.
  - Useful when the receipt appears plausible but bank confirmation is pending.
- `verified`
  - Finance accepts the receipt as valid transfer proof.
  - Counts toward verified contribution totals.
- `rejected`
  - Finance rejects the receipt and supplies a donor-visible reason.
  - Does not count toward contribution totals.
  - Allows donor to upload a corrected replacement for the same match/month.
- `money_delivered`
  - Verified money has been delivered, allocated, or otherwise completed according to internal
    orphan-support process.
  - Counts toward delivered contribution totals.

Allowed transitions:

- `submitted` -> `ready_for_review`
- `ready_for_review` -> `reviewed`
- `ready_for_review` -> `verified`
- `ready_for_review` -> `rejected`
- `reviewed` -> `verified`
- `reviewed` -> `rejected`
- `verified` -> `money_delivered`

Blocked transitions by default:

- `rejected` -> `verified`
- `rejected` -> `money_delivered`
- `money_delivered` -> any earlier state
- Any transition that changes `donor_id`, `sponsorship_match_id`, or `donation_month` after review.

Correction rule:

- A rejected receipt should stay in history.
- Donor correction should create a new receipt record for the same match/month or explicitly mark a
  replacement relationship if that field exists.
- Contribution totals should count only the accepted reviewable receipt, never the rejected one.

#### Phase 9.4: Database And Schema Additions

Phase 8 already defines the main `donation_receipts` fields. Phase 9 should verify those fields exist
and add any missing finance-only fields additively.

Recommended additions if not already present:

- `finance_notes text`
- `reviewed_by_team_member_id uuid references public.team_members(id) on delete set null`
- `reviewed_at timestamptz`
- `verified_by_team_member_id uuid references public.team_members(id) on delete set null`
- `verified_at timestamptz`
- `money_delivered_by_team_member_id uuid references public.team_members(id) on delete set null`
- `money_delivered_at timestamptz`
- `rejection_reason text`
- `status_changed_at timestamptz`
- `replacement_for_receipt_id uuid references public.donation_receipts(id) on delete set null`

Optional later fields:

- `bank_statement_reference text`
- `amount_variance numeric(12,2)`
- `expected_amount_at_submission numeric(12,2)`
- `delivery_batch_id uuid`

Constraints:

- Require `rejection_reason` when `status = 'rejected'`.
- Require `verified_at` and `verified_by_team_member_id` when `status in ('verified',
  'money_delivered')`.
- Require `money_delivered_at` and `money_delivered_by_team_member_id` when
  `status = 'money_delivered'`.
- Keep amount positive.
- Require receipt amount to be greater than or equal to the expected monthly amount unless a later
  exception workflow is explicitly approved.
- Keep status within the allowed list.

Indexes:

- `donation_receipts_status_submitted_at_idx`
- `donation_receipts_status_changed_at_idx`
- `donation_receipts_verified_at_idx`
- `donation_receipts_money_delivered_at_idx`
- `donation_receipts_donor_month_idx`
- `donation_receipts_match_month_idx`

Monthly contribution storage:

- Start with calculated stats from `donation_receipts`.
- Do not create or maintain `monthly_contributions` unless queries become slow or reporting needs a
  frozen ledger.
- If `monthly_contributions` is introduced later, it must be written only by server-side finance
  actions and tied to a source receipt.

#### Phase 9.5: Data Access And Types

Add admin finance TypeScript types:

- `AdminReceiptListItem`
- `AdminReceiptDetail`
- `AdminReceiptStatus`
- `AdminReceiptQueueFilters`
- `AdminReceiptDecisionInput`
- `AdminReceiptRejectionInput`
- `AdminReceiptDeliveryInput`
- `AdminFinanceSummary`
- `AdminOverdueSponsorship`
- `ReceiptStatusTransition`

Receipt list item should include:

- Receipt id.
- Donor id and donor display name.
- Donor email/phone if role can see contact data.
- Match id.
- Orphan id, orphan code, and donor-safe orphan name/display label.
- Donation month.
- Amount and currency.
- Expected monthly amount.
- Amount variance, where positive variance is allowed extra giving and negative variance is a review
  problem.
- Bank account label.
- Transfer reference.
- Transfer date.
- Status.
- Submitted-late flag.
- Submitted date.
- Reviewed/verified/delivered timestamps.

Receipt detail should additionally include:

- Secure file preview/download URL or signed access route.
- Receipt file metadata.
- Donor note.
- Finance notes.
- Rejection reason.
- Status timeline.
- Previous/replacement receipt relationship when applicable.
- Audit/event history if available.

Add data helpers:

- `listAdminReceipts(actor, filters)`
- `getAdminReceiptDetail(actor, receiptId)`
- `getReceiptFileAccess(actor, receiptId)`
- `markReceiptReviewed(actor, receiptId, input)`
- `verifyReceipt(actor, receiptId, input)`
- `rejectReceipt(actor, receiptId, input)`
- `markReceiptMoneyDelivered(actor, receiptId, input)`
- `bulkMarkReceiptsMoneyDelivered(actor, input)`
- `listOverdueSponsorships(actor, options)`
- `getAdminFinanceSummary(actor, options)`
- `calculateContributionTotals(scope)`

Data rules:

- Never trust `team_member_id` from the browser; derive the actor from the admin session.
- Never expose receipt files through public bucket URLs.
- Filter or redact contact and finance note fields based on role.
- Keep donor-visible rejection reasons separate from internal finance notes.
- All status mutations must happen inside server code and validate allowed transitions.

#### Phase 9.6: API Routes

Add admin finance routes:

- `GET /api/admin/receipts`
  - Lists receipt queue items.
  - Requires `canViewFinanceQueue`.
  - Supports filters:
    - `status`
    - `donorId`
    - `matchId`
    - `orphanId`
    - `monthFrom`
    - `monthTo`
    - `submittedLate`
    - `bankAccountId`
    - `q`
  - Supports sorting:
    - newest submitted
    - oldest pending
    - donation month
    - amount
    - status

- `GET /api/admin/receipts/[id]`
  - Returns one receipt detail.
  - Requires `canViewReceiptDetail`.
  - Redacts finance notes and file access if role policy requires it.

- `GET /api/admin/receipts/[id]/file`
  - Returns a signed URL or streams the receipt file.
  - Requires `canViewReceiptFile`.
  - Should not leak storage paths to roles that cannot access files.

- `PATCH /api/admin/receipts/[id]/review`
  - Marks `ready_for_review` as `reviewed`.
  - Requires `canMarkReceiptReviewed`.
  - Optional internal finance note.

- `PATCH /api/admin/receipts/[id]/verify`
  - Marks `ready_for_review` or `reviewed` as `verified`.
  - Requires `canVerifyReceipt`.
  - Stores verifier id and timestamp.
  - Optional internal finance note.

- `PATCH /api/admin/receipts/[id]/reject`
  - Marks `ready_for_review` or `reviewed` as `rejected`.
  - Requires `canRejectReceipt`.
  - Requires donor-visible rejection reason.
  - Optional internal finance note.

- `PATCH /api/admin/receipts/[id]/money-delivered`
  - Marks `verified` as `money_delivered`.
  - Requires `canMarkMoneyDelivered`.
  - Stores actor id and timestamp.
  - Optional delivery note/reference.

- `PATCH /api/admin/receipts/bulk-money-delivered`
  - Marks many `verified` receipts as `money_delivered`.
  - Requires `canBulkMarkMoneyDelivered`.
  - Supports two selection modes:
    - explicit receipt ids
    - current filtered verified queue, with `excludeReceiptIds`
  - This enables "mark all delivered" and "mark all delivered except these 2 or 3" workflows.
  - Must only update receipts that are still `verified` at the time of the request.
  - Stores actor id, timestamp, optional delivery note/reference, and optional delivery batch id.
  - Returns counts:
    - selected
    - updated
    - skipped because not verified
    - skipped because forbidden/not found

- `GET /api/admin/finance/summary`
  - Returns finance overview totals for allowed roles.
  - Include submitted, ready for review, verified, rejected, delivered, overdue, and current month
    expected totals.

- `GET /api/admin/finance/overdue`
  - Lists active sponsorship matches with no non-rejected receipt for the selected month after the
    due window.
  - Requires a finance or admin summary permission.

Error behavior:

- `401` for unauthenticated.
- `403` for authenticated but forbidden.
- `404` when a receipt/file does not exist or must not be revealed.
- `400` for validation errors.
- `409` for invalid status transition or stale update conflict.

#### Phase 9.7: Receipts Queue UI

`/admin/receipts` is the main Phase 9 working page.

Recommended tabs:

- `Needs Review`
- `Reviewed`
- `Verified`
- `Rejected`
- `Delivered`
- `All`

Recommended filters:

- Status.
- Donation month.
- Donor.
- Orphan/match.
- Bank account.
- Submitted late.
- Amount variance.
- Underpaid-only filter.
- Search by donor name, donor email, orphan code, transfer reference.

List/table columns:

- Submitted date.
- Donation month.
- Donor.
- Orphan code/name.
- Amount.
- Expected amount.
- Bank account.
- Status.
- Late badge.
- Review age.
- Primary action.

Queue behavior:

- Default to `Needs Review`, oldest pending first.
- Show count badges per tab.
- Highlight late submissions and underpaid receipts.
- Keep row actions role-aware.
- Use read-only states for roles that can view but cannot decide.
- Keep stale queue data visible during SWR revalidation.

Bulk actions:

- Do not add bulk verify/reject in the first Phase 9 implementation.
- Add bulk money-delivered because delivery/allocation often happens as a batch after receipts are
  already verified.
- Bulk money-delivered options:
  - Select individual verified receipts and choose `Mark Selected Delivered`.
  - From the `Verified` tab, choose `Mark All Filtered Delivered`.
  - From the confirmation modal, exclude selected receipts before confirming, supporting "mark all
    delivered except these 2 or 3".
- Bulk money-delivered must show a confirmation summary:
  - donation month/filter scope
  - number of receipts selected
  - total amount selected
  - excluded receipts
  - delivery date
  - optional delivery reference/note
- Bulk money-delivered must not update receipts in `ready_for_review`, `reviewed`, `rejected`, or
  `money_delivered` status.
- Bulk export can be considered if explicitly needed, but it must obey `canExportFinanceData`.
- If a delivery batch table does not exist yet, store the same delivery reference/note on every
  updated receipt. If delivery batches are added later, link the updated receipts to a batch id.

#### Phase 9.8: Receipt Detail And Review UI

`/admin/receipts/[id]` should support careful single-receipt review.

Layout:

- Receipt file preview/download area.
- Decision panel.
- Donor and sponsorship summary.
- Transfer metadata.
- Expected vs submitted amount comparison, with extra amount shown as acceptable additional giving.
- Status timeline.
- Internal finance notes.
- Rejection/correction history.

Decision actions:

- `Mark Reviewed`
- `Verify Receipt`
- `Reject Receipt`
- `Mark Money Delivered`
- `Mark All Filtered Delivered` from the verified queue when the actor has bulk delivery permission.

Action requirements:

- `Reject Receipt` opens a confirmation form with required donor-visible reason.
- `Verify Receipt` is allowed when submitted amount is equal to or greater than the expected amount.
- `Verify Receipt` blocks or requires an explicit exception when submitted amount is less than the
  expected amount.
- `Mark Money Delivered` is only enabled after verification.
- Bulk `Mark All Filtered Delivered` is only available in a verified-only scope and must allow
  excluding specific receipts before confirmation.
- All actions write actor id and timestamp.
- After mutation, revalidate receipt detail, queue list, finance summary, donor portal receipt data,
  and contribution totals.

Do not show to unauthorized roles:

- Receipt file access.
- Finance notes.
- Decision buttons.
- Export/download controls.

#### Phase 9.9: Finance Overview And Overdue Work

The finance overview can be a section on `/admin/receipts` or a separate `/admin/payments` page.

Summary cards:

- Ready For Review
- Reviewed Awaiting Verification
- Verified This Month
- Delivered This Month
- Rejected This Month
- Overdue Sponsorships
- Expected Current Month Total
- Verified Current Month Total
- Delivered Current Month Total

Overdue view:

- Select month, default current month.
- List active sponsorship matches with no non-rejected receipt for that month.
- Show donor, contact preference, orphan code, monthly amount, due age, and last receipt status.
- Allow allowed roles to open donor/match detail for follow-up context.
- Do not send reminders automatically in Phase 9.

Contribution totals:

- Submitted total includes `submitted`, `ready_for_review`, and `reviewed` if the organization wants
  operational visibility.
- Verified total includes `verified` and `money_delivered`.
- Delivered total includes only `money_delivered`.
- Rejected total can be shown as a separate operational metric but must not count as contributed.

#### Phase 9.10: Donor Portal Status Updates

Phase 9 should make donor portal statuses feel trustworthy without adding donor finance controls.

After finance actions:

- Rejected receipts show donor-visible rejection reason and correction action.
- Verified receipts count toward donor verified totals.
- Money-delivered receipts count toward donor delivered totals.
- Reviewed receipts can show "Reviewed, awaiting confirmation" if the donor portal keeps the
  reviewed state visible.

Donor portal must not show:

- Internal finance notes.
- Team member names unless policy approves it.
- Audit metadata.
- Other donors' payment status.
- Receipt files belonging to anyone else.

#### Phase 9.11: Audit And Event Names

Every finance mutation should create an audit log entry when the audit table/helper exists. If full
audit UI remains Phase 10, Phase 9 should still centralize event names and call the audit helper where
available.

Recommended audit event names:

- `donation_receipt.reviewed`
- `donation_receipt.verified`
- `donation_receipt.rejected`
- `donation_receipt.money_delivered`
- `donation_receipt.bulk_money_delivered`
- `donation_receipt.finance_note_updated`
- `donation_receipt.file_viewed`
- `finance.overdue_viewed`
- `finance.summary_viewed`

Audit metadata should include:

- Receipt id.
- Donor id.
- Sponsorship match id.
- Donation month.
- Previous status.
- New status.
- Actor team member id.
- Reason or note presence, not necessarily full sensitive note text.

#### Phase 9.12: Validation Rules

Status mutation validation:

- Actor must have the required action permission.
- Receipt must exist.
- Receipt must be in an allowed previous status for the requested transition.
- Reject requires a donor-visible reason.
- Verify requires amount and currency sanity checks, including blocking underpayment by default while
  allowing overpayment.
- Money delivered requires current status `verified`.
- Bulk money delivered requires every updated receipt to be `verified`; receipts that changed status
  between selection and submit should be skipped and reported back to the user.
- Bulk money delivered by filter must re-run the filter server-side and then apply
  `excludeReceiptIds`; the browser's visible row list is not trusted as the source of truth.
- Actor id, timestamp, and status_changed_at are server-derived.
- Finance notes should have a length limit.

Receipt file validation:

- File access requires role permission.
- Signed URLs should be short-lived.
- Storage path should be derived server-side from the receipt record.
- Missing file should show a review-blocking state instead of crashing the page.

Overdue validation:

- Only active matches are considered expected by default.
- Paused or ended matches are excluded unless policy says otherwise.
- A rejected receipt does not satisfy the month.
- A `submitted`, `ready_for_review`, `reviewed`, `verified`, or `money_delivered` receipt satisfies
  "has submitted", but only `verified` or `money_delivered` satisfies verified/delivered totals.

#### Phase 9.13: Testing And Verification

Manual verification:

- `finance_manager` can see `Receipts` in the sidebar and lands on `/admin/receipts`.
- `finance_manager` can open receipt detail, preview the file, mark reviewed, verify, reject, and
  mark money delivered through allowed transitions.
- `admin` and `super_admin` can perform the same finance actions.
- `sponsorship_manager` cannot see the full finance queue unless read-only access is explicitly
  enabled.
- `support_coordinator`, `orphan_coordinator`, and unauthorized roles cannot access
  `/admin/receipts` by direct URL.
- `viewer` gets read-only summary access only if the permission map allows it.
- Direct API calls for blocked roles return `403`.
- Invalid status transitions return `409`.
- Reject without a reason returns `400`.
- Bulk mark delivered can mark all verified receipts in a filtered set as delivered.
- Bulk mark delivered can exclude two or three selected receipts from the batch.
- Bulk mark delivered skips receipts that are no longer `verified` and reports skipped counts.
- Rejected receipts allow donor correction in the portal.
- Verified receipts update donor verified totals.
- Money-delivered receipts update donor delivered totals.
- Rejected receipts do not count toward contribution totals.
- Overdue list excludes paused/ended matches and includes active matches missing current-month
  receipts after the due window.
- Receipt file URLs are not public and expire when signed URLs are used.
- Queue filters, search, tabs, and stale-data revalidation work on desktop and mobile.

Automated or code-level checks:

- Unit-test receipt status transition helper if a test setup exists.
- Unit-test contribution total calculation helper if a test setup exists.
- Add route-handler tests later for finance permissions and invalid transitions.
- Run `npm run type-check`.
- Run targeted Biome checks on touched files.
- Run any existing E2E checkpoint scripts that cover admin role visibility.

#### Phase 9.14: Acceptance Criteria

Phase 9 is complete when:

- `/admin/receipts` exists and shows a useful receipt review queue for allowed roles.
- `/admin/receipts/[id]` supports secure single-receipt review.
- `finance_manager`, `admin`, and `super_admin` can review, verify, reject, and mark money delivered.
- Allowed finance roles can mark all filtered verified receipts as delivered, including "all except
  these selected receipts."
- Unauthorized roles cannot access finance pages or mutate receipts through direct API calls.
- Receipt files are available only through secure server-controlled access for allowed roles.
- Rejection requires a donor-visible reason and enables donor correction.
- Verified receipts feed verified contribution totals.
- Money-delivered receipts feed delivered contribution totals.
- Rejected receipts are excluded from contribution totals.
- Overdue sponsorship data is available for finance follow-up.
- Finance summary data is available without becoming the full Phase 10 report builder.
- Donor portal receipt statuses update correctly after finance decisions.
- Audit event names and helper calls exist for finance decisions where the audit foundation exists.
- Type-check and targeted lint checks pass.

### Phase 10: Reports And Audit Logs

- Add admin reports.
- Add donor contribution charts.
- Add audit logs for sensitive actions.
- Add export capability if needed.

### Phase 11: Multi-Initiative Navigation And Architecture

Phase 11 should prepare the admin and donor portals for multiple Bait ul Aqba initiatives without
turning the sidebar into one long mixed menu.

Recommended direction:

- Add an initiative switcher in the admin header, for example `Initiative: Orphan Sponsorship`.
- Make the admin sidebar contextual to the selected initiative.
- Keep truly global admin pages separate and stable.
- Give each initiative its own dashboard and workflow pages.
- Keep donor portal initiative navigation simpler than admin navigation.

Do not keep adding every future initiative page directly into one global sidebar. That pattern will
become crowded and hard to scan as initiatives grow.

Suggested admin structure:

- Global admin pages:
  - Dashboard
  - Donors
  - Team Members
  - Roles & Access
  - Settings
- Orphan Sponsorship initiative:
  - Sponsorship Requests
  - Orphan Profiles
  - Matches
  - Receipts
  - Reports
- Mosques & Schools initiative:
  - Projects
  - Locations
  - Donations
  - Progress Updates
  - Reports
- Relief or Food initiative:
  - Campaigns
  - Beneficiaries
  - Distributions
  - Donations
  - Reports

Suggested URL pattern:

- `/admin/orphan-sponsorship/requests`
- `/admin/orphan-sponsorship/orphans`
- `/admin/orphan-sponsorship/matches`
- `/admin/mosques-schools/projects`
- `/admin/mosques-schools/donations`
- `/admin/relief/campaigns`
- `/admin/relief/distributions`

Donor portal direction:

- Use a simpler initiative selector or tabs such as `My Sponsorships`, `Mosques & Schools`, and
  `Relief`.
- Show donor-facing pages only for initiatives where the donor has activity or where public donor
  participation is enabled.
- Avoid exposing admin-style operational navigation to donors.

Acceptance criteria:

- Admin users can switch initiatives from the header.
- Sidebar links change based on the selected initiative and the user's role permissions.
- Global admin pages remain available without being duplicated inside every initiative.
- Initiative-specific URLs are predictable and can be preserved through future backend migration.
- Donor navigation stays lightweight and focused on the donor's own giving history, receipts, and
  initiative-specific participation.

## Recommended Next Step

Before coding donor, orphan, matching, or finance pages, implement Phase 3:

1. Centralize admin page/action permissions.
2. Render sidebar/navigation from role permissions.
3. Protect existing admin pages through shared server guards.
4. Protect existing admin API routes through shared permission helpers.
5. Add branded forbidden/no-access states.

This gives the system a proper authorization foundation before adding orphan, donor, matching, and
finance workflows.

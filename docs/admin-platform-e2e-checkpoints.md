# Admin Platform E2E Checkpoints

This file tracks the full browser/API verification pass for the implemented admin platform.

## Test Data Prefix

Use a unique run id for every test pass:

```txt
E2E-YYYYMMDD-HHMMSS
```

All temporary Supabase Auth users, team members, donors, orphans, sponsorship requests, contact logs,
and matches created by the test harness should include that run id in names, notes, or emails so they
can be inspected and cleaned up safely.

## Checkpoint 0: Harness And Seed Data

Pass criteria:

- Dev server starts locally.
- Browser automation can open the app.
- Supabase connection works using the configured test database.
- Test Auth users exist for every internal role.
- Matching `team_members` rows exist and are active.
- Browser sessions can be established for each role without manual Google OAuth.
- Baseline fixture data exists for requests, donors, orphans, and matches.

Roles:

- `super_admin`
- `admin`
- `sponsorship_manager`
- `orphan_coordinator`
- `finance_manager`
- `support_coordinator`
- `viewer`

## Checkpoint 1: Auth Foundation And Team Members

Pass criteria:

- Unauthenticated users redirect from protected admin routes to `/admin/login`.
- Active team members can access allowed admin pages.
- Unknown and inactive users are denied.
- `/api/admin/session` returns the correct user and role.
- Logout clears the admin session.
- Sidebar visibility matches the permission model.
- `/admin/team`, `/admin/team/new`, `/admin/team/[id]`, and `/admin/team/roles` are correctly
  allowed or denied by role.
- Team-member create, edit, role change, and activate/deactivate controls obey role rules.
- API routes enforce the same rules as the UI.

## Checkpoint 2: Sponsorship Requests

Pass criteria:

- Request dashboard loads for every role allowed to view it.
- Search and filters work.
- New request drawer works for allowed roles.
- Status, assignment, follow-up date, admin notes, and contact logs save correctly.
- Every request dropdown value can be selected.
- Conversion to donor works and prevents duplicate donor creation.
- Support coordinator sees only assigned requests.
- Viewer/read-only roles cannot mutate records.
- API routes enforce the same rules as the UI.

## Checkpoint 3: Donors

Pass criteria:

- Donor directory loads for allowed roles.
- Search, filters, and KPI counts behave.
- New donor form validates required fields and creates a donor.
- Donor detail page can edit allowed fields.
- Preferred contact/source/status dropdown values work.
- Active/inactive controls work for allowed roles.
- Linked-auth donor email locking is respected.
- Donor contact logs can be created and viewed.
- Read-only or blocked roles cannot mutate records.
- API routes enforce the same rules as the UI.

## Checkpoint 4: Orphan Profiles

Pass criteria:

- Orphan directory loads for allowed roles.
- Search and filters work.
- New orphan form validates required fields and creates draft profiles.
- Orphan code behavior works.
- Detail page can edit allowed profile and guardian fields.
- Profile image/document upload controls behave as implemented.
- Submit for review, approve, archive, and restore/status actions obey role rules.
- Profile PDF generation works for allowed roles.
- Read-only or blocked roles cannot mutate records.
- API routes enforce the same rules as the UI.

## Checkpoint 5: Matches

Pass criteria:

- Match directory loads for allowed roles.
- Search, creator/status/date filters work.
- New match drawer loads matchable donors and orphans.
- Eligible donor + approved field-verified orphan can be matched.
- Invalid eligibility cases are rejected server-side.
- Pause, resume, end, and void actions work where allowed.
- Invalid status transitions are blocked.
- Orphan status updates correctly after create/end/void.
- Donor and orphan detail pages show match history where implemented.
- API routes enforce the same rules as the UI.

## Checkpoint 6: Custom Dropdown Regression

Pass criteria:

- No native `<select>` elements remain in `src`.
- Every custom dropdown opens, closes on outside click, and closes on Escape.
- Every option can be selected.
- Disabled dropdowns do not open.
- Menus are not clipped in drawers, tables, mobile layouts, or filter bars.
- Dropdowns work in sponsorship requests, donors, orphan profiles, matches, and team-member pages.

## Final Report

Include:

- Run id.
- Test accounts created.
- Records created.
- Checkpoint status table.
- Bugs found with page/action/role.
- Console/runtime errors.
- API permission failures.
- Commands run.
- Cleanup status.

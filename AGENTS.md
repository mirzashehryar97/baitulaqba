# Project Rules

## Backend Persistence Pattern

For user-submitted data, keep the frontend decoupled from the storage provider.

- Submit forms to project-owned Next.js API routes or server actions first.
- Let those server-side handlers write to Supabase Postgres while Supabase is the current backend.
- Do not wire client components directly to Supabase for core business workflows unless explicitly requested.
- Keep table and payload shapes portable so the backend can later move to Django + Postgres with minimal frontend changes.
- Prefer endpoint names that can be preserved later, for example `/api/sponsorship-requests`.

Current intended path:

```txt
Next.js UI -> Next.js API route/server action -> Supabase Postgres
```

Future migration path:

```txt
Next.js UI -> Django API -> Postgres
```

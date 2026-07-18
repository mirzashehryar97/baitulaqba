create extension if not exists "pgcrypto";

create table if not exists public.team_members (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid unique references auth.users(id) on delete set null,
  full_name text not null,
  email text not null unique,
  phone text,
  role text not null
    check (role in ('super_admin', 'admin', 'sponsorship_manager', 'orphan_coordinator', 'finance_manager', 'support_coordinator', 'viewer', 'custom')),
  active boolean not null default true,
  notes text,
  created_by_team_member_id uuid references public.team_members(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.team_members
  add column if not exists notes text;

alter table public.team_members
  drop constraint if exists team_members_role_check;

alter table public.team_members
  add constraint team_members_role_check
  check (role in ('super_admin', 'admin', 'sponsorship_manager', 'orphan_coordinator', 'finance_manager', 'support_coordinator', 'viewer', 'custom'));

create index if not exists team_members_role_idx
  on public.team_members (role);

create index if not exists team_members_active_idx
  on public.team_members (active);

-- Editable permission overrides. Access levels are 'none' | 'view' | 'full'. The application
-- layer owns the canonical feature list (src/lib/permissionFeatures.ts); these tables only
-- persist the deltas a super admin applies on top of the built-in role defaults.
create table if not exists public.role_permissions (
  id uuid primary key default gen_random_uuid(),
  role text not null
    check (role in ('super_admin', 'admin', 'sponsorship_manager', 'orphan_coordinator', 'finance_manager', 'support_coordinator', 'viewer')),
  feature_key text not null,
  access_level text not null
    check (access_level in ('none', 'view', 'full')),
  updated_by_team_member_id uuid references public.team_members(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (role, feature_key)
);

create index if not exists role_permissions_role_idx
  on public.role_permissions (role);

create table if not exists public.team_member_permissions (
  id uuid primary key default gen_random_uuid(),
  team_member_id uuid not null references public.team_members(id) on delete cascade,
  feature_key text not null,
  access_level text not null
    check (access_level in ('none', 'view', 'full')),
  updated_by_team_member_id uuid references public.team_members(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (team_member_id, feature_key)
);

create index if not exists team_member_permissions_team_member_id_idx
  on public.team_member_permissions (team_member_id);

alter table public.role_permissions enable row level security;
alter table public.team_member_permissions enable row level security;

-- A Google Auth user may also exist in public.donors.
-- If both profiles are active, the app defaults them to the admin panel and shows a donor switch.
insert into public.team_members (full_name, email, role, active)
values ('Mirza Shehryar', lower('mirzashehryar97@gmail.com'), 'super_admin', true)
on conflict (email) do update set
  full_name = excluded.full_name,
  role = 'super_admin',
  active = true,
  updated_at = now();

create table if not exists public.donors (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid unique references auth.users(id) on delete set null,
  full_name text not null,
  email text not null unique,
  phone text,
  city_country text,
  preferred_contact_method text not null default 'whatsapp'
    check (preferred_contact_method in ('whatsapp', 'phone', 'email')),
  donor_source text not null default 'admin_created'
    check (donor_source in ('converted_request', 'admin_created', 'whatsapp', 'phone', 'email', 'referral', 'other')),
  active boolean not null default true,
  notes text,
  created_by_team_member_id uuid references public.team_members(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.donors
  add column if not exists preferred_contact_method text not null default 'whatsapp';

alter table public.donors
  add column if not exists donor_source text not null default 'admin_created';

alter table public.donors
  drop constraint if exists donors_preferred_contact_method_check;

alter table public.donors
  add constraint donors_preferred_contact_method_check
  check (preferred_contact_method in ('whatsapp', 'phone', 'email'));

alter table public.donors
  drop constraint if exists donors_donor_source_check;

alter table public.donors
  add constraint donors_donor_source_check
  check (donor_source in ('converted_request', 'admin_created', 'whatsapp', 'phone', 'email', 'referral', 'other'));

-- Donor phone and address are printed on the sponsorship match certificate and are required.
alter table public.donors
  add column if not exists address text;

update public.donors
  set phone = 'Not provided'
  where phone is null or length(trim(phone)) = 0;

update public.donors
  set address = coalesce(nullif(trim(city_country), ''), 'Not provided')
  where address is null or length(trim(address)) = 0;

alter table public.donors
  alter column phone set not null;

alter table public.donors
  alter column address set not null;

-- Donor email is optional: admins can create donor profiles without an email
-- (those donors simply can't sign in to the donor portal, which is Google-login only).
-- The public sponsorship form still requires an email. The unique index on email
-- permits multiple NULLs, so many email-less donors can coexist.
alter table public.donors
  alter column email drop not null;

create index if not exists donors_active_idx
  on public.donors (active);

create index if not exists donors_created_at_idx
  on public.donors (created_at desc);

create index if not exists donors_created_by_team_member_id_idx
  on public.donors (created_by_team_member_id);

create index if not exists donors_donor_source_idx
  on public.donors (donor_source);

create index if not exists donors_preferred_contact_method_idx
  on public.donors (preferred_contact_method);

create table if not exists public.sponsorship_requests (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  email text not null,
  phone text not null,
  city_country text,
  preferred_contact_method text not null default 'whatsapp'
    check (preferred_contact_method in ('whatsapp', 'phone', 'email')),
  message text,
  confirmed_minimum_amount boolean not null default false,
  status text not null default 'new'
    check (status in ('new', 'contacted', 'profiles_prepared', 'profiles_shared', 'converted_to_donor', 'closed')),
  assigned_to text,
  assigned_team_member_id uuid references public.team_members(id) on delete set null,
  converted_donor_id uuid references public.donors(id) on delete set null,
  converted_by_team_member_id uuid references public.team_members(id) on delete set null,
  converted_at timestamptz,
  created_by_team_member_id uuid references public.team_members(id) on delete set null,
  contacted_at timestamptz,
  profiles_prepared_at timestamptz,
  profiles_shared_at timestamptz,
  closed_at timestamptz,
  request_source text not null default 'public_form'
    check (request_source in ('public_form', 'admin_created', 'whatsapp', 'phone', 'email', 'referral', 'walk_in', 'other')),
  last_contacted_at timestamptz,
  next_follow_up_at timestamptz,
  admin_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.sponsorship_requests
  add column if not exists assigned_team_member_id uuid references public.team_members(id) on delete set null;

alter table public.sponsorship_requests
  add column if not exists converted_donor_id uuid references public.donors(id) on delete set null;

alter table public.sponsorship_requests
  add column if not exists converted_by_team_member_id uuid references public.team_members(id) on delete set null;

alter table public.sponsorship_requests
  add column if not exists converted_at timestamptz;

alter table public.sponsorship_requests
  add column if not exists created_by_team_member_id uuid references public.team_members(id) on delete set null;

alter table public.sponsorship_requests
  add column if not exists contacted_at timestamptz;

alter table public.sponsorship_requests
  add column if not exists profiles_prepared_at timestamptz;

alter table public.sponsorship_requests
  add column if not exists profiles_shared_at timestamptz;

alter table public.sponsorship_requests
  add column if not exists closed_at timestamptz;

alter table public.sponsorship_requests
  add column if not exists request_source text not null default 'public_form';

alter table public.sponsorship_requests
  add column if not exists last_contacted_at timestamptz;

alter table public.sponsorship_requests
  add column if not exists next_follow_up_at timestamptz;

alter table public.sponsorship_requests
  drop constraint if exists sponsorship_requests_status_check;

update public.sponsorship_requests
set status = 'closed',
    updated_at = now()
where status = 'matched';

alter table public.sponsorship_requests
  add constraint sponsorship_requests_status_check
  check (status in ('new', 'contacted', 'profiles_prepared', 'profiles_shared', 'converted_to_donor', 'closed'));

update public.sponsorship_requests
set status = 'converted_to_donor',
    updated_at = now()
where converted_donor_id is not null
  and status in ('new', 'contacted', 'profiles_prepared', 'profiles_shared');

update public.sponsorship_requests
set status = 'profiles_shared',
    updated_at = now()
where converted_donor_id is null
  and status = 'converted_to_donor';

update public.sponsorship_requests
set contacted_at = coalesce(last_contacted_at, updated_at, created_at)
where contacted_at is null
  and status in ('contacted', 'profiles_prepared', 'profiles_shared', 'converted_to_donor', 'closed');

update public.sponsorship_requests
set profiles_prepared_at = coalesce(updated_at, created_at)
where profiles_prepared_at is null
  and status in ('profiles_prepared', 'profiles_shared', 'converted_to_donor', 'closed');

update public.sponsorship_requests
set profiles_shared_at = coalesce(converted_at, updated_at, created_at)
where profiles_shared_at is null
  and status in ('profiles_shared', 'converted_to_donor', 'closed');

update public.sponsorship_requests
set closed_at = coalesce(updated_at, created_at)
where closed_at is null
  and status = 'closed';

alter table public.sponsorship_requests
  drop constraint if exists sponsorship_requests_conversion_status_check;

alter table public.sponsorship_requests
  add constraint sponsorship_requests_conversion_status_check
  check (
    (
      converted_donor_id is null
      and status <> 'converted_to_donor'
    )
    or
    (
      converted_donor_id is not null
      and status in ('converted_to_donor', 'closed')
    )
  );

alter table public.sponsorship_requests
  drop constraint if exists sponsorship_requests_request_source_check;

alter table public.sponsorship_requests
  add constraint sponsorship_requests_request_source_check
  check (request_source in ('public_form', 'admin_created', 'whatsapp', 'phone', 'email', 'referral', 'walk_in', 'other'));

create index if not exists sponsorship_requests_status_idx
  on public.sponsorship_requests (status);

create index if not exists sponsorship_requests_created_at_idx
  on public.sponsorship_requests (created_at desc);

create index if not exists sponsorship_requests_assigned_team_member_id_idx
  on public.sponsorship_requests (assigned_team_member_id);

create index if not exists sponsorship_requests_converted_donor_id_idx
  on public.sponsorship_requests (converted_donor_id);

create index if not exists sponsorship_requests_created_by_team_member_id_idx
  on public.sponsorship_requests (created_by_team_member_id);

create index if not exists sponsorship_requests_request_source_idx
  on public.sponsorship_requests (request_source);

create index if not exists sponsorship_requests_next_follow_up_at_idx
  on public.sponsorship_requests (next_follow_up_at);

update public.donors
set donor_source = 'converted_request',
    updated_at = now()
where donor_source = 'admin_created'
  and id in (
    select converted_donor_id
    from public.sponsorship_requests
    where converted_donor_id is not null
  );

create table if not exists public.contact_logs (
  id uuid primary key default gen_random_uuid(),
  sponsorship_request_id uuid references public.sponsorship_requests(id) on delete cascade,
  donor_id uuid references public.donors(id) on delete set null,
  team_member_id uuid references public.team_members(id) on delete set null,
  contact_method text not null
    check (contact_method in ('whatsapp', 'phone', 'email', 'sms', 'in_person', 'other')),
  direction text not null default 'outbound'
    check (direction in ('outbound', 'inbound', 'internal_note')),
  outcome text not null default 'logged'
    check (outcome in ('logged', 'reached', 'no_response', 'follow_up_needed', 'not_interested', 'converted')),
  summary text not null,
  next_follow_up_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists contact_logs_sponsorship_request_id_idx
  on public.contact_logs (sponsorship_request_id);

create index if not exists contact_logs_team_member_id_idx
  on public.contact_logs (team_member_id);

create index if not exists contact_logs_donor_id_idx
  on public.contact_logs (donor_id);

create index if not exists contact_logs_created_at_idx
  on public.contact_logs (created_at desc);

create table if not exists public.orphan_profiles (
  id uuid primary key default gen_random_uuid(),
  orphan_code text not null unique,
  full_name text not null,
  profile_image_url text not null,
  gender text not null
    check (gender in ('male', 'female')),
  date_of_birth date,
  age_estimate integer,
  city_area text,
  health_notes text,
  education_status text,
  background_summary text,
  verification_status text not null default 'unverified'
    check (verification_status in ('unverified', 'documents_received', 'field_verified', 'needs_more_information', 'rejected')),
  profile_status text not null default 'draft'
    check (profile_status in ('draft', 'under_review', 'approved', 'matched', 'archived')),
  created_by_team_member_id uuid references public.team_members(id) on delete set null,
  submitted_by_team_member_id uuid references public.team_members(id) on delete set null,
  submitted_at timestamptz,
  approved_by_team_member_id uuid references public.team_members(id) on delete set null,
  approved_at timestamptz,
  archived_by_team_member_id uuid references public.team_members(id) on delete set null,
  archived_at timestamptz,
  archive_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint orphan_profiles_orphan_code_format_check check (orphan_code ~ '^OR[0-9]+$'),
  constraint orphan_profiles_profile_image_url_required_check check (length(trim(profile_image_url)) > 0)
);

create table if not exists public.orphan_guardians (
  id uuid primary key default gen_random_uuid(),
  orphan_id uuid not null references public.orphan_profiles(id) on delete cascade,
  guardian_name text not null,
  relationship text not null,
  phone text,
  whatsapp text,
  address text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.orphan_profile_status_history (
  id uuid primary key default gen_random_uuid(),
  orphan_id uuid not null references public.orphan_profiles(id) on delete cascade,
  previous_status text
    check (
      previous_status is null
      or previous_status in ('draft', 'under_review', 'approved', 'matched', 'archived')
    ),
  new_status text not null
    check (new_status in ('draft', 'under_review', 'approved', 'matched', 'archived')),
  changed_by_team_member_id uuid references public.team_members(id) on delete set null,
  changed_at timestamptz not null default now(),
  reason text,
  created_at timestamptz not null default now()
);

create table if not exists public.orphan_profile_verification_history (
  id uuid primary key default gen_random_uuid(),
  orphan_id uuid not null references public.orphan_profiles(id) on delete cascade,
  previous_status text
    check (
      previous_status is null
      or previous_status in (
        'unverified',
        'documents_received',
        'field_verified',
        'needs_more_information',
        'rejected'
      )
    ),
  new_status text not null
    check (
      new_status in (
        'unverified',
        'documents_received',
        'field_verified',
        'needs_more_information',
        'rejected'
      )
    ),
  changed_by_team_member_id uuid references public.team_members(id) on delete set null,
  changed_at timestamptz not null default now(),
  reason text,
  created_at timestamptz not null default now()
);

create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(),
  owner_type text not null
    check (owner_type in ('orphan_profile', 'donor', 'sponsorship_request')),
  owner_id uuid not null,
  file_url text not null,
  file_name text not null,
  file_type text not null,
  document_category text
    check (
      document_category is null
      or document_category in (
        'profile_image',
        'birth_or_identity_document',
        'guardian_document',
        'school_document',
        'medical_document',
        'verification_photo',
        'donation_receipt',
        'other'
      )
    ),
  is_primary_profile_image boolean not null default false,
  uploaded_by_team_member_id uuid references public.team_members(id) on delete set null,
  uploaded_by_donor_id uuid references public.donors(id) on delete set null,
  created_at timestamptz not null default now()
);

alter table public.orphan_profiles
  add column if not exists orphan_code text;

alter table public.orphan_profiles
  add column if not exists profile_image_url text;

alter table public.orphan_profiles
  add column if not exists submitted_by_team_member_id uuid references public.team_members(id) on delete set null;

alter table public.orphan_profiles
  add column if not exists submitted_at timestamptz;

alter table public.orphan_profiles
  add column if not exists archived_by_team_member_id uuid references public.team_members(id) on delete set null;

alter table public.orphan_profiles
  add column if not exists archived_at timestamptz;

alter table public.orphan_profiles
  add column if not exists archive_reason text;

alter table public.orphan_profiles
  drop constraint if exists orphan_profiles_orphan_code_format_check;

alter table public.orphan_profiles
  add constraint orphan_profiles_orphan_code_format_check
  check (orphan_code ~ '^OR[0-9]+$');

alter table public.orphan_profiles
  drop constraint if exists orphan_profiles_profile_image_url_required_check;

alter table public.orphan_profiles
  add constraint orphan_profiles_profile_image_url_required_check
  check (length(trim(profile_image_url)) > 0);

alter table public.orphan_profiles
  drop constraint if exists orphan_profiles_gender_check;

alter table public.orphan_profiles
  add constraint orphan_profiles_gender_check
  check (gender in ('male', 'female'));

alter table public.orphan_profiles
  drop constraint if exists orphan_profiles_verification_status_check;

alter table public.orphan_profiles
  add constraint orphan_profiles_verification_status_check
  check (verification_status in ('unverified', 'documents_received', 'field_verified', 'needs_more_information', 'rejected'));

alter table public.orphan_profiles
  drop constraint if exists orphan_profiles_profile_status_check;

alter table public.orphan_profiles
  add constraint orphan_profiles_profile_status_check
  check (profile_status in ('draft', 'under_review', 'approved', 'matched', 'archived'));

-- Orphan location and birthday are printed on the sponsorship match certificate and are required.
update public.orphan_profiles
  set city_area = 'Gaza'
  where city_area is null or length(trim(city_area)) = 0;

-- NOTE: date_of_birth is printed as the orphan's "Birthday" on the certificate and is now required.
-- Rows without a real birthday are backfilled with a placeholder that MUST be replaced with the
-- orphan's actual date of birth.
update public.orphan_profiles
  set date_of_birth = date '2000-01-01'
  where date_of_birth is null;

alter table public.orphan_profiles
  alter column city_area set not null;

alter table public.orphan_profiles
  alter column date_of_birth set not null;

-- Guardian phone is printed on the certificate and is now required.
update public.orphan_guardians
  set phone = 'Not provided'
  where phone is null or length(trim(phone)) = 0;

alter table public.orphan_guardians
  alter column phone set not null;

alter table public.documents
  add column if not exists document_category text;

alter table public.documents
  add column if not exists is_primary_profile_image boolean not null default false;

alter table public.orphan_profile_status_history
  add column if not exists previous_status text;

alter table public.orphan_profile_status_history
  add column if not exists new_status text;

alter table public.orphan_profile_status_history
  add column if not exists changed_by_team_member_id uuid references public.team_members(id) on delete set null;

alter table public.orphan_profile_status_history
  add column if not exists changed_at timestamptz not null default now();

alter table public.orphan_profile_status_history
  add column if not exists reason text;

alter table public.orphan_profile_status_history
  add column if not exists created_at timestamptz not null default now();

alter table public.orphan_profile_status_history
  drop constraint if exists orphan_profile_status_history_previous_status_check;

alter table public.orphan_profile_status_history
  add constraint orphan_profile_status_history_previous_status_check
  check (
    previous_status is null
    or previous_status in ('draft', 'under_review', 'approved', 'matched', 'archived')
  );

alter table public.orphan_profile_status_history
  drop constraint if exists orphan_profile_status_history_new_status_check;

alter table public.orphan_profile_status_history
  add constraint orphan_profile_status_history_new_status_check
  check (new_status in ('draft', 'under_review', 'approved', 'matched', 'archived'));

alter table public.orphan_profile_verification_history
  add column if not exists previous_status text;

alter table public.orphan_profile_verification_history
  add column if not exists new_status text;

alter table public.orphan_profile_verification_history
  add column if not exists changed_by_team_member_id uuid references public.team_members(id) on delete set null;

alter table public.orphan_profile_verification_history
  add column if not exists changed_at timestamptz not null default now();

alter table public.orphan_profile_verification_history
  add column if not exists reason text;

alter table public.orphan_profile_verification_history
  add column if not exists created_at timestamptz not null default now();

alter table public.orphan_profile_verification_history
  drop constraint if exists orphan_profile_verification_history_previous_status_check;

alter table public.orphan_profile_verification_history
  add constraint orphan_profile_verification_history_previous_status_check
  check (
    previous_status is null
    or previous_status in (
      'unverified',
      'documents_received',
      'field_verified',
      'needs_more_information',
      'rejected'
    )
  );

alter table public.orphan_profile_verification_history
  drop constraint if exists orphan_profile_verification_history_new_status_check;

alter table public.orphan_profile_verification_history
  add constraint orphan_profile_verification_history_new_status_check
  check (
    new_status in (
      'unverified',
      'documents_received',
      'field_verified',
      'needs_more_information',
      'rejected'
    )
  );

alter table public.documents
  drop constraint if exists documents_owner_type_check;

alter table public.documents
  add constraint documents_owner_type_check
  check (owner_type in ('orphan_profile', 'donor', 'sponsorship_request'));

alter table public.documents
  drop constraint if exists documents_document_category_check;

alter table public.documents
  add constraint documents_document_category_check
  check (
    document_category is null
    or document_category in (
      'profile_image',
      'birth_or_identity_document',
      'guardian_document',
      'school_document',
      'medical_document',
      'verification_photo',
      'donation_receipt',
      'other'
    )
  );

create index if not exists orphan_profiles_orphan_code_idx
  on public.orphan_profiles (orphan_code);

create index if not exists orphan_profiles_profile_status_idx
  on public.orphan_profiles (profile_status);

create index if not exists orphan_profiles_verification_status_idx
  on public.orphan_profiles (verification_status);

create index if not exists orphan_profiles_created_by_team_member_id_idx
  on public.orphan_profiles (created_by_team_member_id);

create index if not exists orphan_profiles_approved_by_team_member_id_idx
  on public.orphan_profiles (approved_by_team_member_id);

create index if not exists orphan_profiles_created_at_idx
  on public.orphan_profiles (created_at desc);

create index if not exists orphan_guardians_orphan_id_idx
  on public.orphan_guardians (orphan_id);

create index if not exists orphan_profile_status_history_orphan_id_changed_at_idx
  on public.orphan_profile_status_history (orphan_id, changed_at desc);

create index if not exists orphan_profile_status_history_changed_by_team_member_id_idx
  on public.orphan_profile_status_history (changed_by_team_member_id);

create index if not exists orphan_profile_verification_history_orphan_id_changed_at_idx
  on public.orphan_profile_verification_history (orphan_id, changed_at desc);

create index if not exists orphan_profile_verification_history_changed_by_team_member_id_idx
  on public.orphan_profile_verification_history (changed_by_team_member_id);

create index if not exists documents_owner_type_owner_id_idx
  on public.documents (owner_type, owner_id);

create index if not exists documents_document_category_idx
  on public.documents (document_category);

create index if not exists documents_uploaded_by_team_member_id_idx
  on public.documents (uploaded_by_team_member_id);

insert into public.orphan_profile_status_history (
  orphan_id,
  previous_status,
  new_status,
  changed_by_team_member_id,
  changed_at,
  reason
)
select
  op.id,
  null,
  'draft',
  op.created_by_team_member_id,
  op.created_at,
  'Profile created.'
from public.orphan_profiles op
where not exists (
  select 1
    from public.orphan_profile_status_history history
    where history.orphan_id = op.id
      and history.previous_status is null
      and history.new_status = 'draft'
);

insert into public.orphan_profile_status_history (
  orphan_id,
  previous_status,
  new_status,
  changed_by_team_member_id,
  changed_at,
  reason
)
select
  op.id,
  'draft',
  'under_review',
  op.submitted_by_team_member_id,
  op.submitted_at,
  'Submitted for review.'
from public.orphan_profiles op
where op.submitted_at is not null
  and not exists (
    select 1
      from public.orphan_profile_status_history history
      where history.orphan_id = op.id
        and history.new_status = 'under_review'
        and history.changed_at = op.submitted_at
  );

insert into public.orphan_profile_status_history (
  orphan_id,
  previous_status,
  new_status,
  changed_by_team_member_id,
  changed_at,
  reason
)
select
  op.id,
  'under_review',
  'approved',
  op.approved_by_team_member_id,
  op.approved_at,
  'Profile approved.'
from public.orphan_profiles op
where op.approved_at is not null
  and not exists (
    select 1
      from public.orphan_profile_status_history history
      where history.orphan_id = op.id
        and history.new_status = 'approved'
        and history.changed_at = op.approved_at
  );

insert into public.orphan_profile_status_history (
  orphan_id,
  previous_status,
  new_status,
  changed_by_team_member_id,
  changed_at,
  reason
)
select
  op.id,
  case
    when op.approved_at is not null then 'approved'
    when op.submitted_at is not null then 'under_review'
    else 'draft'
  end,
  'archived',
  op.archived_by_team_member_id,
  op.archived_at,
  nullif(trim(op.archive_reason), '')
from public.orphan_profiles op
where op.archived_at is not null
  and not exists (
    select 1
      from public.orphan_profile_status_history history
      where history.orphan_id = op.id
        and history.new_status = 'archived'
        and history.changed_at = op.archived_at
  );

insert into public.orphan_profile_status_history (
  orphan_id,
  previous_status,
  new_status,
  changed_by_team_member_id,
  changed_at,
  reason
)
select
  op.id,
  null,
  op.profile_status,
  null,
  op.updated_at,
  'Current status captured from existing profile.'
from public.orphan_profiles op
where op.profile_status <> 'draft'
  and not exists (
    select 1
      from public.orphan_profile_status_history history
      where history.orphan_id = op.id
        and history.new_status = op.profile_status
  );

insert into public.orphan_profile_verification_history (
  orphan_id,
  previous_status,
  new_status,
  changed_by_team_member_id,
  changed_at,
  reason
)
select
  op.id,
  null,
  op.verification_status,
  op.created_by_team_member_id,
  op.created_at,
  'Verification status set.'
from public.orphan_profiles op
where not exists (
  select 1
    from public.orphan_profile_verification_history history
    where history.orphan_id = op.id
      and history.previous_status is null
      and history.new_status = op.verification_status
);

create table if not exists public.sponsorship_matches (
  id uuid primary key default gen_random_uuid(),
  donor_id uuid not null references public.donors(id) on delete restrict,
  orphan_id uuid not null references public.orphan_profiles(id) on delete restrict,
  monthly_amount numeric(12,2) not null,
  currency text not null default 'PKR',
  status text not null default 'active'
    check (status in ('active', 'paused', 'ended', 'voided')),
  started_at date not null,
  ended_at date,
  status_reason text,
  notes text,
  created_by_team_member_id uuid references public.team_members(id) on delete set null,
  updated_by_team_member_id uuid references public.team_members(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint sponsorship_matches_monthly_amount_positive_check check (monthly_amount > 0),
  constraint sponsorship_matches_currency_check check (currency = 'PKR'),
  constraint sponsorship_matches_dates_check check (ended_at is null or ended_at >= started_at)
);

alter table public.sponsorship_matches
  add column if not exists donor_id uuid references public.donors(id) on delete restrict;

alter table public.sponsorship_matches
  add column if not exists orphan_id uuid references public.orphan_profiles(id) on delete restrict;

alter table public.sponsorship_matches
  add column if not exists monthly_amount numeric(12,2);

alter table public.sponsorship_matches
  add column if not exists currency text not null default 'PKR';

alter table public.sponsorship_matches
  add column if not exists status text not null default 'active';

alter table public.sponsorship_matches
  add column if not exists started_at date;

alter table public.sponsorship_matches
  add column if not exists ended_at date;

alter table public.sponsorship_matches
  add column if not exists status_reason text;

alter table public.sponsorship_matches
  add column if not exists notes text;

alter table public.sponsorship_matches
  add column if not exists created_by_team_member_id uuid references public.team_members(id) on delete set null;

alter table public.sponsorship_matches
  add column if not exists updated_by_team_member_id uuid references public.team_members(id) on delete set null;

alter table public.sponsorship_matches
  add column if not exists created_at timestamptz not null default now();

alter table public.sponsorship_matches
  add column if not exists updated_at timestamptz not null default now();

alter table public.sponsorship_matches
  alter column currency set default 'PKR';

update public.sponsorship_matches
set currency = 'PKR'
where currency is distinct from 'PKR';

alter table public.sponsorship_matches
  alter column status set default 'active';

alter table public.sponsorship_matches
  drop constraint if exists sponsorship_matches_status_check;

alter table public.sponsorship_matches
  add constraint sponsorship_matches_status_check
  check (status in ('active', 'paused', 'ended', 'voided'));

alter table public.sponsorship_matches
  drop constraint if exists sponsorship_matches_monthly_amount_positive_check;

alter table public.sponsorship_matches
  add constraint sponsorship_matches_monthly_amount_positive_check
  check (monthly_amount > 0);

alter table public.sponsorship_matches
  drop constraint if exists sponsorship_matches_currency_check;

alter table public.sponsorship_matches
  add constraint sponsorship_matches_currency_check
  check (currency = 'PKR');

-- Stable per-match certificate serial, rendered as MATCH-{start year}-{padded seq} on the
-- sponsorship match certificate. Adding the identity column backfills existing rows sequentially.
alter table public.sponsorship_matches
  add column if not exists certificate_seq bigint generated by default as identity;

create unique index if not exists sponsorship_matches_certificate_seq_idx
  on public.sponsorship_matches (certificate_seq);

alter table public.sponsorship_matches
  drop constraint if exists sponsorship_matches_dates_check;

alter table public.sponsorship_matches
  add constraint sponsorship_matches_dates_check
  check (ended_at is null or ended_at >= started_at);

create index if not exists sponsorship_matches_donor_id_idx
  on public.sponsorship_matches (donor_id);

create index if not exists sponsorship_matches_orphan_id_idx
  on public.sponsorship_matches (orphan_id);

create index if not exists sponsorship_matches_status_idx
  on public.sponsorship_matches (status);

create index if not exists sponsorship_matches_started_at_idx
  on public.sponsorship_matches (started_at desc);

create index if not exists sponsorship_matches_created_at_idx
  on public.sponsorship_matches (created_at desc);

create unique index if not exists sponsorship_matches_one_active_orphan_idx
  on public.sponsorship_matches (orphan_id)
  where status = 'active';

create or replace function public.create_sponsorship_match(
  p_donor_id uuid,
  p_orphan_id uuid,
  p_monthly_amount numeric,
  p_currency text,
  p_started_at date,
  p_notes text,
  p_created_by_team_member_id uuid
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_donor_active boolean;
  v_match_id uuid;
  v_orphan_profile_status text;
  v_orphan_verification_status text;
begin
  select active
    into v_donor_active
    from public.donors
    where id = p_donor_id
    for update;

  if not found then
    raise exception 'Donor not found.';
  end if;

  if v_donor_active is not true then
    raise exception 'Inactive donors cannot receive new matches.';
  end if;

  select profile_status, verification_status
    into v_orphan_profile_status, v_orphan_verification_status
    from public.orphan_profiles
    where id = p_orphan_id
    for update;

  if not found then
    raise exception 'Orphan profile not found.';
  end if;

  if v_orphan_verification_status <> 'field_verified' then
    raise exception 'Only field verified orphan profiles can be matched.';
  end if;

  if v_orphan_profile_status <> 'approved' then
    raise exception 'Only approved orphan profiles can be matched.';
  end if;

  if exists (
    select 1
      from public.sponsorship_matches
      where orphan_id = p_orphan_id
        and status = 'active'
  ) then
    raise exception 'This orphan already has an active sponsor.';
  end if;

  insert into public.sponsorship_matches (
    donor_id,
    orphan_id,
    monthly_amount,
    currency,
    status,
    started_at,
    notes,
    created_by_team_member_id
  )
  values (
    p_donor_id,
    p_orphan_id,
    p_monthly_amount,
    upper(trim(p_currency)),
    'active',
    p_started_at,
    nullif(trim(coalesce(p_notes, '')), ''),
    p_created_by_team_member_id
  )
  returning id into v_match_id;

  update public.orphan_profiles
    set profile_status = 'matched'
    where id = p_orphan_id
      and profile_status <> 'archived';

  return v_match_id;
end;
$$;

create or replace function public.set_sponsorship_match_status(
  p_match_id uuid,
  p_status text,
  p_reason text,
  p_ended_at date,
  p_updated_by_team_member_id uuid
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_donor_active boolean;
  v_existing_status text;
  v_orphan_id uuid;
  v_orphan_profile_status text;
  v_orphan_verification_status text;
begin
  if p_status not in ('active', 'paused', 'ended', 'voided') then
    raise exception 'Invalid sponsorship match status.';
  end if;

  if nullif(trim(coalesce(p_reason, '')), '') is null then
    raise exception 'Reason is required.';
  end if;

  select status, orphan_id
    into v_existing_status, v_orphan_id
    from public.sponsorship_matches
    where id = p_match_id
    for update;

  if not found then
    raise exception 'Sponsorship match not found.';
  end if;

  if v_existing_status in ('ended', 'voided') then
    raise exception 'Ended or voided matches cannot be changed.';
  end if;

  if p_status = 'paused' and v_existing_status <> 'active' then
    raise exception 'Only active matches can be paused.';
  end if;

  if p_status = 'active' and v_existing_status <> 'paused' then
    raise exception 'Only paused matches can be resumed.';
  end if;

  if p_status in ('ended', 'voided') and v_existing_status not in ('active', 'paused') then
    raise exception 'Only active or paused matches can be closed.';
  end if;

  if p_status = 'active' then
    select d.active, o.profile_status, o.verification_status
      into v_donor_active, v_orphan_profile_status, v_orphan_verification_status
      from public.sponsorship_matches sm
      join public.donors d on d.id = sm.donor_id
      join public.orphan_profiles o on o.id = sm.orphan_id
      where sm.id = p_match_id
      for update of d, o;

    if v_donor_active is not true then
      raise exception 'Inactive donors cannot receive new matches.';
    end if;

    if v_orphan_verification_status <> 'field_verified' then
      raise exception 'Only field verified orphan profiles can be matched.';
    end if;

    if v_orphan_profile_status not in ('approved', 'matched') then
      raise exception 'Only approved orphan profiles can be matched.';
    end if;

    if exists (
      select 1
        from public.sponsorship_matches
        where orphan_id = v_orphan_id
          and status = 'active'
          and id <> p_match_id
    ) then
      raise exception 'This orphan already has an active sponsor.';
    end if;
  end if;

  update public.sponsorship_matches
    set ended_at = case when p_status in ('ended', 'voided') then p_ended_at else null end,
        status = p_status,
        status_reason = trim(p_reason),
        updated_by_team_member_id = p_updated_by_team_member_id
    where id = p_match_id;

  if p_status = 'active' then
    update public.orphan_profiles
      set profile_status = 'matched'
      where id = v_orphan_id
        and profile_status <> 'archived';
  elsif p_status in ('ended', 'voided') and not exists (
    select 1
      from public.sponsorship_matches
      where orphan_id = v_orphan_id
        and status = 'active'
  ) then
    update public.orphan_profiles
      set profile_status = 'approved'
      where id = v_orphan_id
        and profile_status = 'matched';
  end if;

  return p_match_id;
end;
$$;

-- Database-backed admin list summaries. Each function returns every KPI for its page in one
-- aggregate query. They are server-only RPCs; browser roles cannot execute them directly.
create or replace function public.admin_donor_list_summary(
  p_scoped_to_team_member_id uuid
)
returns jsonb
language sql
stable
set search_path = public
as $$
  with scoped_donors as (
    select donor.*
    from public.donors donor
    where p_scoped_to_team_member_id is null
      or exists (
        select 1
        from public.sponsorship_requests request
        where request.converted_donor_id = donor.id
          and request.assigned_team_member_id = p_scoped_to_team_member_id
      )
  )
  select jsonb_build_object(
    'active', count(*) filter (where active),
    'inactive', count(*) filter (where not active),
    'pendingFirstLogin', count(*) filter (where active and auth_user_id is null),
    'total', count(*)
  )
  from scoped_donors;
$$;

create or replace function public.admin_orphan_list_summary()
returns jsonb
language sql
stable
set search_path = public
as $$
  select jsonb_build_object(
    'approved', count(*) filter (where profile_status = 'approved'),
    'drafts', count(*) filter (where profile_status = 'draft'),
    'total', count(*),
    'underReview', count(*) filter (where profile_status = 'under_review')
  )
  from public.orphan_profiles;
$$;

create or replace function public.admin_team_member_list_summary()
returns jsonb
language sql
stable
set search_path = public
as $$
  select jsonb_build_object(
    'admins', count(*) filter (
      where active and role in ('super_admin', 'admin')
    ),
    'inactive', count(*) filter (where not active),
    'pendingFirstLogin', count(*) filter (where active and auth_user_id is null),
    'total', count(*)
  )
  from public.team_members;
$$;

create or replace function public.admin_sponsorship_request_list_summary(
  p_current_team_member_id uuid,
  p_scoped_to_team_member_id uuid
)
returns jsonb
language sql
stable
set search_path = public
as $$
  with scoped_requests as (
    select request.*
    from public.sponsorship_requests request
    where p_scoped_to_team_member_id is null
      or request.assigned_team_member_id = p_scoped_to_team_member_id
  )
  select jsonb_build_object(
    'assignedToMe', count(*) filter (
      where assigned_team_member_id = p_current_team_member_id
    ),
    'convertedDonors', count(*) filter (where converted_donor_id is not null),
    'followUpsDue', count(*) filter (
      where next_follow_up_at is not null
        and next_follow_up_at <= now()
    ),
    'newRequests', count(*) filter (where status = 'new'),
    'statusCounts', jsonb_build_object(
      'new', count(*) filter (where status = 'new'),
      'contacted', count(*) filter (where status = 'contacted'),
      'profiles_prepared', count(*) filter (where status = 'profiles_prepared'),
      'profiles_shared', count(*) filter (where status = 'profiles_shared'),
      'converted_to_donor', count(*) filter (where status = 'converted_to_donor'),
      'closed', count(*) filter (where status = 'closed')
    ),
    'total', count(*)
  )
  from scoped_requests;
$$;

create or replace function public.admin_sponsorship_match_list_summary()
returns jsonb
language sql
stable
set search_path = public
as $$
  with month_window as (
    select
      date_trunc('month', timezone('Asia/Karachi', now()))
        at time zone 'Asia/Karachi' as starts_at,
      (
        date_trunc('month', timezone('Asia/Karachi', now()))
        + interval '1 month'
      ) at time zone 'Asia/Karachi' as ends_at
  ),
  match_counts as (
    select
      count(*) filter (where sponsorship.status = 'active') as active,
      count(*) filter (where sponsorship.status = 'paused') as paused,
      count(*) filter (
        where sponsorship.created_at >= month_window.starts_at
          and sponsorship.created_at < month_window.ends_at
      ) as new_this_month
    from public.sponsorship_matches sponsorship
    cross join month_window
  )
  select jsonb_build_object(
    'active', match_counts.active,
    'availableOrphans', (
      select count(*)
      from public.orphan_profiles orphan
      where orphan.profile_status = 'approved'
        and orphan.verification_status = 'field_verified'
    ),
    'newThisMonth', match_counts.new_this_month,
    'paused', match_counts.paused
  )
  from match_counts;
$$;

-- Keep match filtering and pagination inside PostgreSQL. The helper returns only identifiers,
-- allowing the application to fetch the existing portable match payload for the current page.
create or replace function public.admin_filtered_sponsorship_match_ids(
  p_status text,
  p_created_by uuid,
  p_donor_id uuid,
  p_orphan_id uuid,
  p_search text,
  p_started_from date,
  p_started_to date
)
returns table (
  match_id uuid,
  match_created_at timestamptz
)
language sql
stable
set search_path = public
as $$
  select sponsorship.id, sponsorship.created_at
  from public.sponsorship_matches sponsorship
  join public.donors donor on donor.id = sponsorship.donor_id
  join public.orphan_profiles orphan on orphan.id = sponsorship.orphan_id
  where (p_status is null or sponsorship.status = p_status)
    and (p_created_by is null or sponsorship.created_by_team_member_id = p_created_by)
    and (p_donor_id is null or sponsorship.donor_id = p_donor_id)
    and (p_orphan_id is null or sponsorship.orphan_id = p_orphan_id)
    and (p_started_from is null or sponsorship.started_at >= p_started_from)
    and (p_started_to is null or sponsorship.started_at <= p_started_to)
    and (
      nullif(trim(p_search), '') is null
      or donor.full_name ilike '%' || trim(p_search) || '%'
      or donor.email ilike '%' || trim(p_search) || '%'
      or donor.phone ilike '%' || trim(p_search) || '%'
      or orphan.full_name ilike '%' || trim(p_search) || '%'
      or orphan.orphan_code ilike '%' || trim(p_search) || '%'
      or sponsorship.status ilike '%' || trim(p_search) || '%'
    );
$$;

create or replace function public.admin_sponsorship_match_page_ids(
  p_status text,
  p_created_by uuid,
  p_donor_id uuid,
  p_orphan_id uuid,
  p_search text,
  p_started_from date,
  p_started_to date,
  p_limit integer,
  p_offset integer,
  p_known_total bigint
)
returns table (
  match_id uuid,
  total_count bigint
)
language plpgsql
stable
set search_path = public
as $$
begin
  if p_known_total is null then
    return query
      select
        filtered.match_id,
        count(*) over() as total_count
      from public.admin_filtered_sponsorship_match_ids(
        p_status,
        p_created_by,
        p_donor_id,
        p_orphan_id,
        p_search,
        p_started_from,
        p_started_to
      ) filtered
      order by filtered.match_created_at desc, filtered.match_id desc
      limit least(greatest(coalesce(p_limit, 10), 1), 100)
      offset greatest(coalesce(p_offset, 0), 0);
  else
    return query
      select
        filtered.match_id,
        p_known_total as total_count
      from public.admin_filtered_sponsorship_match_ids(
        p_status,
        p_created_by,
        p_donor_id,
        p_orphan_id,
        p_search,
        p_started_from,
        p_started_to
      ) filtered
      order by filtered.match_created_at desc, filtered.match_id desc
      limit least(greatest(coalesce(p_limit, 10), 1), 100)
      offset greatest(coalesce(p_offset, 0), 0);
  end if;
end;
$$;

create index if not exists sponsorship_matches_created_by_team_member_id_idx
  on public.sponsorship_matches (created_by_team_member_id);

revoke execute on function public.admin_donor_list_summary(uuid)
  from public, anon, authenticated;
revoke execute on function public.admin_orphan_list_summary()
  from public, anon, authenticated;
revoke execute on function public.admin_team_member_list_summary()
  from public, anon, authenticated;
revoke execute on function public.admin_sponsorship_request_list_summary(uuid, uuid)
  from public, anon, authenticated;
revoke execute on function public.admin_sponsorship_match_list_summary()
  from public, anon, authenticated;
revoke execute on function public.admin_filtered_sponsorship_match_ids(
  text, uuid, uuid, uuid, text, date, date
) from public, anon, authenticated;
revoke execute on function public.admin_sponsorship_match_page_ids(
  text, uuid, uuid, uuid, text, date, date, integer, integer, bigint
) from public, anon, authenticated;

grant execute on function public.admin_donor_list_summary(uuid) to service_role;
grant execute on function public.admin_orphan_list_summary() to service_role;
grant execute on function public.admin_team_member_list_summary() to service_role;
grant execute on function public.admin_sponsorship_request_list_summary(uuid, uuid)
  to service_role;
grant execute on function public.admin_sponsorship_match_list_summary() to service_role;
grant execute on function public.admin_filtered_sponsorship_match_ids(
  text, uuid, uuid, uuid, text, date, date
) to service_role;
grant execute on function public.admin_sponsorship_match_page_ids(
  text, uuid, uuid, uuid, text, date, date, integer, integer, bigint
) to service_role;

insert into storage.buckets (id, name, public)
values ('orphan-photos', 'orphan-photos', true)
on conflict (id) do update set
  public = true;

insert into storage.buckets (id, name, public)
values ('orphan-documents', 'orphan-documents', false)
on conflict (id) do nothing;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists sponsorship_requests_set_updated_at on public.sponsorship_requests;

create trigger sponsorship_requests_set_updated_at
before update on public.sponsorship_requests
for each row
execute function public.set_updated_at();

drop trigger if exists team_members_set_updated_at on public.team_members;

create trigger team_members_set_updated_at
before update on public.team_members
for each row
execute function public.set_updated_at();

drop trigger if exists donors_set_updated_at on public.donors;

create trigger donors_set_updated_at
before update on public.donors
for each row
execute function public.set_updated_at();

drop trigger if exists contact_logs_set_updated_at on public.contact_logs;

create trigger contact_logs_set_updated_at
before update on public.contact_logs
for each row
execute function public.set_updated_at();

drop trigger if exists orphan_profiles_set_updated_at on public.orphan_profiles;

create trigger orphan_profiles_set_updated_at
before update on public.orphan_profiles
for each row
execute function public.set_updated_at();

drop trigger if exists orphan_guardians_set_updated_at on public.orphan_guardians;

create trigger orphan_guardians_set_updated_at
before update on public.orphan_guardians
for each row
execute function public.set_updated_at();

drop trigger if exists sponsorship_matches_set_updated_at on public.sponsorship_matches;

create trigger sponsorship_matches_set_updated_at
before update on public.sponsorship_matches
for each row
execute function public.set_updated_at();

alter table public.team_members enable row level security;
alter table public.donors enable row level security;
alter table public.sponsorship_requests enable row level security;
alter table public.contact_logs enable row level security;
alter table public.orphan_profiles enable row level security;
alter table public.orphan_guardians enable row level security;
alter table public.orphan_profile_status_history enable row level security;
alter table public.orphan_profile_verification_history enable row level security;
alter table public.documents enable row level security;
alter table public.sponsorship_matches enable row level security;

create table if not exists public.organization_bank_accounts (
  id uuid primary key default gen_random_uuid(),
  account_label text not null,
  bank_name text not null,
  account_title text not null,
  account_number text,
  iban text,
  currency text not null default 'PKR',
  country text,
  instructions text,
  sort_order integer not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.organization_bank_accounts
  add column if not exists account_label text;

alter table public.organization_bank_accounts
  add column if not exists bank_name text;

alter table public.organization_bank_accounts
  add column if not exists account_title text;

alter table public.organization_bank_accounts
  add column if not exists account_number text;

alter table public.organization_bank_accounts
  add column if not exists iban text;

alter table public.organization_bank_accounts
  add column if not exists currency text not null default 'PKR';

alter table public.organization_bank_accounts
  add column if not exists country text;

alter table public.organization_bank_accounts
  add column if not exists instructions text;

alter table public.organization_bank_accounts
  add column if not exists sort_order integer not null default 0;

alter table public.organization_bank_accounts
  add column if not exists active boolean not null default true;

alter table public.organization_bank_accounts
  add column if not exists created_at timestamptz not null default now();

alter table public.organization_bank_accounts
  add column if not exists updated_at timestamptz not null default now();

alter table public.organization_bank_accounts
  drop constraint if exists organization_bank_accounts_currency_check;

update public.organization_bank_accounts
set currency = 'PKR'
where currency is distinct from 'PKR';

alter table public.organization_bank_accounts
  add constraint organization_bank_accounts_currency_check
  check (currency = 'PKR');

create index if not exists organization_bank_accounts_active_sort_order_idx
  on public.organization_bank_accounts (active, sort_order, account_label);

delete from public.organization_bank_accounts
where account_label in (
  'Meezan PKR Account',
  'HBL PKR Account',
  'Bank Alfalah PKR Account'
);

insert into public.organization_bank_accounts (
  account_label,
  bank_name,
  account_title,
  account_number,
  iban,
  currency,
  country,
  instructions,
  sort_order,
  active
)
select
  account_label,
  bank_name,
  account_title,
  account_number,
  iban,
  currency,
  country,
  instructions,
  sort_order,
  active
from (
  values
    (
      'Others',
      'Other',
      'Other payment method',
      null,
      null,
      'PKR',
      'Pakistan',
      'Select this only if you paid through another approved method. Add the payment details in the donor note.',
      10,
      true
    ),
    (
      'Cash',
      'Cash',
      'Office cash payment',
      null,
      null,
      'PKR',
      'Pakistan',
      'Cash donations can be submitted at one of our offices in Islamabad or Lahore. Please upload the cash receipt or acknowledgement.',
      20,
      true
    ),
    (
      'Meezan bank',
      'Meezan Bank',
      'ROUHAN AHMED',
      '11380106891679',
      null,
      'PKR',
      'Pakistan',
      'Please avoid mentioning Donation/Charity/Zakat/Funds/Palestine/Gaza and any such tags Jazaak Allah Khair.',
      30,
      true
    ),
    (
      'Bank Al Habib',
      'Bank Al Habib',
      'JAMILA ADEEL',
      'PK02BAHL5637182900050301',
      null,
      'PKR',
      'Pakistan',
      'Please avoid mentioning Donation/Charity/Zakat/Funds/Palestine/Gaza and any such tags Jazaak Allah Khair.',
      40,
      true
    ),
    (
      'JS Bank',
      'JS Bank',
      'MERCY MISSION',
      '0002871995',
      'PK18JSBL9621000002871995',
      'PKR',
      'Pakistan',
      'Please avoid mentioning Palestine/Gaza Jazaak Allah Khair.',
      50,
      true
    ),
    (
      'International payments - Allied Bank',
      'Allied Bank',
      'MUHAMMAD NOUMAN',
      '07170010111088810016',
      'PK64ABPA0010111088810016',
      'PKR',
      'Pakistan',
      'Please avoid mentioning Donation/Charity/Zakat/Funds/Palestine/Gaza and any such tags Jazaak Allah Khair.',
      60,
      true
    ),
    (
      'JazzCash',
      'JazzCash',
      'JAMILA ADEEL',
      '03343175741',
      null,
      'PKR',
      'Pakistan',
      'Please avoid mentioning Donation/Charity/Zakat/Funds/Palestine/Gaza and any such tags Jazaak Allah Khair.',
      70,
      true
    ),
    (
      'Bank Islami',
      'Bank Islami',
      'ASAD AHMED',
      '210700088930001',
      null,
      'PKR',
      'Pakistan',
      'Please avoid mentioning Donation/Charity/Zakat/Funds/Palestine/Gaza and any such tags Jazaak Allah Khair.',
      80,
      true
    )
) as seed_accounts(
  account_label,
  bank_name,
  account_title,
  account_number,
  iban,
  currency,
  country,
  instructions,
  sort_order,
  active
)
where not exists (
  select 1
  from public.organization_bank_accounts existing_accounts
  where existing_accounts.account_label = seed_accounts.account_label
);

drop trigger if exists organization_bank_accounts_set_updated_at on public.organization_bank_accounts;

create trigger organization_bank_accounts_set_updated_at
before update on public.organization_bank_accounts
for each row execute function public.set_updated_at();

create table if not exists public.donation_receipts (
  id uuid primary key default gen_random_uuid(),
  donor_id uuid not null references public.donors(id) on delete restrict,
  sponsorship_match_id uuid not null references public.sponsorship_matches(id) on delete restrict,
  organization_bank_account_id uuid references public.organization_bank_accounts(id) on delete set null,
  amount numeric(12,2) not null,
  currency text not null default 'PKR',
  donation_month date not null,
  receipt_file_url text not null,
  receipt_file_name text,
  receipt_file_type text,
  receipt_file_size integer,
  transfer_reference text,
  transfer_date date,
  donor_note text,
  status text not null default 'ready_for_review',
  submitted_late boolean not null default false,
  submitted_at timestamptz not null default now(),
  reviewed_by_team_member_id uuid references public.team_members(id) on delete set null,
  reviewed_at timestamptz,
  verified_by_team_member_id uuid references public.team_members(id) on delete set null,
  verified_at timestamptz,
  money_delivered_by_team_member_id uuid references public.team_members(id) on delete set null,
  money_delivered_at timestamptz,
  rejection_reason text,
  finance_notes text,
  status_changed_at timestamptz,
  delivery_reference text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint donation_receipts_amount_positive_check check (amount > 0),
  constraint donation_receipts_currency_check check (currency = 'PKR'),
  constraint donation_receipts_month_check check (date_trunc('month', donation_month)::date = donation_month),
  constraint donation_receipts_status_check check (
    status in ('submitted', 'ready_for_review', 'reviewed', 'verified', 'rejected', 'money_delivered')
  )
);

alter table public.donation_receipts
  add column if not exists donor_id uuid references public.donors(id) on delete restrict;

alter table public.donation_receipts
  add column if not exists sponsorship_match_id uuid references public.sponsorship_matches(id) on delete restrict;

alter table public.donation_receipts
  add column if not exists organization_bank_account_id uuid references public.organization_bank_accounts(id) on delete set null;

alter table public.donation_receipts
  add column if not exists amount numeric(12,2);

alter table public.donation_receipts
  add column if not exists currency text not null default 'PKR';

alter table public.donation_receipts
  add column if not exists donation_month date;

alter table public.donation_receipts
  add column if not exists receipt_file_url text;

alter table public.donation_receipts
  add column if not exists receipt_file_name text;

alter table public.donation_receipts
  add column if not exists receipt_file_type text;

alter table public.donation_receipts
  add column if not exists receipt_file_size integer;

alter table public.donation_receipts
  add column if not exists transfer_reference text;

alter table public.donation_receipts
  add column if not exists transfer_date date;

alter table public.donation_receipts
  add column if not exists donor_note text;

alter table public.donation_receipts
  add column if not exists status text not null default 'ready_for_review';

alter table public.donation_receipts
  add column if not exists submitted_late boolean not null default false;

alter table public.donation_receipts
  add column if not exists submitted_at timestamptz not null default now();

alter table public.donation_receipts
  add column if not exists reviewed_by_team_member_id uuid references public.team_members(id) on delete set null;

alter table public.donation_receipts
  add column if not exists reviewed_at timestamptz;

alter table public.donation_receipts
  add column if not exists verified_by_team_member_id uuid references public.team_members(id) on delete set null;

alter table public.donation_receipts
  add column if not exists verified_at timestamptz;

alter table public.donation_receipts
  add column if not exists money_delivered_by_team_member_id uuid references public.team_members(id) on delete set null;

alter table public.donation_receipts
  add column if not exists money_delivered_at timestamptz;

alter table public.donation_receipts
  add column if not exists rejection_reason text;

alter table public.donation_receipts
  add column if not exists finance_notes text;

alter table public.donation_receipts
  add column if not exists status_changed_at timestamptz;

alter table public.donation_receipts
  add column if not exists delivery_reference text;

alter table public.donation_receipts
  add column if not exists created_at timestamptz not null default now();

alter table public.donation_receipts
  add column if not exists updated_at timestamptz not null default now();

alter table public.donation_receipts
  drop constraint if exists donation_receipts_amount_positive_check;

alter table public.donation_receipts
  add constraint donation_receipts_amount_positive_check check (amount > 0);

alter table public.donation_receipts
  drop constraint if exists donation_receipts_currency_check;

update public.donation_receipts
set currency = 'PKR'
where currency is distinct from 'PKR';

alter table public.donation_receipts
  add constraint donation_receipts_currency_check check (currency = 'PKR');

alter table public.donation_receipts
  drop constraint if exists donation_receipts_month_check;

alter table public.donation_receipts
  add constraint donation_receipts_month_check check (date_trunc('month', donation_month)::date = donation_month);

alter table public.donation_receipts
  drop constraint if exists donation_receipts_status_check;

alter table public.donation_receipts
  add constraint donation_receipts_status_check
  check (status in ('submitted', 'ready_for_review', 'reviewed', 'verified', 'rejected', 'money_delivered'));

create index if not exists donation_receipts_donor_id_idx
  on public.donation_receipts (donor_id);

create index if not exists donation_receipts_sponsorship_match_id_idx
  on public.donation_receipts (sponsorship_match_id);

create index if not exists donation_receipts_bank_account_id_idx
  on public.donation_receipts (organization_bank_account_id);

create index if not exists donation_receipts_donation_month_idx
  on public.donation_receipts (donation_month desc);

create index if not exists donation_receipts_status_idx
  on public.donation_receipts (status);

create index if not exists donation_receipts_submitted_at_idx
  on public.donation_receipts (submitted_at desc);

create index if not exists donation_receipts_status_submitted_at_idx
  on public.donation_receipts (status, submitted_at desc);

create index if not exists donation_receipts_status_changed_at_idx
  on public.donation_receipts (status_changed_at desc);

create index if not exists donation_receipts_verified_at_idx
  on public.donation_receipts (verified_at desc);

create index if not exists donation_receipts_money_delivered_at_idx
  on public.donation_receipts (money_delivered_at desc);

create index if not exists donation_receipts_donor_month_idx
  on public.donation_receipts (donor_id, donation_month desc);

create index if not exists donation_receipts_match_month_idx
  on public.donation_receipts (sponsorship_match_id, donation_month desc);

create unique index if not exists donation_receipts_one_reviewable_per_match_month_idx
  on public.donation_receipts (sponsorship_match_id, donation_month)
  where status <> 'rejected';

drop trigger if exists donation_receipts_set_updated_at on public.donation_receipts;

create trigger donation_receipts_set_updated_at
before update on public.donation_receipts
for each row execute function public.set_updated_at();

alter table public.organization_bank_accounts enable row level security;
alter table public.donation_receipts enable row level security;

create or replace function public.admin_finance_summary(p_month date)
returns jsonb
language sql
stable
set search_path = public
as $$
  with selected_month as (
    select coalesce(
      date_trunc('month', p_month)::date,
      date_trunc('month', timezone('Asia/Karachi', now()))::date
    ) as month_start
  ),
  pakistan_clock as (
    select timezone('Asia/Karachi', now())::date as today
  ),
  receipt_summary as (
    select
      count(*) filter (where receipt.status = 'money_delivered') as delivered_this_month,
      count(*) filter (
        where receipt.status in ('submitted', 'ready_for_review')
      ) as ready_for_review,
      count(*) filter (where receipt.status = 'rejected') as rejected_this_month,
      count(*) filter (where receipt.status = 'reviewed') as reviewed_awaiting_verification,
      coalesce(sum(receipt.amount) filter (
        where receipt.status in ('verified', 'money_delivered')
      ), 0) as verified_current_month_total,
      count(*) filter (where receipt.status = 'verified') as verified_this_month
    from public.donation_receipts receipt
    cross join selected_month selected
    where receipt.donation_month = selected.month_start
  ),
  overdue_summary as (
    select
      count(*) as overdue_sponsorships,
      coalesce(sum(sponsorship.monthly_amount), 0) as expected_current_month_total
    from public.sponsorship_matches sponsorship
    cross join selected_month selected
    cross join pakistan_clock clock
    where (
      selected.month_start < date_trunc('month', clock.today)::date
      or (
        selected.month_start = date_trunc('month', clock.today)::date
        and extract(day from clock.today) > 10
      )
    )
      and sponsorship.status <> 'voided'
      and sponsorship.started_at < (selected.month_start + interval '1 month')::date
      and (
        sponsorship.ended_at is null
        or sponsorship.ended_at >= selected.month_start
      )
      and not exists (
        select 1
        from public.donation_receipts receipt
        where receipt.sponsorship_match_id = sponsorship.id
          and receipt.donation_month = selected.month_start
          and receipt.status <> 'rejected'
      )
  )
  select jsonb_build_object(
    'deliveredThisMonth', receipts.delivered_this_month,
    'expectedCurrentMonthTotal', overdue.expected_current_month_total,
    'month', to_char(selected.month_start, 'YYYY-MM-DD'),
    'overdueSponsorships', overdue.overdue_sponsorships,
    'readyForReview', receipts.ready_for_review,
    'rejectedThisMonth', receipts.rejected_this_month,
    'reviewedAwaitingVerification', receipts.reviewed_awaiting_verification,
    'verifiedCurrentMonthTotal', receipts.verified_current_month_total,
    'verifiedThisMonth', receipts.verified_this_month
  )
  from selected_month selected
  cross join receipt_summary receipts
  cross join overdue_summary overdue;
$$;

revoke execute on function public.admin_finance_summary(date)
  from public, anon, authenticated;
grant execute on function public.admin_finance_summary(date) to service_role;

insert into storage.buckets (id, name, public)
values ('donation-receipts', 'donation-receipts', false)
on conflict (id) do nothing;

-- The app reads and writes through Next.js server routes using SUPABASE_SERVICE_ROLE_KEY.
-- No anonymous policies are created intentionally.

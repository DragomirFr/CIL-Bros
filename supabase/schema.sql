-- ============================================================================
--  CIL Bros Construction — everything the admin area needs in Supabase.
--
--  Paste this whole file into the Supabase SQL editor (Database → SQL editor →
--  New query) and press Run. It is safe to run again: nothing here drops data.
--
--  What it sets up
--    * admins       — one row per person, keyed by their username
--    * site_content — one row per editable section of the website
--    * the policies that decide who may change what
--    * the site-media storage bucket the uploads go into
--
--  Step-by-step instructions, including creating Dragomir's login, are in
--  docs/ADMIN.md.
-- ============================================================================


-- ---------------------------------------------------------------------------
--  1. Tables
-- ---------------------------------------------------------------------------

-- One row per admin.
--
-- Keyed by the username rather than the Supabase user id, so the owner can set
-- someone's permissions before they have ever signed in — and so a login and its
-- permissions are matched by name, which is what the helper functions below do.
create table if not exists public.admins (
  id          text primary key check (id ~ '^[a-z0-9]+$'),
  username    text not null,
  email       text not null,
  role        text not null default 'staff' check (role in ('owner', 'staff')),
  -- { "gallery": true, "recentJobs": false, ... } — the keys are PERMISSION_KEYS
  -- in src/lib/admin-access.ts.
  permissions jsonb not null default '{}'::jsonb,
  disabled    boolean not null default false,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- One row per editable section, holding the published items as a JSON array.
--
-- A row per section is what makes per-person permissions possible: an account
-- with the gallery switch on can write the row whose id is 'gallery' and nothing
-- else. The ids match ContentSectionId in src/lib/admin-access.ts.
create table if not exists public.site_content (
  id         text primary key
             check (id in ('gallery', 'recentJobs', 'siteVideos', 'services')),
  items      jsonb not null default '[]'::jsonb,
  -- The username of whoever last saved it, shown in the admin area.
  updated_by text,
  updated_at timestamptz not null default now()
);


-- ---------------------------------------------------------------------------
--  2. Who is asking
-- ---------------------------------------------------------------------------
--
--  These run as the function owner rather than the caller (`security definer`),
--  which is what lets a policy on `admins` read `admins` without recursing.

-- The admins.id of whoever is making the request: the part of their email before
-- the "@", with everything but letters and numbers stripped. Deliberately the
-- same rule as normaliseUsername() in src/lib/admin-auth.tsx.
--
-- Returns an empty string for a request with no login, which matches no row.
create or replace function public.caller_id()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select regexp_replace(
    lower(split_part(coalesce(auth.jwt() ->> 'email', ''), '@', 1)),
    '[^a-z0-9]', '', 'g'
  );
$$;

-- Signed in, has a profile, and has not been switched off.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.admins a
    where a.id = public.caller_id()
      and a.disabled = false
  );
$$;

create or replace function public.is_owner()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.admins a
    where a.id = public.caller_id()
      and a.role = 'owner'
      and a.disabled = false
  );
$$;

-- May the caller change this section? The owner always; staff only where their
-- switch for it is on.
--
-- Compared as JSON rather than cast to boolean, so a hand-edited permissions
-- object with something odd in it reads as "off" instead of raising an error.
create or replace function public.can_edit(p_section text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.admins a
    where a.id = public.caller_id()
      and a.disabled = false
      and (
        a.role = 'owner'
        or coalesce(a.permissions -> p_section = 'true'::jsonb, false)
      )
  );
$$;


-- ---------------------------------------------------------------------------
--  3. updated_at, kept honest by the database
-- ---------------------------------------------------------------------------
--
--  Set here rather than sent by the browser, so a device with a wrong clock
--  cannot post-date an edit.

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists admins_touch_updated_at on public.admins;
create trigger admins_touch_updated_at
  before update on public.admins
  for each row execute function public.touch_updated_at();

drop trigger if exists site_content_touch_updated_at on public.site_content;
create trigger site_content_touch_updated_at
  before insert or update on public.site_content
  for each row execute function public.touch_updated_at();


-- ---------------------------------------------------------------------------
--  4. Who may read and write the content
-- ---------------------------------------------------------------------------

alter table public.site_content enable row level security;

-- Anyone at all, signed in or not: this is the website's own content, and the
-- public pages read it directly.
drop policy if exists "site_content is public to read" on public.site_content;
create policy "site_content is public to read"
  on public.site_content for select
  using (true);

-- Writing needs the switch for that exact section. Saving a section is an
-- upsert, so it needs both of the first two policies.
drop policy if exists "site_content insert needs the section switch" on public.site_content;
create policy "site_content insert needs the section switch"
  on public.site_content for insert to authenticated
  with check (public.can_edit(id));

drop policy if exists "site_content update needs the section switch" on public.site_content;
create policy "site_content update needs the section switch"
  on public.site_content for update to authenticated
  using (public.can_edit(id))
  with check (public.can_edit(id));

-- Used by "Original content", which drops the saved row so the section falls
-- back to the copy bundled with the site.
drop policy if exists "site_content delete needs the section switch" on public.site_content;
create policy "site_content delete needs the section switch"
  on public.site_content for delete to authenticated
  using (public.can_edit(id));


-- ---------------------------------------------------------------------------
--  5. Who may read and write the admin profiles
-- ---------------------------------------------------------------------------

alter table public.admins enable row level security;

-- Your own row, so the admin area knows what you can see. The owner reads
-- everyone, for the Team page.
drop policy if exists "admins read own row, owner reads all" on public.admins;
create policy "admins read own row, owner reads all"
  on public.admins for select to authenticated
  using (id = public.caller_id() or public.is_owner());

-- Only the owner adds people, and only ever as staff — nobody can create a
-- second full-access account from the website.
drop policy if exists "admins insert by owner as staff" on public.admins;
create policy "admins insert by owner as staff"
  on public.admins for insert to authenticated
  with check (public.is_owner() and role = 'staff');

-- The owner changes staff rows. The owner's own row is deliberately untouchable
-- from the website: a hijacked owner session cannot promote anyone, and nobody
-- can lock the owner out. Change it here in the SQL editor if you ever need to.
drop policy if exists "admins update staff by owner" on public.admins;
create policy "admins update staff by owner"
  on public.admins for update to authenticated
  using (public.is_owner() and role <> 'owner')
  with check (public.is_owner() and role = 'staff');

drop policy if exists "admins delete staff by owner" on public.admins;
create policy "admins delete staff by owner"
  on public.admins for delete to authenticated
  using (public.is_owner() and role <> 'owner');


-- ---------------------------------------------------------------------------
--  6. Live updates
-- ---------------------------------------------------------------------------
--
--  The admin area follows both tables, so saving a section updates every open
--  page and switching a permission off empties that person's sidebar while they
--  are looking at it. Row-level security still applies to these updates.
--
--  Wrapped because adding a table that is already published raises an error, and
--  this file is meant to be safe to run twice.

do $$
begin
  alter publication supabase_realtime add table public.site_content;
exception
  when duplicate_object then null;
end
$$;

do $$
begin
  alter publication supabase_realtime add table public.admins;
exception
  when duplicate_object then null;
end
$$;


-- ---------------------------------------------------------------------------
--  7. The bucket the photos and videos go into
-- ---------------------------------------------------------------------------
--
--  Public, so the website can show the files without signing anything. 50 MB a
--  file is the ceiling on Supabase's free plan; raise both this number and
--  MAX_UPLOAD_BYTES in src/lib/media-library.ts together if you move to a paid
--  plan and need bigger videos.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('site-media', 'site-media', true, 52428800, array['image/*', 'video/*'])
on conflict (id) do update
  set public             = true,
      file_size_limit    = 52428800,
      allowed_mime_types = array['image/*', 'video/*'];

-- Reading a file needs no policy — the bucket is public, so the URLs in the
-- published content just work. Listing the bucket is a different thing, and is
-- what the "From library" button and the Media library page do.
drop policy if exists "site-media listed by admins" on storage.objects;
create policy "site-media listed by admins"
  on storage.objects for select to authenticated
  using (bucket_id = 'site-media' and public.is_admin());

-- Any admin who can edit a section can add files to it, which is why this is
-- not tied to the media switch.
drop policy if exists "site-media uploaded by admins" on storage.objects;
create policy "site-media uploaded by admins"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'site-media' and public.is_admin());

-- Deleting is the shared, destructive one — it can blank a photo out of a
-- section somebody else looks after — so it needs the media switch.
drop policy if exists "site-media deleted with the media switch" on storage.objects;
create policy "site-media deleted with the media switch"
  on storage.objects for delete to authenticated
  using (bucket_id = 'site-media' and public.can_edit('media'));


-- ---------------------------------------------------------------------------
--  8. The owner
-- ---------------------------------------------------------------------------
--
--  This creates Dragomir's *permissions*. The login itself is created by hand,
--  once, in Authentication → Users — see docs/ADMIN.md. The two are matched by
--  the username, so the email there must start with "dragomir@".
--
--  Running this again repairs the row (role back to owner, access back on)
--  without touching a username you have edited.
--
--  Note: if you set VITE_ADMIN_EMAIL_DOMAIN to something other than
--  cilbrosconstruction.com, update the address below to match. It is only what
--  the Team page displays — access is decided by the id.

insert into public.admins (id, username, email, role, permissions, disabled)
values (
  'dragomir',
  'Dragomir',
  'dragomir@cilbrosconstruction.com',
  'owner',
  '{"gallery": true, "recentJobs": true, "siteVideos": true, "services": true, "media": true}'::jsonb,
  false
)
on conflict (id) do update
  set role     = 'owner',
      disabled = false;

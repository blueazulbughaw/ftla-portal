-- ============================================================
-- FaithTech LA portal: database setup for the attendee hub.
--
-- How to run it (one time):
--   1. Change you@example.com near the bottom to your own email.
--   2. In Supabase, open SQL Editor, click "New query", paste this whole file, click Run.
-- It is safe to run again later; it only adds what is missing.
-- ============================================================

-- ---------- Profiles: one row per person who signs in ----------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  display_name text,
  avatar_url text,
  contact_email text,
  phone text,
  linkedin_url text,
  website_url text,
  meal_prefs text[] not null default '{}',
  roles text[] not null default '{attendee}',
  share_token text unique not null default replace(gen_random_uuid()::text, '-', ''),
  share_name boolean not null default true,
  share_photo boolean not null default true,
  share_email boolean not null default false,
  share_phone boolean not null default false,
  share_linkedin boolean not null default true,
  share_website boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- People whose account becomes an admin as soon as they sign in.
create table if not exists public.bootstrap_admins (email text primary key);
alter table public.bootstrap_admins enable row level security;

-- Make a profile automatically when someone signs up (email or Google).
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, display_name, avatar_url, contact_email, roles)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data ->> 'avatar_url',
    new.email,
    case when exists (select 1 from public.bootstrap_admins b where lower(b.email) = lower(new.email))
      then array['attendee', 'organizer', 'admin'] else array['attendee'] end
  )
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- Helpers the security rules below use.
create or replace function public.has_role(r text) returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce((select r = any (roles) from public.profiles where id = auth.uid()), false);
$$;

create or replace function public.is_staff() returns boolean
language sql stable security definer set search_path = public as $$
  select public.has_role('admin') or public.has_role('organizer');
$$;

alter table public.profiles enable row level security;
drop policy if exists "read own or staff" on public.profiles;
create policy "read own or staff" on public.profiles for select
  using (id = auth.uid() or public.is_staff());
drop policy if exists "insert own" on public.profiles;
create policy "insert own" on public.profiles for insert
  with check (id = auth.uid() and roles = '{attendee}');
drop policy if exists "update own" on public.profiles;
create policy "update own" on public.profiles for update using (id = auth.uid()) with check (id = auth.uid());

-- Stop people from giving themselves roles. Only set_user_roles() below can change roles.
create or replace function public.protect_roles() returns trigger
language plpgsql as $$
begin
  if new.roles is distinct from old.roles and current_setting('app.allow_roles', true) is distinct from 'on' then
    new.roles := old.roles;
  end if;
  new.updated_at := now();
  return new;
end $$;
drop trigger if exists profiles_protect_roles on public.profiles;
create trigger profiles_protect_roles before update on public.profiles
  for each row execute function public.protect_roles();

-- Admins change someone's roles. "attendee" is always kept.
create or replace function public.set_user_roles(target uuid, new_roles text[]) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.has_role('admin') then
    raise exception 'Only admins can change roles';
  end if;
  perform set_config('app.allow_roles', 'on', true);
  update public.profiles
    set roles = array(select distinct unnest(array['attendee'] || new_roles))
    where id = target;
end $$;

-- What other people see when they scan your QR: only the fields you switched on.
create or replace function public.get_share_card(token text)
returns table (id uuid, display_name text, avatar_url text, contact_email text, phone text, linkedin_url text, website_url text)
language sql stable security definer set search_path = public as $$
  select p.id,
    case when p.share_name then p.display_name end,
    case when p.share_photo then p.avatar_url end,
    case when p.share_email then p.contact_email end,
    case when p.share_phone then p.phone end,
    case when p.share_linkedin then p.linkedin_url end,
    case when p.share_website then p.website_url end
  from public.profiles p where p.share_token = token;
$$;

-- ---------- Saved sessions ("My schedule") ----------
create table if not exists public.saved_sessions (
  user_id uuid not null references auth.users (id) on delete cascade,
  event_slug text not null,
  session_id text not null,
  created_at timestamptz not null default now(),
  primary key (user_id, event_slug, session_id)
);
alter table public.saved_sessions enable row level security;
drop policy if exists "own saved sessions" on public.saved_sessions;
create policy "own saved sessions" on public.saved_sessions for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ---------- Contacts you saved from someone's share card ----------
create table if not exists public.contacts (
  owner_id uuid not null references auth.users (id) on delete cascade,
  contact_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (owner_id, contact_id)
);
alter table public.contacts enable row level security;
drop policy if exists "own contacts" on public.contacts;
create policy "own contacts" on public.contacts for all
  using (owner_id = auth.uid()) with check (owner_id = auth.uid());

-- Your saved contacts, showing only what each person chose to share.
create or replace function public.get_my_contacts()
returns table (id uuid, display_name text, avatar_url text, contact_email text, phone text, linkedin_url text, website_url text, saved_at timestamptz)
language sql stable security definer set search_path = public as $$
  select p.id,
    case when p.share_name then p.display_name end,
    case when p.share_photo then p.avatar_url end,
    case when p.share_email then p.contact_email end,
    case when p.share_phone then p.phone end,
    case when p.share_linkedin then p.linkedin_url end,
    case when p.share_website then p.website_url end,
    c.created_at
  from public.contacts c join public.profiles p on p.id = c.contact_id
  where c.owner_id = auth.uid()
  order by c.created_at desc;
$$;

-- True when you are on the team of the organization that runs this event (by its id).
create or replace function public.manages_event(event_key text) returns boolean
language plpgsql stable security definer set search_path = public as $$
begin
  return exists (
    select 1 from public.events e join public.org_members m on m.org_id = e.org_id
    where e.id::text = event_key and m.user_id = auth.uid()
  );
exception when undefined_table then
  return false;
end $$;

-- ---------- Announcements ----------
create table if not exists public.announcements (
  id uuid primary key default gen_random_uuid(),
  event_slug text not null,
  title text not null,
  body text not null default '',
  publish_at timestamptz not null default now(),
  active boolean not null default true,
  archived boolean not null default false,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);
alter table public.announcements enable row level security;
drop policy if exists "read live announcements" on public.announcements;
create policy "read live announcements" on public.announcements for select
  using ((auth.uid() is not null and active and not archived and publish_at <= now()) or public.is_staff() or public.manages_event(event_slug));
drop policy if exists "staff write announcements" on public.announcements;
create policy "staff write announcements" on public.announcements for all
  using (public.is_staff() or public.manages_event(event_slug)) with check (public.is_staff() or public.manages_event(event_slug));

create table if not exists public.announcement_dismissals (
  user_id uuid not null references auth.users (id) on delete cascade,
  announcement_id uuid not null references public.announcements (id) on delete cascade,
  primary key (user_id, announcement_id)
);
alter table public.announcement_dismissals enable row level security;
drop policy if exists "own dismissals" on public.announcement_dismissals;
create policy "own dismissals" on public.announcement_dismissals for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ---------- Profile photos ----------
insert into storage.buckets (id, name, public) values ('avatars', 'avatars', true)
  on conflict (id) do nothing;
drop policy if exists "upload own avatar" on storage.objects;
create policy "upload own avatar" on storage.objects for insert
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists "replace own avatar" on storage.objects;
create policy "replace own avatar" on storage.objects for update
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

-- ============================================================
-- Organizations, event types, events and add-ons
-- ============================================================

create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null check (slug ~ '^[a-z0-9-]{2,60}$'),
  name text not null,
  about text not null default '',
  website text,
  contact_email text,
  is_nonprofit boolean not null default false,
  -- [{ "label": "Give monthly", "url": "https://..." }]
  donation_links jsonb not null default '[]',
  -- Basic is free: the organization page and event pages.
  plan text not null default 'basic',
  -- Paid extras: participant_hub, integrations, reporting.
  addons text[] not null default '{}',
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.org_members (
  org_id uuid not null references public.organizations (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role text not null default 'admin' check (role in ('owner', 'admin', 'organizer')),
  primary key (org_id, user_id)
);

-- Secrets an organization keeps for its integrations. Only its admins can read them.
create table if not exists public.org_secrets (
  org_id uuid primary key references public.organizations (id) on delete cascade,
  luma_api_key text,
  webhook_secret text not null default replace(gen_random_uuid()::text, '-', '')
);

create or replace function public.is_org_member(o uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.org_members m where m.org_id = o and m.user_id = auth.uid());
$$;

create or replace function public.is_org_admin(o uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.org_members m where m.org_id = o and m.user_id = auth.uid() and m.role in ('owner', 'admin'));
$$;

-- Whoever creates an organization becomes its owner.
create or replace function public.handle_new_org() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is not null then
    insert into public.org_members (org_id, user_id, role) values (new.id, auth.uid(), 'owner') on conflict do nothing;
  end if;
  insert into public.org_secrets (org_id) values (new.id) on conflict do nothing;
  return new;
end $$;
drop trigger if exists on_org_created on public.organizations;
create trigger on_org_created after insert on public.organizations
  for each row execute function public.handle_new_org();

alter table public.organizations enable row level security;
drop policy if exists "anyone reads orgs" on public.organizations;
create policy "anyone reads orgs" on public.organizations for select using (true);
drop policy if exists "signed in creates org" on public.organizations;
create policy "signed in creates org" on public.organizations for insert
  with check (auth.uid() is not null and created_by = auth.uid() and plan = 'basic' and addons = '{}');
drop policy if exists "admins edit org" on public.organizations;
create policy "admins edit org" on public.organizations for update using (public.is_org_admin(id));
drop policy if exists "owners delete org" on public.organizations;
create policy "owners delete org" on public.organizations for delete
  using (exists (select 1 from public.org_members m where m.org_id = id and m.user_id = auth.uid() and m.role = 'owner'));

alter table public.org_members enable row level security;
drop policy if exists "members see team" on public.org_members;
create policy "members see team" on public.org_members for select using (public.is_org_member(org_id) or user_id = auth.uid());
drop policy if exists "admins manage team" on public.org_members;
create policy "admins manage team" on public.org_members for all using (public.is_org_admin(org_id)) with check (public.is_org_admin(org_id));

alter table public.org_secrets enable row level security;
drop policy if exists "admins use secrets" on public.org_secrets;
create policy "admins use secrets" on public.org_secrets for all using (public.is_org_admin(org_id)) with check (public.is_org_admin(org_id));

create table if not exists public.event_types (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations (id) on delete cascade,
  name text not null,
  -- Which sections events of this type show, like {location,parking,agenda,food}.
  features text[] not null default '{location}',
  created_at timestamptz not null default now()
);
alter table public.event_types enable row level security;
drop policy if exists "anyone reads types" on public.event_types;
create policy "anyone reads types" on public.event_types for select using (true);
drop policy if exists "members manage types" on public.event_types;
create policy "members manage types" on public.event_types for all using (public.is_org_member(org_id)) with check (public.is_org_member(org_id));

create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations (id) on delete cascade,
  type_id uuid references public.event_types (id) on delete set null,
  slug text not null check (slug ~ '^[a-z0-9-]{2,80}$'),
  title text not null,
  starts_on date not null,
  time_text text not null default '',
  place text not null default '',
  address text,
  summary text not null default '',
  description text,
  price text,
  register_url text,
  register_label text,
  luma_event_id text,
  published boolean not null default false,
  -- Everything the event's features need: sessions, parking, speakers, hackathon tracks, meals...
  details jsonb not null default '{}',
  created_at timestamptz not null default now(),
  unique (org_id, slug)
);
alter table public.events enable row level security;
drop policy if exists "read published or own" on public.events;
create policy "read published or own" on public.events for select using (published or public.is_org_member(org_id));
drop policy if exists "members manage events" on public.events;
create policy "members manage events" on public.events for all using (public.is_org_member(org_id)) with check (public.is_org_member(org_id));

-- People registered for an event, from Luma, a webhook, or added by hand.
create table if not exists public.event_registrations (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events (id) on delete cascade,
  name text,
  email text not null,
  status text not null default 'going',
  checked_in boolean not null default false,
  source text not null default 'manual',
  created_at timestamptz not null default now(),
  unique (event_id, email)
);
alter table public.event_registrations enable row level security;
drop policy if exists "members see registrations" on public.event_registrations;
create policy "members see registrations" on public.event_registrations for all
  using (public.is_org_member((select e.org_id from public.events e where e.id = event_id)))
  with check (public.is_org_member((select e.org_id from public.events e where e.id = event_id)));

-- Webhooks: another app (Zapier, a form, Luma automations) posts a registration here.
-- The secret in the URL proves the sender is allowed. Runs without a signed-in user.
create or replace function public.webhook_register(org_slug text, secret text, event_slug text, p_name text, p_email text, p_status text, p_checked_in boolean)
returns text
language plpgsql security definer set search_path = public as $$
declare o uuid; e uuid;
begin
  select org.id into o from public.organizations org join public.org_secrets s on s.org_id = org.id
    where org.slug = org_slug and s.webhook_secret = secret and 'integrations' = any (org.addons);
  if o is null then return 'unauthorized'; end if;
  select ev.id into e from public.events ev where ev.org_id = o and ev.slug = event_slug;
  if e is null then return 'no_event'; end if;
  if p_email is null or position('@' in p_email) = 0 then return 'bad_email'; end if;
  insert into public.event_registrations (event_id, name, email, status, checked_in, source)
    values (e, left(p_name, 120), lower(left(p_email, 200)), coalesce(nullif(p_status, ''), 'going'), coalesce(p_checked_in, false), 'webhook')
    on conflict (event_id, email) do update set name = excluded.name, status = excluded.status,
      checked_in = public.event_registrations.checked_in or excluded.checked_in;
  return 'ok';
end $$;
grant execute on function public.webhook_register(text, text, text, text, text, text, boolean) to anon, authenticated;

-- Add-ons are paid extras. Until billing is connected, only a site admin can switch them on.
create or replace function public.set_org_addons(o uuid, new_addons text[]) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.has_role('admin') then raise exception 'Only site admins can change add-ons for now'; end if;
  update public.organizations set addons = array(
    select distinct a from unnest(new_addons) a where a in ('participant_hub', 'integrations', 'reporting')
  ) where id = o;
end $$;

-- Stop org admins from giving themselves paid add-ons by editing the row directly.
create or replace function public.protect_addons() returns trigger
language plpgsql as $$
begin
  if (new.addons is distinct from old.addons or new.plan is distinct from old.plan)
     and auth.uid() is not null and not public.has_role('admin') then
    new.addons := old.addons;
    new.plan := old.plan;
  end if;
  return new;
end $$;
drop trigger if exists organizations_protect_addons on public.organizations;
create trigger organizations_protect_addons before update on public.organizations
  for each row execute function public.protect_addons();

-- Add a teammate to an organization by the email they signed in with.
create or replace function public.add_org_member(o uuid, member_email text, member_role text) returns text
language plpgsql security definer set search_path = public as $$
declare uid uuid;
begin
  if not public.is_org_admin(o) then raise exception 'Only organization admins can add teammates'; end if;
  if member_role not in ('admin', 'organizer') then raise exception 'Role must be admin or organizer'; end if;
  select id into uid from public.profiles where lower(email) = lower(member_email);
  if uid is null then return 'not_found'; end if;
  insert into public.org_members (org_id, user_id, role) values (o, uid, member_role)
    on conflict (org_id, user_id) do update set role = excluded.role
    where public.org_members.role <> 'owner';
  return 'ok';
end $$;

-- Teammates with their names, for the organization settings page.
drop function if exists public.org_team(uuid);
create or replace function public.org_team(o uuid)
returns table (user_id uuid, role text, display_name text, email text)
language sql stable security definer set search_path = public as $$
  select m.user_id, m.role, p.display_name, p.email
  from public.org_members m left join public.profiles p on p.id = m.user_id
  where m.org_id = o and public.is_org_member(o)
  order by m.role, p.display_name;
$$;

-- Numbers for one event's report. Only the event's team (or site staff) can run it.
create or replace function public.event_report(event_key text)
returns table (registered bigint, going bigint, checked_in bigint, hub_people bigint, meal_counts jsonb, session_counts jsonb)
language plpgsql stable security definer set search_path = public as $$
begin
  if not (public.manages_event(event_key) or public.is_staff()) then
    raise exception 'Not allowed';
  end if;
  return query
  with regs as (
    select r.* from public.event_registrations r where r.event_id::text = event_key
  ),
  hub as (
    select distinct s.user_id from public.saved_sessions s where s.event_slug = event_key
  ),
  people as (
    select p.meal_prefs from public.profiles p
    where p.id in (select user_id from hub) or lower(p.email) in (select lower(email) from regs)
  )
  select
    (select count(*) from regs),
    (select count(*) from regs where status = 'going'),
    (select count(*) from regs where checked_in),
    (select count(*) from hub),
    coalesce((select jsonb_object_agg(m, n) from (select unnest(meal_prefs) m, count(*) n from people group by 1) t), '{}'::jsonb),
    coalesce((select jsonb_object_agg(session_id, n) from (select session_id, count(*) n from public.saved_sessions where event_slug = event_key group by 1) t), '{}'::jsonb);
end $$;


-- ============================================================
-- Programs: chapters, series, resource library and the member directory
-- ============================================================

-- ---------- Chapters: one organization, several cities ----------
create table if not exists public.chapters (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations (id) on delete cascade,
  slug text not null check (slug ~ '^[a-z0-9-]{2,60}$'),
  name text not null,
  city text not null default '',
  created_at timestamptz not null default now(),
  unique (org_id, slug)
);
alter table public.chapters enable row level security;
drop policy if exists "anyone reads chapters" on public.chapters;
create policy "anyone reads chapters" on public.chapters for select using (true);
drop policy if exists "admins manage chapters" on public.chapters;
create policy "admins manage chapters" on public.chapters for all using (public.is_org_admin(org_id)) with check (public.is_org_admin(org_id));

-- A teammate with a chapter only works on that chapter's events. No chapter means the whole organization.
alter table public.org_members add column if not exists chapter_id uuid references public.chapters (id) on delete set null;

-- Adding a teammate can now pick a chapter.
drop function if exists public.add_org_member(uuid, text, text);
create or replace function public.add_org_member(o uuid, member_email text, member_role text, member_chapter uuid default null) returns text
language plpgsql security definer set search_path = public as $$
declare uid uuid;
begin
  if not public.is_org_admin(o) then raise exception 'Only organization admins can add teammates'; end if;
  if member_role not in ('admin', 'organizer') then raise exception 'Role must be admin or organizer'; end if;
  if member_chapter is not null and not exists (select 1 from public.chapters c where c.id = member_chapter and c.org_id = o) then
    raise exception 'That chapter belongs to another organization';
  end if;
  select id into uid from public.profiles where lower(email) = lower(member_email);
  if uid is null then return 'not_found'; end if;
  insert into public.org_members (org_id, user_id, role, chapter_id) values (o, uid, member_role, member_chapter)
    on conflict (org_id, user_id) do update set role = excluded.role, chapter_id = excluded.chapter_id
    where public.org_members.role <> 'owner';
  return 'ok';
end $$;

-- ---------- Series: a cohort, a workshop series, a monthly meetup ----------
create table if not exists public.series (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations (id) on delete cascade,
  chapter_id uuid references public.chapters (id) on delete set null,
  slug text not null check (slug ~ '^[a-z0-9-]{2,60}$'),
  name text not null,
  description text not null default '',
  created_at timestamptz not null default now(),
  unique (org_id, slug)
);
alter table public.series enable row level security;
drop policy if exists "anyone reads series" on public.series;
create policy "anyone reads series" on public.series for select using (true);
drop policy if exists "members manage series" on public.series;
create policy "members manage series" on public.series for all using (public.is_org_member(org_id)) with check (public.is_org_member(org_id));

alter table public.events add column if not exists chapter_id uuid references public.chapters (id) on delete set null;
alter table public.events add column if not exists series_id uuid references public.series (id) on delete set null;

-- True when you can edit events in this chapter: you're on the whole team, or on that chapter's team.
create or replace function public.edits_chapter(o uuid, c uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.org_members m
    where m.org_id = o and m.user_id = auth.uid() and (m.chapter_id is null or m.chapter_id = c)
  );
$$;

drop policy if exists "members manage events" on public.events;
create policy "members manage events" on public.events for all
  using (public.edits_chapter(org_id, chapter_id)) with check (public.edits_chapter(org_id, chapter_id));

-- Team list now includes each person's chapter.
drop function if exists public.org_team(uuid);
create or replace function public.org_team(o uuid)
returns table (user_id uuid, role text, display_name text, email text, chapter_id uuid)
language sql stable security definer set search_path = public as $$
  select m.user_id, m.role, p.display_name, p.email, m.chapter_id
  from public.org_members m left join public.profiles p on p.id = m.user_id
  where m.org_id = o and public.is_org_member(o)
  order by m.role, p.display_name;
$$;

-- ---------- Resource library: slides, recordings and links, kept after the event ----------
create table if not exists public.resources (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations (id) on delete cascade,
  event_id uuid references public.events (id) on delete set null,
  series_id uuid references public.series (id) on delete set null,
  title text not null,
  url text not null,
  kind text not null default 'link' check (kind in ('slides', 'recording', 'link', 'doc', 'code')),
  topic text not null default 'General',
  description text not null default '',
  published boolean not null default true,
  created_at timestamptz not null default now()
);
alter table public.resources enable row level security;
drop policy if exists "read published resources" on public.resources;
create policy "read published resources" on public.resources for select using (published or public.is_org_member(org_id));
drop policy if exists "members manage resources" on public.resources;
create policy "members manage resources" on public.resources for all using (public.is_org_member(org_id)) with check (public.is_org_member(org_id));

-- ---------- Member directory (opt in) ----------
alter table public.profiles add column if not exists in_directory boolean not null default false;
alter table public.profiles add column if not exists headline text;
alter table public.profiles add column if not exists skills text[] not null default '{}';
alter table public.profiles add column if not exists interests text[] not null default '{}';

-- Signed-in people can search those who opted in. Only what each person chose to share comes back.
create or replace function public.directory_search(q text default '')
returns table (display_name text, avatar_url text, headline text, skills text[], interests text[], share_token text, linkedin_url text, website_url text)
language sql stable security definer set search_path = public as $$
  select
    case when p.share_name then p.display_name else 'FaithTech member' end,
    case when p.share_photo then p.avatar_url end,
    p.headline, p.skills, p.interests, p.share_token,
    case when p.share_linkedin then p.linkedin_url end,
    case when p.share_website then p.website_url end
  from public.profiles p
  where auth.uid() is not null and p.in_directory
    and (coalesce(q, '') = ''
      or p.display_name ilike '%' || q || '%'
      or p.headline ilike '%' || q || '%'
      or exists (select 1 from unnest(p.skills || p.interests) t where t ilike '%' || q || '%'))
  order by p.display_name
  limit 200;
$$;
grant execute on function public.directory_search(text) to authenticated;

-- ---------- Event planning (team only) ----------
-- Which planning tools an event uses. Admins switch them on and off per event.
alter table public.events add column if not exists planning_tools text[] not null default '{tasks,budget,venues,promotion,shopping,people}';

-- One row of a planning tool: a task, a budget line, a venue, a post, an item to buy...
create table if not exists public.plan_items (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events (id) on delete cascade,
  tool text not null check (tool in ('tasks', 'budget', 'venues', 'dates', 'promotion', 'shopping', 'people', 'outreach')),
  position int not null default 0,
  data jsonb not null default '{}',
  updated_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists plan_items_event on public.plan_items (event_id, tool, position);
alter table public.plan_items enable row level security;
drop policy if exists "team plans events" on public.plan_items;
create policy "team plans events" on public.plan_items for all
  using (exists (select 1 from public.events e where e.id = event_id and public.edits_chapter(e.org_id, e.chapter_id)))
  with check (exists (select 1 from public.events e where e.id = event_id and public.edits_chapter(e.org_id, e.chapter_id)));

-- ---------- Themes ----------
-- { "preset": "ocean", "accent": "#1d8fb9" } for everyone. Organizations with the
-- custom_branding add-on can also set colors, font, logo and extra CSS.
alter table public.organizations add column if not exists theme jsonb not null default '{}';

create or replace function public.limit_theme() returns trigger
language plpgsql as $$
begin
  if not ('custom_branding' = any (new.addons)) then
    new.theme := jsonb_strip_nulls(jsonb_build_object('preset', new.theme -> 'preset', 'accent', new.theme -> 'accent'));
  end if;
  return new;
end $$;
drop trigger if exists organizations_limit_theme on public.organizations;
create trigger organizations_limit_theme before insert or update on public.organizations
  for each row execute function public.limit_theme();

-- Add-ons now include custom branding.
create or replace function public.set_org_addons(o uuid, new_addons text[]) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.has_role('admin') then raise exception 'Only site admins can change add-ons for now'; end if;
  update public.organizations set addons = array(
    select distinct a from unnest(new_addons) a where a in ('participant_hub', 'integrations', 'reporting', 'custom_branding')
  ) where id = o;
end $$;

-- ---------- FaithTech LA's own organization ----------
-- Comes with every add-on. The admins listed at the bottom of this file become its owners.
insert into public.organizations (slug, name, about, website, is_nonprofit, addons)
values ('faithtech-la', 'FaithTech LA', 'Christians in tech in Los Angeles, building for the good of the city.', 'https://faithtech.com', true,
  '{participant_hub,integrations,reporting,custom_branding}')
on conflict (slug) do nothing;
update public.organizations set addons = '{participant_hub,integrations,reporting,custom_branding}' where slug = 'faithtech-la';
insert into public.event_types (org_id, name, features)
select o.id, t.name, t.features
from public.organizations o,
  (values ('Meetup', '{location,registration}'::text[]),
          ('Dinner', '{location,parking,registration,food}'::text[]),
          ('Workshop', '{location,parking,registration,agenda,speakers,food}'::text[]),
          ('Hackathon', '{location,parking,registration,agenda,food,hackathon,perks,on_the_day}'::text[]),
          ('Conference', '{location,parking,registration,agenda,speakers,food,perks,on_the_day}'::text[])) as t(name, features)
where o.slug = 'faithtech-la' and not exists (select 1 from public.event_types et where et.org_id = o.id);
insert into public.org_secrets (org_id) select id from public.organizations where slug = 'faithtech-la' on conflict do nothing;

-- ---------- Profiles for people who signed up before this file was run ----------
insert into public.profiles (id, email, display_name, avatar_url, contact_email)
select u.id, u.email,
  coalesce(u.raw_user_meta_data ->> 'full_name', u.raw_user_meta_data ->> 'name', split_part(u.email, '@', 1)),
  u.raw_user_meta_data ->> 'avatar_url', u.email
from auth.users u
on conflict (id) do nothing;

-- ============================================================
-- EDIT HERE: your email, so your account is an admin.
-- Add more lines like this for other organizers.
-- ============================================================
insert into public.bootstrap_admins (email) values ('you@example.com') on conflict do nothing;

select set_config('app.allow_roles', 'on', false);
update public.profiles p set roles = array['attendee', 'organizer', 'admin']
from public.bootstrap_admins b where lower(p.email) = lower(b.email);
select set_config('app.allow_roles', 'off', false);

-- The admins above own FaithTech LA's organization.
insert into public.org_members (org_id, user_id, role)
select o.id, p.id, 'owner'
from public.organizations o, public.profiles p, public.bootstrap_admins b
where o.slug = 'faithtech-la' and lower(p.email) = lower(b.email)
on conflict (org_id, user_id) do nothing;

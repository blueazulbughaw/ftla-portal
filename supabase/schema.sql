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
  using ((auth.uid() is not null and active and not archived and publish_at <= now()) or public.is_staff());
drop policy if exists "staff write announcements" on public.announcements;
create policy "staff write announcements" on public.announcements for all
  using (public.is_staff()) with check (public.is_staff());

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

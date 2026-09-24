-- General Business ERP - Supabase Auth + database setup
-- Run this entire file in Supabase SQL Editor.
-- IMPORTANT: user passwords are NOT stored in the ERP database. Supabase Auth
-- (auth.users) owns password hashes and authentication sessions.

create extension if not exists pgcrypto;

create table if not exists public.erp_state (
  id text primary key,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id)
);

alter table public.erp_state enable row level security;

drop policy if exists "erp users can read state" on public.erp_state;
create policy "erp users can read state"
on public.erp_state for select
to authenticated
using (public.is_active_erp_user());

drop policy if exists "erp users can write state" on public.erp_state;
create policy "erp users can write state"
on public.erp_state for insert
to authenticated
with check (public.is_active_erp_user());

drop policy if exists "erp users can update state" on public.erp_state;
create policy "erp users can update state"
on public.erp_state for update
to authenticated
using (public.is_active_erp_user())
with check (public.is_active_erp_user());

-- ERP profile / role mapping. Passwords are deliberately absent here.
create table if not exists public.erp_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique not null,
  full_name text,
  role text not null default 'Cashier / Sales Clerk'
    check (role in ('Admin / Owner','Accountant','Supervisor','Cashier / Sales Clerk')),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.erp_profiles enable row level security;

-- Active-account gate used by ERP data policies. This means disabling an account
-- also blocks direct database access for that user's existing Auth token.
create or replace function public.is_active_erp_user(uid uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.erp_profiles
    where id = uid and active = true
  );
$$;



drop policy if exists "profiles self read" on public.erp_profiles;
create policy "profiles self read"
on public.erp_profiles for select
to authenticated
using (id = auth.uid());

drop policy if exists "profiles self update" on public.erp_profiles;
create policy "profiles self update"
on public.erp_profiles for update
to authenticated
using (id = auth.uid())
with check (id = auth.uid());

-- Keep profile email aligned with the Auth email whenever the user updates it.
create or replace function public.sync_erp_profile_from_auth()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.erp_profiles
  set email = new.email,
      updated_at = now()
  where id = new.id;
  return new;
end;
$$;

drop trigger if exists trg_sync_erp_profile_auth on auth.users;
create trigger trg_sync_erp_profile_auth
after update of email on auth.users
for each row execute function public.sync_erp_profile_from_auth();

-- Automatically create a basic ERP profile whenever an Auth user is created.
-- An administrator can then set the correct role in erp_profiles.
create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.erp_profiles (id, email, full_name, role, active)
  values (
    new.id,
    lower(new.email),
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    'Cashier / Sales Clerk',
    true
  )
  on conflict (id) do update
    set email = excluded.email,
        full_name = coalesce(public.erp_profiles.full_name, excluded.full_name),
        updated_at = now();
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_auth_user();

insert into public.erp_state (id, data)
values ('main', '{}'::jsonb)
on conflict (id) do nothing;

create index if not exists idx_erp_state_updated_at on public.erp_state(updated_at);
create index if not exists idx_erp_profiles_email on public.erp_profiles(email);

-- Email 2FA challenges. No browser-accessible policies are created.
create table if not exists public.erp_login_2fa_challenges (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  code_hash text not null,
  expires_at timestamptz not null,
  attempts integer not null default 0,
  used_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.erp_login_2fa_challenges enable row level security;

create index if not exists idx_erp_2fa_email_created
  on public.erp_login_2fa_challenges(email, created_at desc);
create index if not exists idx_erp_2fa_expires
  on public.erp_login_2fa_challenges(expires_at);

-- Optional cleanup of the legacy application user/password data.
-- This removes the users key from the shared JSONB state if the old version
-- ever populated it. It does NOT affect auth.users or erp_profiles.
update public.erp_state
set data = data - 'users', updated_at = now()
where data ? 'users';

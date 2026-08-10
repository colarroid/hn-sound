-- 0001_auth_and_profiles.sql
-- Hope Nation Church, Sound & Technical Department
-- Phase 1: profiles, roles, department positions, and the signup trigger.

-- ---------------------------------------------------------------------------
-- Roles
-- ---------------------------------------------------------------------------
-- Role controls permissions. Department position (below) does not.
create type public.app_role as enum ('admin', 'senior_pastor', 'treasurer', 'member');

-- ---------------------------------------------------------------------------
-- Department positions (descriptive only, no permissions attached)
-- ---------------------------------------------------------------------------
create table public.department_positions (
  id          uuid primary key default gen_random_uuid(),
  name        text not null unique,
  sort_order  integer not null default 100,
  created_at  timestamptz not null default now()
);

insert into public.department_positions (name, sort_order) values
  ('Senior Engineer',          10),
  ('Front of House Engineer',  20),
  ('Monitor Engineer',         30),
  ('Stage Engineer',           40),
  ('Lighting Operator',        50),
  ('Camera Operator',          60),
  ('Stream Operator',          70),
  ('Presentation Operator',    80),
  ('Trainee',                  90);

-- ---------------------------------------------------------------------------
-- Profiles
-- ---------------------------------------------------------------------------
-- One row per auth.users row. Created automatically by the signup trigger.
create table public.profiles (
  id             uuid primary key references auth.users (id) on delete cascade,
  first_name     text not null default '',
  last_name      text not null default '',
  email          text not null,
  phone          text,
  -- Nullable at the database level so a malformed signup can never 500.
  -- The signup form requires it; the birthdays view skips nulls.
  date_of_birth  date,
  role           public.app_role not null default 'member',
  position_id    uuid references public.department_positions (id) on delete set null,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create index profiles_role_idx on public.profiles (role);
create index profiles_position_idx on public.profiles (position_id);
create index profiles_dob_idx on public.profiles (date_of_birth);

-- ---------------------------------------------------------------------------
-- updated_at
-- ---------------------------------------------------------------------------
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_touch_updated_at
  before update on public.profiles
  for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------------------
-- Role helpers
-- ---------------------------------------------------------------------------
-- security definer so policies on profiles can read profiles without recursing
-- through the very policies being evaluated.
create or replace function public.current_user_role()
returns public.app_role
language sql
security definer
stable
set search_path = public
as $$
  select role from public.profiles where id = auth.uid()
$$;

create or replace function public.is_admin()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select coalesce(public.current_user_role() = 'admin', false)
$$;

revoke execute on function public.current_user_role() from anon;
revoke execute on function public.is_admin() from anon;

-- ---------------------------------------------------------------------------
-- Signup trigger
-- ---------------------------------------------------------------------------
-- Everyone lands as 'member'. The admin assigns role and position afterwards,
-- so neither is read from signup metadata here.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, first_name, last_name, email, phone, date_of_birth)
  values (
    new.id,
    coalesce(nullif(trim(new.raw_user_meta_data ->> 'first_name'), ''), ''),
    coalesce(nullif(trim(new.raw_user_meta_data ->> 'last_name'), ''), ''),
    new.email,
    nullif(trim(new.raw_user_meta_data ->> 'phone'), ''),
    -- Guard the cast: bad input leaves the column null rather than failing signup.
    case
      when (new.raw_user_meta_data ->> 'date_of_birth') ~ '^\d{4}-\d{2}-\d{2}$'
        then (new.raw_user_meta_data ->> 'date_of_birth')::date
      else null
    end
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Keep profiles.email in step if the user changes their auth email.
create or replace function public.handle_user_email_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.email is distinct from old.email then
    update public.profiles set email = new.email where id = new.id;
  end if;
  return new;
end;
$$;

create trigger on_auth_user_email_changed
  after update of email on auth.users
  for each row execute function public.handle_user_email_change();

-- ---------------------------------------------------------------------------
-- Privilege guard
-- ---------------------------------------------------------------------------
-- Members may edit their own contact details. Only an admin may change role or
-- position, so non-admin updates silently keep the old values.
create or replace function public.guard_profile_privileges()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    new.role        := old.role;
    new.position_id := old.position_id;
    new.created_at  := old.created_at;
  end if;
  return new;
end;
$$;

create trigger profiles_guard_privileges
  before update on public.profiles
  for each row execute function public.guard_profile_privileges();

-- ---------------------------------------------------------------------------
-- Row level security
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.department_positions enable row level security;

-- Directory: every signed-in member sees every member.
create policy profiles_select_authenticated
  on public.profiles for select
  to authenticated
  using (true);

-- Own row, or anything if admin. Role and position changes are still filtered
-- by guard_profile_privileges above.
create policy profiles_update_own_or_admin
  on public.profiles for update
  to authenticated
  using (id = auth.uid() or public.is_admin())
  with check (id = auth.uid() or public.is_admin());

create policy profiles_delete_admin
  on public.profiles for delete
  to authenticated
  using (public.is_admin());

create policy positions_select_authenticated
  on public.department_positions for select
  to authenticated
  using (true);

create policy positions_write_admin
  on public.department_positions for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

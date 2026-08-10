-- 0005_repair_migration_order.sql
-- The Hope Nation Church, Sound & Technical Department
--
-- Repair script. 0003 and 0004 both redefine guard_profile_privileges, so
-- applying them out of order leaves the wrong version installed and every
-- profile update fails with: record "new" has no field "approval_status".
--
-- This script is idempotent and brings the database to the intended final state
-- no matter which of 0003 and 0004 ran, or in what order. Safe to run after a
-- clean in-order install too, where it changes nothing.

-- ---------------------------------------------------------------------------
-- 1. The approval enum
-- ---------------------------------------------------------------------------
-- Its own statement, so the ALTER TABLE below resolves a type that already
-- exists rather than one created in the same plpgsql block.
do $$
begin
  if not exists (select 1 from pg_type where typname = 'member_approval_status') then
    create type public.member_approval_status as enum ('pending', 'approved', 'declined');
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- 2. Columns
-- ---------------------------------------------------------------------------
do $$
declare
  column_was_added boolean := false;
begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'profiles'
      and column_name = 'approval_status'
  ) then
    alter table public.profiles
      add column approval_status public.member_approval_status not null default 'pending';
    column_was_added := true;
  end if;

  alter table public.profiles add column if not exists approved_at    timestamptz;
  alter table public.profiles add column if not exists decline_reason text;
  alter table public.profiles add column if not exists position       text;

  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'profiles'
      and column_name = 'approved_by'
  ) then
    alter table public.profiles
      add column approved_by uuid references public.profiles (id) on delete set null;
  end if;

  -- Only on the pass that introduces the gate. Anyone who already had an account
  -- predates it and was already inside. Guarded so a later re-run cannot sweep a
  -- genuinely pending member through to approved.
  if column_was_added then
    update public.profiles
    set approval_status = 'approved',
        approved_at = coalesce(created_at, now());
  end if;
end $$;

create index if not exists profiles_approval_idx on public.profiles (approval_status);

-- ---------------------------------------------------------------------------
-- 3. Helpers
-- ---------------------------------------------------------------------------
create or replace function public.is_approved()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select coalesce(
    (select approval_status = 'approved' from public.profiles where id = auth.uid()),
    false
  )
$$;

revoke execute on function public.is_approved() from anon;

-- ---------------------------------------------------------------------------
-- 4. Signup trigger
-- ---------------------------------------------------------------------------
-- Somebody has to be first, and there is nobody to approve them, so the very
-- first profile is approved on creation. Every profile after it waits.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  is_first boolean;
begin
  select not exists (select 1 from public.profiles) into is_first;

  insert into public.profiles (
    id, first_name, last_name, email, phone, date_of_birth,
    approval_status, approved_at
  )
  values (
    new.id,
    coalesce(nullif(trim(new.raw_user_meta_data ->> 'first_name'), ''), ''),
    coalesce(nullif(trim(new.raw_user_meta_data ->> 'last_name'), ''), ''),
    new.email,
    nullif(trim(new.raw_user_meta_data ->> 'phone'), ''),
    case
      when (new.raw_user_meta_data ->> 'date_of_birth') ~ '^\d{4}-\d{2}-\d{2}$'
        then (new.raw_user_meta_data ->> 'date_of_birth')::date
      else null
    end,
    case when is_first then 'approved'::public.member_approval_status else 'pending' end,
    case when is_first then now() else null end
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- 5. The privilege guard, correct final version
-- ---------------------------------------------------------------------------
-- This is the one that was left broken. It references position, not position_id,
-- and every column it protects now actually exists.
create or replace function public.guard_profile_privileges()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is not null and not public.is_admin() then
    new.role            := old.role;
    new.position        := old.position;
    new.approval_status := old.approval_status;
    new.approved_at     := old.approved_at;
    new.approved_by     := old.approved_by;
    new.decline_reason  := old.decline_reason;
    new.created_at      := old.created_at;
  end if;
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- 6. Row level security
-- ---------------------------------------------------------------------------
-- A pending account holds a valid token, so without this it could read the whole
-- members directory straight off the API while sitting on the waiting screen.
drop policy if exists profiles_select_authenticated on public.profiles;
drop policy if exists profiles_select_approved_or_self on public.profiles;

create policy profiles_select_approved_or_self
  on public.profiles for select
  to authenticated
  using (
    id = auth.uid()
    or public.is_approved()
    or public.is_admin()
  );

-- department_positions is gone as of 0004, so its policies went with it. Nothing
-- to re-create here.

-- 0003_signup_approval.sql
-- The Hope Nation Church, Sound & Technical Department
--
-- Adds an admin approval step after signup. Confirming the email address is no
-- longer enough to reach the dashboard: the head of department has to let each
-- new member in, so a stranger who finds the URL gets no further than a waiting
-- screen.

create type public.member_approval_status as enum ('pending', 'approved', 'declined');

alter table public.profiles
  add column approval_status public.member_approval_status not null default 'pending',
  add column approved_at     timestamptz,
  add column approved_by     uuid references public.profiles (id) on delete set null,
  add column decline_reason  text;

-- Anyone who already had an account predates the gate and was already inside.
update public.profiles
set approval_status = 'approved',
    approved_at = coalesce(created_at, now())
where approval_status = 'pending';

create index profiles_approval_idx on public.profiles (approval_status);

-- ---------------------------------------------------------------------------
-- Approval helper
-- ---------------------------------------------------------------------------
-- security definer for the same reason as is_admin: policies on profiles need to
-- read profiles without recursing through the policies being evaluated.
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
-- Signup trigger: bootstrap the first account
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
    -- Guard the cast: bad input leaves the column null rather than failing signup.
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
-- Privilege guard: approval is not self service
-- ---------------------------------------------------------------------------
-- Without the approval columns listed here a member could approve themselves
-- with a single API call, which would defeat the entire gate.
create or replace function public.guard_profile_privileges()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is not null and not public.is_admin() then
    new.role            := old.role;
    new.position_id     := old.position_id;
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
-- Row level security: an unapproved account sees only itself
-- ---------------------------------------------------------------------------
-- The point of the gate is that the public gains nothing by signing up. A
-- pending account holds a valid token, so without this it could still read the
-- whole members directory straight off the API.
drop policy if exists profiles_select_authenticated on public.profiles;

create policy profiles_select_approved_or_self
  on public.profiles for select
  to authenticated
  using (
    id = auth.uid()
    or public.is_approved()
    or public.is_admin()
  );

drop policy if exists positions_select_authenticated on public.department_positions;

create policy positions_select_approved
  on public.department_positions for select
  to authenticated
  using (public.is_approved() or public.is_admin());

-- 0004_position_as_text.sql
-- The Hope Nation Church, Sound & Technical Department
--
-- Department position becomes free text that the admin types during approval,
-- rather than a pick from a fixed lookup table. Titles in a department like this
-- one are not a closed set: Asst. Head of Department, Stage Engineer, and
-- whatever the department invents next all need to fit without a migration.
--
-- DESTRUCTIVE: this drops public.department_positions. The table only ever held
-- suggestions, and those now live in the app as a datalist, so nothing that
-- matters is lost. Read this before running it.

alter table public.profiles
  add column position text;

-- Carry across anything already assigned before the table goes.
update public.profiles p
set position = dp.name
from public.department_positions dp
where p.position_id = dp.id;

-- Dropping the column takes profiles_position_idx and the foreign key with it.
alter table public.profiles
  drop column position_id;

drop table public.department_positions;

-- ---------------------------------------------------------------------------
-- Privilege guard
-- ---------------------------------------------------------------------------
-- Position is descriptive and grants nothing, but the brief is explicit that the
-- admin assigns it, so it stays out of reach of the member it describes. Same
-- treatment as role: a non-admin update silently keeps the old value.
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

-- 0002_fix_privilege_guard.sql
-- Hope Nation Church, Sound & Technical Department
--
-- Fixes a guard that was too broad. In 0001, guard_profile_privileges reverted
-- every role and position change unless is_admin() returned true. But is_admin()
-- reads auth.uid(), and auth.uid() is null for the service role and for the SQL
-- editor. The guard therefore silently reverted trusted server side updates as
-- well, including the one statement needed to appoint the very first admin, so
-- there was no way to appoint one at all.
--
-- The guard now only applies when a signed-in user is behind the request.

create or replace function public.guard_profile_privileges()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- auth.uid() is null for the service role and for the SQL editor, which are
  -- the trusted paths. It is never null for an end user request. The anon role
  -- cannot reach this trigger at all: the UPDATE policy on profiles is granted
  -- to authenticated only.
  if auth.uid() is not null and not public.is_admin() then
    new.role        := old.role;
    new.position_id := old.position_id;
    new.created_at  := old.created_at;
  end if;
  return new;
end;
$$;

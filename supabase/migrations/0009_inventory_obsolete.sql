-- 0009_inventory_obsolete.sql
-- The Hope Nation Church, Sound & Technical Department
--
-- Adds 'obsolete' as a fourth inventory status, and marks the ten items the 2025
-- fixed asset register already recorded that way.
--
-- Obsolete is deliberately not the same as faulty. A faulty item is broken and
-- belongs on the needs-fixing list. An obsolete item still works but has reached
-- end of life and should be planned for replacement. Folding the two together
-- would fill the repair list with things nobody can repair.
--
-- ---------------------------------------------------------------------------
-- IMPORTANT: run STEP 1 on its own, then run the rest.
-- Postgres will not let a brand new enum value be used in the same transaction
-- that created it, and the SQL editor may wrap a multi statement script in one.
-- If you see "unsafe use of new value of enum type", that is why.
-- ---------------------------------------------------------------------------

-- STEP 1 ---------------------------------------------------------------------
alter type public.inventory_status add value if not exists 'obsolete';

-- STEP 2 ---------------------------------------------------------------------
-- Only items the register itself called obsolete, and only if nobody has since
-- flagged them as faulty, so this cannot trample a real fault report.
update public.inventory_items
set status = 'obsolete'
where notes like '%Condition recorded: OBSOLETE%'
  and status = 'ok';

-- STEP 3 ---------------------------------------------------------------------
-- Obsolescence is a judgement about replacing kit, so it is the admin's call, as
-- is retiring. An ordinary member may still move an item between working and
-- faulty, which is the half they actually need.
create or replace function public.guard_inventory_edits()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- auth.uid() is null for the service role and the SQL editor, both trusted.
  if auth.uid() is null or public.is_admin() then
    return new;
  end if;

  if new.added_by is distinct from auth.uid() then
    new.name          := old.name;
    new.category_id   := old.category_id;
    new.quantity      := old.quantity;
    new.serial_number := old.serial_number;
    new.location      := old.location;
    new.notes         := old.notes;
  end if;

  -- A non-admin may only move between 'ok' and 'faulty'. Anything else, in either
  -- direction, keeps the status it already had.
  if not (old.status in ('ok', 'faulty') and new.status in ('ok', 'faulty')) then
    new.status := old.status;
  end if;

  new.added_by   := old.added_by;
  new.created_at := old.created_at;
  return new;
end;
$$;

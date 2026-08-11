-- 0010_fix_obsolete_fault_flagging.sql
-- The Hope Nation Church, Sound & Technical Department
--
-- Fixes a guard that was too strict. 0009 allowed a non-admin to move an item
-- only when its CURRENT status was already 'ok' or 'faulty', which quietly blocked
-- the ordinary case of an obsolete item breaking: the fault note was written but
-- the status was reverted, leaving a row that claimed to be fine while carrying a
-- fault report.
--
-- Permitted transitions for a non-admin are now spelled out one by one:
--
--   ok       -> faulty    someone found a fault
--   obsolete -> faulty    an obsolete item can still break
--   faulty   -> ok        someone repaired it
--
-- Everything else keeps the status it had. In particular a member still cannot
-- retire an item, cannot mark one obsolete, and cannot quietly clear an admin's
-- obsolete marking without reporting an actual fault.
--
-- Note the consequence: clearing a fault lands the item on 'ok', not back on
-- 'obsolete'. If it is still due for replacement, an admin marks it obsolete again.

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

  if not (
       (old.status in ('ok', 'obsolete') and new.status = 'faulty')
    or (old.status = 'faulty' and new.status = 'ok')
    or (old.status = new.status)
  ) then
    new.status := old.status;
  end if;

  -- A reverted status must not leave a fault report behind claiming otherwise.
  if new.status <> 'faulty' then
    new.fault_note := old.fault_note;
    new.flagged_by := old.flagged_by;
    new.flagged_at := old.flagged_at;
  end if;

  new.added_by   := old.added_by;
  new.created_at := old.created_at;
  return new;
end;
$$;

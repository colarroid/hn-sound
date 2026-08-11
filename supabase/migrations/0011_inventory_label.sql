-- 0011_inventory_label.sql
-- The Hope Nation Church, Sound & Technical Department
--
-- Adds a short distinguishing label to inventory items, because 50 of the 83
-- imported items sit in 16 groups that share a name. Six rows all read "SHURE
-- Mics", so "the mic is faulty" was impossible to pin to a row.
--
-- The label is the human handle: Blue, Floor Tom, Stage Left, Bishop's. It is not
-- the serial number, which nobody reads off a cable in the middle of a service.

alter table public.inventory_items
  add column label text;

alter table public.inventory_items
  add constraint inventory_items_label_check
  check (label is null or char_length(label) <= 60);

-- Two names already carry their distinguisher inside brackets. Lift it into the
-- new field so the data is consistent with how the field is meant to be used, and
-- so those rows join their own name group properly.
update public.inventory_items
set name = 'Drum mic', label = 'Kick'
where name = 'Drum mic(KICK)';

update public.inventory_items
set name = 'SHURE Mics', label = 'Bishop''s'
where name = 'SHURE Mics(Bishop''s Mic)';

-- The label is a detail, so it follows the same rule as the other details: the
-- admin, or whoever added the item, may change it. Everyone can still flag faults.
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
    new.label         := old.label;
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

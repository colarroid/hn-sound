-- 0008_inventory.sql
-- The Hope Nation Church, Sound & Technical Department
--
-- Inventory: items grouped into categories, any member can add an item or flag
-- one as faulty, and a faulty item lands on the needs-fixing list.
--
-- The senior pastor reads the inventory and writes nothing, consistent with the
-- role everywhere else in the platform.

create type public.inventory_status as enum ('ok', 'faulty', 'retired');

create table public.inventory_categories (
  id         uuid primary key default gen_random_uuid(),
  name       text not null unique,
  sort_order integer not null default 100,
  created_at timestamptz not null default now()
);

insert into public.inventory_categories (name, sort_order) values
  ('Speakers',            10),
  ('Microphones',         20),
  ('Cables',              30),
  ('Mixing Desks',        40),
  ('Stands and Mounts',   50),
  ('Amplifiers',          60),
  ('Lighting',            70),
  ('Cameras',             80),
  ('Streaming',           90),
  ('Instruments',        100),
  ('Accessories',        110);

create table public.inventory_items (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  -- Nullable on purpose: a member should never be blocked from recording an item
  -- because the right category does not exist yet. It files under Uncategorised
  -- until an admin sorts it.
  category_id   uuid references public.inventory_categories (id) on delete set null,
  quantity      integer not null default 1,
  serial_number text,
  location      text,
  notes         text,

  status        public.inventory_status not null default 'ok',
  fault_note    text,
  flagged_by    uuid references public.profiles (id) on delete set null,
  flagged_at    timestamptz,
  resolved_by   uuid references public.profiles (id) on delete set null,
  resolved_at   timestamptz,

  added_by      uuid references public.profiles (id) on delete set null,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),

  constraint inventory_items_quantity_check check (quantity >= 0 and quantity <= 100000)
);

create index inventory_items_status_idx on public.inventory_items (status);
create index inventory_items_category_idx on public.inventory_items (category_id);
create index inventory_items_name_idx on public.inventory_items (name);

create trigger inventory_items_touch_updated_at
  before update on public.inventory_items
  for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------------------
-- Who may write
-- ---------------------------------------------------------------------------
-- Every approved member except the senior pastor, who is view only throughout.
create or replace function public.can_edit_inventory()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select coalesce(
    (select approval_status = 'approved' and role <> 'senior_pastor'
     from public.profiles where id = auth.uid()),
    false
  )
$$;

revoke execute on function public.can_edit_inventory() from anon;

-- ---------------------------------------------------------------------------
-- Edit guard
-- ---------------------------------------------------------------------------
-- Flagging a fault and clearing one are open to any writing member, because
-- whoever finds a dead cable is rarely the admin. The item's own details are for
-- the admin, or for whoever added it, so one member cannot quietly rewrite
-- another's entry. Retiring an item is admin only.
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

  if new.status = 'retired' and old.status <> 'retired' then
    new.status := old.status;
  end if;

  new.added_by   := old.added_by;
  new.created_at := old.created_at;
  return new;
end;
$$;

create trigger inventory_items_guard_edits
  before update on public.inventory_items
  for each row execute function public.guard_inventory_edits();

-- ---------------------------------------------------------------------------
-- Row level security
-- ---------------------------------------------------------------------------
alter table public.inventory_categories enable row level security;
alter table public.inventory_items enable row level security;

-- Everyone approved reads both, the senior pastor included.
create policy inventory_categories_select
  on public.inventory_categories for select
  to authenticated
  using (public.is_approved());

create policy inventory_categories_write_admin
  on public.inventory_categories for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy inventory_items_select
  on public.inventory_items for select
  to authenticated
  using (public.is_approved());

create policy inventory_items_insert
  on public.inventory_items for insert
  to authenticated
  with check (public.can_edit_inventory());

create policy inventory_items_update
  on public.inventory_items for update
  to authenticated
  using (public.can_edit_inventory())
  with check (public.can_edit_inventory());

create policy inventory_items_delete_admin
  on public.inventory_items for delete
  to authenticated
  using (public.is_admin());

-- 0006_training.sql
-- The Hope Nation Church, Sound & Technical Department
--
-- Training materials with per member eligibility. A member sees only what they
-- have been made eligible for, and a member eligible for nothing gets an access
-- denied screen rather than an empty list.
--
-- Eligibility is explicit. There is no "everyone can see this" flag, because the
-- brief is that members see only what they are eligible for.

create type public.training_material_kind as enum ('link', 'file');

create table public.training_materials (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  summary     text,
  kind        public.training_material_kind not null,

  -- Exactly one of these is used, enforced by the check below.
  url         text,
  file_path   text,
  file_name   text,
  file_size   bigint,
  mime_type   text,

  created_by  uuid references public.profiles (id) on delete set null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),

  constraint training_materials_location_check check (
    (kind = 'link' and url is not null and file_path is null)
    or
    (kind = 'file' and file_path is not null and url is null)
  )
);

create trigger training_materials_touch_updated_at
  before update on public.training_materials
  for each row execute function public.touch_updated_at();

create table public.training_eligibility (
  material_id uuid not null references public.training_materials (id) on delete cascade,
  profile_id  uuid not null references public.profiles (id) on delete cascade,
  granted_by  uuid references public.profiles (id) on delete set null,
  granted_at  timestamptz not null default now(),
  primary key (material_id, profile_id)
);

create index training_eligibility_profile_idx on public.training_eligibility (profile_id);
create index training_materials_created_idx on public.training_materials (created_at desc);

-- ---------------------------------------------------------------------------
-- Oversight helper
-- ---------------------------------------------------------------------------
-- The senior pastor sees everything the admin manages and changes none of it,
-- so they read the whole training library without needing eligibility rows.
create or replace function public.can_oversee()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select coalesce(
    (select role in ('admin', 'senior_pastor') and approval_status = 'approved'
     from public.profiles where id = auth.uid()),
    false
  )
$$;

revoke execute on function public.can_oversee() from anon;

-- ---------------------------------------------------------------------------
-- Row level security
-- ---------------------------------------------------------------------------
alter table public.training_materials enable row level security;
alter table public.training_eligibility enable row level security;

-- A member reads a material only if an eligibility row names them. Approval is
-- part of the test, so a pending account sees nothing here either.
create policy training_materials_select
  on public.training_materials for select
  to authenticated
  using (
    public.can_oversee()
    or (
      public.is_approved()
      and exists (
        select 1 from public.training_eligibility e
        where e.material_id = training_materials.id
          and e.profile_id = auth.uid()
      )
    )
  );

create policy training_materials_write_admin
  on public.training_materials for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- A member can see which materials they were granted, and nobody else's grants.
create policy training_eligibility_select
  on public.training_eligibility for select
  to authenticated
  using (profile_id = auth.uid() or public.can_oversee());

create policy training_eligibility_write_admin
  on public.training_eligibility for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- Storage
-- ---------------------------------------------------------------------------
-- Private bucket. No storage policies are added on purpose: with RLS on and no
-- policy granting access, neither anon nor authenticated can touch these objects
-- directly. Uploads and downloads both go through server actions that check the
-- caller first, then use the service role. Eligibility is enforced in one place
-- rather than duplicated into storage policies.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'training',
  'training',
  false,
  10485760, -- 10 MB. Host video as a link instead; the free tier has 1 GB total.
  array[
    'application/pdf',
    'image/png',
    'image/jpeg',
    'image/webp',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/plain'
  ]
)
on conflict (id) do nothing;

-- 0012_events.sql
-- The Hope Nation Church, Sound & Technical Department
--
-- Events the admin creates: one-off, or repeating on chosen weekdays with a time.
-- "Monday to Friday" and "just Mondays" are both a weekly event with a different
-- set of weekdays, so there is one recurring shape rather than a pattern language.
--
-- Occurrences are not stored. A weekly event is one row, and the app works out the
-- next dates when it draws the list. Storing every future occurrence would mean
-- rewriting rows whenever the schedule changed, and deciding how far ahead to
-- generate. Nothing to drift out of step this way.

create type public.event_recurrence as enum ('once', 'weekly');

create table public.events (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  description text,
  location    text,

  recurrence  public.event_recurrence not null default 'once',

  -- Used when recurrence is 'once'.
  starts_on   date,

  -- Used when recurrence is 'weekly'. 0 is Sunday, 6 is Saturday, matching
  -- JavaScript's getUTCDay so no translation is needed at the boundary.
  weekdays    smallint[],

  -- Both kinds may carry a time of day. Null means the time is not fixed yet.
  starts_at   time,
  ends_at     time,

  -- Optional bounds for a recurring event, for a term or a season.
  active_from  date,
  active_until date,

  created_by  uuid references public.profiles (id) on delete set null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),

  constraint events_shape_check check (
    (recurrence = 'once'   and starts_on is not null and weekdays is null)
    or
    (recurrence = 'weekly' and weekdays is not null and array_length(weekdays, 1) between 1 and 7)
  ),

  constraint events_weekdays_range_check check (
    weekdays is null or (
      0 <= all (weekdays) and 6 >= all (weekdays)
    )
  ),

  constraint events_time_order_check check (
    starts_at is null or ends_at is null or ends_at > starts_at
  ),

  constraint events_active_range_check check (
    active_from is null or active_until is null or active_until >= active_from
  )
);

create index events_recurrence_idx on public.events (recurrence);
create index events_starts_on_idx on public.events (starts_on);

create trigger events_touch_updated_at
  before update on public.events
  for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------------------
-- Row level security
-- ---------------------------------------------------------------------------
alter table public.events enable row level security;

-- Every approved member reads the schedule, the senior pastor included.
create policy events_select
  on public.events for select
  to authenticated
  using (public.is_approved());

-- Only the admin runs the calendar.
create policy events_write_admin
  on public.events for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- 0013_fix_event_shape_check.sql
-- The Hope Nation Church, Sound & Technical Department
--
-- Fixes a check constraint that let an impossible event through.
--
-- 0012 wrote:  array_length(weekdays, 1) between 1 and 7
--
-- For an empty array, array_length('{}', 1) returns NULL rather than 0, so the
-- comparison evaluated to NULL, and a CHECK constraint only rejects a row when it
-- evaluates to FALSE. NULL counts as satisfied. A weekly event with an empty
-- weekday set therefore saved happily and then never occurred: it appeared in the
-- Every event list and nowhere in the diary.
--
-- The app already refused this in the action, so the UI never produced one. This
-- closes the same gap in the database, which is where it belongs.

-- Any row already in this state can never occur, so it has nothing to lose.
delete from public.events
where recurrence = 'weekly'
  and coalesce(array_length(weekdays, 1), 0) = 0;

alter table public.events
  drop constraint if exists events_shape_check;

alter table public.events
  add constraint events_shape_check check (
    (recurrence = 'once' and starts_on is not null and weekdays is null)
    or
    (recurrence = 'weekly' and coalesce(array_length(weekdays, 1), 0) between 1 and 7)
  );

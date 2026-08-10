-- 0007_training_lessons.sql
-- The Hope Nation Church, Sound & Technical Department
--
-- Training material becomes a course rather than a pile of files. Two additions:
--
--   lesson_number  which week of the course the material belongs to
--   expectations   what the trainer wants the trainee to take away from it
--
-- lesson_number is an integer rather than text like 'Week 1' so that week 10
-- sorts after week 9 instead of after week 1. Both are nullable: a reference
-- manual that belongs to no particular week is still a legitimate material.

alter table public.training_materials
  add column lesson_number integer,
  add column expectations  text;

alter table public.training_materials
  add constraint training_materials_lesson_number_check
  check (lesson_number is null or (lesson_number >= 1 and lesson_number <= 999));

-- Course order, with the unnumbered reference material trailing behind.
create index training_materials_lesson_idx
  on public.training_materials (lesson_number nulls last, created_at desc);

-- Add sex and department columns to students table
-- Run this in Supabase SQL Editor

alter table students add column if not exists sex text;
alter table students add column if not exists department text;

-- Update the attendance_log view to include new columns
create or replace view attendance_log as
select
  a.id,
  a.uid,
  a.scanned_at,
  s.full_name,
  s.phone,
  s.class,
  s.sex,
  s.department
from attendance a
left join students s on s.id = a.student_id
order by a.scanned_at desc;

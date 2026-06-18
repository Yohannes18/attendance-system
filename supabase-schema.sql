-- ============================================================
-- NFC Attendance System — Supabase Schema
-- Run this in Supabase SQL Editor (Project -> SQL Editor -> New Query)
-- ============================================================

-- Students table: one row per registered RFID/NFC card
create table if not exists students (
  id          uuid primary key default gen_random_uuid(),
  uid         text unique not null,        -- card UID, e.g. "7A810E06"
  full_name   text not null,
  phone       text,
  class       text,
  sex         text,                        -- Male, Female, Other
  department  text,                        -- Department/Faculty
  created_at  timestamptz default now()
);

-- Attendance table: one row per scan event
create table if not exists attendance (
  id          uuid primary key default gen_random_uuid(),
  student_id  uuid references students(id) on delete cascade,
  uid         text not null,               -- denormalized for fast lookups / debugging
  scanned_at  timestamptz default now()
);

-- Helpful index for dashboard queries (filter by date/class)
create index if not exists idx_attendance_scanned_at on attendance(scanned_at desc);
create index if not exists idx_students_uid on students(uid);

-- ============================================================
-- Row Level Security
-- The ESP8266 and the website both use the Supabase ANON key.
-- We enable RLS and add permissive policies scoped to what's needed.
-- For a portfolio/demo project this keeps things simple; tighten
-- later if this ever becomes a real production deployment.
-- ============================================================

alter table students enable row level security;
alter table attendance enable row level security;

-- Anyone with the anon key can read students (needed for dashboard + UID lookup)
create policy "allow read students" on students
  for select using (true);

-- Anyone with the anon key can insert a new student (registration form)
create policy "allow insert students" on students
  for insert with check (true);

-- Anyone with the anon key can read attendance (dashboard)
create policy "allow read attendance" on attendance
  for select using (true);

-- Anyone with the anon key can insert attendance (ESP8266 scan)
create policy "allow insert attendance" on attendance
  for insert with check (true);

-- ============================================================
-- Optional: a view that joins attendance with student info,
-- so the dashboard can query one place instead of joining client-side.
-- ============================================================
create or replace view attendance_log as
select
  a.id,
  a.uid,
  a.scanned_at,
  s.full_name,
  s.phone,
  s.class
from attendance a
left join students s on s.id = a.student_id
order by a.scanned_at desc;

-- ============================================================
-- RPC function: log_attendance(p_uid)
-- Lets the ESP8266 do ONE call to insert an attendance row.
-- Looks up the student by UID server-side and inserts the
-- linked attendance record atomically. Call via:
--   POST /rest/v1/rpc/log_attendance   body: {"p_uid": "7A810E06"}
-- ============================================================
create or replace function log_attendance(p_uid text)
returns void as $$
declare
  v_student_id uuid;
begin
  select id into v_student_id from students where uid = p_uid;

  insert into attendance (student_id, uid)
  values (v_student_id, p_uid);
end;
$$ language plpgsql security definer;

-- Allow the anon key to call this function
grant execute on function log_attendance(text) to anon;

-- ============================================================
-- Enable Realtime on the attendance table so the dashboard's
-- live feed updates instantly when the ESP8266 logs a scan.
-- (Supabase dashboard: Database -> Replication is the GUI
-- equivalent of this if you'd rather click through it.)
-- ============================================================
alter publication supabase_realtime add table attendance;

-- Add semester management and absence tracking

-- Semesters table
create table if not exists semesters (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,              -- e.g. "2024-2025 Semester 1"
  start_date  date not null,
  end_date    date not null,
  max_absent  int default 5,
  alert_at    int default 4,              -- alert when reaches this count
  created_at  timestamptz default now()
);

-- Expected attendance (class schedule)
create table if not exists class_schedule (
  id          uuid primary key default gen_random_uuid(),
  student_id  uuid references students(id) on delete cascade,
  semester_id uuid references semesters(id) on delete cascade,
  date        date not null,
  status      text default 'pending',     -- pending, present, absent, excused
  created_at  timestamptz default now(),
  unique(student_id, semester_id, date)
);

-- Auto-mark absent if no scan on a class day
create or replace function mark_absences()
returns void as $$
declare
  v_semester record;
  v_day date;
begin
  for v_semester in select * from semesters where now()::date between start_date and end_date loop
    for v_day in 
      select generate_series(v_semester.start_date, v_semester.end_date, '1 day'::interval)::date as day_date
    loop
      -- For each student, check if they have a schedule entry for this day
      insert into class_schedule (student_id, semester_id, date, status)
      select s.id, v_semester.id, v_day, 'pending'
      from students s
      on conflict (student_id, semester_id, date) do nothing;
    end loop;
  end loop;
end;
$$ language plpgsql security definer;

grant execute on function mark_absences() to anon;

-- View for absence summary
create or replace view absence_summary as
select
  s.id as student_id,
  s.full_name,
  s.class,
  sem.id as semester_id,
  sem.name as semester_name,
  count(case when cs.status = 'absent' then 1 end) as absent_count,
  sem.max_absent,
  sem.alert_at,
  case 
    when count(case when cs.status = 'absent' then 1 end) >= sem.alert_at then 'warning'
    when count(case when cs.status = 'absent' then 1 end) >= sem.max_absent then 'critical'
    else 'ok'
  end as status
from students s
cross join semesters sem
left join class_schedule cs on cs.student_id = s.id and cs.semester_id = sem.id
where now()::date between sem.start_date and sem.end_date
group by s.id, s.full_name, s.class, sem.id, sem.name, sem.max_absent, sem.alert_at;

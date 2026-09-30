-- Seed the VIT Pune Computer Engineering core subjects used by the faculty portal.
-- Source: AY 2025-26 B.Tech Computer Engineering course structure.
insert into public.subjects (code, name, department, semester, credits) values
  ('CS2305', 'Data Structures-I', 'Computer Engineering', 3, 3),
  ('CS2302', 'Logic Design and Microprocessor', 'Computer Engineering', 3, 3),
  ('CS2303', 'Object Oriented Programming', 'Computer Engineering', 3, 3),
  ('CS2304', 'Database Management System', 'Computer Engineering', 3, 3),
  ('CS2308', 'Data Structures-II', 'Computer Engineering', 4, 3),
  ('CS2309', 'Theory of Computation', 'Computer Engineering', 4, 2),
  ('CS2310', 'Operating System', 'Computer Engineering', 4, 3),
  ('CS2311', 'Software Engineering', 'Computer Engineering', 4, 3)
on conflict (code) do update set
  name = excluded.name,
  department = excluded.department,
  semester = excluded.semester,
  credits = excluded.credits,
  is_active = true;

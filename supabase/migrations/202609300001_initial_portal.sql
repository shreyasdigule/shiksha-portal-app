-- ShikshaPortal cloud foundation. Run in the Supabase SQL editor.
create extension if not exists pgcrypto;
create type public.app_role as enum ('student', 'faculty', 'admin');
create type public.account_status as enum ('active', 'pending', 'suspended');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  full_name text not null check (char_length(trim(full_name)) between 2 and 100),
  student_id text unique,
  department text check (department is null or char_length(trim(department)) between 2 and 100),
  semester smallint check (semester is null or semester between 1 and 12),
  role public.app_role not null default 'student',
  status public.account_status not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (role <> 'student' or student_id is not null)
);

create function public.create_profile_for_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
declare user_metadata jsonb := new.raw_user_meta_data;
begin
  -- Client metadata cannot self-assign staff roles.
  insert into public.profiles (id, email, full_name, student_id, department, semester, role)
  values (
    new.id, lower(new.email),
    coalesce(nullif(trim(user_metadata ->> 'full_name'), ''), split_part(new.email, '@', 1)),
    nullif(upper(trim(user_metadata ->> 'student_id')), ''),
    nullif(trim(user_metadata ->> 'department'), ''),
    nullif(user_metadata ->> 'semester', '')::smallint, 'student'
  );
  return new;
end;
$$;
create trigger on_auth_user_created after insert on auth.users
  for each row execute procedure public.create_profile_for_new_user();

create function public.is_staff()
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.profiles where id = (select auth.uid()) and role in ('faculty', 'admin') and status = 'active');
$$;
create function public.is_admin()
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.profiles where id = (select auth.uid()) and role = 'admin' and status = 'active');
$$;

create table public.subjects (
  id uuid primary key default gen_random_uuid(),
  code text not null unique check (code = upper(code) and code ~ '^[A-Z0-9][A-Z0-9_-]{1,19}$'),
  name text not null check (char_length(trim(name)) between 2 and 120),
  department text not null check (char_length(trim(department)) between 2 and 100),
  semester smallint not null check (semester between 1 and 12),
  credits smallint not null check (credits between 1 and 8),
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);
create table public.enrollments (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles(id) on delete cascade,
  subject_id uuid not null references public.subjects(id) on delete restrict,
  status text not null default 'enrolled' check (status in ('enrolled', 'dropped', 'completed')),
  enrolled_at timestamptz not null default now(), unique (student_id, subject_id)
);
create table public.tests (
  id uuid primary key default gen_random_uuid(),
  subject_id uuid not null references public.subjects(id) on delete restrict,
  title text not null check (char_length(trim(title)) between 3 and 160),
  starts_at timestamptz not null, ends_at timestamptz not null,
  duration_minutes smallint not null check (duration_minutes between 1 and 300),
  marks_per_question numeric(6,2) not null default 2 check (marks_per_question > 0),
  negative_mark numeric(6,2) not null default 0.5 check (negative_mark >= 0),
  is_published boolean not null default false,
  created_by uuid not null references public.profiles(id), created_at timestamptz not null default now(),
  check (ends_at > starts_at)
);
create table public.test_questions (
  id uuid primary key default gen_random_uuid(),
  test_id uuid not null references public.tests(id) on delete cascade,
  prompt text not null check (char_length(trim(prompt)) between 3 and 2000),
  options jsonb not null check (jsonb_typeof(options) = 'array' and jsonb_array_length(options) between 2 and 8),
  correct_option smallint not null, position smallint not null check (position > 0),
  unique (test_id, position), check (correct_option >= 0 and correct_option < jsonb_array_length(options))
);
create table public.attempts (
  id uuid primary key default gen_random_uuid(), test_id uuid not null references public.tests(id) on delete restrict,
  student_id uuid not null references public.profiles(id) on delete restrict,
  started_at timestamptz not null default now(), submitted_at timestamptz,
  score numeric(8,2), max_score numeric(8,2),
  status text not null default 'in_progress' check (status in ('in_progress', 'submitted', 'auto_submitted')),
  unique (test_id, student_id),
  check ((submitted_at is null and score is null and max_score is null) or (submitted_at is not null and score is not null and max_score is not null))
);
create table public.attempt_answers (
  attempt_id uuid not null references public.attempts(id) on delete cascade,
  question_id uuid not null references public.test_questions(id) on delete restrict,
  selected_option smallint, is_correct boolean not null, awarded_marks numeric(8,2) not null,
  primary key (attempt_id, question_id)
);
create table public.attendance (
  id uuid primary key default gen_random_uuid(), subject_id uuid not null references public.subjects(id) on delete restrict,
  student_id uuid not null references public.profiles(id) on delete cascade,
  class_date date not null, status text not null check (status in ('present', 'absent', 'late')),
  marked_by uuid not null references public.profiles(id), marked_at timestamptz not null default now(),
  unique (subject_id, student_id, class_date)
);


alter table public.profiles enable row level security;
alter table public.subjects enable row level security;
alter table public.enrollments enable row level security;
alter table public.tests enable row level security;
alter table public.test_questions enable row level security;
alter table public.attempts enable row level security;
alter table public.attempt_answers enable row level security;
alter table public.attendance enable row level security;

create policy "view own or staff profiles" on public.profiles for select using (id = (select auth.uid()) or public.is_staff());
create policy "update own student profile" on public.profiles for update
  using (id = (select auth.uid()) and role = 'student')
  with check (id = (select auth.uid()) and role = 'student' and status = 'active');
create policy "admins manage profiles" on public.profiles for all using (public.is_admin()) with check (public.is_admin());
create policy "students read active subjects" on public.subjects for select using (is_active or public.is_staff());
create policy "staff manage subjects" on public.subjects for all using (public.is_staff()) with check (public.is_staff());
create policy "students view own enrollments" on public.enrollments for select using (student_id = (select auth.uid()) or public.is_staff());
create policy "staff manage enrollments" on public.enrollments for all using (public.is_staff()) with check (public.is_staff());
create policy "read published available tests" on public.tests for select using ((is_published and now() between starts_at and ends_at) or public.is_staff());
create policy "staff manage tests" on public.tests for all using (public.is_staff()) with check (public.is_staff());
create policy "staff manage test questions" on public.test_questions for all using (public.is_staff()) with check (public.is_staff());
create policy "students view own attempts" on public.attempts for select using (student_id = (select auth.uid()) or public.is_staff());
create policy "students create own attempt" on public.attempts for insert with check (student_id = (select auth.uid()) and status = 'in_progress' and score is null);
create policy "staff manage attempts" on public.attempts for all using (public.is_staff()) with check (public.is_staff());
create policy "view own attempt answers" on public.attempt_answers for select
  using (exists (select 1 from public.attempts a where a.id = attempt_id and (a.student_id = (select auth.uid()) or public.is_staff())));
create policy "staff manage attempt answers" on public.attempt_answers for all using (public.is_staff()) with check (public.is_staff());
create policy "view own attendance" on public.attendance for select using (student_id = (select auth.uid()) or public.is_staff());
create policy "staff manage attendance" on public.attendance for all using (public.is_staff()) with check (public.is_staff());

-- Safe view: correct_option remains inaccessible to clients during an exam.
create view public.available_test_questions with (security_barrier = true) as
  select q.id, q.test_id, q.prompt, q.options, q.position
  from public.test_questions q join public.tests t on t.id = q.test_id
  where t.is_published and now() between t.starts_at and t.ends_at;
grant select on public.available_test_questions to authenticated;
grant select, insert, update, delete on public.profiles, public.subjects, public.enrollments,
  public.tests, public.test_questions, public.attempts, public.attempt_answers, public.attendance to authenticated;

-- Repairs faculty registration on projects where only part of the earlier
-- faculty migrations was applied. Public faculty signups are active for this
-- demonstration; requested_role can only create faculty, never admin.
create table if not exists public.faculty_accounts (
  id uuid primary key references public.profiles(id) on delete cascade,
  email text not null unique,
  full_name text not null check (char_length(trim(full_name)) between 2 and 100),
  department text check (department is null or char_length(trim(department)) between 2 and 100),
  role public.app_role not null default 'faculty' check (role = 'faculty'),
  status public.account_status not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.faculty_accounts drop constraint if exists faculty_accounts_email_check;
alter table public.faculty_accounts drop constraint if exists faculty_accounts_email_vit_format;
alter table public.faculty_accounts
  add constraint faculty_accounts_email_vit_format
  check (email = lower(email) and email ~ '^[^@[:space:]]+@vit\.edu$');
alter table public.faculty_accounts enable row level security;
drop policy if exists "faculty view own directory record" on public.faculty_accounts;
create policy "faculty view own directory record" on public.faculty_accounts
  for select using (id = (select auth.uid()) or public.is_admin());
grant select on public.faculty_accounts to authenticated;

create or replace function public.sync_faculty_account()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if new.role = 'faculty' then
    insert into public.faculty_accounts (id, email, full_name, department, role, status, updated_at)
    values (new.id, lower(new.email), new.full_name, new.department, 'faculty', new.status, now())
    on conflict (id) do update set
      email = excluded.email,
      full_name = excluded.full_name,
      department = excluded.department,
      status = excluded.status,
      updated_at = now();
  else
    delete from public.faculty_accounts where id = new.id;
  end if;
  return new;
end;
$$;

drop trigger if exists sync_faculty_account_after_profile_change on public.profiles;
create trigger sync_faculty_account_after_profile_change
  after insert or update of role, email, full_name, department, status on public.profiles
  for each row execute function public.sync_faculty_account();

create or replace function public.create_profile_for_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  user_metadata jsonb := new.raw_user_meta_data;
  requested_faculty boolean := user_metadata ->> 'requested_role' = 'faculty';
begin
  if requested_faculty then
    insert into public.profiles (id, email, full_name, student_id, department, semester, role, status)
    values (
      new.id,
      lower(new.email),
      coalesce(nullif(trim(user_metadata ->> 'full_name'), ''), split_part(new.email, '@', 1)),
      null,
      nullif(trim(user_metadata ->> 'department'), ''),
      null,
      'faculty',
      'active'
    );
  else
    insert into public.profiles (id, email, full_name, student_id, department, semester, role, status)
    values (
      new.id,
      lower(new.email),
      coalesce(nullif(trim(user_metadata ->> 'full_name'), ''), split_part(new.email, '@', 1)),
      nullif(upper(trim(user_metadata ->> 'student_id')), ''),
      nullif(trim(user_metadata ->> 'department'), ''),
      nullif(user_metadata ->> 'semester', '')::smallint,
      'student',
      'active'
    );
  end if;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.create_profile_for_new_user();

-- Move earlier faculty requests straight into the demo's active state.
update public.profiles set status = 'active'
where role = 'faculty' and status = 'pending';

insert into public.faculty_accounts (id, email, full_name, department, role, status)
select id, lower(email), full_name, department, 'faculty', status
from public.profiles where role = 'faculty'
on conflict (id) do update set
  email = excluded.email,
  full_name = excluded.full_name,
  department = excluded.department,
  status = excluded.status,
  updated_at = now();

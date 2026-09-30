-- Keep VIT faculty email addresses and account status in a dedicated table.
-- Role assignment still comes from the protected profiles table; public users
-- cannot insert or promote records in either table.
create table public.faculty_accounts (
  id uuid primary key references public.profiles(id) on delete cascade,
  email text not null unique check (email = lower(email) and email ~ '^[a-z0-9]+([._+-][a-z0-9]+)*@vit\.edu$'),
  full_name text not null check (char_length(trim(full_name)) between 2 and 100),
  department text check (department is null or char_length(trim(department)) between 2 and 100),
  role public.app_role not null default 'faculty' check (role = 'faculty'),
  status public.account_status not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.faculty_accounts enable row level security;
create policy "faculty view own directory record" on public.faculty_accounts
  for select using (id = (select auth.uid()) or public.is_admin());
grant select on public.faculty_accounts to authenticated;

create function public.sync_faculty_account()
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

create trigger sync_faculty_account_after_profile_change
  after insert or update of role, email, full_name, department, status on public.profiles
  for each row execute function public.sync_faculty_account();

-- Include already-provisioned faculty accounts when this migration is applied.
insert into public.faculty_accounts (id, email, full_name, department, role, status)
select id, lower(email), full_name, department, 'faculty', status
from public.profiles
where role = 'faculty'
on conflict (id) do update set
  email = excluded.email,
  full_name = excluded.full_name,
  department = excluded.department,
  status = excluded.status,
  updated_at = now();

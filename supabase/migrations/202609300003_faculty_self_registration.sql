-- Faculty self-registration is allowed, but the role can only be faculty (not
-- admin). Client metadata cannot request an admin role.
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
    -- All other self-signups are students and must supply a PRN. Metadata can
    -- never set a role or an active staff status.
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

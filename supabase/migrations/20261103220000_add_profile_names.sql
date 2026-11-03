alter table public.profiles
  add column if not exists first_name text,
  add column if not exists last_name text;

alter table public.profiles
  drop constraint if exists profiles_first_name_length,
  drop constraint if exists profiles_last_name_length;

alter table public.profiles
  add constraint profiles_first_name_length
    check (first_name is null or length(trim(first_name)) between 1 and 80),
  add constraint profiles_last_name_length
    check (last_name is null or length(trim(last_name)) between 1 and 80);

update public.profiles as profile
set
  first_name = nullif(trim(users.raw_user_meta_data->>'first_name'), ''),
  last_name = nullif(trim(users.raw_user_meta_data->>'last_name'), '')
from auth.users as users
where profile.id = users.id
  and (
    nullif(trim(users.raw_user_meta_data->>'first_name'), '') is not null
    or nullif(trim(users.raw_user_meta_data->>'last_name'), '') is not null
  );

create or replace function public.create_profile_for_auth_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  profile_name text;
  first_name_value text;
  last_name_value text;
begin
  first_name_value := nullif(trim(new.raw_user_meta_data->>'first_name'), '');
  last_name_value := nullif(trim(new.raw_user_meta_data->>'last_name'), '');
  profile_name := left(
    coalesce(
      nullif(trim(new.raw_user_meta_data->>'display_name'), ''),
      nullif(concat_ws(' ', first_name_value, last_name_value), ''),
      nullif(split_part(coalesce(new.email, ''), '@', 1), ''),
      'Member'
    ),
    80
  );

  insert into public.profiles (id, display_name, first_name, last_name)
  values (new.id, profile_name, first_name_value, last_name_value)
  on conflict (id) do nothing;

  return new;
end;
$$;

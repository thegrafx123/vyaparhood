-- =====================================================================
-- Email OTP login.
--
-- Members now sign in with a 6-digit code sent to their email. A
-- confirmed email counts as verified, the same way a confirmed phone
-- number did. The phone triggers stay in place so phone login can be
-- switched back on later without another migration.
-- =====================================================================

-- Bootstrap accounts can be matched by email or phone.
alter table public.bootstrap_accounts drop constraint bootstrap_accounts_pkey;
alter table public.bootstrap_accounts alter column phone drop not null;
alter table public.bootstrap_accounts
  add column email text unique check (email is null or email = lower(email)),
  add constraint bootstrap_accounts_phone_key unique (phone),
  add constraint bootstrap_accounts_has_key check (email is not null or phone is not null);

create or replace function public.apply_bootstrap(p_user uuid, p_phone text, p_email text default null)
returns void language plpgsql security definer set search_path = public as $$
declare
  b public.bootstrap_accounts;
begin
  select * into b from public.bootstrap_accounts
    where (p_email is not null and email = lower(p_email))
       or (p_phone is not null and phone = p_phone)
    limit 1;
  if not found then
    return;
  end if;

  if b.make_admin then
    update public.profiles set is_admin = true where id = p_user;
  end if;

  if b.grant_membership then
    update public.memberships
      set active = true, source = 'admin', plan_id = 'root', renews_at = null
      where user_id = p_user;
  end if;

  -- The demo seed function only exists on the dev project.
  if b.seed_demo and to_regprocedure('public.dev_seed_relationships(uuid)') is not null then
    execute 'select public.dev_seed_relationships($1)' using p_user;
  end if;
end $$;

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  confirmed boolean := new.phone_confirmed_at is not null or new.email_confirmed_at is not null;
begin
  insert into public.profiles (id, phone, email, verification_status)
  values (new.id, new.phone, lower(new.email), case when confirmed then 'verified' else 'none' end)
  on conflict (id) do nothing;
  insert into public.memberships (user_id) values (new.id) on conflict (user_id) do nothing;
  if confirmed then
    perform public.apply_bootstrap(new.id, new.phone, new.email);
  end if;
  return new;
end $$;

create or replace function public.handle_phone_confirmed()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if old.phone_confirmed_at is null and new.phone_confirmed_at is not null then
    update public.profiles
      set phone = new.phone,
          verification_status = case when verification_status in ('none', 'rejected') then 'verified' else verification_status end
      where id = new.id;
    insert into public.notifications (user_id, kind) values (new.id, 'badge');
    perform public.apply_bootstrap(new.id, new.phone, new.email);
  end if;
  return new;
end $$;

-- Email OTP confirmed → the profile is verified.
create or replace function public.handle_email_confirmed()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if old.email_confirmed_at is null and new.email_confirmed_at is not null then
    update public.profiles
      set email = lower(new.email),
          verification_status = case when verification_status in ('none', 'rejected') then 'verified' else verification_status end
      where id = new.id;
    insert into public.notifications (user_id, kind) values (new.id, 'badge');
    perform public.apply_bootstrap(new.id, new.phone, new.email);
  end if;
  return new;
end $$;

drop trigger if exists on_auth_user_email_confirmed on auth.users;
create trigger on_auth_user_email_confirmed
  after update of email_confirmed_at on auth.users
  for each row execute function public.handle_email_confirmed();

revoke execute on function public.handle_email_confirmed() from authenticated;
revoke execute on function public.apply_bootstrap(uuid, text, text) from authenticated;
drop function if exists public.apply_bootstrap(uuid, text);

-- Same as init, except the dev demo check matches the root account by
-- email as well as phone.
create or replace function public.update_live_location(
  p_lat      double precision,
  p_lng      double precision,
  p_city     text default null,
  p_locality text default null
) returns void
language plpgsql security definer set search_path = public, extensions as $$
declare
  me uuid := auth.uid();
begin
  if me is null then
    raise exception 'Not signed in' using errcode = '42501';
  end if;
  if p_lat not between -90 and 90 or p_lng not between -180 and 180 then
    raise exception 'Invalid coordinates';
  end if;

  insert into public.live_locations as ll (user_id, location, city, locality, updated_at)
  values (me, ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)::extensions.geography,
          nullif(left(btrim(p_city), 60), ''), nullif(left(btrim(p_locality), 80), ''), now())
  on conflict (user_id) do update set
    location = excluded.location,
    city     = coalesce(excluded.city, ll.city),
    locality = coalesce(excluded.locality, ll.locality),
    updated_at = now();

  -- Dev only: keep demo members around whoever is testing.
  if to_regprocedure('public.dev_place_demo_near(uuid)') is not null
     and exists (
       select 1 from public.bootstrap_accounts b
       join public.profiles p on p.email = b.email or p.phone = b.phone
       where p.id = me and b.seed_demo
     ) then
    execute 'select public.dev_place_demo_near($1)' using me;
  end if;
end $$;

-- Admin search: by name, email or phone.
drop function if exists public.admin_search_members(text);
create function public.admin_search_members(p_query text default '')
returns table (
  id                  uuid,
  full_name           text,
  phone               text,
  email               text,
  city                text,
  membership_active   boolean,
  is_admin            boolean,
  is_banned           boolean,
  deleting            boolean,
  created_at          timestamptz
)
language plpgsql stable security definer set search_path = public as $$
#variable_conflict use_column
begin
  perform public.assert_admin();
  return query
  select p.id, p.full_name, p.phone, p.email, p.city,
         coalesce(m.active, false), p.is_admin, p.is_banned,
         p.deletion_requested_at is not null, p.created_at
  from public.profiles p
  left join public.memberships m on m.user_id = p.id
  where coalesce(p_query, '') = ''
     or p.full_name ilike '%' || p_query || '%'
     or p.email ilike '%' || p_query || '%'
     or (regexp_replace(p_query, '\D', '', 'g') <> ''
         and p.phone like '%' || regexp_replace(p_query, '\D', '', 'g') || '%')
  order by p.created_at desc
  limit 50;
end $$;

revoke execute on function public.admin_search_members(text) from public, anon;
grant execute on function public.admin_search_members(text) to authenticated;

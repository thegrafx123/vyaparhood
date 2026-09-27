-- =====================================================================
-- Vyaparhood — initial schema
-- Run on BOTH the dev and prod Supabase projects (supabase db push).
--
-- Security model in one paragraph:
--   * Nothing is readable without logging in (anon has no access).
--   * Each user can read/write only their own rows directly.
--   * Anything that touches other members (discovery, distances,
--     requests, chats list, admin tools) goes through SECURITY DEFINER
--     functions that return only safe columns. Coordinates, DOB, email
--     and phone are never returned to other members.
-- =====================================================================

create extension if not exists postgis with schema extensions;

-- ---------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------

create table public.profiles (
  id                   uuid primary key references auth.users (id) on delete cascade,
  email                text,
  phone                text check (phone is null or phone ~ '^[0-9]{10}$'),
  full_name            text not null default '' check (char_length(full_name) <= 80),
  dob                  date,
  headline             text not null default '' check (char_length(headline) <= 80),
  building             text not null default '' check (char_length(building) <= 120),
  category             text check (category in ('food', 'fitness', 'creative', 'tech', 'retail')),
  bio                  text not null default '' check (char_length(bio) <= 300),
  social_handle        text check (char_length(social_handle) <= 60),
  offers               text[] not null default '{}' check (cardinality(offers) <= 5),
  looking_for          text[] not null default '{}' check (cardinality(looking_for) <= 5),
  tag_label            text,
  tag_tone             text check (tag_tone in ('orange', 'yellow', 'blue', 'teal')),
  city                 text check (char_length(city) <= 60),
  area                 text check (char_length(area) <= 80),
  photo_path           text,
  verification_status  text not null default 'none'
                       check (verification_status in ('none', 'pending', 'verified', 'rejected')),
  show_exact_distance  boolean not null default false,
  notify_requests      boolean not null default true,
  notify_messages      boolean not null default true,
  onboarding_completed boolean not null default false,
  consented_at         timestamptz,
  is_admin             boolean not null default false,
  is_banned            boolean not null default false,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now(),
  -- A user can only point at files inside their own storage folder.
  constraint photo_path_is_own check (photo_path is null or photo_path like id::text || '/%')
);

-- Membership is the "has paid" flag. Only the server (payments later,
-- admins now) can change it.
create table public.memberships (
  user_id    uuid primary key references public.profiles (id) on delete cascade,
  active     boolean not null default false,
  plan_id    text,
  source     text not null default 'none' check (source in ('none', 'admin', 'apple', 'google', 'cashfree')),
  renews_at  timestamptz,
  updated_at timestamptz not null default now()
);

-- Exact coordinates live here and are readable only by their owner.
create table public.user_locations (
  user_id      uuid primary key references public.profiles (id) on delete cascade,
  location     extensions.geography(Point, 4326),
  geohash      text,
  source       text not null check (source in ('device', 'manual')),
  pincode      text check (pincode is null or pincode ~ '^[1-9][0-9]{5}$'),
  locality     text,
  city         text,
  address_line text,
  updated_at   timestamptz not null default now()
);
create index user_locations_location_gix on public.user_locations using gist (location);

-- Optional: India Post pincode centroids (import once, see README).
-- Lets members who type an address instead of sharing location appear in Nearby.
create table public.pincodes (
  pincode text primary key,
  lat     double precision not null,
  lng     double precision not null
);

create table public.connection_requests (
  id           uuid primary key default gen_random_uuid(),
  from_user    uuid not null references public.profiles (id) on delete cascade,
  to_user      uuid not null references public.profiles (id) on delete cascade,
  note         text not null check (char_length(btrim(note)) between 10 and 300),
  status       text not null default 'pending' check (status in ('pending', 'accepted', 'declined', 'withdrawn')),
  created_at   timestamptz not null default now(),
  responded_at timestamptz,
  check (from_user <> to_user)
);
create unique index connection_requests_one_pending
  on public.connection_requests (least(from_user, to_user), greatest(from_user, to_user))
  where status = 'pending';
create index connection_requests_to_user on public.connection_requests (to_user, status);
create index connection_requests_from_user on public.connection_requests (from_user, created_at);

create table public.connections (
  id         uuid primary key default gen_random_uuid(),
  user_a     uuid not null references public.profiles (id) on delete cascade,
  user_b     uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  check (user_a < user_b),
  unique (user_a, user_b)
);
create index connections_user_b on public.connections (user_b);

create table public.messages (
  id            bigint generated always as identity primary key,
  connection_id uuid not null references public.connections (id) on delete cascade,
  sender_id     uuid not null references public.profiles (id) on delete cascade,
  body          text not null check (char_length(btrim(body)) between 1 and 2000),
  created_at    timestamptz not null default now()
);
create index messages_connection_created on public.messages (connection_id, created_at desc);

create table public.chat_reads (
  connection_id uuid not null references public.connections (id) on delete cascade,
  user_id       uuid not null references public.profiles (id) on delete cascade,
  last_read_at  timestamptz not null default now(),
  primary key (connection_id, user_id)
);

create table public.blocks (
  blocker    uuid not null references public.profiles (id) on delete cascade,
  blocked    uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker, blocked),
  check (blocker <> blocked)
);
create index blocks_blocked on public.blocks (blocked);

create table public.reports (
  id         uuid primary key default gen_random_uuid(),
  reporter   uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  reported   uuid not null references public.profiles (id) on delete cascade,
  reason     text not null check (reason in ('fake', 'inappropriate', 'spam', 'harassment', 'other')),
  details    text not null default '' check (char_length(details) <= 1000),
  status     text not null default 'open' check (status in ('open', 'actioned', 'dismissed')),
  created_at timestamptz not null default now(),
  check (reporter <> reported)
);

create table public.ratings (
  rater      uuid not null references public.profiles (id) on delete cascade,
  rated      uuid not null references public.profiles (id) on delete cascade,
  stars      smallint not null check (stars between 1 and 5),
  tags       text[] not null default '{}',
  note       text not null default '' check (char_length(note) <= 280),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (rater, rated),
  check (rater <> rated)
);
create index ratings_rated on public.ratings (rated);

create table public.saved_profiles (
  user_id    uuid not null references public.profiles (id) on delete cascade,
  member_id  uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, member_id)
);

create table public.notifications (
  id            bigint generated always as identity primary key,
  user_id       uuid not null references public.profiles (id) on delete cascade,
  kind          text not null check (kind in ('request', 'approved', 'badge', 'message')),
  actor_id      uuid references public.profiles (id) on delete cascade,
  connection_id uuid references public.connections (id) on delete cascade,
  created_at    timestamptz not null default now(),
  read_at       timestamptz
);
create index notifications_user_created on public.notifications (user_id, created_at desc);

create table public.verification_documents (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  kind         text not null check (kind in ('business_proof', 'gov_id')),
  storage_path text not null,
  file_name    text not null check (char_length(file_name) <= 200),
  mime_type    text,
  size_bytes   bigint check (size_bytes is null or size_bytes <= 10485760),
  status       text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  reviewed_by  uuid references public.profiles (id) on delete set null,
  reviewed_at  timestamptz,
  delete_after timestamptz not null default now() + interval '30 days',
  purged_at    timestamptz,
  created_at   timestamptz not null default now(),
  constraint doc_path_is_own check (storage_path like user_id::text || '/%')
);
create index verification_documents_pending on public.verification_documents (status, created_at) where purged_at is null;
create index verification_documents_purge on public.verification_documents (delete_after) where purged_at is null;

-- Accounts that get special treatment the moment they sign up
-- (root admin, demo data). No client access at all.
create table public.bootstrap_accounts (
  email            text primary key,
  make_admin       boolean not null default false,
  grant_membership boolean not null default false,
  seed_demo        boolean not null default false
);

-- ---------------------------------------------------------------------
-- Helper functions (used by policies and RPCs)
-- ---------------------------------------------------------------------

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce((select p.is_admin from public.profiles p where p.id = auth.uid()), false);
$$;

create or replace function public.is_active_member(uid uuid default auth.uid())
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1
    from public.profiles p
    left join public.memberships m on m.user_id = p.id
    where p.id = uid and not p.is_banned and (p.is_admin or coalesce(m.active, false))
  );
$$;

create or replace function public.is_blocked_between(a uuid, b uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.blocks
    where (blocker = a and blocked = b) or (blocker = b and blocked = a)
  );
$$;

create or replace function public.connection_id_between(a uuid, b uuid)
returns uuid language sql stable security definer set search_path = public as $$
  select c.id from public.connections c where c.user_a = least(a, b) and c.user_b = greatest(a, b);
$$;

create or replace function public.is_connection_member(p_connection uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.connections c
    where c.id = p_connection and auth.uid() in (c.user_a, c.user_b)
  );
$$;

create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end $$;

create trigger profiles_touch before update on public.profiles
  for each row execute function public.touch_updated_at();
create trigger memberships_touch before update on public.memberships
  for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------------
-- New user → profile + membership row (+ bootstrap for root/admin)
-- ---------------------------------------------------------------------

create or replace function public.apply_bootstrap(p_user uuid, p_email text)
returns void language plpgsql security definer set search_path = public as $$
declare
  b public.bootstrap_accounts;
begin
  select * into b from public.bootstrap_accounts where lower(email) = lower(p_email);
  if not found then
    return;
  end if;

  if b.make_admin then
    update public.profiles set is_admin = true, verification_status = 'verified' where id = p_user;
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
begin
  insert into public.profiles (id, email) values (new.id, new.email) on conflict (id) do nothing;
  insert into public.memberships (user_id) values (new.id) on conflict (user_id) do nothing;
  perform public.apply_bootstrap(new.id, new.email);
  return new;
end $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------
-- Notification triggers
-- ---------------------------------------------------------------------

create or replace function public.notify_on_request()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.notifications (user_id, kind, actor_id) values (new.to_user, 'request', new.from_user);
  return new;
end $$;

create trigger connection_requests_notify
  after insert on public.connection_requests
  for each row execute function public.notify_on_request();

create or replace function public.notify_on_message()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  c         public.connections;
  recipient uuid;
begin
  if coalesce(current_setting('vyaparhood.skip_message_notify', true), '') = 'on' then
    return new;
  end if;
  select * into c from public.connections where id = new.connection_id;
  recipient := case when c.user_a = new.sender_id then c.user_b else c.user_a end;
  -- One unread "sent you a message" per chat is enough.
  if not exists (
    select 1 from public.notifications n
    where n.user_id = recipient and n.kind = 'message'
      and n.connection_id = new.connection_id and n.read_at is null
  ) then
    insert into public.notifications (user_id, kind, actor_id, connection_id)
    values (recipient, 'message', new.sender_id, new.connection_id);
  end if;
  return new;
end $$;

create trigger messages_notify
  after insert on public.messages
  for each row execute function public.notify_on_message();

create or replace function public.mark_verification_pending()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  update public.profiles set verification_status = 'pending'
  where id = new.user_id and verification_status in ('none', 'rejected');
  return new;
end $$;

create trigger verification_documents_pending
  after insert on public.verification_documents
  for each row execute function public.mark_verification_pending();

-- ---------------------------------------------------------------------
-- Row level security
-- ---------------------------------------------------------------------

alter table public.profiles               enable row level security;
alter table public.memberships            enable row level security;
alter table public.user_locations         enable row level security;
alter table public.pincodes               enable row level security;
alter table public.connection_requests    enable row level security;
alter table public.connections            enable row level security;
alter table public.messages               enable row level security;
alter table public.chat_reads             enable row level security;
alter table public.blocks                 enable row level security;
alter table public.reports                enable row level security;
alter table public.ratings                enable row level security;
alter table public.saved_profiles         enable row level security;
alter table public.notifications          enable row level security;
alter table public.verification_documents enable row level security;
alter table public.bootstrap_accounts     enable row level security;

-- Start from zero privileges, then grant exactly what the app needs.
revoke all on all tables in schema public from anon, authenticated;

-- profiles: read own row; update only safe columns of own row.
grant select on public.profiles to authenticated;
grant update (
  full_name, phone, dob, building, headline, category, bio, social_handle,
  offers, looking_for, city, area, photo_path, show_exact_distance,
  notify_requests, notify_messages, onboarding_completed, consented_at
) on public.profiles to authenticated;
create policy "profiles: read own" on public.profiles
  for select to authenticated using (id = auth.uid() or public.is_admin());
create policy "profiles: update own" on public.profiles
  for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

grant select on public.memberships to authenticated;
create policy "memberships: read own" on public.memberships
  for select to authenticated using (user_id = auth.uid() or public.is_admin());

grant select on public.user_locations to authenticated;
create policy "user_locations: read own" on public.user_locations
  for select to authenticated using (user_id = auth.uid());

grant select on public.connection_requests to authenticated;
create policy "requests: read own" on public.connection_requests
  for select to authenticated using (auth.uid() in (from_user, to_user));

grant select on public.connections to authenticated;
create policy "connections: read own" on public.connections
  for select to authenticated using (auth.uid() in (user_a, user_b));

grant select, insert on public.messages to authenticated;
create policy "messages: read in my chats" on public.messages
  for select to authenticated using (public.is_connection_member(connection_id));
create policy "messages: send in my chats" on public.messages
  for insert to authenticated with check (
    sender_id = auth.uid()
    and public.is_active_member()
    and exists (
      select 1 from public.connections c
      where c.id = connection_id
        and auth.uid() in (c.user_a, c.user_b)
        and not public.is_blocked_between(c.user_a, c.user_b)
    )
  );

grant select, insert, update on public.chat_reads to authenticated;
create policy "chat_reads: own" on public.chat_reads
  for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid() and public.is_connection_member(connection_id));

grant select, delete on public.blocks to authenticated;
create policy "blocks: read own" on public.blocks
  for select to authenticated using (blocker = auth.uid());
create policy "blocks: remove own" on public.blocks
  for delete to authenticated using (blocker = auth.uid());

grant select, insert on public.reports to authenticated;
create policy "reports: file" on public.reports
  for insert to authenticated with check (reporter = auth.uid());
create policy "reports: read own or admin" on public.reports
  for select to authenticated using (reporter = auth.uid() or public.is_admin());

grant select on public.ratings to authenticated;
create policy "ratings: read own" on public.ratings
  for select to authenticated using (rater = auth.uid());

grant select, insert, delete on public.saved_profiles to authenticated;
create policy "saved: own" on public.saved_profiles
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

grant select on public.notifications to authenticated;
grant update (read_at) on public.notifications to authenticated;
create policy "notifications: read own" on public.notifications
  for select to authenticated using (user_id = auth.uid());
create policy "notifications: mark own read" on public.notifications
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

grant select, insert, delete on public.verification_documents to authenticated;
create policy "docs: read own or admin" on public.verification_documents
  for select to authenticated using (user_id = auth.uid() or public.is_admin());
create policy "docs: add own" on public.verification_documents
  for insert to authenticated with check (user_id = auth.uid() and status = 'pending');
create policy "docs: remove own pending" on public.verification_documents
  for delete to authenticated using (user_id = auth.uid() and status = 'pending');

-- pincodes and bootstrap_accounts: no policies → no client access.

-- ---------------------------------------------------------------------
-- Realtime (chat, requests, notifications). RLS still applies.
-- ---------------------------------------------------------------------

alter publication supabase_realtime add table public.messages;
alter publication supabase_realtime add table public.connection_requests;
alter publication supabase_realtime add table public.notifications;

-- ---------------------------------------------------------------------
-- Storage: two private buckets
-- ---------------------------------------------------------------------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('avatars', 'avatars', false, 5242880, array['image/jpeg', 'image/png', 'image/webp']),
  ('verification-docs', 'verification-docs', false, 10485760,
   array['application/pdf', 'image/jpeg', 'image/png', 'image/webp', 'image/heic'])
on conflict (id) do nothing;

create policy "avatars: members and owner can view" on storage.objects
  for select to authenticated using (
    bucket_id = 'avatars'
    and ((storage.foldername(name))[1] = auth.uid()::text or public.is_active_member())
  );
create policy "avatars: owner uploads" on storage.objects
  for insert to authenticated with check (
    bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text
  );
create policy "avatars: owner replaces" on storage.objects
  for update to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "avatars: owner deletes" on storage.objects
  for delete to authenticated using (
    bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "docs: owner or admin can view" on storage.objects
  for select to authenticated using (
    bucket_id = 'verification-docs'
    and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin())
  );
create policy "docs: owner uploads" on storage.objects
  for insert to authenticated with check (
    bucket_id = 'verification-docs' and (storage.foldername(name))[1] = auth.uid()::text
  );
create policy "docs: owner deletes" on storage.objects
  for delete to authenticated using (
    bucket_id = 'verification-docs' and (storage.foldername(name))[1] = auth.uid()::text
  );

-- ---------------------------------------------------------------------
-- RPC: location
-- ---------------------------------------------------------------------

create or replace function public.update_my_location(
  p_lat          double precision default null,
  p_lng          double precision default null,
  p_geohash      text default null,
  p_source       text default 'device',
  p_pincode      text default null,
  p_locality     text default null,
  p_city         text default null,
  p_address_line text default null
) returns void
language plpgsql security definer set search_path = public, extensions as $$
declare
  me      uuid := auth.uid();
  v_point extensions.geography;
  v_lat   double precision;
  v_lng   double precision;
begin
  if me is null then
    raise exception 'Not signed in' using errcode = '42501';
  end if;
  if p_source not in ('device', 'manual') then
    raise exception 'Invalid location source';
  end if;

  if p_lat is not null and p_lng is not null then
    if p_lat not between -90 and 90 or p_lng not between -180 and 180 then
      raise exception 'Invalid coordinates';
    end if;
    v_point := ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)::extensions.geography;
  elsif p_pincode is not null then
    select pc.lat, pc.lng into v_lat, v_lng from public.pincodes pc where pc.pincode = p_pincode;
    if found then
      v_point := ST_SetSRID(ST_MakePoint(v_lng, v_lat), 4326)::extensions.geography;
    end if;
  end if;

  insert into public.user_locations as ul
    (user_id, location, geohash, source, pincode, locality, city, address_line, updated_at)
  values
    (me, v_point, p_geohash, p_source, p_pincode, p_locality, p_city, left(p_address_line, 200), now())
  on conflict (user_id) do update set
    location     = excluded.location,
    geohash      = excluded.geohash,
    source       = excluded.source,
    pincode      = excluded.pincode,
    locality     = excluded.locality,
    city         = coalesce(excluded.city, ul.city),
    address_line = excluded.address_line,
    updated_at   = now();

  if p_locality is not null and btrim(p_locality) <> '' then
    update public.profiles set area = left(btrim(p_locality), 80) where id = me;
  end if;

  -- Dev only: keep demo members around whoever is testing.
  if to_regprocedure('public.dev_place_demo_near(uuid)') is not null
     and exists (
       select 1 from public.bootstrap_accounts b
       join public.profiles p on lower(p.email) = lower(b.email)
       where p.id = me and b.seed_demo
     ) then
    execute 'select public.dev_place_demo_near($1)' using me;
  end if;
end $$;

-- Distance shown to other people: 0.1 km precision only if that member
-- allows it, otherwise rounded to the nearest 0.5 km.
create or replace function public.display_distance(d_km double precision, precise boolean)
returns double precision language sql immutable as $$
  select case
    when d_km is null then null
    when precise then round(d_km::numeric, 1)::double precision
    else greatest(0.5, round(d_km::numeric * 2) / 2)::double precision
  end;
$$;

-- ---------------------------------------------------------------------
-- RPC: discovery
-- ---------------------------------------------------------------------

create or replace function public.discover_members(
  p_mode          text default 'citywide',
  p_max_km        double precision default 4.5,
  p_categories    text[] default null,
  p_verified_only boolean default false,
  p_sort          text default 'default',
  p_limit         integer default 50,
  p_offset        integer default 0
) returns table (
  id               uuid,
  full_name        text,
  headline         text,
  category         text,
  area             text,
  city             text,
  distance_km      double precision,
  distance_precise boolean,
  verified         boolean,
  tag_label        text,
  tag_tone         text,
  photo_path       text,
  joined_at        timestamptz,
  rating           numeric
)
language plpgsql stable security definer set search_path = public, extensions as $$
#variable_conflict use_column
declare
  me      uuid := auth.uid();
  my_loc  extensions.geography;
  my_city text;
begin
  if not public.is_active_member(me) then
    raise exception 'Membership required' using errcode = '42501';
  end if;

  select l.location into my_loc from public.user_locations l where l.user_id = me;
  select p.city into my_city from public.profiles p where p.id = me;

  if p_mode = 'nearby' and my_loc is null then
    return;
  end if;

  return query
  with base as (
    select
      p.*,
      case when my_loc is not null and l.location is not null
           then ST_Distance(my_loc, l.location) / 1000.0 end as d_km,
      (select avg(r.stars) from public.ratings r where r.rated = p.id) as avg_stars
    from public.profiles p
    left join public.user_locations l on l.user_id = p.id
    where p.id <> me
      and p.onboarding_completed
      and not p.is_banned
      and not public.is_blocked_between(me, p.id)
      and (p_categories is null or cardinality(p_categories) = 0 or p.category = any (p_categories))
      and (not p_verified_only or p.verification_status = 'verified')
      and (
        case when p_mode = 'nearby'
          then l.location is not null
               and ST_DWithin(my_loc, l.location, least(greatest(p_max_km, 0.5), 50) * 1000)
          else my_city is null or lower(p.city) = lower(my_city)
        end
      )
  )
  select
    b.id,
    b.full_name,
    coalesce(nullif(b.headline, ''), b.building),
    b.category,
    b.area,
    b.city,
    public.display_distance(b.d_km, b.show_exact_distance),
    b.show_exact_distance,
    b.verification_status = 'verified',
    coalesce(
      b.tag_label,
      case when cardinality(b.looking_for) > 0 then 'Looking for ' || lower(b.looking_for[1])
           when cardinality(b.offers) > 0 then b.offers[1] end
    ),
    coalesce(
      b.tag_tone,
      case when cardinality(b.looking_for) > 0 then 'blue'
           when cardinality(b.offers) > 0 then 'teal' end
    ),
    b.photo_path,
    b.created_at,
    round(b.avg_stars::numeric, 1)
  from base b
  order by
    case when p_sort = 'nearest' then b.d_km end asc nulls last,
    case when p_sort = 'newest' then b.created_at end desc,
    case when p_sort = 'rating' then b.avg_stars end desc nulls last,
    b.created_at asc
  limit least(greatest(p_limit, 1), 200)
  offset greatest(p_offset, 0);
end $$;

create or replace function public.get_member(p_id uuid)
returns table (
  id               uuid,
  full_name        text,
  headline         text,
  bio              text,
  category         text,
  area             text,
  city             text,
  distance_km      double precision,
  distance_precise boolean,
  verified         boolean,
  photo_path       text,
  connections      integer,
  member_since     timestamptz,
  rating           numeric,
  offers           text[],
  looking_for      text[],
  relation         text,
  request_id       uuid,
  connection_id    uuid,
  is_saved         boolean
)
language plpgsql stable security definer set search_path = public, extensions as $$
#variable_conflict use_column
declare
  me     uuid := auth.uid();
  my_loc extensions.geography;
begin
  if not public.is_active_member(me) then
    raise exception 'Membership required' using errcode = '42501';
  end if;
  -- If they blocked me, they simply don't exist for me.
  if exists (select 1 from public.blocks bl where bl.blocker = p_id and bl.blocked = me) then
    return;
  end if;

  select l.location into my_loc from public.user_locations l where l.user_id = me;

  return query
  select
    p.id,
    p.full_name,
    coalesce(nullif(p.headline, ''), p.building),
    p.bio,
    p.category,
    p.area,
    p.city,
    public.display_distance(
      case when my_loc is not null and l.location is not null
           then ST_Distance(my_loc, l.location) / 1000.0 end,
      p.show_exact_distance),
    p.show_exact_distance,
    p.verification_status = 'verified',
    p.photo_path,
    (select count(*)::integer from public.connections c where p.id in (c.user_a, c.user_b)),
    p.created_at,
    (select round(avg(r.stars)::numeric, 1) from public.ratings r where r.rated = p.id),
    p.offers,
    p.looking_for,
    case
      when exists (select 1 from public.blocks bl where bl.blocker = me and bl.blocked = p.id) then 'blocked'
      when public.connection_id_between(me, p.id) is not null then 'connected'
      when exists (select 1 from public.connection_requests cr
                   where cr.status = 'pending' and cr.from_user = me and cr.to_user = p.id) then 'outgoing'
      when exists (select 1 from public.connection_requests cr
                   where cr.status = 'pending' and cr.from_user = p.id and cr.to_user = me) then 'incoming'
      else 'none'
    end,
    (select cr.id from public.connection_requests cr
      where cr.status = 'pending'
        and least(cr.from_user, cr.to_user) = least(me, p.id)
        and greatest(cr.from_user, cr.to_user) = greatest(me, p.id)
      limit 1),
    public.connection_id_between(me, p.id),
    exists (select 1 from public.saved_profiles s where s.user_id = me and s.member_id = p.id)
  from public.profiles p
  left join public.user_locations l on l.user_id = p.id
  where p.id = p_id and p.onboarding_completed and not p.is_banned;
end $$;

-- ---------------------------------------------------------------------
-- RPC: connection requests
-- ---------------------------------------------------------------------

create or replace function public.send_connection_request(p_to uuid, p_note text)
returns uuid language plpgsql security definer set search_path = public as $$
declare
  me     uuid := auth.uid();
  new_id uuid;
begin
  if not public.is_active_member(me) then
    raise exception 'Membership required' using errcode = '42501';
  end if;
  if p_to = me then
    raise exception 'You cannot connect with yourself';
  end if;
  if not exists (select 1 from public.profiles p where p.id = p_to and p.onboarding_completed and not p.is_banned) then
    raise exception 'This member is not available';
  end if;
  if public.is_blocked_between(me, p_to) then
    raise exception 'This member is not available';
  end if;
  if public.connection_id_between(me, p_to) is not null then
    raise exception 'You are already connected';
  end if;
  if exists (select 1 from public.connection_requests cr
             where cr.status = 'pending' and cr.from_user = p_to and cr.to_user = me) then
    raise exception 'They already sent you a request — check your Requests tab';
  end if;
  if (select count(*) from public.connection_requests cr
      where cr.from_user = me and cr.created_at > now() - interval '24 hours') >= 30 then
    raise exception 'Daily request limit reached. Try again tomorrow.';
  end if;

  insert into public.connection_requests (from_user, to_user, note)
  values (me, p_to, btrim(p_note))
  returning id into new_id;
  return new_id;
end $$;

create or replace function public.respond_connection_request(p_request uuid, p_accept boolean)
returns uuid language plpgsql security definer set search_path = public as $$
declare
  me    uuid := auth.uid();
  req   public.connection_requests;
  conn  uuid;
begin
  select * into req from public.connection_requests
  where id = p_request and to_user = me and status = 'pending'
  for update;
  if not found then
    raise exception 'This request is no longer available';
  end if;

  if not p_accept then
    update public.connection_requests set status = 'declined', responded_at = now() where id = p_request;
    return null;
  end if;

  if not public.is_active_member(me) then
    raise exception 'Membership required' using errcode = '42501';
  end if;

  insert into public.connections (user_a, user_b)
  values (least(req.from_user, req.to_user), greatest(req.from_user, req.to_user))
  on conflict (user_a, user_b) do nothing;
  conn := public.connection_id_between(req.from_user, req.to_user);

  update public.connection_requests set status = 'accepted', responded_at = now() where id = p_request;

  -- Their note becomes the first message, as in the design.
  perform set_config('vyaparhood.skip_message_notify', 'on', true);
  insert into public.messages (connection_id, sender_id, body) values (conn, req.from_user, req.note);
  perform set_config('vyaparhood.skip_message_notify', 'off', true);

  insert into public.notifications (user_id, kind, actor_id, connection_id)
  values (req.from_user, 'approved', me, conn);

  return conn;
end $$;

create or replace function public.withdraw_connection_request(p_request uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  update public.connection_requests
  set status = 'withdrawn', responded_at = now()
  where id = p_request and from_user = auth.uid() and status = 'pending';
end $$;

create or replace function public.my_requests()
returns table (
  id              uuid,
  direction       text,
  note            text,
  created_at      timestamptz,
  member_id       uuid,
  member_name     text,
  member_headline text,
  member_photo    text
)
language sql stable security definer set search_path = public as $$
  select
    cr.id,
    case when cr.to_user = auth.uid() then 'incoming' else 'outgoing' end,
    cr.note,
    cr.created_at,
    p.id,
    p.full_name,
    coalesce(nullif(p.headline, ''), p.building),
    p.photo_path
  from public.connection_requests cr
  join public.profiles p
    on p.id = case when cr.to_user = auth.uid() then cr.from_user else cr.to_user end
  where cr.status = 'pending'
    and auth.uid() in (cr.from_user, cr.to_user)
    and not p.is_banned
    and not public.is_blocked_between(cr.from_user, cr.to_user)
  order by cr.created_at desc;
$$;

-- ---------------------------------------------------------------------
-- RPC: chats
-- ---------------------------------------------------------------------

create or replace function public.my_chats()
returns table (
  connection_id     uuid,
  member_id         uuid,
  member_name       text,
  member_photo      text,
  last_body         text,
  last_sender_is_me boolean,
  last_at           timestamptz,
  unread            boolean,
  blocked           boolean
)
language sql stable security definer set search_path = public as $$
  select
    c.id,
    p.id,
    p.full_name,
    p.photo_path,
    lm.body,
    lm.sender_id = auth.uid(),
    coalesce(lm.created_at, c.created_at),
    coalesce(lm.sender_id <> auth.uid() and lm.created_at > coalesce(cr.last_read_at, 'epoch'::timestamptz), false),
    public.is_blocked_between(c.user_a, c.user_b)
  from public.connections c
  join public.profiles p on p.id = case when c.user_a = auth.uid() then c.user_b else c.user_a end
  left join lateral (
    select m.body, m.sender_id, m.created_at
    from public.messages m
    where m.connection_id = c.id
    order by m.created_at desc
    limit 1
  ) lm on true
  left join public.chat_reads cr on cr.connection_id = c.id and cr.user_id = auth.uid()
  where auth.uid() in (c.user_a, c.user_b)
    and not exists (select 1 from public.blocks b where b.blocker = auth.uid()
                    and b.blocked = p.id)
  order by coalesce(lm.created_at, c.created_at) desc;
$$;

create or replace function public.mark_chat_read(p_connection uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.is_connection_member(p_connection) then
    return;
  end if;
  insert into public.chat_reads (connection_id, user_id, last_read_at)
  values (p_connection, auth.uid(), now())
  on conflict (connection_id, user_id) do update set last_read_at = now();
  update public.notifications set read_at = now()
  where user_id = auth.uid() and connection_id = p_connection and kind = 'message' and read_at is null;
end $$;

-- ---------------------------------------------------------------------
-- RPC: safety (block, report, rate, saved)
-- ---------------------------------------------------------------------

create or replace function public.block_member(p_id uuid)
returns void language plpgsql security definer set search_path = public as $$
declare
  me uuid := auth.uid();
begin
  if me is null or p_id = me then
    raise exception 'Invalid block';
  end if;
  insert into public.blocks (blocker, blocked) values (me, p_id) on conflict do nothing;
  update public.connection_requests
    set status = case when from_user = me then 'withdrawn' else 'declined' end, responded_at = now()
    where status = 'pending'
      and least(from_user, to_user) = least(me, p_id)
      and greatest(from_user, to_user) = greatest(me, p_id);
  delete from public.saved_profiles where user_id = me and member_id = p_id;
end $$;

create or replace function public.my_blocked()
returns table (id uuid, full_name text)
language sql stable security definer set search_path = public as $$
  select p.id, p.full_name
  from public.blocks b join public.profiles p on p.id = b.blocked
  where b.blocker = auth.uid()
  order by b.created_at desc;
$$;

create or replace function public.rate_member(p_id uuid, p_stars integer, p_tags text[], p_note text)
returns void language plpgsql security definer set search_path = public as $$
begin
  if public.connection_id_between(auth.uid(), p_id) is null then
    raise exception 'You can only rate members you are connected with';
  end if;
  insert into public.ratings (rater, rated, stars, tags, note)
  values (auth.uid(), p_id, p_stars, coalesce(p_tags, '{}'), left(coalesce(p_note, ''), 280))
  on conflict (rater, rated) do update
    set stars = excluded.stars, tags = excluded.tags, note = excluded.note, updated_at = now();
end $$;

create or replace function public.my_saved()
returns table (id uuid, full_name text, headline text, photo_path text)
language sql stable security definer set search_path = public as $$
  select p.id, p.full_name, coalesce(nullif(p.headline, ''), p.building), p.photo_path
  from public.saved_profiles s join public.profiles p on p.id = s.member_id
  where s.user_id = auth.uid()
    and not p.is_banned
    and not public.is_blocked_between(auth.uid(), p.id)
  order by s.created_at desc;
$$;

create or replace function public.my_notifications()
returns table (
  id            bigint,
  kind          text,
  created_at    timestamptz,
  read_at       timestamptz,
  actor_id      uuid,
  actor_name    text,
  connection_id uuid
)
language sql stable security definer set search_path = public as $$
  select n.id, n.kind, n.created_at, n.read_at, n.actor_id, p.full_name, n.connection_id
  from public.notifications n
  left join public.profiles p on p.id = n.actor_id
  where n.user_id = auth.uid()
    and (n.actor_id is null or not public.is_blocked_between(auth.uid(), n.actor_id))
  order by n.created_at desc
  limit 100;
$$;

create or replace function public.my_stats()
returns table (connections integer, requests_sent integer, rating numeric)
language sql stable security definer set search_path = public as $$
  select
    (select count(*)::integer from public.connections c where auth.uid() in (c.user_a, c.user_b)),
    (select count(*)::integer from public.connection_requests cr where cr.from_user = auth.uid()),
    (select round(avg(r.stars)::numeric, 1) from public.ratings r where r.rated = auth.uid());
$$;

-- ---------------------------------------------------------------------
-- RPC: admin tools (every function checks is_admin itself)
-- ---------------------------------------------------------------------

create or replace function public.assert_admin()
returns void language plpgsql stable security definer set search_path = public as $$
begin
  if not public.is_admin() then
    raise exception 'Admins only' using errcode = '42501';
  end if;
end $$;

create or replace function public.admin_pending_documents()
returns table (
  doc_id       uuid,
  user_id      uuid,
  user_name    text,
  user_email   text,
  kind         text,
  file_name    text,
  storage_path text,
  created_at   timestamptz
)
language plpgsql stable security definer set search_path = public as $$
#variable_conflict use_column
begin
  perform public.assert_admin();
  return query
  select d.id, d.user_id, p.full_name, p.email, d.kind, d.file_name, d.storage_path, d.created_at
  from public.verification_documents d
  join public.profiles p on p.id = d.user_id
  where d.status = 'pending' and d.purged_at is null
  order by d.created_at asc;
end $$;

create or replace function public.admin_review_member(p_user uuid, p_approve boolean)
returns void language plpgsql security definer set search_path = public as $$
begin
  perform public.assert_admin();
  update public.verification_documents
    set status = case when p_approve then 'approved' else 'rejected' end,
        reviewed_by = auth.uid(), reviewed_at = now()
    where user_id = p_user and status = 'pending';
  update public.profiles
    set verification_status = case when p_approve then 'verified' else 'rejected' end
    where id = p_user;
  if p_approve then
    insert into public.notifications (user_id, kind) values (p_user, 'badge');
  end if;
end $$;

create or replace function public.admin_list_reports()
returns table (
  id              uuid,
  reporter_name   text,
  reported_id     uuid,
  reported_name   text,
  reported_banned boolean,
  reason          text,
  details         text,
  status          text,
  created_at      timestamptz
)
language plpgsql stable security definer set search_path = public as $$
#variable_conflict use_column
begin
  perform public.assert_admin();
  return query
  select r.id, rp.full_name, r.reported, dp.full_name, dp.is_banned, r.reason, r.details, r.status, r.created_at
  from public.reports r
  join public.profiles rp on rp.id = r.reporter
  join public.profiles dp on dp.id = r.reported
  order by (r.status = 'open') desc, r.created_at desc
  limit 200;
end $$;

create or replace function public.admin_set_report_status(p_report uuid, p_status text)
returns void language plpgsql security definer set search_path = public as $$
begin
  perform public.assert_admin();
  update public.reports set status = p_status where id = p_report;
end $$;

create or replace function public.admin_set_banned(p_user uuid, p_banned boolean)
returns void language plpgsql security definer set search_path = public as $$
begin
  perform public.assert_admin();
  if p_user = auth.uid() then
    raise exception 'You cannot ban yourself';
  end if;
  update public.profiles set is_banned = p_banned where id = p_user;
end $$;

create or replace function public.admin_set_membership(p_user uuid, p_active boolean)
returns void language plpgsql security definer set search_path = public as $$
begin
  perform public.assert_admin();
  insert into public.memberships (user_id, active, source, plan_id)
  values (p_user, p_active, 'admin', case when p_active then 'granted' end)
  on conflict (user_id) do update
    set active = excluded.active, source = 'admin', plan_id = excluded.plan_id;
end $$;

create or replace function public.admin_set_admin(p_user uuid, p_admin boolean)
returns void language plpgsql security definer set search_path = public as $$
begin
  perform public.assert_admin();
  if p_user = auth.uid() and not p_admin then
    raise exception 'You cannot remove your own admin rights';
  end if;
  update public.profiles set is_admin = p_admin where id = p_user;
end $$;

create or replace function public.admin_search_members(p_query text default '')
returns table (
  id                  uuid,
  full_name           text,
  email               text,
  city                text,
  verification_status text,
  membership_active   boolean,
  is_admin            boolean,
  is_banned           boolean,
  created_at          timestamptz
)
language plpgsql stable security definer set search_path = public as $$
#variable_conflict use_column
begin
  perform public.assert_admin();
  return query
  select p.id, p.full_name, p.email, p.city, p.verification_status,
         coalesce(m.active, false), p.is_admin, p.is_banned, p.created_at
  from public.profiles p
  left join public.memberships m on m.user_id = p.id
  where coalesce(p_query, '') = ''
     or p.full_name ilike '%' || p_query || '%'
     or p.email ilike '%' || p_query || '%'
  order by p.created_at desc
  limit 50;
end $$;

-- ---------------------------------------------------------------------
-- Function permissions: logged-in users only; internals locked away.
-- ---------------------------------------------------------------------

revoke execute on all functions in schema public from public, anon;
grant execute on all functions in schema public to authenticated;
revoke execute on function public.apply_bootstrap(uuid, text) from authenticated;
revoke execute on function public.handle_new_user() from authenticated;
revoke execute on function public.notify_on_request() from authenticated;
revoke execute on function public.notify_on_message() from authenticated;
revoke execute on function public.mark_verification_pending() from authenticated;
alter default privileges in schema public revoke execute on functions from public, anon;

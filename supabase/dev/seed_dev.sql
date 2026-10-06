-- =====================================================================
-- DEV PROJECT ONLY. Never run this on production.
--
-- Before running, replace 919999999999 (two places below) with the
-- phone number you will test with: country code + number, digits only.
-- Use the same number as a Supabase test number (README, step 1.4) so
-- you can log in without a real SMS.
--
--   * Makes that number the root admin.
--   * Creates 10 demo businesses (not real, can't log in).
--   * When the root account signs up, it gets demo requests, chats,
--     saved profiles and notifications, and the demo businesses are kept
--     within a few km of wherever you are testing, in your city.
-- Safe to run more than once.
-- =====================================================================

insert into public.bootstrap_accounts (phone, make_admin, grant_membership, seed_demo)
values ('917624828905', true, true, true)
on conflict (phone) do update
  set make_admin = true, grant_membership = true, seed_demo = true;

create table if not exists public.dev_demo_members (
  id           uuid primary key,
  slug         text unique not null,
  phone        text unique not null,
  distance_km  double precision not null,
  bearing_deg  double precision not null,
  sort_order   integer not null
);
alter table public.dev_demo_members enable row level security;

insert into public.dev_demo_members (id, slug, phone, distance_km, bearing_deg, sort_order) values
  ('00000000-0000-4000-a000-000000000001', 'riya',   '910000000001',  0.8, 322,  1),
  ('00000000-0000-4000-a000-000000000002', 'arjun',  '910000000002',  2.1,  47,  2),
  ('00000000-0000-4000-a000-000000000003', 'sana',   '910000000003',  1.4, 144,  3),
  ('00000000-0000-4000-a000-000000000004', 'dev',    '910000000004',  1.2, 228,  4),
  ('00000000-0000-4000-a000-000000000005', 'meera',  '910000000005',  6.2,  15,  5),
  ('00000000-0000-4000-a000-000000000006', 'ishaan', '910000000006',  8.3, 190,  6),
  ('00000000-0000-4000-a000-000000000007', 'pooja',  '910000000007',  9.1,  95,  7),
  ('00000000-0000-4000-a000-000000000008', 'rohan',  '910000000008', 12.4, 200,  8),
  ('00000000-0000-4000-a000-000000000009', 'karan',  '910000000009',  2.6,  80,  9),
  ('00000000-0000-4000-a000-000000000010', 'neha',   '910000000010',  3.4, 300, 10)
on conflict (id) do nothing;

-- Demo auth users. They have no way to receive an OTP, so nobody can
-- sign in as them.
insert into auth.users (
  instance_id, id, aud, role, phone, phone_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, recovery_token, email_change_token_new, email_change
)
select
  '00000000-0000-0000-0000-000000000000', d.id, 'authenticated', 'authenticated',
  d.phone, now(),
  '{"provider":"phone","providers":["phone"]}'::jsonb, '{}'::jsonb,
  now() - (interval '1 day' * (20 - d.sort_order)), now(),
  '', '', '', ''
from public.dev_demo_members d
on conflict (id) do nothing;

-- Profiles (rows were created by the signup trigger; fill them in).
update public.profiles p set
  full_name = v.full_name, headline = v.headline, category = v.category,
  bio = v.bio, offers = v.offers, looking_for = v.looking_for,
  area = v.area, city = 'Mumbai', show_exact_distance = v.exact,
  verification_status = 'verified',
  onboarding_completed = true, consented_at = now(),
  created_at = now() - (interval '1 day' * (20 - d.sort_order))
from public.dev_demo_members d
join (values
  ('riya', 'Riya Kapoor', 'Founder, Cafe Loom', 'food', 'Building third-wave coffee spaces for remote workers across Mumbai.', array['Hiring baristas'], array['Co-founder'], 'Bandra West', true),
  ('arjun', 'Arjun Mehta', 'Strength & Conditioning Coach', 'fitness', 'Runs small-group strength sessions for startup teams and busy founders.', array['Open to collabs', 'Team fitness sessions'], array['Studio space'], 'Powai', true),
  ('sana', 'Sana Iyer', 'Brand & Interior Designer', 'creative', 'Designs cafes and boutique retail spaces across Mumbai. Previously led interiors at a hospitality studio — now building my own practice one project at a time.', array['Interior design', 'Space planning'], array['Co-founder', 'Contractor referrals'], 'Bandra West', true),
  ('dev', 'Dev Malhotra', 'Product Photographer', 'creative', 'Shoots menus, products and spaces for small brands. Studio in Khar.', array['Open to collabs', 'Product shoots'], array['Brand collabs'], 'Khar West', false),
  ('meera', 'Meera Joshi', 'Graphic Designer', 'creative', 'Brand identities and packaging for food and D2C brands.', array['Branding', 'Packaging design'], array['Printing partners'], 'Andheri West', true),
  ('ishaan', 'Ishaan Rao', 'Founder, Loop Retail', 'retail', 'Opening a sustainable homeware store. Sourcing from local makers.', array['Pop-up retail space'], array['Suppliers', 'Visual merchandiser'], 'Lower Parel', false),
  ('pooja', 'Pooja Nair', 'Yoga Studio Owner', 'fitness', 'Two studios in Chembur. Runs workshops for corporate teams.', array['Corporate yoga'], array['Cafe partners'], 'Chembur', true),
  ('rohan', 'Rohan Desai', 'Cafe Owner', 'food', 'All-day cafe in Colaba. Planning a second outlet next year.', array['Hiring chefs', 'Event space'], array['Head chef'], 'Colaba', true),
  ('karan', 'Karan Shah', 'Co-working space founder', 'tech', 'Runs a 120-seat co-working space in Bandra East.', array['Desk space', 'Meeting rooms'], array['Community partners'], 'Bandra East', true),
  ('neha', 'Neha Verma', 'Marketing consultant', 'creative', 'Launch and growth marketing for new local businesses.', array['Launch plans', 'Social media'], array['New clients'], 'Santacruz', true)
) as v(slug, full_name, headline, category, bio, offers, looking_for, area, exact)
  on v.slug = d.slug
where p.id = d.id;

-- Default demo business locations around Bandra West, Mumbai.
insert into public.business_locations (user_id, location, address_line, locality, city, placed_by, updated_at)
select d.id,
       extensions.ST_Project(
         extensions.ST_SetSRID(extensions.ST_MakePoint(72.8295, 19.0596), 4326)::extensions.geography,
         d.distance_km * 1000, radians(d.bearing_deg))::extensions.geography,
       'Demo address', p.area, 'Mumbai', 'device', now()
from public.dev_demo_members d
join public.profiles p on p.id = d.id
on conflict (user_id) do nothing;

-- A few ratings between demo members so averages aren't empty.
insert into public.ratings (rater, rated, stars, tags)
select a.id, b.id, 5, array['Professional']
from public.dev_demo_members a join public.dev_demo_members b on a.slug = 'karan' and b.slug in ('riya', 'sana', 'arjun')
on conflict do nothing;

-- Keep demo businesses a few km around the tester, in the tester's city.
create or replace function public.dev_place_demo_near(p_user uuid)
returns void language plpgsql security definer set search_path = public, extensions as $$
declare
  center extensions.geography;
  v_city text;
begin
  center := public.search_origin(p_user);
  if center is null then
    return;
  end if;
  select coalesce(l.city, p.city, 'Mumbai') into v_city
  from public.profiles p left join public.live_locations l on l.user_id = p.id
  where p.id = p_user;

  update public.business_locations bl
    set location = extensions.ST_Project(center, d.distance_km * 1000, radians(d.bearing_deg))::extensions.geography,
        city = v_city, updated_at = now()
  from public.dev_demo_members d
  where bl.user_id = d.id;

  update public.profiles p set city = v_city
  from public.dev_demo_members d where p.id = d.id;
end $$;

-- Demo requests, chats, saved profiles and notifications for the tester.
create or replace function public.dev_seed_relationships(p_user uuid)
returns void language plpgsql security definer set search_path = public as $$
declare
  riya  uuid := '00000000-0000-4000-a000-000000000001';
  arjun uuid := '00000000-0000-4000-a000-000000000002';
  sana  uuid := '00000000-0000-4000-a000-000000000003';
  karan uuid := '00000000-0000-4000-a000-000000000009';
  neha  uuid := '00000000-0000-4000-a000-000000000010';
  c_riya  uuid;
  c_arjun uuid;
begin
  perform set_config('vyaparhood.skip_message_notify', 'on', true);

  -- Incoming requests (Karan, Neha) — accept them to see chat unlock.
  insert into public.connection_requests (from_user, to_user, note, created_at) values
    (karan, p_user, 'Hey! Saw you''re building nearby too — would love to swap notes on vendors.', now() - interval '12 minutes'),
    (neha,  p_user, 'Would love to help with your launch marketing — happy to share a quick plan.', now() - interval '1 hour')
  on conflict do nothing;

  -- Existing chats (Riya, Arjun).
  insert into public.connections (user_a, user_b) values (least(p_user, riya), greatest(p_user, riya)) on conflict do nothing;
  insert into public.connections (user_a, user_b) values (least(p_user, arjun), greatest(p_user, arjun)) on conflict do nothing;
  c_riya  := public.connection_id_between(p_user, riya);
  c_arjun := public.connection_id_between(p_user, arjun);

  if not exists (select 1 from public.messages where connection_id = c_riya) then
    insert into public.messages (connection_id, sender_id, body, created_at) values
      (c_riya, riya,   'Come by the cafe on Friday around 4? We can talk branding ☕', now() - interval '26 hours'),
      (c_riya, p_user, 'Sounds good, see you at the cafe!', now() - interval '25 hours');
  end if;
  if not exists (select 1 from public.messages where connection_id = c_arjun) then
    insert into public.messages (connection_id, sender_id, body, created_at) values
      (c_arjun, p_user, 'Would your sessions work for a team of eight?', now() - interval '4 days 1 hour'),
      (c_arjun, arjun,  'Let''s do a free trial session for your team 💪', now() - interval '4 days');
  end if;

  insert into public.saved_profiles (user_id, member_id) values
    (p_user, riya), (p_user, arjun), (p_user, sana)
  on conflict do nothing;

  insert into public.notifications (user_id, kind, actor_id, connection_id, created_at, read_at) values
    (p_user, 'message', arjun, c_arjun, now() - interval '4 days', null);

  perform set_config('vyaparhood.skip_message_notify', 'off', true);
end $$;

revoke execute on function public.dev_place_demo_near(uuid) from public, anon, authenticated;
revoke execute on function public.dev_seed_relationships(uuid) from public, anon, authenticated;

-- If the root account already signed up before this file was run:
select public.apply_bootstrap(u.id, u.phone)
from auth.users u
where u.phone = '917624828905' and u.phone_confirmed_at is not null;

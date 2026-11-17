-- =====================================================================
-- PRODUCTION: make Jay Shetty an admin and Vyaparhood the root account.
-- Run in the SQL Editor of the prod project, one step at a time.
-- =====================================================================

-- STEP 1 — check who will be changed. Expect exactly one row per person.
-- If a name matches more than one row, use the email instead
-- (where p.email = '...').
select p.id, p.full_name, p.email, p.is_admin, m.active, m.plan_id, m.renews_at
from public.profiles p
left join public.memberships m on m.user_id = p.id
where p.full_name ilike 'jay shetty'
   or p.full_name ilike 'vyaparhood';

-- STEP 2 — Jay Shetty: admin (admins never hit the paywall).
update public.profiles
  set is_admin = true
  where full_name ilike 'jay shetty';

-- STEP 3 — Vyaparhood: admin + root membership that never expires.
update public.profiles
  set is_admin = true
  where full_name ilike 'vyaparhood';

update public.memberships m
  set active = true, source = 'admin', plan_id = 'root', renews_at = null
  from public.profiles p
  where p.id = m.user_id
    and p.full_name ilike 'vyaparhood';

-- Keep it that way if the account is ever recreated with the same email.
insert into public.bootstrap_accounts (email, make_admin, grant_membership, seed_demo)
select lower(p.email), true, true, false
from public.profiles p
where p.full_name ilike 'vyaparhood' and p.email is not null
on conflict (email) do update set make_admin = true, grant_membership = true, seed_demo = false;

-- STEP 4 — confirm.
select p.full_name, p.email, p.is_admin, m.active, m.plan_id, m.renews_at
from public.profiles p
left join public.memberships m on m.user_id = p.id
where p.is_admin;

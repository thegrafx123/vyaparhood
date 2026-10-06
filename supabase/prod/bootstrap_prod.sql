-- =====================================================================
-- PRODUCTION: root admin account (no demo data).
-- Replace 91XXXXXXXXXX (two places) with the admin's phone number:
-- country code + number, digits only, e.g. 919876543210.
-- Run once in the SQL editor.
-- =====================================================================
insert into public.bootstrap_accounts (phone, make_admin, grant_membership, seed_demo)
values ('91XXXXXXXXXX', true, true, false)
on conflict (phone) do update set make_admin = true, grant_membership = true, seed_demo = false;

-- Applies immediately if that account already exists.
select public.apply_bootstrap(u.id, u.phone)
from auth.users u
where u.phone = '91XXXXXXXXXX' and u.phone_confirmed_at is not null;

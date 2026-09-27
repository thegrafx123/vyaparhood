-- =====================================================================
-- PRODUCTION: root admin account (no demo data).
-- Replace the email before running. Run once in the SQL editor.
-- =====================================================================
insert into public.bootstrap_accounts (email, make_admin, grant_membership, seed_demo)
values ('REPLACE_WITH_PROD_ADMIN_EMAIL', true, true, false)
on conflict (email) do update set make_admin = true, grant_membership = true, seed_demo = false;

-- Applies immediately if that account already exists.
select public.apply_bootstrap(u.id, u.email)
from auth.users u
where lower(u.email) = lower('REPLACE_WITH_PROD_ADMIN_EMAIL');

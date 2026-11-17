-- =====================================================================
-- PRODUCTION: root admin account (no demo data).
-- Replace admin@example.com (two places) with the admin's login email,
-- lowercase. Run once in the SQL editor.
-- =====================================================================
insert into public.bootstrap_accounts (email, make_admin, grant_membership, seed_demo)
values ('no-reply@vyaparhood.com', true, true, false)
on conflict (email) do update set make_admin = true, grant_membership = true, seed_demo = false;

-- Applies immediately if that account already exists.
select public.apply_bootstrap(u.id, u.phone, u.email)
from auth.users u
where lower(u.email) = 'no-reply@vyaparhood.com' and u.email_confirmed_at is not null;

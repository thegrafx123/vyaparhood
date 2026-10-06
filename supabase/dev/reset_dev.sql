-- =====================================================================
-- DEV ONLY — wipe everything the app created so the current schema
-- (supabase/migrations/20260928000000_init.sql) can be installed fresh.
-- NEVER run this on production.
--
-- Removes: every table, function and trigger in the public schema,
-- the app's storage policies, the app's scheduled jobs, and ALL user
-- logins (test accounts and demo members).
--
-- Leaves alone: Supabase's own schemas (auth, storage, realtime …) and
-- installed extensions such as PostGIS — dropping those breaks the project.
--
-- Before running: Dashboard → Storage → delete the "verification-docs"
-- bucket, and empty the "avatars" bucket if it has test photos.
-- Supabase doesn't allow deleting stored files from SQL.
-- =====================================================================

-- 1. Sign-up triggers on auth.users (old and new schema).
drop trigger if exists on_auth_user_created on auth.users;
drop trigger if exists on_auth_user_phone_confirmed on auth.users;

-- 2. The app's storage policies (the buckets are handled in the dashboard).
drop policy if exists "avatars: members and owner can view" on storage.objects;
drop policy if exists "avatars: owner uploads" on storage.objects;
drop policy if exists "avatars: owner replaces" on storage.objects;
drop policy if exists "avatars: owner deletes" on storage.objects;
drop policy if exists "docs: owner or admin can view" on storage.objects;
drop policy if exists "docs: owner uploads" on storage.objects;
drop policy if exists "docs: owner deletes" on storage.objects;

-- 3. Every table in public, with its indexes, policies, triggers and
--    realtime entries. Tables that belong to an extension are skipped.
do $$
declare
  t text;
begin
  for t in
    select format('%I.%I', n.nspname, c.relname)
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relkind in ('r', 'p')
      and not exists (
        select 1 from pg_depend d
        where d.classid = 'pg_class'::regclass and d.objid = c.oid and d.deptype = 'e'
      )
  loop
    execute format('drop table if exists %s cascade', t);
  end loop;
end $$;

-- 4. Every function in public (app RPCs, trigger functions, dev seed helpers).
do $$
declare
  f text;
begin
  for f in
    select p.oid::regprocedure::text
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and not exists (
        select 1 from pg_depend d
        where d.classid = 'pg_proc'::regclass and d.objid = p.oid and d.deptype = 'e'
      )
  loop
    execute format('drop function if exists %s cascade', f);
  end loop;
end $$;

-- 5. The app's scheduled jobs (only if pg_cron is installed).
do $$
begin
  if exists (select 1 from pg_extension where extname = 'pg_cron') then
    perform cron.unschedule(j.jobid)
    from cron.job j
    where j.jobname in ('purge-expired-documents', 'purge-deleted-accounts');
  end if;
end $$;

-- 6. CLI migration history (only exists if you used `supabase db push`).
do $$
begin
  if to_regclass('supabase_migrations.schema_migrations') is not null then
    delete from supabase_migrations.schema_migrations;
  end if;
end $$;

-- 7. Every login: your test accounts and the old demo members.
delete from auth.users;

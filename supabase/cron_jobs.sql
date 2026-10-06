-- =====================================================================
-- Scheduled job: permanently delete accounts 30 days after their owner
-- asked for deletion. Run once per project (dev and prod) in the SQL
-- editor, AFTER deploying the purge-deleted-accounts Edge Function.
--
-- Replace:
--   <PROJECT_REF>  e.g. abcdefghijklmnop (Project Settings → General)
--   <CRON_SECRET>  the same random string you set with
--                  `supabase secrets set CRON_SECRET=...`
-- =====================================================================
create extension if not exists pg_cron;
create extension if not exists pg_net;

select cron.schedule(
  'purge-deleted-accounts',
  '30 21 * * *',   -- 21:30 UTC = 03:00 IST, daily
  $$
  select net.http_post(
    url     := 'https://uxhbekxbpittlpymvfam.supabase.co/functions/v1/purge-deleted-accounts',
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-cron-secret', '466ba3e45d8e95db81746c3c1ded2fb64b24307b812ee5ee23c6a85de72d973e'),
    body    := '{}'::jsonb
  );
  $$
);

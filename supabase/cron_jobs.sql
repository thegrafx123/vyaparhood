-- =====================================================================
-- Scheduled job: permanently delete verification documents after
-- 30 days. Run once per project (dev and prod) in the SQL editor,
-- AFTER deploying the purge-expired-documents Edge Function.
--
-- Replace:
--   <PROJECT_REF>  e.g. abcdefghijklmnop (Settings → General)
--   <CRON_SECRET>  the same random string you set with
--                  `supabase secrets set CRON_SECRET=...`
-- =====================================================================
create extension if not exists pg_cron;
create extension if not exists pg_net;

select cron.schedule(
  'purge-expired-documents',
  '30 21 * * *',   -- 21:30 UTC = 03:00 IST, daily
  $$
  select net.http_post(
    url     := 'https://<PROJECT_REF>.supabase.co/functions/v1/purge-expired-documents',
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-cron-secret', '<CRON_SECRET>'),
    body    := '{}'::jsonb
  );
  $$
);

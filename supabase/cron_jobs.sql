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
    url     :='https://vpsrdoqyuxabadnkizbk.supabase.co/functions/v1/purge-deleted-accounts',
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-cron-secret', 'QeNjM50Wdv6kmnGYOEUyIoLXPspa4lq2wDugAc8xRTCZhbB9'),
    body    := '{}'::jsonb
  );
  $$
);

-- ---------------------------------------------------------------------
-- Scheduled job: switch off memberships whose plan period has ended.
-- Run once per project AFTER deploying the expire-memberships Edge
-- Function. Uses the same <PROJECT_REF> and <CRON_SECRET> as above.
-- ---------------------------------------------------------------------
select cron.schedule(
  'expire-memberships',
  '35 18 * * *',   -- 18:35 UTC = 00:05 IST, daily
  $$
  select net.http_post(
    url     := 'https://vpsrdoqyuxabadnkizbk.supabase.co/functions/v1/expire-memberships',
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-cron-secret', 'QeNjM50Wdv6kmnGYOEUyIoLXPspa4lq2wDugAc8xRTCZhbB9'),
    body    := '{}'::jsonb
  );
  $$
);
-- Twice a day instead: use '35 6,18 * * *' (12:05 and 00:05 IST).

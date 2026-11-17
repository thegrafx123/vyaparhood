-- =====================================================================
-- Plan expiry. A paid membership whose renews_at has passed is switched
-- off (memberships.active = false). Nothing is deleted: the member keeps
-- their profile, chats and history, and is sent to the paywall until
-- they renew. Called by the expire-memberships Edge Function on a
-- schedule (see supabase/cron_jobs.sql).
--
-- Admin/root grants have no renews_at, so they never expire.
-- =====================================================================

create index if not exists memberships_expiry
  on public.memberships (renews_at)
  where active and renews_at is not null;

create or replace function public.expire_memberships()
returns integer language plpgsql security definer set search_path = public as $$
declare
  n integer;
begin
  update public.memberships
    set active = false
    where active
      and renews_at is not null
      and renews_at <= now();
  get diagnostics n = row_count;
  return n;
end $$;

-- Only the Edge Function (service role) may run it.
revoke execute on function public.expire_memberships() from public, anon, authenticated;
grant execute on function public.expire_memberships() to service_role;

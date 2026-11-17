-- =====================================================================
-- Push notifications.
--   push_tokens: one row per phone (Expo push token), owned by whoever
--   is signed in on it. Whenever a notifications row (request / approved
--   / badge) or a chat message is created, the database calls the
--   send-push Edge Function through pg_net; it sends via Expo.
--
-- One-time setup per project (SQL editor), after deploying send-push:
--   select vault.create_secret('https://<PROJECT_REF>.supabase.co/functions/v1/send-push', 'push_function_url');
--   select vault.create_secret('<CRON_SECRET>', 'push_function_secret');
-- Until both exist, pushes are skipped (the in-app list still works).
-- =====================================================================
create extension if not exists pg_net;

create table public.push_tokens (
  token      text primary key,
  user_id    uuid not null references public.profiles (id) on delete cascade,
  platform   text not null check (platform in ('ios', 'android', 'web')),
  updated_at timestamptz not null default now()
);
create index push_tokens_user on public.push_tokens (user_id);

alter table public.push_tokens enable row level security;
grant select, delete on public.push_tokens to authenticated;
create policy "push_tokens: read own" on public.push_tokens
  for select to authenticated using (user_id = auth.uid());
create policy "push_tokens: delete own" on public.push_tokens
  for delete to authenticated using (user_id = auth.uid());

-- Saves this phone's token for the caller. A phone that signs into
-- another account takes its token with it, which RLS alone can't do.
create or replace function public.claim_push_token(p_token text, p_platform text)
returns void language sql security definer set search_path = public as $$
  insert into public.push_tokens (token, user_id, platform, updated_at)
  values (p_token, auth.uid(), p_platform, now())
  on conflict (token) do update
    set user_id = excluded.user_id, platform = excluded.platform, updated_at = now();
$$;
revoke all on function public.claim_push_token(text, text) from public, anon;
grant execute on function public.claim_push_token(text, text) to authenticated;

create or replace function public.dispatch_push(p_payload jsonb)
returns void language plpgsql security definer set search_path = public as $$
declare
  fn_url    text;
  fn_secret text;
begin
  select decrypted_secret into fn_url    from vault.decrypted_secrets where name = 'push_function_url';
  select decrypted_secret into fn_secret from vault.decrypted_secrets where name = 'push_function_secret';
  if fn_url is null or fn_secret is null then
    return;
  end if;
  perform net.http_post(
    url     := fn_url,
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-cron-secret', fn_secret),
    body    := p_payload
  );
exception when others then
  -- A push problem must never break the insert that caused it.
  raise warning 'dispatch_push failed: %', sqlerrm;
end $$;
revoke all on function public.dispatch_push(jsonb) from public, anon, authenticated;

-- request / approved / badge. Message rows are skipped here: they are
-- de-duplicated per chat, while a push should go out for every message.
create or replace function public.push_on_notification()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.kind <> 'message' then
    perform public.dispatch_push(jsonb_build_object(
      'kind', new.kind,
      'user_id', new.user_id,
      'actor_id', new.actor_id,
      'connection_id', new.connection_id
    ));
  end if;
  return new;
end $$;

create trigger notifications_push
  after insert on public.notifications
  for each row execute function public.push_on_notification();

create or replace function public.push_on_message()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  c public.connections;
begin
  -- The request note copied in as the first message gets the "approved" push instead.
  if coalesce(current_setting('vyaparhood.skip_message_notify', true), '') = 'on' then
    return new;
  end if;
  select * into c from public.connections where id = new.connection_id;
  perform public.dispatch_push(jsonb_build_object(
    'kind', 'message',
    'user_id', case when c.user_a = new.sender_id then c.user_b else c.user_a end,
    'actor_id', new.sender_id,
    'connection_id', new.connection_id,
    'body', left(new.body, 140)
  ));
  return new;
end $$;

create trigger messages_push
  after insert on public.messages
  for each row execute function public.push_on_message();

-- =====================================================================
-- PayU payments.
--
-- Flow (all money logic is server-side):
--   1. App → payu-create-order (Edge Function, member's JWT). It creates
--      a `payments` row with the server-side price and returns signed
--      PayU form fields.
--   2. App opens PayU checkout in a WebView with those fields.
--   3. PayU POSTs the result to payu-return (surl/furl) and, separately,
--      to payu-webhook. Both verify PayU's reverse hash AND re-check the
--      transaction with PayU's verify_payment API, then call
--      payu_settle_payment(), which is idempotent.
--   4. A successful payment switches the membership on for the plan's
--      period (stacked on top of any time left on a paid plan).
-- =====================================================================

alter table public.memberships drop constraint if exists memberships_source_check;
alter table public.memberships add constraint memberships_source_check
  check (source in ('none', 'beta', 'admin', 'apple', 'google', 'cashfree', 'payu'));

create table if not exists public.payments (
  txnid          text primary key,
  user_id        uuid not null references public.profiles (id) on delete cascade,
  plan_id        text not null check (plan_id in ('weekly_99', 'monthly_299')),
  amount         numeric(10, 2) not null check (amount > 0),
  currency       text not null default 'INR',
  status         text not null default 'created'
                   check (status in ('created', 'success', 'failed', 'cancelled', 'mismatch')),
  payu_id        text,           -- PayU's mihpayid
  payu_mode      text,           -- CC / DC / UPI / NB ...
  payu_status    text,           -- raw status from PayU
  error_message  text,
  raw            jsonb,          -- last verified payload from PayU
  created_at     timestamptz not null default now(),
  settled_at     timestamptz,
  updated_at     timestamptz not null default now()
);
create index if not exists payments_user on public.payments (user_id, created_at desc);

alter table public.payments enable row level security;
grant select on public.payments to authenticated;
drop policy if exists "payments: read own" on public.payments;
create policy "payments: read own" on public.payments
  for select to authenticated using (user_id = auth.uid());
-- No insert/update policies: only the service role (Edge Functions) writes.

create or replace function public.plan_price(p_plan text)
returns numeric language sql immutable as $$
  select case p_plan
    when 'weekly_99'   then 99.00
    when 'monthly_299' then 299.00
  end::numeric;
$$;

-- Records PayU's verified result. Safe to call any number of times for
-- the same txnid (surl + webhook both call it): the membership is
-- extended only on the first transition to 'success'.
create or replace function public.payu_settle_payment(
  p_txnid       text,
  p_status      text,      -- 'success' | 'failed' | 'cancelled'
  p_amount      numeric,
  p_payu_id     text,
  p_mode        text,
  p_payu_status text,
  p_error       text,
  p_raw         jsonb
) returns text language plpgsql security definer set search_path = public as $$
declare
  pay public.payments;
  m   public.memberships;
  base timestamptz;
begin
  select * into pay from public.payments where txnid = p_txnid for update;
  if not found then
    raise exception 'Unknown txnid %', p_txnid;
  end if;

  -- Already settled successfully: nothing more to do.
  if pay.status = 'success' then
    return 'success';
  end if;

  if p_status = 'success' and p_amount is distinct from pay.amount then
    update public.payments
      set status = 'mismatch', payu_id = p_payu_id, payu_mode = p_mode,
          payu_status = p_payu_status, raw = p_raw,
          error_message = format('Amount mismatch: paid %s, expected %s', p_amount, pay.amount),
          updated_at = now()
      where txnid = p_txnid;
    return 'mismatch';
  end if;

  update public.payments
    set status = p_status, payu_id = p_payu_id, payu_mode = p_mode,
        payu_status = p_payu_status, error_message = p_error, raw = p_raw,
        settled_at = case when p_status = 'success' then now() else settled_at end,
        updated_at = now()
    where txnid = p_txnid;

  if p_status = 'success' then
    select * into m from public.memberships where user_id = pay.user_id for update;
    -- Stack on remaining paid time; beta/expired plans start from now.
    base := case
      when m.active and m.source = 'payu' and m.renews_at > now() then m.renews_at
      else now()
    end;
    insert into public.memberships as mm (user_id, plan_id, source, active, renews_at)
    values (pay.user_id, pay.plan_id, 'payu', true, base + public.plan_period(pay.plan_id))
    on conflict (user_id) do update
      set plan_id = excluded.plan_id,
          source = 'payu',
          active = true,
          renews_at = excluded.renews_at
      where mm.source <> 'admin';
  end if;

  return p_status;
end $$;

revoke execute on function public.payu_settle_payment(text, text, numeric, text, text, text, text, jsonb)
  from public, anon, authenticated;
grant execute on function public.payu_settle_payment(text, text, numeric, text, text, text, text, jsonb)
  to service_role;
revoke execute on function public.plan_price(text) from public, anon;

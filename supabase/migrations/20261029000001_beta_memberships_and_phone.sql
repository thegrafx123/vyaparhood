-- =====================================================================
-- 1. Beta plans are real memberships. Choosing a plan during the beta
--    (no payment) switches the membership on with an end date:
--      weekly_99   → now() + 168 hours
--      monthly_299 → now() + 30 days
--    Access now always needs an active, unexpired membership (admins
--    excepted), in beta and after billing starts.
-- 2. Members save a phone number once, right after their first email
--    login. It isn't verified by OTP.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Memberships
-- ---------------------------------------------------------------------

create or replace function public.plan_period(p_plan text)
returns interval language sql immutable as $$
  select case p_plan
    when 'weekly_99'   then interval '168 hours'
    when 'monthly_299' then interval '30 days'
  end;
$$;

create or replace function public.choose_plan(p_plan text)
returns void language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then
    raise exception 'Not signed in' using errcode = '42501';
  end if;
  if p_plan not in ('weekly_99', 'monthly_299') then
    raise exception 'Unknown plan';
  end if;
  if public.billing_enabled() then
    raise exception 'Please complete payment to continue';
  end if;
  insert into public.memberships as m (user_id, plan_id, source, active, renews_at)
  values (auth.uid(), p_plan, 'beta', true, now() + public.plan_period(p_plan))
  on conflict (user_id) do update
    set plan_id   = excluded.plan_id,
        source    = 'beta',
        active    = true,
        renews_at = excluded.renews_at
    -- Never downgrade an admin/root grant into a timed beta plan.
    where m.source <> 'admin';
end $$;

-- Active, and (for timed plans) not past the end date.
create or replace function public.is_active_member(uid uuid default auth.uid())
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1
    from public.profiles p
    left join public.memberships m on m.user_id = p.id
    where p.id = uid
      and not p.is_banned
      and p.deletion_requested_at is null
      and p.onboarding_completed
      and (
        p.is_admin
        or (coalesce(m.active, false) and (m.renews_at is null or m.renews_at > now()))
      )
  );
$$;

-- Members who already picked a beta plan get a fresh period from today.
update public.memberships
  set active = true,
      renews_at = now() + public.plan_period(plan_id)
  where source = 'beta'
    and plan_id in ('weekly_99', 'monthly_299');

-- ---------------------------------------------------------------------
-- 2. Phone number (collected, not verified)
-- ---------------------------------------------------------------------

-- Saves the member's own phone. Takes 10 digits (Indian mobile) and
-- stores Supabase-style digits with the country code: 919876543210.
create or replace function public.set_my_phone(p_phone text)
returns void language plpgsql security definer set search_path = public as $$
declare
  me uuid := auth.uid();
  digits text := regexp_replace(coalesce(p_phone, ''), '\D', '', 'g');
begin
  if me is null then
    raise exception 'Not signed in' using errcode = '42501';
  end if;
  if length(digits) = 12 and left(digits, 2) = '91' then
    digits := substr(digits, 3);
  end if;
  if digits !~ '^[6-9][0-9]{9}$' then
    raise exception 'Enter a valid 10-digit mobile number.';
  end if;
  update public.profiles set phone = '91' || digits where id = me;
end $$;

revoke execute on function public.set_my_phone(text) from public, anon;
grant execute on function public.set_my_phone(text) to authenticated;
revoke execute on function public.plan_period(text) from public, anon;

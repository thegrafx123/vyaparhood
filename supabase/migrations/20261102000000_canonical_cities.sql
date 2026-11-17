-- =====================================================================
-- One spelling per city.
--
-- Citywide compares city names as text, so "Bangalore" on one profile
-- and "Bengaluru" on another meant the two never saw each other there,
-- even though Nearby (map distance) showed them. Every city saved to a
-- profile, business address or live location is now stored in one
-- standard spelling, and existing rows are cleaned up.
--
-- Keep the alias list in sync with normaliseCity() in
-- src/services/location.ts.
-- =====================================================================

create or replace function public.canonical_city(p_city text)
returns text language sql immutable as $$
  with c as (
    select nullif(regexp_replace(btrim(coalesce(p_city, '')), '\s+', ' ', 'g'), '') as v
  )
  select case lower(c.v)
    when 'bangalore'          then 'Bengaluru'
    when 'bengaluru'          then 'Bengaluru'
    when 'bengaluru urban'    then 'Bengaluru'
    when 'bangalore urban'    then 'Bengaluru'
    when 'bombay'             then 'Mumbai'
    when 'mumbai'             then 'Mumbai'
    when 'mumbai suburban'    then 'Mumbai'
    when 'mumbai city'        then 'Mumbai'
    when 'new delhi'          then 'Delhi NCR'
    when 'delhi'              then 'Delhi NCR'
    when 'delhi ncr'          then 'Delhi NCR'
    when 'gurgaon'            then 'Gurugram'
    when 'gurugram'           then 'Gurugram'
    when 'calcutta'           then 'Kolkata'
    when 'kolkata'            then 'Kolkata'
    when 'madras'             then 'Chennai'
    when 'chennai'            then 'Chennai'
    when 'cochin'             then 'Kochi'
    when 'ernakulam'          then 'Kochi'
    when 'kochi'              then 'Kochi'
    when 'mysore'             then 'Mysuru'
    when 'mysuru'             then 'Mysuru'
    when 'mangalore'          then 'Mangaluru'
    when 'mangaluru'          then 'Mangaluru'
    when 'trivandrum'         then 'Thiruvananthapuram'
    when 'thiruvananthapuram' then 'Thiruvananthapuram'
    when 'poona'              then 'Pune'
    when 'pune'               then 'Pune'
    when 'baroda'             then 'Vadodara'
    when 'vadodara'           then 'Vadodara'
    when 'vizag'              then 'Visakhapatnam'
    when 'visakhapatnam'      then 'Visakhapatnam'
    when 'hyderabad'          then 'Hyderabad'
    when 'ahmedabad'          then 'Ahmedabad'
    when 'jaipur'             then 'Jaipur'
    else c.v
  end
  from c;
$$;

create or replace function public.canonicalise_city_column()
returns trigger language plpgsql as $$
begin
  new.city := public.canonical_city(new.city);
  return new;
end $$;

drop trigger if exists profiles_canonical_city on public.profiles;
create trigger profiles_canonical_city
  before insert or update of city on public.profiles
  for each row execute function public.canonicalise_city_column();

drop trigger if exists business_locations_canonical_city on public.business_locations;
create trigger business_locations_canonical_city
  before insert or update of city on public.business_locations
  for each row execute function public.canonicalise_city_column();

drop trigger if exists live_locations_canonical_city on public.live_locations;
create trigger live_locations_canonical_city
  before insert or update of city on public.live_locations
  for each row execute function public.canonicalise_city_column();

-- Clean up what's already saved.
update public.profiles set city = public.canonical_city(city)
  where city is distinct from public.canonical_city(city);
update public.business_locations set city = public.canonical_city(city)
  where city is distinct from public.canonical_city(city);
update public.live_locations set city = public.canonical_city(city)
  where city is distinct from public.canonical_city(city);

revoke execute on function public.canonicalise_city_column() from public, anon, authenticated;

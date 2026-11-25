-- Phase 9: estimate log (funnel + unserved demand) and the weekly summary.
--
-- estimate_log: one row per estimate shown or failed in the widget. Anonymous
-- and coarse: city-level place names and coordinates rounded to ~10 km. No
-- name, phone, address, IP or cookie id. Written only via site_record_estimate.

create table public.estimate_log (
  id            bigint generated always as identity primary key,
  created_at    timestamptz not null default now(),
  outcome       text not null check (outcome in ('shown', 'failed')),
  reason        text check (char_length(reason) <= 40),
  served        boolean,
  from_place    text check (char_length(from_place) <= 80),
  to_place      text check (char_length(to_place) <= 80),
  from_lat      numeric(4, 1),
  from_lng      numeric(4, 1),
  to_lat        numeric(4, 1),
  to_lng        numeric(4, 1),
  truck         text check (char_length(truck) <= 40),
  distance_km   integer check (distance_km >= 0),
  fare_min      integer,
  fare_max      integer,
  utm_source    text check (char_length(utm_source) <= 100),
  utm_medium    text check (char_length(utm_medium) <= 100),
  utm_campaign  text check (char_length(utm_campaign) <= 100),
  page          text check (char_length(page) <= 200)
);
create index estimate_log_created_idx on public.estimate_log (created_at desc);
alter table public.estimate_log enable row level security;
comment on table public.estimate_log is
  'Anonymous estimate funnel + unserved demand (city-level). Kept 400 days.';

create or replace function public.site_record_estimate(p_secret text, p_row jsonb)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare r public.estimate_log;
begin
  perform private.require_site_secret(p_secret);
  r := jsonb_populate_record(null::public.estimate_log, p_row);
  insert into public.estimate_log (
    outcome, reason, served, from_place, to_place, from_lat, from_lng, to_lat, to_lng,
    truck, distance_km, fare_min, fare_max, utm_source, utm_medium, utm_campaign, page
  ) values (
    r.outcome, r.reason, r.served, r.from_place, r.to_place,
    round(r.from_lat, 1), round(r.from_lng, 1), round(r.to_lat, 1), round(r.to_lng, 1),
    r.truck, r.distance_km, r.fare_min, r.fare_max, r.utm_source, r.utm_medium, r.utm_campaign,
    r.page
  );
end;
$$;

-- Aggregates for the weekly client email. Counts only — no lead contact data.
create or replace function public.site_weekly_summary(
  p_secret text, p_from timestamptz, p_to timestamptz
)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare result jsonb;
begin
  perform private.require_site_secret(p_secret);
  with
    est as (
      select * from public.estimate_log where created_at >= p_from and created_at < p_to
    ),
    lds as (
      select * from public.leads
      where created_at >= p_from and created_at < p_to and not is_test
    )
  select jsonb_build_object(
    'from', p_from,
    'to', p_to,
    'estimates_shown', (select count(*) from est where outcome = 'shown'),
    'estimates_failed', (select count(*) from est where outcome = 'failed'),
    'estimates_unserved', (select count(*) from est where outcome = 'shown' and served = false),
    'leads_total', (select count(*) from lds),
    'leads_by_type', coalesce((
      select jsonb_object_agg(type, n) from (select type, count(*) n from lds group by type) t
    ), '{}'::jsonb),
    'quote_leads', (select count(*) from lds where type = 'quote'),
    'top_lanes', coalesce((
      select jsonb_agg(x) from (
        select from_place, to_place, count(*) as estimates
        from est where outcome = 'shown' and from_place is not null
        group by from_place, to_place order by count(*) desc limit 10
      ) x
    ), '[]'::jsonb),
    'unserved_lanes', coalesce((
      select jsonb_agg(x) from (
        select from_place, to_place, coalesce(reason, 'not_served') as reason, count(*) as requests
        from est
        where (outcome = 'failed' or served = false) and from_place is not null
        group by from_place, to_place, coalesce(reason, 'not_served')
        order by count(*) desc limit 10
      ) x
    ), '[]'::jsonb),
    'top_sources', coalesce((
      select jsonb_agg(x) from (
        select coalesce(nullif(utm->>'utm_source', ''), case
                 when referrer is null or referrer = '' then '(direct)'
                 else split_part(split_part(referrer, '://', 2), '/', 1) end) as source,
               coalesce(nullif(utm->>'utm_medium', ''), '(none)') as medium,
               count(*) as leads
        from lds group by 1, 2 order by count(*) desc limit 10
      ) x
    ), '[]'::jsonb)
  ) into result;
  return result;
end;
$$;

revoke all on function public.site_record_estimate(text, jsonb) from public, authenticated;
revoke all on function public.site_weekly_summary(text, timestamptz, timestamptz) from public, authenticated;
grant execute on function public.site_record_estimate(text, jsonb) to anon, service_role;
grant execute on function public.site_weekly_summary(text, timestamptz, timestamptz) to anon, service_role;

-- Retention: estimate log kept 400 days (year-on-year comparisons).
create or replace function public.prune_marketing_caches()
returns void
language sql
security invoker
set search_path = ''
as $$
  delete from public.rate_limits where window_start < now() - interval '1 day';
  delete from public.distance_cache where fetched_at < now() - interval '30 days';
  delete from public.web_vitals where created_at < now() - interval '90 days';
  delete from public.estimate_log where created_at < now() - interval '400 days';
$$;
revoke all on function public.prune_marketing_caches() from public, anon, authenticated;
grant execute on function public.prune_marketing_caches() to service_role;

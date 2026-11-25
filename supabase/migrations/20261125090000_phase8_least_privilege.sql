-- Phase 8: least privilege for the marketing site.
--
-- The site now connects with the PUBLISHABLE (anon) key, not the secret key.
--   * anon may SELECT public content tables, filtered by RLS (active /
--     published / consented rows only) and limited to the columns the site shows.
--   * anon has no table privileges on leads, rate_limits, distance_cache or
--     web_vitals. The site writes them only through the site_* functions below,
--     which require the site secret (SUPABASE_SITE_SECRET, server-only). Its
--     SHA-256 hash lives in private.site_secret, a schema the API doesn't expose.
--   * The publishable key alone (it's public) can read content and nothing else.
--
-- Set or rotate the secret (SQL editor, as postgres):
--   select private.set_site_secret('<64 random hex chars>');

-- ---------------------------------------------------------------------------
-- 1. Remove Supabase's default grants; future tables start closed too.
-- ---------------------------------------------------------------------------
revoke all on all tables in schema public from anon, authenticated;
revoke all on all sequences in schema public from anon, authenticated;
revoke all on all functions in schema public from public, anon, authenticated;
alter default privileges for role postgres in schema public revoke all on tables from anon, authenticated;
alter default privileges for role postgres in schema public revoke all on sequences from anon, authenticated;
alter default privileges for role postgres in schema public revoke execute on functions from public, anon, authenticated;

-- service_role (admin tooling, migrations) keeps full access.
grant all on all tables in schema public to service_role;
grant execute on all functions in schema public to service_role;

-- ---------------------------------------------------------------------------
-- 2. Public content: SELECT on the columns the site renders, RLS-filtered.
-- ---------------------------------------------------------------------------
grant select on public.truck_types, public.rate_cards, public.service_areas, public.lanes,
  public.faqs, public.site_metrics to anon, authenticated;
-- Approval bookkeeping (approved_by) and internal notes stay private.
grant select (id, quote, name, role, company, photo_url, photo_alt, sort_order, published,
  consent_on_file, approved_at) on public.testimonials to anon, authenticated;
grant select (id, name, logo_url, sort_order, published, permission_on_file, approved_at)
  on public.client_logos to anon, authenticated;
grant select (key, value, is_sample, updated_at) on public.site_config to anon, authenticated;

create policy "public reads active truck types" on public.truck_types
  for select to anon, authenticated using (active);
create policy "public reads active rate cards" on public.rate_cards
  for select to anon, authenticated using (active);
create policy "public reads active service areas" on public.service_areas
  for select to anon, authenticated using (active);
create policy "public reads active lanes" on public.lanes
  for select to anon, authenticated using (active);
create policy "public reads published faqs" on public.faqs
  for select to anon, authenticated using (published);
create policy "public reads approved testimonials" on public.testimonials
  for select to anon, authenticated
  using (published and consent_on_file and approved_at is not null);
create policy "public reads approved client logos" on public.client_logos
  for select to anon, authenticated
  using (published and permission_on_file and approved_at is not null);
create policy "public reads site config" on public.site_config
  for select to anon, authenticated using (true);
create policy "public reads site metrics" on public.site_metrics
  for select to anon, authenticated using (true);

-- ---------------------------------------------------------------------------
-- 3. Web vitals (real-user monitoring). No PII: no IP, no user agent string.
-- ---------------------------------------------------------------------------
create table public.web_vitals (
  id          bigint generated always as identity primary key,
  created_at  timestamptz not null default now(),
  name        text not null check (name in ('LCP', 'INP', 'CLS', 'FCP', 'TTFB')),
  value       double precision not null check (value >= 0),
  rating      text not null check (rating in ('good', 'needs-improvement', 'poor')),
  path        text not null check (char_length(path) <= 200),
  device      text not null check (device in ('mobile', 'desktop')),
  connection  text check (char_length(connection) <= 20)
);
create index web_vitals_created_idx on public.web_vitals (created_at desc, name);
alter table public.web_vitals enable row level security;
comment on table public.web_vitals is 'Real-user Core Web Vitals. Anonymous; kept 90 days.';

-- ---------------------------------------------------------------------------
-- 4. The site secret.
-- ---------------------------------------------------------------------------
create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create table private.site_secret (
  id           boolean primary key default true check (id),
  secret_hash  bytea not null,
  rotated_at   timestamptz not null default now()
);

create or replace function private.set_site_secret(p_secret text)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if char_length(p_secret) < 32 then
    raise exception 'site secret must be at least 32 characters';
  end if;
  insert into private.site_secret (id, secret_hash, rotated_at)
  values (true, extensions.digest(p_secret, 'sha256'), now())
  on conflict (id) do update set secret_hash = excluded.secret_hash, rotated_at = now();
end;
$$;
revoke all on function private.set_site_secret(text) from public, anon, authenticated;

create or replace function private.require_site_secret(p_secret text)
returns void
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if p_secret is null or not exists (
    select 1 from private.site_secret
    where secret_hash = extensions.digest(p_secret, 'sha256')
  ) then
    raise exception 'forbidden' using errcode = '42501';
  end if;
end;
$$;
revoke all on function private.require_site_secret(text) from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- 5. site_* functions: the only write path from the site.
--    SECURITY DEFINER (owner postgres), fixed search_path, secret required.
-- ---------------------------------------------------------------------------

-- Inserts one lead from an allow-listed set of fields; status is always 'new'.
create or replace function public.site_submit_lead(p_secret text, p_lead jsonb)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_id uuid;
  r public.leads;
begin
  perform private.require_site_secret(p_secret);
  r := jsonb_populate_record(null::public.leads, p_lead);
  insert into public.leads (
    type, name, phone_e164, email, company, city, pickup, drop, truck_type_slug, pickup_date,
    weight_tonnes, material, distance_km, fare_min_paise, fare_max_paise, rate_card_version,
    served, details, utm, source_path, referrer, locale, consent_contact, consent_text_version,
    is_test
  ) values (
    r.type, r.name, r.phone_e164, r.email, r.company, r.city, r.pickup, r.drop,
    r.truck_type_slug, r.pickup_date, r.weight_tonnes, r.material, r.distance_km,
    r.fare_min_paise, r.fare_max_paise, r.rate_card_version, r.served,
    coalesce(r.details, '{}'::jsonb), coalesce(r.utm, '{}'::jsonb), r.source_path, r.referrer,
    coalesce(r.locale, 'en'), coalesce(r.consent_contact, true), r.consent_text_version,
    coalesce(r.is_test, false)
  )
  returning id into v_id;
  return v_id;
end;
$$;

-- Merges keys into a recent lead's details (async outcomes, e.g. WhatsApp ack).
create or replace function public.site_annotate_lead(p_secret text, p_id uuid, p_details jsonb)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform private.require_site_secret(p_secret);
  update public.leads
  set details = details || p_details
  where id = p_id and created_at > now() - interval '1 hour';
end;
$$;

create or replace function public.site_rate_limit_hit(
  p_secret text, p_key text, p_limit integer, p_window_seconds integer
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_window timestamptz;
  v_hits integer;
begin
  perform private.require_site_secret(p_secret);
  v_window := to_timestamp(floor(extract(epoch from now()) / p_window_seconds) * p_window_seconds);
  insert into public.rate_limits as r (key, window_start, hits)
  values (p_key, v_window, 1)
  on conflict (key, window_start) do update set hits = r.hits + 1
  returning r.hits into v_hits;
  return v_hits <= p_limit;
end;
$$;

create or replace function public.site_distance_get(
  p_secret text, p_origin text, p_destination text
)
returns table (distance_m integer, duration_s integer)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  perform private.require_site_secret(p_secret);
  return query
    select d.distance_m, d.duration_s from public.distance_cache d
    where d.origin_id = p_origin and d.destination_id = p_destination
      and d.fetched_at > now() - interval '30 days';
end;
$$;

create or replace function public.site_distance_put(
  p_secret text, p_origin text, p_destination text, p_distance_m integer, p_duration_s integer,
  p_provider text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform private.require_site_secret(p_secret);
  insert into public.distance_cache (origin_id, destination_id, distance_m, duration_s, provider, fetched_at)
  values (p_origin, p_destination, p_distance_m, p_duration_s, p_provider, now())
  on conflict (origin_id, destination_id) do update set
    distance_m = excluded.distance_m, duration_s = excluded.duration_s,
    provider = excluded.provider, fetched_at = now();
end;
$$;

create or replace function public.site_record_vitals(p_secret text, p_rows jsonb)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform private.require_site_secret(p_secret);
  if jsonb_array_length(p_rows) > 10 then
    raise exception 'too many rows';
  end if;
  insert into public.web_vitals (name, value, rating, path, device, connection)
  select x.name, x.value, x.rating, x.path, x.device, x.connection
  from jsonb_to_recordset(p_rows) as x(
    name text, value double precision, rating text, path text, device text, connection text
  );
end;
$$;

-- p75 per metric over the last N days (used by the daily web-vitals alert).
create or replace function public.site_vitals_p75(p_secret text, p_days integer default 7)
returns table (name text, device text, p75 double precision, samples bigint)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  perform private.require_site_secret(p_secret);
  return query
    select v.name, v.device,
      percentile_cont(0.75) within group (order by v.value) as p75,
      count(*) as samples
    from public.web_vitals v
    where v.created_at > now() - make_interval(days => p_days)
    group by v.name, v.device;
end;
$$;

do $$
declare f text;
begin
  foreach f in array array[
    'public.site_submit_lead(text, jsonb)',
    'public.site_annotate_lead(text, uuid, jsonb)',
    'public.site_rate_limit_hit(text, text, integer, integer)',
    'public.site_distance_get(text, text, text)',
    'public.site_distance_put(text, text, text, integer, integer, text)',
    'public.site_record_vitals(text, jsonb)',
    'public.site_vitals_p75(text, integer)'
  ] loop
    execute format('revoke all on function %s from public, authenticated', f);
    execute format('grant execute on function %s to anon, service_role', f);
  end loop;
end;
$$;

-- The old secret-key-only function is no longer used by the site.
revoke all on function public.rate_limit_hit(text, integer, integer) from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- 6. Retention. Caches and vitals are pruned nightly by pg_cron. Leads are
--    pruned by prune_leads() once the privacy policy sets a period (NFC-19).
-- ---------------------------------------------------------------------------
create or replace function public.prune_marketing_caches()
returns void
language sql
security invoker
set search_path = ''
as $$
  delete from public.rate_limits where window_start < now() - interval '1 day';
  delete from public.distance_cache where fetched_at < now() - interval '30 days';
  delete from public.web_vitals where created_at < now() - interval '90 days';
$$;

-- Deletes enquiries that never became bookings, older than p_months.
create or replace function public.prune_leads(p_months integer)
returns integer
language plpgsql
security invoker
set search_path = ''
as $$
declare v_count integer;
begin
  if p_months < 1 then raise exception 'p_months must be >= 1'; end if;
  delete from public.leads
  where status <> 'converted' and created_at < now() - make_interval(months => p_months);
  get diagnostics v_count = row_count;
  return v_count;
end;
$$;
revoke all on function public.prune_leads(integer) from public, anon, authenticated;
revoke all on function public.prune_marketing_caches() from public, anon, authenticated;
grant execute on function public.prune_leads(integer) to service_role;
grant execute on function public.prune_marketing_caches() to service_role;

create extension if not exists pg_cron;
select cron.schedule('prune-marketing-caches', '30 21 * * *', 'select public.prune_marketing_caches()');

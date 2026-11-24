-- TruckBuck marketing site: core tables.
--
-- Access model: RLS is ON for every table and there are NO policies for the
-- anon or authenticated roles. Only the site's server (service role / secret
-- key, never shipped to browsers) reads and writes. Leads therefore can only
-- arrive through the server action, which applies Turnstile + rate limiting.
--
-- `is_sample` rows are sample data for development and previews. The
-- site ignores them in production unless ALLOW_SAMPLE_DATA=true.

-- ---------------------------------------------------------------------------
-- Truck catalogue
-- ---------------------------------------------------------------------------
create table public.truck_types (
  slug            text primary key check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name            text not null,
  body_type       text not null check (body_type in ('mini', 'pickup', 'closed', 'container', 'open', 'trailer', 'reefer')),
  icon_key        text not null check (icon_key in ('mini', 'pickup', 'lcv', 'mcv', 'container', 'open', 'trailer', 'reefer')),
  length_ft       numeric(5, 1) not null check (length_ft > 0),
  payload_tonnes  numeric(5, 1) not null check (payload_tonnes > 0),
  good_for        text,
  sort_order      integer not null default 100,
  active          boolean not null default true,
  is_sample       boolean not null default false,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
comment on table public.truck_types is 'Truck classes offered on the site (NFC-1).';

-- ---------------------------------------------------------------------------
-- Rate cards: one active card per truck type. All money in integer paise.
-- ---------------------------------------------------------------------------
create table public.rate_cards (
  id                      uuid primary key default gen_random_uuid(),
  truck_type_slug         text not null references public.truck_types (slug) on update cascade,
  version                 text not null,
  base_fare_paise         integer not null check (base_fare_paise >= 0),
  min_km                  integer not null default 0 check (min_km >= 0),
  -- Progressive per-km slabs, ordered by up_to_km; the last slab has up_to_km = null.
  -- e.g. [{"up_to_km":100,"per_km_paise":6000},{"up_to_km":null,"per_km_paise":4500}]
  km_slabs                jsonb not null check (jsonb_typeof(km_slabs) = 'array' and jsonb_array_length(km_slabs) > 0),
  loading_hours           numeric(4, 1) not null default 0 check (loading_hours >= 0),
  avg_speed_kmph          numeric(5, 1) not null check (avg_speed_kmph > 0),
  night_surcharge_pct     numeric(5, 2) not null default 0 check (night_surcharge_pct >= 0),
  night_start_hour_ist    smallint not null default 22 check (night_start_hour_ist between 0 and 23),
  night_end_hour_ist      smallint not null default 6 check (night_end_hour_ist between 0 and 23),
  urgent_surcharge_pct    numeric(5, 2) not null default 0 check (urgent_surcharge_pct >= 0),
  urgent_within_hours     smallint not null default 0 check (urgent_within_hours >= 0),
  gst_pct                 numeric(5, 2) not null check (gst_pct >= 0),
  range_low_pct           numeric(5, 2) not null default 0 check (range_low_pct >= 0 and range_low_pct < 100),
  range_high_pct          numeric(5, 2) not null default 0 check (range_high_pct >= 0),
  round_to_paise          integer not null default 10000 check (round_to_paise > 0),
  includes                text[] not null default '{}',
  excludes                text[] not null default '{}',
  active                  boolean not null default true,
  is_sample               boolean not null default false,
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now()
);
create unique index rate_cards_one_active_per_truck
  on public.rate_cards (truck_type_slug, is_sample) where active;
comment on table public.rate_cards is 'Fare inputs for priceQuote() (NFC-2). Never exposed to browsers.';

-- ---------------------------------------------------------------------------
-- Coverage
-- ---------------------------------------------------------------------------
create table public.service_areas (
  slug        text primary key check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and slug !~ '-to-'),
  name        text not null,
  state       text not null,
  lat         double precision not null check (lat between 6 and 38),
  lng         double precision not null check (lng between 67 and 98),
  radius_km   integer not null default 50 check (radius_km > 0),
  active      boolean not null default true,
  is_sample   boolean not null default false,
  created_at  timestamptz not null default now()
);
comment on table public.service_areas is 'Cities served (NFC-3). A route is served when pickup and drop each fall within radius_km of an active area.';

create table public.lanes (
  from_slug   text not null references public.service_areas (slug) on update cascade,
  to_slug     text not null references public.service_areas (slug) on update cascade,
  active      boolean not null default true,
  is_sample   boolean not null default false,
  primary key (from_slug, to_slug),
  check (from_slug <> to_slug)
);
comment on table public.lanes is 'Corridors highlighted on the coverage map and used for /truck-booking/[from]-to-[to] pages.';

-- ---------------------------------------------------------------------------
-- Content
-- ---------------------------------------------------------------------------
create table public.faqs (
  id          uuid primary key default gen_random_uuid(),
  page        text not null default 'home',
  audience    text not null default 'shipper' check (audience in ('shipper', 'transporter', 'driver', 'all')),
  locale      text not null default 'en' check (locale in ('en', 'hi', 'ta')),
  question    text not null,
  answer      text not null,
  sort_order  integer not null default 100,
  published   boolean not null default false,
  created_at  timestamptz not null default now()
);
create index faqs_page_idx on public.faqs (page, locale, sort_order) where published;

create table public.testimonials (
  id               uuid primary key default gen_random_uuid(),
  quote            text not null,
  name             text not null,
  role             text,
  company          text,
  consent_on_file  boolean not null default false,
  published        boolean not null default false,
  sort_order       integer not null default 100,
  created_at       timestamptz not null default now(),
  check (not published or consent_on_file)
);
comment on table public.testimonials is 'Real quotes only. A row cannot be published without consent on file.';

create table public.client_logos (
  id                  uuid primary key default gen_random_uuid(),
  name                text not null,
  logo_url            text not null,
  permission_on_file  boolean not null default false,
  published           boolean not null default false,
  sort_order          integer not null default 100,
  check (not published or permission_on_file)
);

-- ---------------------------------------------------------------------------
-- Leads (insert-only from the site's server)
-- ---------------------------------------------------------------------------
create table public.leads (
  id                    uuid primary key default gen_random_uuid(),
  created_at            timestamptz not null default now(),
  type                  text not null check (type in ('quote', 'callback', 'business_enquiry', 'transporter_application', 'driver_waitlist', 'grievance', 'account_deletion')),
  name                  text not null check (char_length(name) between 1 and 120),
  phone_e164            text not null check (phone_e164 ~ '^\+91[6-9][0-9]{9}$'),
  email                 text,
  company               text,
  -- Quote context (null for other lead types).
  pickup                jsonb,
  drop                  jsonb,
  truck_type_slug       text,
  pickup_date           date,
  weight_tonnes         numeric(6, 2),
  material              text,
  distance_km           numeric(8, 1),
  fare_min_paise        integer,
  fare_max_paise        integer,
  rate_card_version     text,
  served                boolean,
  details               jsonb not null default '{}'::jsonb,
  -- Attribution.
  utm                   jsonb not null default '{}'::jsonb,
  source_path           text,
  referrer              text,
  locale                text not null default 'en',
  consent_contact       boolean not null default true,
  consent_text_version  text not null,
  is_test               boolean not null default false,
  status                text not null default 'new' check (status in ('new', 'contacted', 'converted', 'lost', 'spam'))
);
create index leads_created_idx on public.leads (created_at desc);
create index leads_phone_idx on public.leads (phone_e164);
comment on table public.leads is 'Marketing leads. Never readable by anon/authenticated roles.';

-- ---------------------------------------------------------------------------
-- Infrastructure: distance cache + rate limiting
-- ---------------------------------------------------------------------------
create table public.distance_cache (
  origin_id       text not null,
  destination_id  text not null,
  distance_m      integer not null check (distance_m >= 0),
  duration_s      integer not null check (duration_s >= 0),
  provider        text not null,
  fetched_at      timestamptz not null default now(),
  primary key (origin_id, destination_id)
);
comment on table public.distance_cache is 'Route distance lookups, kept at most 30 days (Google Maps Platform caching terms).';

create table public.rate_limits (
  key           text not null,
  window_start  timestamptz not null,
  hits          integer not null default 0,
  primary key (key, window_start)
);

-- Atomically counts a hit for `p_key` in the current fixed window and
-- returns true when the caller is still within `p_limit`.
create or replace function public.rate_limit_hit(p_key text, p_limit integer, p_window_seconds integer)
returns boolean
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_window timestamptz := to_timestamp(floor(extract(epoch from now()) / p_window_seconds) * p_window_seconds);
  v_hits integer;
begin
  insert into public.rate_limits as r (key, window_start, hits)
  values (p_key, v_window, 1)
  on conflict (key, window_start) do update set hits = r.hits + 1
  returning r.hits into v_hits;
  return v_hits <= p_limit;
end;
$$;

-- Housekeeping, callable from a scheduled job.
create or replace function public.prune_marketing_caches()
returns void
language sql
security invoker
set search_path = ''
as $$
  delete from public.rate_limits where window_start < now() - interval '1 day';
  delete from public.distance_cache where fetched_at < now() - interval '30 days';
$$;

-- ---------------------------------------------------------------------------
-- updated_at triggers
-- ---------------------------------------------------------------------------
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger truck_types_touch before update on public.truck_types
  for each row execute function public.touch_updated_at();
create trigger rate_cards_touch before update on public.rate_cards
  for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------------------
-- Lock everything down: RLS on, no anon/authenticated policies.
-- ---------------------------------------------------------------------------
alter table public.truck_types    enable row level security;
alter table public.rate_cards     enable row level security;
alter table public.service_areas  enable row level security;
alter table public.lanes          enable row level security;
alter table public.faqs           enable row level security;
alter table public.testimonials   enable row level security;
alter table public.client_logos   enable row level security;
alter table public.leads          enable row level security;
alter table public.distance_cache enable row level security;
alter table public.rate_limits    enable row level security;

revoke all on function public.rate_limit_hit(text, integer, integer) from public, anon, authenticated;
revoke all on function public.prune_marketing_caches() from public, anon, authenticated;
grant execute on function public.rate_limit_hit(text, integer, integer) to service_role;
grant execute on function public.prune_marketing_caches() to service_role;

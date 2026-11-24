-- Phase 7: real service areas + the facts programmatic SEO pages need.

-- ---------------------------------------------------------------------------
-- Cities the client confirmed TruckBuck serves today (2026-11-24):
-- Coimbatore, Tiruppur, Erode, Salem, Chennai, Madurai, Bengaluru, Kochi.
-- Coordinates are city centres. radius_km is still the sample value and
-- needs confirming with ops (NFC-3). Other cities stay sample (dev only).
-- ---------------------------------------------------------------------------
insert into public.service_areas (slug, name, state, lat, lng, radius_km, active, is_sample) values
  ('coimbatore', 'Coimbatore', 'Tamil Nadu', 11.0168, 76.9558, 40, true, false),
  ('tiruppur',   'Tiruppur',   'Tamil Nadu', 11.1085, 77.3411, 30, true, false),
  ('erode',      'Erode',      'Tamil Nadu', 11.3410, 77.7172, 30, true, false),
  ('salem',      'Salem',      'Tamil Nadu', 11.6643, 78.1460, 35, true, false),
  ('chennai',    'Chennai',    'Tamil Nadu', 13.0827, 80.2707, 60, true, false),
  ('madurai',    'Madurai',    'Tamil Nadu',  9.9252, 78.1198, 40, true, false),
  ('bengaluru',  'Bengaluru',  'Karnataka',  12.9716, 77.5946, 60, true, false),
  ('kochi',      'Kochi',      'Kerala',      9.9312, 76.2673, 40, true, false)
on conflict (slug) do update
  set name = excluded.name, state = excluded.state, lat = excluded.lat, lng = excluded.lng,
      active = true, is_sample = false;

-- ---------------------------------------------------------------------------
-- City facts for /truck-booking/[city]. Empty until supplied and reviewed
-- (NFC-15 for industries); a page shows a section only when it has data.
-- ---------------------------------------------------------------------------
alter table public.service_areas
  add column if not exists industries text[] not null default '{}',
  add column if not exists facts_source text,
  add column if not exists facts_reviewed boolean not null default false,
  add constraint service_area_reviewed_facts_have_source
    check (not facts_reviewed or facts_source is not null);

-- ---------------------------------------------------------------------------
-- Lane facts for /truck-booking/[from]-to-[to]. Highways, toll note and the
-- goods commonly moved are ops knowledge (NFC-3); nothing is filled in here.
-- ---------------------------------------------------------------------------
alter table public.lanes
  add column if not exists highways text[] not null default '{}',
  add column if not exists toll_note text,
  add column if not exists common_goods text[] not null default '{}',
  add column if not exists facts_source text,
  add column if not exists facts_reviewed boolean not null default false,
  add constraint lane_reviewed_facts_have_source
    check (not facts_reviewed or facts_source is not null);

comment on column public.lanes.common_goods is
  'Goods commonly moved on this lane, each "name:tonnes" (e.g. "Cotton yarn:9"), used for the best-truck suggestion.';

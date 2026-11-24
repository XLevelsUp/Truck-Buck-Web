-- Phase 4: audience pages, truck catalogue, pricing.

-- ---------------------------------------------------------------------------
-- Leads: the lead types named in the Phase 4 brief, plus a city column.
-- (business_enquiry / transporter_application are kept for compatibility.)
-- ---------------------------------------------------------------------------
alter table public.leads drop constraint leads_type_check;
alter table public.leads add constraint leads_type_check check (type in (
  'quote', 'callback', 'business', 'transporter', 'driver_waitlist',
  'business_enquiry', 'transporter_application', 'grievance', 'account_deletion'
));
alter table public.leads add column if not exists city text;

-- ---------------------------------------------------------------------------
-- Truck catalogue: what the detail pages and the "Which truck?" helper need.
-- ---------------------------------------------------------------------------
alter table public.truck_types
  add column if not exists class text not null default 'lcv'
    check (class in ('mini', 'pickup', 'lcv', 'mcv', 'hcv', 'container', 'trailer')),
  add column if not exists width_ft numeric(4, 1) check (width_ft > 0),
  add column if not exists height_ft numeric(4, 1) check (height_ft > 0),
  -- Standard 1200 × 1000 mm pallets, single stacked. Shown as "approx."
  add column if not exists pallets integer check (pallets >= 0),
  add column if not exists typical_loads text[] not null default '{}',
  -- Landscape photo or render, displayed at a fixed 4:3 ratio (no CLS).
  add column if not exists image_url text,
  add column if not exists image_alt text,
  add constraint truck_image_has_alt check (image_url is null or image_alt is not null);

comment on column public.truck_types.pallets is 'Approximate count of 1200×1000 mm pallets on the floor, single stacked.';

-- Sample dimensions so the helper and detail pages work in dev/preview.
-- Typical published figures for Indian bodies; confirm with ops (NFC-1).
update public.truck_types t set
  class = v.class, width_ft = v.w, height_ft = v.h, pallets = v.pallets, typical_loads = v.loads
from (values
  ('mini-truck',     'mini',      4.5, 4.0, 2,  array['Retail stock', 'Small cartons', 'Parcels']),
  ('pickup-8ft',     'pickup',    5.0, 4.5, 3,  array['Appliances', 'Small furniture', 'Hardware']),
  ('lcv-14ft',       'lcv',       6.0, 6.0, 6,  array['FMCG cartons', 'E-commerce parcels', 'Textiles']),
  ('lcv-17ft',       'lcv',       6.5, 6.5, 8,  array['Furniture', 'White goods', 'Packaged food']),
  ('mcv-20ft',       'mcv',       7.0, 7.0, 10, array['Pallets', 'Packaged goods', 'Auto parts']),
  ('container-32ft', 'container', 8.0, 8.0, 16, array['High-volume cartons', 'Electronics', 'Weather-sensitive goods']),
  ('open-body-22ft', 'hcv',       7.5, 3.5, 12, array['Steel', 'Building material', 'Machinery']),
  ('reefer-20ft',    'mcv',       7.0, 6.5, 10, array['Dairy', 'Frozen food', 'Pharmaceuticals'])
) as v(slug, class, w, h, pallets, loads)
where t.slug = v.slug and t.is_sample;

-- ---------------------------------------------------------------------------
-- Site config: non-secret values ops can change without a deploy
-- (transporter fee explainer, cancellation/waiting charges, payment terms).
-- ---------------------------------------------------------------------------
create table public.site_config (
  key         text primary key check (key ~ '^[a-z0-9_.]+$'),
  value       jsonb not null,
  is_sample   boolean not null default false,
  note        text,
  updated_at  timestamptz not null default now()
);
alter table public.site_config enable row level security;
comment on table public.site_config is 'Site-editable settings. Server-read only (RLS on, no policies).';

insert into public.site_config (key, value, is_sample, note) values
  ('transporter.fee',
   '{"model": "per_trip_percent", "percent": null, "minimum_paise": null, "payout_days": null}',
   true, 'TODO(NFC-11): real per-trip fee and payout timeline. Nulls render as TODO.'),
  ('shipper.charges',
   '{"waiting_free_hours": null, "waiting_per_hour_paise": null, "cancellation": null, "payment_terms": null}',
   true, 'TODO(NFC-2, NFC-11): waiting, cancellation and payment terms.');

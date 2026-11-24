-- Phase 6: trust, safety, company and support.

-- ---------------------------------------------------------------------------
-- Social proof: an explicit approval stamp on top of consent/permission.
-- A row renders only when published, consented AND approved by a named person.
-- ---------------------------------------------------------------------------
alter table public.testimonials
  add column if not exists photo_url text,
  add column if not exists photo_alt text,
  add column if not exists approved_by text,
  add column if not exists approved_at timestamptz,
  add constraint testimonial_photo_has_alt check (photo_url is null or photo_alt is not null),
  add constraint testimonial_published_is_approved
    check (not published or (approved_by is not null and approved_at is not null));

alter table public.client_logos
  add column if not exists approved_by text,
  add column if not exists approved_at timestamptz,
  add constraint client_logo_published_is_approved
    check (not published or (approved_by is not null and approved_at is not null));

-- ---------------------------------------------------------------------------
-- Counters (trips completed, transporters onboarded).
-- Written only by a server job that runs a real COUNT(*) against the booking
-- system; `source` records that query. The site shows a value only when it is
-- fresh and above the client's threshold (site_config 'metrics.thresholds',
-- null = never shown). No row = nothing shown.
-- ---------------------------------------------------------------------------
create table public.site_metrics (
  key          text primary key check (key in ('trips_completed', 'transporters_onboarded')),
  value        bigint not null check (value >= 0),
  source       text not null check (char_length(source) > 0),
  measured_at  timestamptz not null default now()
);
comment on table public.site_metrics is
  'Real counts from the booking system, written by a server job. Server-read only (RLS on, no policies).';
alter table public.site_metrics enable row level security;

insert into public.site_config (key, value, note)
values (
  'metrics.thresholds',
  '{"trips_completed": null, "transporters_onboarded": null, "max_age_days": 7}'::jsonb,
  'Minimum counts before a counter is shown (NFC-11: whether to publish numbers at all). null = hidden.'
)
on conflict (key) do nothing;

-- ---------------------------------------------------------------------------
-- Leads: contact form (topic in details: shipper / transporter / press / other).
-- ---------------------------------------------------------------------------
alter table public.leads drop constraint leads_type_check;
alter table public.leads add constraint leads_type_check check (type in (
  'quote', 'callback', 'business', 'transporter', 'driver_waitlist', 'contact',
  'business_enquiry', 'transporter_application', 'grievance', 'account_deletion'
));

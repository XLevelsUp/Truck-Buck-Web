-- SAMPLE data so the fare widget, truck carousel and coverage map work in
-- development and previews. Every row is is_sample = true, and the site
-- ignores sample rows in production (unless ALLOW_SAMPLE_DATA=true).
--
-- Truck sizes and city coordinates are typical public figures, but the
-- RATES ARE SAMPLES that nobody has approved (NFC-2). Replace them with real
-- rate cards (is_sample = false) from ops (NEEDS-FROM-CLIENT NFC-1, NFC-2,
-- NFC-3) before launch.

insert into public.truck_types (slug, name, body_type, icon_key, length_ft, payload_tonnes, good_for, sort_order, is_sample) values
  ('mini-truck',      'Mini truck',            'mini',      'mini',      7,    0.8, 'Small cartons, retail stock',                 10, true),
  ('pickup-8ft',      'Pickup 8 ft',           'pickup',    'pickup',    8,    1.5, 'Appliances, small furniture',                 20, true),
  ('lcv-14ft',        'LCV 14 ft',             'closed',    'lcv',       14,   4,   'FMCG cartons, e-commerce parcels',            30, true),
  ('lcv-17ft',        'LCV 17 ft',             'closed',    'lcv',       17,   5,   'Furniture, white goods',                      40, true),
  ('mcv-20ft',        'Truck 20 ft',           'closed',    'mcv',       20,   7,   'Pallets, packaged goods',                     50, true),
  ('container-32ft',  'Container 32 ft MXL',   'container', 'container', 32,   15,  'High-volume, weather-sensitive cargo',        60, true),
  ('open-body-22ft',  'Open body 22 ft',       'open',      'open',      22,   16,  'Steel, building material, machinery',         70, true),
  ('reefer-20ft',     'Refrigerated 20 ft',    'reefer',    'reefer',    20,   6,   'Dairy, frozen food, pharma',                  80, true);

insert into public.rate_cards (
  truck_type_slug, version, base_fare_paise, min_km, km_slabs, loading_hours, avg_speed_kmph,
  night_surcharge_pct, urgent_surcharge_pct, urgent_within_hours, gst_pct,
  range_low_pct, range_high_pct, round_to_paise, includes, excludes, is_sample
)
select slug, 'sample-2026-11', base, min_km, slabs::jsonb, 2, speed, 10, 15, 24, 12, 8, 12, 10000,
       array['Truck and driver', 'Fuel', 'Driver allowance'],
       array['Tolls (paid at actuals)', 'Loading and unloading labour', 'Waiting beyond 2 hours'],
       true
from (values
  ('mini-truck',     150000, 25, '[{"up_to_km":100,"per_km_paise":2200},{"up_to_km":null,"per_km_paise":1800}]', 40),
  ('pickup-8ft',     180000, 25, '[{"up_to_km":100,"per_km_paise":2600},{"up_to_km":null,"per_km_paise":2100}]', 40),
  ('lcv-14ft',       250000, 50, '[{"up_to_km":100,"per_km_paise":3800},{"up_to_km":500,"per_km_paise":3200},{"up_to_km":null,"per_km_paise":2800}]', 38),
  ('lcv-17ft',       300000, 50, '[{"up_to_km":100,"per_km_paise":4300},{"up_to_km":500,"per_km_paise":3600},{"up_to_km":null,"per_km_paise":3200}]', 38),
  ('mcv-20ft',       350000, 50, '[{"up_to_km":100,"per_km_paise":5000},{"up_to_km":500,"per_km_paise":4200},{"up_to_km":null,"per_km_paise":3700}]', 36),
  ('container-32ft', 600000, 100, '[{"up_to_km":100,"per_km_paise":7500},{"up_to_km":500,"per_km_paise":6200},{"up_to_km":null,"per_km_paise":5500}]', 34),
  ('open-body-22ft', 500000, 100, '[{"up_to_km":100,"per_km_paise":6800},{"up_to_km":500,"per_km_paise":5600},{"up_to_km":null,"per_km_paise":5000}]', 34),
  ('reefer-20ft',    550000, 50, '[{"up_to_km":100,"per_km_paise":7000},{"up_to_km":500,"per_km_paise":6000},{"up_to_km":null,"per_km_paise":5400}]', 36)
) as t(slug, base, min_km, slabs, speed);

insert into public.service_areas (slug, name, state, lat, lng, radius_km, is_sample) values
  ('chennai',    'Chennai',    'Tamil Nadu',     13.0827, 80.2707, 60, true),
  ('bengaluru',  'Bengaluru',  'Karnataka',      12.9716, 77.5946, 60, true),
  ('coimbatore', 'Coimbatore', 'Tamil Nadu',     11.0168, 76.9558, 40, true),
  ('madurai',    'Madurai',    'Tamil Nadu',      9.9252, 78.1198, 40, true),
  ('hyderabad',  'Hyderabad',  'Telangana',      17.3850, 78.4867, 60, true),
  ('kochi',      'Kochi',      'Kerala',          9.9312, 76.2673, 40, true),
  ('vijayawada', 'Vijayawada', 'Andhra Pradesh', 16.5062, 80.6480, 40, true),
  ('pune',       'Pune',       'Maharashtra',    18.5204, 73.8567, 50, true),
  ('mumbai',     'Mumbai',     'Maharashtra',    19.0760, 72.8777, 60, true);

insert into public.lanes (from_slug, to_slug, is_sample) values
  ('chennai', 'bengaluru', true),
  ('chennai', 'coimbatore', true),
  ('chennai', 'hyderabad', true),
  ('chennai', 'madurai', true),
  ('bengaluru', 'hyderabad', true),
  ('bengaluru', 'kochi', true),
  ('coimbatore', 'kochi', true),
  ('hyderabad', 'vijayawada', true),
  ('bengaluru', 'pune', true),
  ('pune', 'mumbai', true);

-- Home-page FAQs. Draft copy limited to facts in docs/blueprint.md; review
-- before launch. Answers avoid timelines and terms ops haven't confirmed.
insert into public.faqs (page, audience, question, answer, sort_order, published) values
  ('home', 'shipper', 'What is a full truck load (FTL)?',
   'You book the whole truck for your goods. Nobody else''s load shares it, so it goes straight from pickup to drop.', 10, true),
  ('home', 'shipper', 'Do I need to sign up to see a price?',
   'No. Enter pickup, drop and truck type to see a fare range. Leave your number only if you want us to call you.', 20, true),
  ('home', 'shipper', 'How is the fare calculated?',
   'From the road distance, the truck type and the pickup time. Night and same-day pickups can cost more. The estimate lists what is included and what is not.', 30, true),
  ('home', 'shipper', 'Why do I see a range, not one price?',
   'The final fare depends on details we confirm with you, such as exact addresses and loading time. You agree the final fare before anything is booked.', 40, true),
  ('home', 'shipper', 'Who carries my goods?',
   'A transporter from TruckBuck''s closed network. Every transporter is checked before they can accept a load. It is not an open load board.', 50, true),
  ('home', 'shipper', 'What happens after I ask for a callback?',
   'Our team calls the number you gave, confirms the details and the fare, and assigns a vetted transporter.', 60, true),
  ('home', 'shipper', 'Can I continue on WhatsApp instead?',
   'Yes. After you see your fare, tap Continue on WhatsApp. The message already includes your route, truck and estimate.', 70, true),
  ('home', 'shipper', 'Which cities do you serve?',
   'See the coverage map on this page. If your route is not listed, leave your number and we will call you if we can help.', 80, true);

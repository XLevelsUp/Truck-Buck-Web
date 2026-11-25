# Analytics, CRO and lead handling (Phase 9)

How the marketing site measures the funnel, runs A/B tests and gets every lead to the team within a minute. The client chose **Google Tag Manager + GA4, with consent**.

## 1. Privacy rules (non-negotiable)

- **Consent first.** GTM (and everything inside it: GA4, Clarity, any ads tag) loads only after the visitor taps **Accept analytics** on the banner. "No thanks" is as prominent as "Accept", and the choice can be changed any time with **Cookie settings** in the footer. The choice is kept in the `tb_consent` cookie for 180 days.
- **No personal data to analytics.** The taxonomy has no name, phone, email or address fields. `src/lib/analytics.ts` strips any parameter that isn't allow-listed for its event, and drops any string that looks like a phone number or email. Place names never go to GA4. Fares, distance and truck type do.
- **Server conversions respect consent too.** They're sent only when `tb_consent=granted`.
- **Session replay masks everything typed.** Every form has `data-clarity-mask="true"`, and Clarity must be set to **Strict** masking (section 5).
- **First-party logs are anonymous.** The estimate log (§6) stores city-level places only, with no cookies, IPs or ids.

## 2. Event taxonomy

Events go to `window.dataLayer` as `{ event: <name>, ...params }`, after consent.

| Event                                       | When                             | Parameters                                                                                                            |
| ------------------------------------------- | -------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| `page_view`                                 | Every page and client navigation | `page_path`, `page_title`, `language`                                                                                 |
| `estimate_started`                          | First focus in the fare widget   | `page`                                                                                                                |
| `estimate_address_entered`                  | Pickup or drop chosen            | `field` (`pickup`/`drop`), `method` (`search`/`link`)                                                                 |
| `estimate_truck_selected`                   | Truck chip chosen                | `truck`                                                                                                               |
| `estimate_shown`                            | A fare (or distance) is shown    | `distance_km`, `truck`, `fare_min`, `fare_max` (₹, null if not served), `served`                                      |
| `estimate_failed`                           | The estimate request failed      | `reason` (`no_route`, `place_not_found`, `past_date`, `unavailable`, `rate_limited`, `bot_check`, `network`), `truck` |
| `callback_submitted`                        | Callback form sent after a fare  | `truck`, `served`                                                                                                     |
| `whatsapp_clicked`                          | Any WhatsApp link                | `page`, `placement` (`header`, `footer`, `bottom_bar`, `content`, `estimate_primary`, `exit_prompt`)                  |
| `call_clicked`                              | Any `tel:` link                  | `page`, `placement`                                                                                                   |
| `business_enquiry_submitted`                | `/shippers` business form sent   | —                                                                                                                     |
| `transporter_step_completed`                | Application step 1 or 2 done     | `step`                                                                                                                |
| `transporter_submitted`                     | Application sent                 | `fleet_size`                                                                                                          |
| `driver_waitlist_submitted`                 | Driver rewards waitlist joined   | —                                                                                                                     |
| `app_badge_clicked`                         | Google Play badge                | `page`, `store`                                                                                                       |
| `language_switched`                         | Language switcher used           | `from`, `to` (e.g. `en-IN` → `ta-IN`)                                                                                 |
| `experiment_viewed`                         | A/B page view                    | `experiment`, `variant`                                                                                               |
| `exit_prompt_shown` / `exit_prompt_clicked` | Desktop exit prompt              | `page`                                                                                                                |

Clicks on WhatsApp, call, app-badge and language links are captured by one delegated listener (`src/components/analytics.tsx`). A new link of those kinds is tracked automatically.

### Server-side conversions (ad-blocker proof)

When a lead is saved, the server sends the conversion through the **GA4 Measurement Protocol** (`src/server/ga4.ts`):

| Lead form               | Server event                 |
| ----------------------- | ---------------------------- |
| Quote callback          | `callback_submitted`         |
| Business account        | `business_enquiry_submitted` |
| Transporter application | `transporter_submitted`      |
| Driver waitlist         | `driver_waitlist_submitted`  |
| Contact form            | `contact_submitted`          |

Each one carries `lead_type`, `truck`, `served`, `campaign_source`/`campaign_medium`/`campaign_name`, `language` and `server_side: true`, and uses the visitor's analytics id (the `tb_cid` cookie). It's sent only with consent.

**To avoid counting twice**, in GA4 these conversions come only from the server. The GTM trigger in §4 excludes `*_submitted` events from the GA4 event tag. The browser copies stay in the dataLayer for ad-platform conversion tags.

Needed: `GA4_MEASUREMENT_ID` (G-…) and `GA4_API_SECRET`. To create the secret: GA4 → Admin → Data streams → web stream → Measurement Protocol API secrets → Create.

## 3. Attribution

Every lead gets the visitor's **first touch**: landing page, external referrer (origin and path only, no query) and UTMs (plus `gclid`). It's kept in `localStorage` (`tb_attribution`) for 90 days (`src/components/forms/attribution.ts`).

- A later visit with new UTMs replaces the UTMs (last campaign click wins); the landing page stays the first one.
- The data stays in the browser until the visitor submits a form, then lands in `leads.utm` as `landing_path`, `first_referrer` and `first_seen_at`. `leads.source_path` and `leads.referrer` record the page the form was sent from.
- It goes to the ops alert, the Sheet and the weekly summary's "top sources". It is never sent to analytics; GA4 has its own session attribution.

## 4. GTM container setup (GTM-5TQTVZXH)

The site loads the container itself after consent. **Don't paste the GTM snippet into the site.** It also sets Consent Mode v2 defaults: `analytics_storage` granted, all `ad_*` denied.

In tagmanager.google.com:

1. **Variables:**
   - Data Layer Variables named `tb_cid`, `page_path`, `page_title`, `language`, `truck`, `distance_km`, `fare_min`, `fare_max`, `served`, `reason`, `field`, `method`, `page`, `placement`, `step`, `fleet_size`, `store`, `from`, `to`, `experiment` and `variant`.
   - A Constant `GA4 Measurement ID` = G-….
2. **Google tag** (GA4 configuration):
   - Tag ID: `{{GA4 Measurement ID}}`.
   - Configuration parameters: `client_id` = `{{tb_cid}}` (so browser and server events join up) and `send_page_view` = `false` (the site sends `page_view` itself).
   - Trigger: **Initialization – All Pages**.
3. **GA4 event tag:**
   - Event name `{{Event}}`.
   - Event parameters: the DLVs above, each under the same name.
   - Trigger: Custom Event, regex `^(page_view|estimate_.*|whatsapp_clicked|call_clicked|transporter_step_completed|app_badge_clicked|language_switched|experiment_viewed|exit_prompt_.*)$`. Conversions are excluded, because the server sends them.
4. **Microsoft Clarity (session replay):**
   - Custom HTML tag with Clarity's snippet for your project.
   - Trigger: **Page View**, limited to Page Path matches regex `^/$|^/(shippers|transporters|drivers|contact|grievance)$|^/trucks/|^/truck-booking/`. That's the home page and the pages with forms.
   - In Clarity → Settings → Masking, choose **Strict**.
5. Publish, then check with **Preview** (Tag Assistant). The site's CSP already allows `googletagmanager.com`, `*.google-analytics.com` and `*.clarity.ms`.

### In GA4

- **Custom dimensions** (event scope): `truck`, `served`, `reason`, `placement`, `experiment`, `variant`, `step`, `language`, `lead_type`. Custom metrics: `distance_km`, `fare_min`, `fare_max`.
- **Key events:** `callback_submitted`, `business_enquiry_submitted`, `transporter_submitted`, `driver_waitlist_submitted`, `contact_submitted`, `whatsapp_clicked`.
- **Funnel explorations:**
  - **Estimate → lead:** `estimate_started` → `estimate_address_entered` → `estimate_truck_selected` → `estimate_shown` → (`callback_submitted` OR `whatsapp_clicked`). Add a breakdown by **Session source / medium** for UTM attribution, and by `variant` for A/B tests.
  - **Transporter application:** `page_view` (page_path = /transporters) → `transporter_step_completed` (step 1) → `transporter_submitted`.

## 5. A/B tests

These are defined in `src/lib/ab.ts`. They're switched on with `NEXT_PUBLIC_EXPERIMENTS` (comma-separated), for example `hero,cta,widget_order,primary_action`. Unset means everyone sees the control.

| Key              | Variants                               | Where                                                                            |
| ---------------- | -------------------------------------- | -------------------------------------------------------------------------------- |
| `hero`           | `a` (control), `b`, `c`                | Headline, sub and CTA on `/`, `/shippers`, `/transporters`                       |
| `cta`            | `get_price` (control), `book_truck`    | The fare widget button on `/`                                                    |
| `widget_order`   | `route_first` (control), `truck_first` | Truck type before the route fields on `/` (DOM order, so keyboard order follows) |
| `primary_action` | `callback` (control), `whatsapp`       | After the fare on `/`: WhatsApp button first, callback form second               |

**How it works:**

- `src/proxy.ts` gives each human visitor a 90-day `tb_exp` cookie and rewrites the page to a prerendered variant, `/x/<page>/<code>`. The address bar is unchanged and the canonical stays the real URL.
- There's no flicker, and pages stay static.
- Crawlers, link previews and test browsers always get the control.
- The page sends `experiment_viewed` after consent.
- **QA:** add `?exp=hero:b,cta:book_truck` to any of the three URLs to force variants for the rest of the browser session (`tb_exp_qa` session cookie). This works even while the experiment is switched off.
- **Switching an experiment off** sends everyone back to its control, whatever their cookie says.
- **Reading results:** in the GA4 funnel exploration, break down by `variant` and filter by `experiment`. Let each test run until every variant has enough key events. A rule of thumb is at least two weeks and about 100 conversions per variant, before acting on a difference.

## 6. Lead handling

Every form saves the lead through `site_submit_lead` (Supabase `leads`). The visitor gets their reference immediately. Then, after the response, `src/server/notify.ts` runs all of these at once:

| Channel           | What                                                                                                                             | Configure                                                                                           |
| ----------------- | -------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| Ops WhatsApp      | Template message to each ops number: type, reference, name, phone and a one-line summary (route, truck, fare, served)            | `WHATSAPP_CLOUD_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID`, `WHATSAPP_OPS_TEMPLATE`, `WHATSAPP_OPS_NUMBERS` |
| Ops email         | Resend email with the same details, plus call and WhatsApp links                                                                 | `RESEND_API_KEY`, `EMAIL_FROM`, `OPS_EMAILS`                                                        |
| Google Sheet      | One row with Status (dropdown) / Owner / Notes columns                                                                           | `SHEET_WEBHOOK_URL`, `SHEET_WEBHOOK_SECRET`; script in `docs/integrations/lead-sheet.gs`            |
| Customer WhatsApp | Acknowledgement with reference and callback time (quote, business, contact). Transporters get the existing application template. | `WHATSAPP_ACK_TEMPLATE` (transporters: `WHATSAPP_TRANSPORTER_TEMPLATE`)                             |
| GA4               | Server-side conversion (§2)                                                                                                      | `GA4_MEASUREMENT_ID`, `GA4_API_SECRET`                                                              |

**Failures:** each channel has its own timeout, and one failing never blocks the others. The outcome of each channel and the total time are written to the lead's `details.notify` / `details.notify_ms`. A channel that isn't configured is "skipped" and logged.

### WhatsApp templates to submit to Meta (WhatsApp Manager → Message templates)

Business-initiated messages must use approved templates. Submit these (category **Utility**) in English, Hindi and Tamil:

- **`lead_ops_alert`** (ops number only, English):
  > New {{1}} lead {{2}}: {{3}}, {{4}}. {{5}}
- **`lead_ack`** (customer):
  > Thanks for contacting TruckBuck. Your reference is {{1}}. We'll call you within {{2}} minutes. Reply here if you'd rather chat on WhatsApp.
- **`transporter_application_received`** (exists since Phase 4).

Then set `WHATSAPP_OPS_TEMPLATE=lead_ops_alert` and `WHATSAPP_ACK_TEMPLATE=lead_ack`. The forms' consent line already tells people we'll call or message them on WhatsApp (consent version `…-v2`).

### Unserved demand

Every estimate shown or failed is logged anonymously in `estimate_log` through `/api/events`. The log holds:

- the outcome and reason;
- `served`;
- the from/to places, cut to "City, State";
- coordinates rounded to about 10 km;
- truck, distance and fare;
- UTM source, medium and campaign;
- the page.

It feeds the weekly summary's top lanes and unserved demand. It's kept 400 days.

### Weekly summary

Vercel Cron calls `/api/cron/weekly-summary` every **Monday 09:00 IST** (`vercel.json`), authenticated with `CRON_SECRET`. The email goes to `SUMMARY_EMAILS` and covers the previous 7 days:

- estimates (shown, unserved, failed);
- leads by type;
- estimate → callback conversion;
- top lanes and top sources;
- unserved demand.

The database function returns aggregates only.

## 7. Acceptance checks

- **Lead reaches ops in under 60 s:** in Production, with all channels configured, submit a test callback (name "TEST"), then check:
  1. ops WhatsApp;
  2. the ops inbox;
  3. a new Sheet row.

  Each should arrive within seconds. The lead's `details.notify_ms` records the server-side time. Mark the row Status = Spam afterwards.

- **Funnel with UTM attribution:**
  1. Open `/?utm_source=test&utm_medium=qa&utm_campaign=phase9`, accept analytics and get a fare.
  2. Submit a callback.
  3. In GA4 DebugView you'll see the funnel events and the server `callback_submitted` with `campaign_source=test`. The Sheet row shows source `test` / `qa`.
- **No PII:** `e2e/phase9.spec.ts` captures every dataLayer entry through a full estimate and callback, and fails on any name, phone, address or place label.

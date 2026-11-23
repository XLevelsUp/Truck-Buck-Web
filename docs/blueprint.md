# TruckBuck marketing site — blueprint

Status: **Phase 1 deliverable** · Owner: marketing site (`apps/marketing`) · Last updated: 2026-11-23

This is the single source every later phase builds from. It covers the public marketing site
for truckbuck.in only. Booking, login/OTP, accounts, dashboards, tracking, payments and admin
are **out of scope**; where the site would lead into them it uses a lead form, WhatsApp
click-to-chat or the Play Store link instead, and keeps CTAs and data shapes ready for the
future web app.

Conventions used below:

- **`[NFC-n]`** = a fact we need from the client, listed in the [NEEDS-FROM-CLIENT](#11-needs-from-client-checklist) checklist. Until it arrives, the UI shows a clearly marked TODO (in dev) or hides the section (in production). We never fill a gap with an invented number, name, logo or quote.
- **`[DECISION-n]`** = a product decision with a recommended default, listed in [§10](#10-open-decisions). Later phases use the default unless told otherwise.
- Copy shown here is draft copy. It goes into `src/content/en.ts` under the key shown, never into markup.

---

## 1. Positioning

### 1.1 The one idea

> **Book a full truck the way you book a cab: route, truck type, fare up front, done.
> Only vetted transporters can take the load.**

Three proof points carry every page, in this order:

1. **Fare up front** — the shipper sees the price before confirming. No calling five brokers, no haggling.
2. **Closed, vetted network** — transporters are checked before they can accept a load. It is not an open load board where anyone bids.
3. **Driver-first** — the driver app is built for low-end Android, weak signal and few taps, with WhatsApp updates. Happier drivers mean trips that actually complete.

### 1.2 Value proposition per audience

| Audience                                        | One-line value prop (draft)                                                                                    | Content key               |
| ----------------------------------------------- | -------------------------------------------------------------------------------------------------------------- | ------------------------- |
| **Shipper** (manufacturer, distributor, trader) | See your full-truck fare before you book, and get a vetted transporter, without calling around or haggling.    | `positioning.shipper`     |
| **Transporter** (1–10 trucks)                   | Get loads from real shippers at a known fare, in a closed network, without bidding against an open market.     | `positioning.transporter` |
| **Driver**                                      | Every trip in one simple app that works on any Android phone, even on a weak signal, with updates on WhatsApp. | `positioning.driver`      |

Claims we **may not** make until the client confirms them: payment timelines to transporters
(`get paid in N days`), load volume (`steady work`), number of transporters/trucks/cities, on-time
percentages, insurance cover, savings vs brokers. Each is `[NFC-11]`. The current home page
copy says "settle payments" and "get paid on time"; Phase 4 removes these until confirmed.

### 1.3 Headline options (home hero)

All three keep the cab analogy. "Cab" is everyday Indian English and translates directly (Hindi
"कैब/टैक्सी", Tamil "கேப்/டாக்ஸி"), so the line survives localisation.

| #   | Headline                                                               | Sub-headline                                                                             | Use when                                                                |
| --- | ---------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| A   | **Book a truck like you book a cab.**                                  | Enter your route, pick a truck, see the fare. A vetted transporter takes it from there.  | Default. Plainest statement of the promise.                             |
| B   | **Full truck. Fare up front. Booked like a cab.**                      | No broker calls, no haggling — only vetted transporters can accept your load.            | If we want the fare to lead (pricing-sensitive traffic, ads).           |
| C   | **Book a truck like you book a cab — from transporters we've vetted.** | Tell us the route and truck. We show the fare first, then a checked transporter accepts. | If trust is the bigger objection than price (B2B, first-time shippers). |

Recommendation: ship **A**, A/B test **B** once traffic allows (Phase 10).

### 1.4 Competitive framing (internal — not site copy)

> Based on each company's public positioning as we understand it. Re-check every row against
> their live sites before Phase 2 copy is finalised. This table is for our own messaging
> decisions; the site never names or compares competitors.

| Company       | What they lead with                                                                                    | Model                                                                         | Where we differ                                                                                                      |
| ------------- | ------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| **BlackBuck** | Scale for truckers and fleet owners: load board plus fleet services (FASTag, fuel, GPS, finance).      | Open marketplace + fleet-operator tools. Primary customer is the truck owner. | We lead with the **shipper's** experience (fare up front) and a **closed** network, not breadth of trucker services. |
| **Vahak**     | "Find loads and trucks" — a large, open network where shippers and transporters connect and negotiate. | Open load board / bidding, verification badges.                               | **No bidding.** The fare is shown first and a vetted transporter accepts.                                            |
| **FR8**       | On-demand intercity truck booking for businesses.                                                      | Aggregator / booking platform.                                                | Closest overlap. We differentiate on the **closed vetted network** and **driver-first** experience.                  |
| **Porter**    | Instant, app-based booking with an upfront fare — mostly intra-city mini-trucks and two-wheelers.      | Consumer-grade on-demand logistics.                                           | We borrow Porter's simplicity ("like a cab") but for **full-truck-load, intercity** freight.                         |
| **TruckBuck** | **Book a truck like a cab: fare up front, only vetted transporters, driver-first.**                    | Closed network of vetted transporters.                                        | —                                                                                                                    |

---

## 2. Conversion goals

Ranked. Each goal has one owning page, one primary CTA, and one analytics event. Event names are
the contract for Phase 9 analytics.

| Rank | Goal                                           | Primary page(s)                                                                 | Primary CTA (key)                                | Fallback CTA                          | Conversion event                                                    |
| ---- | ---------------------------------------------- | ------------------------------------------------------------------------------- | ------------------------------------------------ | ------------------------------------- | ------------------------------------------------------------------- |
| a    | Shipper gets a fare estimate                   | `/` (hero widget), `/pricing`, `/truck-booking/[slug]`                          | **Get price** (`cta.getPrice`)                   | —                                     | `fare_estimate_shown`                                               |
| b    | Shipper requests callback / starts WhatsApp    | Estimate result panel (any page with the widget), `/contact`, sticky bottom bar | **Request a callback** (`cta.requestCallback`)   | **Chat on WhatsApp** (`cta.whatsapp`) | `lead_submitted{type:callback}`, `whatsapp_click{context}`          |
| c    | Business enquiry (recurring / contract volume) | `/shippers`                                                                     | **Talk to our team** (`cta.businessEnquiry`)     | WhatsApp                              | `lead_submitted{type:business_enquiry}`                             |
| d    | Transporter applies                            | `/transporters`                                                                 | **Apply to join** (`cta.transporterApply`)       | WhatsApp                              | `lead_submitted{type:transporter_application}`                      |
| e    | Driver installs app                            | `/drivers`                                                                      | **Get the app on Google Play** (`cta.playStore`) | Join rewards waitlist                 | `play_store_click{context}`, `lead_submitted{type:driver_waitlist}` |

Rules that follow from the ranking:

- Every shipper-facing page puts **Get price** above the fold on mobile (360 × 640).
- The estimate is **not gated** behind a phone number (`[DECISION-1]`). Seeing a price is goal (a); asking for a phone first trades goal (a) for goal (b). The callback ask comes _after_ the fare, with the fare as the reason to leave a number.
- WhatsApp is always the fallback, never the first ask on a form page — the form captures structured data; WhatsApp captures people who won't fill one.
- Transporter and driver pages never show **Get price** as their primary CTA.

---

## 3. Sitemap

### 3.1 Routes

Rendering: **S** = fully static, **ISR** = static with revalidation from Supabase data (default
`revalidate = 3600`, plus on-demand revalidation when the data changes).

| Route                   | Job                                                                  | Audience             | Primary CTA                                    | Render | Owner phase |
| ----------------------- | -------------------------------------------------------------------- | -------------------- | ---------------------------------------------- | ------ | ----------- |
| `/`                     | Prove the promise and give a fare in under 30 s.                     | Shipper              | Get price (inline widget)                      | ISR    | **4**       |
| `/shippers`             | Win businesses with repeat volume.                                   | Shipper              | Talk to our team (enquiry form)                | S      | **5**       |
| `/transporters`         | Recruit fleet owners into the network.                               | Transporter          | Apply to join (form)                           | S      | **5**       |
| `/drivers`              | Get drivers to install the app; collect rewards interest.            | Driver               | Get the app on Google Play                     | S      | **5**       |
| `/trucks`               | Help shippers pick the right truck.                                  | Shipper              | Get price (truck pre-selected)                 | ISR    | **6**       |
| `/trucks/[slug]`        | One truck type: dimensions, capacity, use cases.                     | Shipper              | Get price for this truck                       | ISR    | **6**       |
| `/pricing`              | Explain how fares are built; full estimator.                         | Shipper              | Get price                                      | ISR    | **4**       |
| `/how-it-works`         | Show the six steps from route to proof of delivery.                  | Shipper (+ others)   | Get price                                      | S      | **6**       |
| `/safety`               | Earn trust: vetting, KYC, POD, data handling.                        | Shipper, transporter | Get price                                      | S      | **6**       |
| `/about`                | Who we are, why we exist.                                            | All                  | Get price                                      | S      | **6**       |
| `/contact`              | Every way to reach us + callback form.                               | All                  | Request a callback                             | S      | **3**       |
| `/help`                 | FAQ hub by audience.                                                 | All                  | Chat on WhatsApp                               | ISR    | **8**       |
| `/help/[slug]`          | One FAQ topic.                                                       | All                  | Chat on WhatsApp                               | ISR    | **8**       |
| `/truck-booking/[slug]` | Local SEO for a **city** or a **lane** (see §3.3).                   | Shipper              | Get price (pre-filled)                         | ISR    | **7**       |
| `/blog`, `/blog/[slug]` | Optional MDX content for SEO.                                        | Shipper              | Get price                                      | S      | **8**       |
| `/privacy`              | Privacy policy (also the Play Store privacy URL for the driver app). | All                  | Contact the grievance officer (→ `/grievance`) | S      | **9**       |
| `/terms`                | Terms of use.                                                        | All                  | Contact us (→ `/contact`)                      | S      | **9**       |
| `/grievance`            | Grievance officer details and complaint form.                        | All                  | Submit a grievance                             | S      | **9**       |
| `/account-deletion`     | Request to delete a driver-app / future account (`[DECISION-4]`).    | Driver               | Submit request                                 | S      | **9**       |

Existing today: `/`, `/privacy`, `/terms`, 404, `robots.txt`, `sitemap.xml`, OG image. Phases
replace their content; `src/lib/routes.ts` stays the single registry (a route missing there is
not in the nav or sitemap).

### 3.2 Reserved — do not build

| Route                    | Future owner | Until then                                                                                                                                                |
| ------------------------ | ------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/book`                  | Web app      | **307** redirect to `/#get-price` (temporary, so the path can be reclaimed). Query params are preserved so a future deep link still pre-fills the widget. |
| `/login`                 | Web app      | 404. Header "Login" link hidden behind `NEXT_PUBLIC_FEATURE_WEB_APP` (default `false`).                                                                   |
| `/account`, `/account/*` | Web app      | 404.                                                                                                                                                      |

These paths are listed in `routes.ts` as `reserved` (not in sitemap, `noindex`) so no marketing
page can claim them by accident.

### 3.3 Implementation note: `/truck-booking/*`

Next.js cannot have both `/truck-booking/[city]` and `/truck-booking/[from]-to-[to]` — they are
the same dynamic segment, and a segment can't be split into two params. So there is **one**
route, `/truck-booking/[slug]`:

- `chennai` → city page (looked up in `service_areas`)
- `chennai-to-bengaluru` → lane page (looked up in `lanes`; slug is `${from}-to-${to}`)
- anything else → 404. `generateStaticParams` comes from the tables, and `dynamicParams = false`, so we never render a page for a city or lane we don't serve.

City slugs must not contain `-to-` (checked by a DB constraint).

---

## 4. Navigation

### 4.1 Header

**Desktop (≥ 1024 px)**

```
[Logo]  Shippers  Transporters  Drivers  Trucks  Pricing  Help        [☎ phone]  [Get price]  (Login*)
```

- Six text links max. How it works, Safety, About live in the footer and inside pages.
- Phone number shown only when `[NFC-6]` exists; `tel:` link.
- **Get price** = primary button → `/#get-price` from any page, or scrolls to the widget if it is on the current page. Becomes `/book` when the web app ships (one constant, `ctaTargets.getPrice`).
- *Login is rendered only when `NEXT_PUBLIC_FEATURE_WEB_APP=true`.
- Current page marked with `aria-current="page"`.
- Header is static (not sticky) on desktop; content is short enough and sticky headers cost CLS budget.

**Mobile (< 1024 px)**

```
[Logo]                                   [Get price]  [☰]
```

- Header height fixed (56 px) to avoid CLS.
- ☰ opens a **drawer** (right side, full height):
  1. For businesses → Shippers, Trucks, Pricing, How it works
  2. Partners → Join as transporter, Driver app
  3. Company → Safety, About, Help, Contact
  4. Footer of drawer: WhatsApp button, phone, Play Store badge.
- Accessibility: button has `aria-expanded` / `aria-controls`; focus moves into the drawer, is trapped there, `Esc` and the close button close it, focus returns to ☰; body scroll locked; works without JS as a plain link to a `/#site-nav` anchor (progressive enhancement).
- Drawer is a client component; the header itself stays a server component.

### 4.2 Sticky mobile bottom bar (< 768 px)

```
[ Get price ]  [ WhatsApp ]
```

- Two equal buttons, 48 px tall, `padding-bottom: env(safe-area-inset-bottom)`. Body gets matching bottom padding from first paint so nothing jumps (CLS).
- **Per-audience variant** (`[DECISION-2]`, recommended): on `/transporters` the bar is `[Apply to join] [WhatsApp]`; on `/drivers` it is `[Get the app] [WhatsApp]`. A shipper CTA on a driver page wastes the most valuable pixel on the screen.
- Hidden while the fare widget is in the viewport (avoids two "Get price" buttons) and while a text input is focused (on-screen keyboard).
- WhatsApp opens `https://wa.me/<number>?text=<prefilled>`; the prefilled text depends on page context (e.g. on a lane page: "Hi, I need a truck from Chennai to Bengaluru"). Fires `whatsapp_click{context}`. Hidden entirely until `[NFC-7]` exists.
- Not shown on legal pages.

### 4.3 Footer (4 columns; stacks to accordion-free single column at 360 px)

| For businesses   | Partners            | Company        | Legal             |
| ---------------- | ------------------- | -------------- | ----------------- |
| Get a price      | Join as transporter | About          | Privacy policy    |
| Truck types      | Driver app          | How it works   | Terms of use      |
| Pricing          | Safety              | Help / FAQ     | Grievance officer |
| Business enquiry |                     | Contact        | Account deletion  |
|                  |                     | Blog (if live) |                   |

Below the columns:

- **Popular routes** row (Phase 7): links to the top city and lane pages — internal linking for SEO.
- Legal identity block: registered legal name, CIN, GSTIN, registered office address `[NFC-4]`; support phone `[NFC-6]`, support email `[NFC-6]`, WhatsApp `[NFC-7]`.
- Play Store badge (driver app), social links if they exist `[NFC-14]`.
- Language switcher slot (renders nothing until Tamil/Hindi exist).
- © year + legal name.

---

## 5. Data and integration contracts

These shapes exist so the future web app can plug in without changing the marketing site. Zod
schemas live in `packages/types` (shared), money in integer **paise**, phones in **E.164**, per
repo conventions.

### 5.1 Supabase tables (Phase 3)

| Table           | Written by                    | Read by                                     | Public access                                                       |
| --------------- | ----------------------------- | ------------------------------------------- | ------------------------------------------------------------------- |
| `leads`         | Server actions (service role) | Ops only (Supabase dashboard → later admin) | **None.** RLS on, no anon policies.                                 |
| `rate_cards`    | Ops                           | Server only (estimate)                      | None — rates are not exposed in bulk.                               |
| `truck_types`   | Ops                           | Build / ISR                                 | Read via server at build time                                       |
| `service_areas` | Ops                           | Build / ISR                                 | "                                                                   |
| `lanes`         | Ops                           | Build / ISR                                 | "                                                                   |
| `faqs`          | Ops                           | Build / ISR                                 | "                                                                   |
| `testimonials`  | Ops                           | Build / ISR                                 | " — only rows with `consent_on_file = true` and `published = true`. |

The site never reads Supabase from the browser. Server actions and build-time fetches use the
service key from server-only env (`src/env.server.ts`).

### 5.2 Lead

```ts
Lead = {
  id: uuid,
  type: "callback" | "business_enquiry" | "transporter_application" | "driver_waitlist"
      | "grievance" | "account_deletion",
  name: string,
  phone: E164,                 // +91XXXXXXXXXX
  email?: string,
  company?: string,
  city?: string,
  details: <typed per lead type, zod discriminated union>,
  estimateId?: uuid,           // links a callback to the fare the shipper saw
  source: { path, referrer?, utm_source?, utm_medium?, utm_campaign?, utm_content?, utm_term? },
  consent: { contact: true, marketing: boolean, textVersion: string },
  locale: "en" | "hi" | "ta",
  createdAt: timestamptz,
}
```

Spam defence: honeypot field + time-to-submit check + per-IP rate limit in the server action.
Add a CAPTCHA only if spam appears (it costs Lighthouse points and conversions).

### 5.3 Fare estimate

```ts
FareEstimateRequest = { from: PlaceRef, to: PlaceRef, truckTypeSlug: string, pickupDate?: ISODate }
PlaceRef = { placeId: string, label: string }

FareEstimate = {
  id: uuid,
  request: FareEstimateRequest,
  distanceKm: number,
  fare: { minPaise: int, maxPaise: int } | { exactPaise: int },   // [DECISION-3]
  includes: string[],            // e.g. "driver", "fuel" — from rate card, never hard-coded
  excludes: string[],            // e.g. "tolls", "loading" — from rate card
  rateCardVersion: string,
  validUntil: timestamptz,
  createdAt: timestamptz,
}
```

- Estimates are stored (no personal data) so a callback, a WhatsApp message and a future `/book` deep link can all reference `estimateId`.
- Future hand-off: `/book?estimate=<id>` or `/book?from=<placeId>&to=<placeId>&truck=<slug>&date=<yyyy-mm-dd>`. The home widget accepts the same query params today (used by lane pages and WhatsApp share links).

### 5.4 Google Maps (Phase 4)

- **No Maps JavaScript on page load.** It would blow the LCP/INP budget. Autocomplete calls go through our own route handler to Places API (New) Autocomplete with session tokens; the widget is a plain accessible combobox.
- Distance: Distance Matrix as specified; note Google now labels it _Legacy_ in favour of Routes API `computeRouteMatrix`. Phase 4 picks one; the estimate contract above is unaffected.
- API key is **server-only**, restricted by API and IP; results restricted to India (`includedRegionCodes: ["in"]`).
- Fallback if Maps is down or quota is hit: show "We couldn't calculate this route right now" + callback + WhatsApp. Never a fake fare.

---

## 6. Content inventory

Per page: sections in order, the single job of each, and the facts each depends on.
"Hidden if empty" means the section does not render in production without real data.

### 6.1 `/` — Home (Phase 4)

| #   | Section                                                                | Job                                                                                                                                               | Needs                                                             |
| --- | ---------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| 1   | Hero: headline, sub-headline, **fare widget** (`#get-price`)           | Give a fare in < 30 s on a phone. The widget _is_ the hero; LCP element is the headline text, not an image.                                       | Truck catalogue `[NFC-1]`, rate logic `[NFC-2]`, cities `[NFC-3]` |
| 2   | Estimate result panel (inline, replaces widget CTA)                    | Turn the fare into a callback or WhatsApp chat. Shows fare, inclusions/exclusions, validity, "Request a callback", "Send this quote on WhatsApp". | `[NFC-2]`, `[NFC-7]`, callback SLA `[NFC-12]`                     |
| 3   | Three proof points (fare up front · vetted only · driver-first)        | Say why we're different in 10 seconds.                                                                                                            | —                                                                 |
| 4   | How it works (6 steps: route → truck → fare → confirm → track → POD)   | Make the process feel as simple as a cab. Marks "track" and "POD" as handled by our team today if the shipper app isn't live.                     | Current ops process `[NFC-13]`                                    |
| 5   | Truck types strip (top 4–6, link to `/trucks`)                         | Help a shipper who doesn't know truck names.                                                                                                      | `[NFC-1]`, photos `[NFC-8]`                                       |
| 6   | Where we operate (cities / lanes)                                      | Answer "do you serve my route?" before they ask.                                                                                                  | `[NFC-3]`                                                         |
| 7   | Trust: client logos, testimonials                                      | Social proof. **Hidden if empty.**                                                                                                                | `[NFC-9]`, `[NFC-10]`                                             |
| 8   | Audience split: "Own trucks?" → `/transporters`; "Drive?" → `/drivers` | Route non-shippers away from the shipper funnel.                                                                                                  | —                                                                 |
| 9   | FAQ (5 shipper questions)                                              | Handle objections; FAQPage schema.                                                                                                                | FAQ answers `[NFC-13]`                                            |
| 10  | Final CTA band: Get price + WhatsApp                                   | Catch scrollers.                                                                                                                                  | —                                                                 |

### 6.2 `/shippers` — For businesses (Phase 5)

| #   | Section                                                                                                               | Job                                                         | Needs                        |
| --- | --------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------- | ---------------------------- |
| 1   | Hero: "Trucks for your business, fare up front" + Talk to our team                                                    | Qualify repeat-volume shippers.                             | —                            |
| 2   | Problems we remove (broker calls, haggling, no-shows, no POD)                                                         | Mirror their current pain.                                  | —                            |
| 3   | What you get (upfront fare, vetted transporters, POD, single point of contact, GST invoice)                           | Concrete benefits — **each only if confirmed**.             | `[NFC-11]`, `[NFC-13]`       |
| 4   | Industries / load types                                                                                               | Let them see themselves.                                    | Target industries `[NFC-15]` |
| 5   | Logos + testimonials                                                                                                  | Proof. **Hidden if empty.**                                 | `[NFC-9]`, `[NFC-10]`        |
| 6   | **Business enquiry form**: name, phone, company, city, monthly truck volume band, typical lanes, truck types, message | Capture goal (c). 2-step on mobile (contact → requirement). | Volume bands `[DECISION-5]`  |
| 7   | Quick quote link → widget                                                                                             | Let one-off shippers self-serve.                            | —                            |

### 6.3 `/transporters` — Join the network (Phase 5)

| #   | Section                                                                                                                                | Job                                                             | Needs                              |
| --- | -------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------- | ---------------------------------- |
| 1   | Hero: "Get loads at a known fare. No bidding." + Apply to join                                                                         | Hook fleet owners.                                              | —                                  |
| 2   | Why join (no bidding war, fare known before you accept, driver app, payments `[NFC-11]`)                                               | Benefits — only confirmed ones.                                 | `[NFC-11]`                         |
| 3   | Who can join (eligibility)                                                                                                             | Self-qualify before applying.                                   | Eligibility criteria `[NFC-5]`     |
| 4   | Documents you'll need (list only — **we do not upload documents on the website**)                                                      | Set expectations for vetting.                                   | KYC document list `[NFC-5]`        |
| 5   | How vetting works (apply → call → document check → first trip)                                                                         | Make "closed network" feel fair, not exclusive.                 | Vetting steps + timeline `[NFC-5]` |
| 6   | Fees for transporters                                                                                                                  | Transparency. **Hidden until confirmed.**                       | `[NFC-11]`                         |
| 7   | **Application form**: name, phone, city/base, fleet size (1, 2–5, 6–10, 10+), truck types owned, preferred lanes, GST registered (y/n) | Capture goal (d). Short; full KYC happens offline / in the app. | `[NFC-1]`                          |
| 8   | Transporter FAQ                                                                                                                        | Objections.                                                     | `[NFC-13]`                         |

### 6.4 `/drivers` — Driver app (Phase 5)

| #   | Section                                                                              | Job                                                                      | Needs                                               |
| --- | ------------------------------------------------------------------------------------ | ------------------------------------------------------------------------ | --------------------------------------------------- |
| 1   | Hero: app promise + **Get it on Google Play** badge                                  | Install.                                                                 | Play URL (env, exists)                              |
| 2   | Built for drivers (works on low-end phones, weak signal, few taps, WhatsApp updates) | Prove driver-first.                                                      | App facts: min Android version, app size `[NFC-16]` |
| 3   | Screens (3 real screenshots)                                                         | Show, don't tell.                                                        | Real app screenshots `[NFC-8]`                      |
| 4   | How a trip works in the app                                                          | Reduce fear of tech.                                                     | `[NFC-16]`                                          |
| 5   | Rewards (coming later) + **waitlist** (name, phone, city, transporter name optional) | Collect interest; **no promised rewards, amounts or dates.**             | Rewards wording approval `[NFC-17]`                 |
| 6   | Language note (Hindi/Tamil coming)                                                   | Set expectation honestly.                                                | —                                                   |
| 7   | Driver FAQ (incl. "I drive for a transporter not on TruckBuck")                      | Route drivers whose owner isn't on the network to share `/transporters`. | `[NFC-13]`                                          |

### 6.5 `/trucks` and `/trucks/[slug]` (Phase 6)

`/trucks`: intro → filter chips (body type: open / closed container / trailer — `[NFC-1]`) →
grid of truck cards (photo, name, length, payload, "Get price") → "Not sure which truck?" →
WhatsApp.

`/trucks/[slug]`: name + photo → spec table (length, width, height, payload, body type, axle /
wheels) → good for (load examples) → not suitable for → Get price with this truck pre-selected →
related trucks. **Every spec comes from `truck_types`; no spec is typed into copy.** Needs
`[NFC-1]`, `[NFC-8]`.

### 6.6 `/pricing` (Phase 4)

| #   | Section                                                              | Job                                                  | Needs                               |
| --- | -------------------------------------------------------------------- | ---------------------------------------------------- | ----------------------------------- |
| 1   | Hero + full estimator                                                | Goal (a) for people who came to compare prices.      | `[NFC-2]`                           |
| 2   | How your fare is built (distance, truck type, … )                    | Make the upfront fare credible.                      | Rate logic in plain words `[NFC-2]` |
| 3   | What's included / not included (tolls, loading, waiting, multi-drop) | Prevent surprise-charge complaints.                  | `[NFC-2]`                           |
| 4   | When the final fare can differ from the estimate                     | Honesty; reduces disputes.                           | `[NFC-2]`                           |
| 5   | Payment terms for shippers                                           | Answer "when do I pay?". **Hidden until confirmed.** | `[NFC-11]`                          |
| 6   | Pricing FAQ                                                          | —                                                    | `[NFC-13]`                          |

### 6.7 `/how-it-works` (Phase 6)

Six steps, each a short block with an illustration (not stock photos): **Route → Truck type →
See fare → Confirm → Track → Proof of delivery**, then "What the transporter and driver do"
side panel, then Get price. Where a step is done by our team today (e.g. confirm by phone),
the copy says so. Needs `[NFC-13]`.

### 6.8 `/safety` (Phase 6)

Vetting of transporters (what we check) → driver/vehicle checks (RC, licence, permits,
insurance — only those we actually do) → during the trip (tracking, contact) → proof of delivery
(how POD is captured and shared) → data protection (link `/privacy`) → report a problem
(`/grievance`). Needs `[NFC-5]`, `[NFC-13]`. No claims of insurance cover unless `[NFC-11]`.

### 6.9 `/about` (Phase 6)

Mission ("make booking a truck as simple as booking a taxi") → why we started → how we're
different (the three proof points) → team (real names/photos only, optional) → company
details (legal name, CIN, address) → contact. Needs `[NFC-4]`, founders' story `[NFC-18]`.

### 6.10 `/contact` (Phase 3)

Ways to reach us (phone, WhatsApp, email, hours) → **callback form** (name, phone, I am a:
shipper / transporter / driver / other, message) → registered office address → grievance link.
Needs `[NFC-4]`, `[NFC-6]`, `[NFC-7]`, support hours `[NFC-12]`.

### 6.11 `/help` and `/help/[slug]` (Phase 8)

Hub: search box (client-side over static FAQ list) → three audience tabs (Shippers /
Transporters / Drivers) → topic cards → "Still stuck? WhatsApp us". Topic page: question list
with answers (FAQPage schema) → related topics → WhatsApp. All content from `faqs`. Needs
`[NFC-13]`.

### 6.12 `/truck-booking/[slug]` (Phase 7)

City: H1 "Truck booking in {City}" → widget with `from` pre-filled → lanes from this city →
truck types available here → local FAQ → nearby cities.
Lane: H1 "{From} to {To} truck booking" → widget with both pre-filled → distance and typical
transit time (from `lanes`, only if ops confirm) → truck types used on this lane → lane FAQ →
reverse lane + related lanes.
Each page must have genuinely unique content from data (not a template with the city name
swapped) or it is not published. Needs `[NFC-3]` with lane list.

### 6.13 `/blog` (Phase 8, optional)

MDX in repo. Launch only with at least 3 real articles; otherwise the route is not built.

### 6.14 Legal: `/privacy`, `/terms`, `/grievance`, `/account-deletion` (Phase 9)

Counsel-approved text only `[NFC-19]`. `/privacy` must cover the driver app's location data
because it is the Play Store privacy URL. `/grievance` publishes the Grievance Officer's name,
designation, contact and response timeline (IT Rules 2021 / DPDP Act 2023) and a complaint
form. `/account-deletion` exists because Google Play requires a web link where users can request
deletion of an app account and its data `[DECISION-4]`.

---

## 7. User journeys

### 7.1 First-time shipper on mobile, from Google

1. Searches "truck booking chennai to bangalore" on a mid-range Android phone, 4G.
2. Lands on `/truck-booking/chennai-to-bengaluru` (or `/` for brand / generic searches). Page is static, headline paints < 2 s.
3. Sees H1 for their lane and the widget with _From_ and _To_ already filled.
4. Picks a truck type from a list with plain names, sizes and a small icon; "Not sure?" opens a short explainer sheet.
5. (Optional) picks a pickup date. Taps **Get price**.
6. Sees the fare (range or exact, `[DECISION-3]`), what's included, how long it's valid. Event `fare_estimate_shown`.
7. Taps **Request a callback**: name + phone (pre-validated +91, numeric keypad), one tap to submit. Or taps **WhatsApp** with a message that includes the route, truck and estimate ID.
8. Sees confirmation: reference number, "We'll call you within {SLA}" `[NFC-12]`, and WhatsApp as a faster option. Event `lead_submitted{type:callback}`.
9. Ops calls back, confirms and books manually (until the web app exists).

### 7.2 Shipper from a WhatsApp share

1. A colleague taps **Send this quote on WhatsApp** on the result panel, or shares `truckbuck.in`.
2. Link carries `?from=…&to=…&truck=…&utm_source=whatsapp&utm_medium=share` (no personal data in the URL).
3. WhatsApp shows the preview: OG image with headline A and the logo; title and description from metadata.
4. Recipient taps it inside WhatsApp's in-app browser. Page loads without Maps JS; widget is pre-filled from the query string.
5. They tap **Get price** (or change the route) and see the fare.
6. CTA: **Chat on WhatsApp** is shown with equal weight here — they're already in WhatsApp. Event `whatsapp_click{context:"shared_quote"}`.
7. Conversation continues with ops on WhatsApp.

### 7.3 Transporter from a WhatsApp link

1. Ops or a fellow transporter forwards `truckbuck.in/transporters?utm_source=whatsapp&utm_campaign=<campaign>`.
2. Opens in WhatsApp's in-app browser. Hero: "Get loads at a known fare. No bidding." + **Apply to join**. Bottom bar: `[Apply to join] [WhatsApp]`.
3. Scrolls: why join → who can join → documents needed → how vetting works.
4. Taps **Apply to join**. Step 1: name, phone, base city. Step 2: fleet size, truck types, preferred lanes, GST yes/no.
5. Submits. Confirmation: reference, what happens next (call from our team within `[NFC-5]` timeline), list of documents to keep ready, WhatsApp button. Event `lead_submitted{type:transporter_application}`.
6. Ops calls, collects documents offline / in the transporter onboarding tool (not the website).

### 7.4 Driver from the Play Store

1. Driver finds "TruckBuck Driver" on Google Play (search, or told to install by their transporter).
2. Before installing, taps the developer website link in the listing → `truckbuck.in/drivers` (set this as the Play listing's website `[NFC-16]`).
3. Page confirms it's a real company: what the app does, real screenshots, company details in footer, privacy link.
4. Sees **Get it on Google Play** — returns to the listing and installs. Event `play_store_click{context:"drivers_hero"}`.
5. Optionally joins the rewards waitlist (name, phone, city). Event `lead_submitted{type:driver_waitlist}`.
6. If their transporter isn't on TruckBuck, the FAQ offers a "Share with your owner" WhatsApp message linking to `/transporters` — a recruitment loop.

---

## 8. Cross-cutting requirements (all phases)

- **Mobile-first at 360 px**; touch targets ≥ 44 × 44 px (exceeds WCAG 2.2 AA 24 px minimum); no horizontal scroll.
- **Performance budget per page**: LCP < 2.0 s, CLS < 0.05, INP < 200 ms on Moto G-class mobile, Lighthouse ≥ 95 in all four categories. ≤ 100 KB JS (gzip) on any marketing page excluding the widget; widget JS loads only when the widget is visible or focused. Images: AVIF/WebP via `next/image`, explicit sizes, no hero image larger than the text LCP.
- **Accessibility**: WCAG 2.2 AA; visible focus ring from tokens; skip link (exists); forms with labels, inline errors linked by `aria-describedby`, error summary on submit; motion respects `prefers-reduced-motion`.
- **i18n**: every string via content keys (`page.section.element`); no string concatenation for sentences (use ICU placeholders); numbers/currency via `Intl` with `en-IN`; layout tolerates +40 % text length (Tamil).
- **Forms**: zod schema shared client + server; server action validates again; phone normalised to E.164; success state is a page-level confirmation with a reference, not a toast.
- **SEO**: unique title/description per route from content keys; canonical from `NEXT_PUBLIC_SITE_URL`; JSON-LD: `Organization` (site-wide), `FAQPage` (help, home FAQ), `BreadcrumbList` (trucks, help, truck-booking), `Service` (truck-booking pages). Reserved routes `noindex`.
- **Analytics** (Phase 9): the events in §2 plus `widget_started`, `widget_error{reason}`, `form_started{type}`, `form_error{type,field}`. UTM params captured on first landing and attached to leads. Consent banner before any non-essential tracking.
- **Feature flags**: `NEXT_PUBLIC_FEATURE_WEB_APP` (Login link, `/book` target). Others added as needed.
- **Truthfulness**: no stats, logos, testimonials or claims without a source in `[NFC]`; empty data hides the section.

---

## 9. Phase plan (owners referenced above)

| Phase | Name                       | Delivers                                                                                                                                                                     | Routes owned                                                      |
| ----- | -------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| 2     | Design system & shell      | Tokens, type scale, restyled shadcn primitives, header + drawer, bottom bar, footer, CTA components, content-key structure, feature flags, `/book` redirect, reserved routes | — (shell for all)                                                 |
| 3     | Data & lead capture        | Supabase schema + RLS, `packages/types` zod schemas, server actions, spam defence, WhatsApp link builder, confirmation pattern                                               | `/contact`                                                        |
| 4     | Fare estimate              | Places proxy, distance calculation, rate engine, widget + result panel, estimate storage, query-param pre-fill                                                               | `/`, `/pricing`                                                   |
| 5     | Audience pages             | Business enquiry, transporter application, driver page + waitlist                                                                                                            | `/shippers`, `/transporters`, `/drivers`                          |
| 6     | Product & trust pages      | Truck catalogue from DB, process, safety, about                                                                                                                              | `/trucks`, `/trucks/[slug]`, `/how-it-works`, `/safety`, `/about` |
| 7     | Local SEO                  | City and lane pages from data, popular-routes footer, internal linking                                                                                                       | `/truck-booking/[slug]`                                           |
| 8     | Help & content             | FAQ hub from `faqs`, optional MDX blog                                                                                                                                       | `/help`, `/help/[slug]`, `/blog`                                  |
| 9     | Legal, consent & analytics | Counsel text, grievance form, account-deletion form, consent banner, analytics events                                                                                        | `/privacy`, `/terms`, `/grievance`, `/account-deletion`           |
| 10    | Launch hardening           | Lighthouse/a11y audit and fixes, redirects from the current truckbuck.in URLs, Search Console + sitemap submission, headline A/B setup                                       | — (all)                                                           |

---

## 10. Open decisions

Recommended default first; later phases proceed with it unless changed.

| ID         | Decision                                | Default                                                                                                      | Why it matters                                                                               |
| ---------- | --------------------------------------- | ------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------- |
| DECISION-1 | Gate the fare behind a phone number?    | **No** — show fare, then ask for callback.                                                                   | Gating raises leads per estimate but cuts estimates (goal a) and feels un-cab-like.          |
| DECISION-2 | Bottom bar varies by audience page?     | **Yes** — Apply on `/transporters`, Get the app on `/drivers`.                                               | Deviates from the brief's fixed `[Get price][WhatsApp]`.                                     |
| DECISION-3 | Show an exact fare or a range?          | **Range** (min–max) until rate logic is proven, labelled "estimate".                                         | An exact number we can't honour creates disputes; a range still beats "call for price".      |
| DECISION-4 | Build `/account-deletion` request page? | **Yes**, simple form → `leads`.                                                                              | Google Play requires a deletion-request URL for apps with accounts; driver app has accounts. |
| DECISION-5 | Business enquiry volume bands           | `1–5`, `6–20`, `21–50`, `50+` trucks / month                                                                 | Used for lead routing; ops may prefer different bands.                                       |
| DECISION-6 | Analytics tool                          | GA4 (needed for Google Ads conversions) loaded after consent, plus Vercel Web Analytics for Core Web Vitals. | Affects consent banner and performance budget.                                               |

---

## 11. NEEDS-FROM-CLIENT checklist

> Copy this section as-is. Anything not supplied stays hidden or marked TODO on the site —
> we will not make it up.

**Business & legal**

- [ ] **NFC-4 — Company identity:** registered legal name, CIN, GSTIN, registered office address (as on MCA), year founded.
- [ ] **NFC-19 — Legal text:** counsel-approved Privacy Policy (covering the website _and_ the driver app, incl. location data), Terms of Use, and Grievance Officer name, designation, email, phone and response timeline.
- [ ] **NFC-11 — Claims we're allowed to make**, each with yes/no and the exact wording: payment timeline to transporters, transporter fees/commission, shipper payment terms (advance / on delivery / credit), GST invoice for shippers, goods insurance, number of vetted transporters / trucks / cities (only if you want them published).

**Contact**

- [ ] **NFC-6 — Support phone number and support email**, and whether the phone should show on every page.
- [ ] **NFC-7 — WhatsApp number** for click-to-chat (a WhatsApp Business number), and who answers it.
- [ ] **NFC-12 — Support hours and callback promise** (e.g. "within 30 minutes, 8 am–8 pm, Mon–Sat").

**Pricing & operations**

- [ ] **NFC-1 — Truck catalogue:** every truck type you book, with: name you use with customers, body type (open / closed container / trailer / other), length (ft), payload (tonnes), number of wheels/axles, typical loads it carries, and which ones to feature first.
- [ ] **NFC-2 — Rate logic:** how a fare is calculated (per km, per tonne, slabs, minimum charge, per truck type), what's included (fuel, driver, tolls?), what's extra (loading/unloading, waiting, multi-drop, night, return), how long a quote is valid, and when the final fare can differ.
- [ ] **NFC-3 — Where you operate:** cities you pick up from, cities you deliver to, and your top 10–20 lanes (from–to). For each lane, typical transit time only if you're confident in it.
- [ ] **NFC-13 — How a booking works today**, step by step (who calls whom, how the transporter is assigned, how tracking and proof of delivery are shared), plus answers to the top 10 questions shippers, transporters and drivers ask you.
- [ ] **NFC-5 — Transporter vetting:** who can join (fleet size, GST, years in business, etc.), documents you check, the vetting steps and how long they take.
- [ ] **NFC-15 — Target industries / load types** you want to highlight (e.g. FMCG, steel, textiles).

**Drivers & app**

- [ ] **NFC-16 — Driver app facts:** minimum Android version, app size, languages, main features live today; and please set `https://truckbuck.in/drivers` as the website on the Play Store listing.
- [ ] **NFC-17 — Rewards programme:** approved one-line description for the waitlist (no amounts or dates unless confirmed).

**Brand & proof**

- [ ] **NFC-8 — Real photos:** trucks (each type), drivers/team (with consent), operations; plus 3–5 driver app screenshots. Minimum 2000 px wide.
- [ ] **NFC-9 — Client logos** you have written permission to show.
- [ ] **NFC-10 — Testimonials:** real quotes with name, role, company and written consent (photo optional).
- [ ] **NFC-14 — Social media links** (if any) and brand assets (logo files, colours, fonts if fixed).
- [ ] **NFC-18 — About us:** why TruckBuck was started (a few lines), founders' names/photos if you want them shown.

**Access**

- [ ] **NFC-20 — Current site:** list of current truckbuck.in URLs (or Search Console access) so we redirect old links, and DNS access for the domain on Vercel.
- [ ] **NFC-21 — Accounts:** Google Cloud project with billing for Maps (Places + distance), Supabase project, Vercel project, GA4 / Search Console access.

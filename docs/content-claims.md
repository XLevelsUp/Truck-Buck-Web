# Content claims ledger

Every factual statement the marketing site makes, where it appears and what backs it.

**Status values**

- **Live:** the statement shows in production.
- **Gated:** the statement is hidden in production until the client confirms it. In development it shows a "Needs from client" marker instead.

**Source values**

- **Brief:** the client's master brief (product model, audiences, differentiators) or a phase brief, quoted below.
- **By construction:** true because of how this site is built.
- **NFC-n:** waiting on that item in the [NEEDS-FROM-CLIENT checklist](blueprint.md#11-needs-from-client-checklist).

**Where to change things**

- Claims are switched in `apps/marketing/src/content/features.ts` (`featureStatus`) and `apps/marketing/src/content/company.ts` (`company.claims` and company facts).
- Hindi and Tamil say the same things as English. Any change here must be made in all three.

Last reviewed: 2026-11-24.

## Live claims and where they come from

| Claim (English wording)                                                                                                                       | Where                                          | Source                                                                                                                                        |
| --------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| "Book a truck like you book a cab." Fare range shown before booking.                                                                          | Home hero, meta, `/how-it-works`, all variants | Brief: "Shippers see a fare up front; a vetted transporter accepts."                                                                          |
| Closed network, and only vetted transporters can take a load (`vettedNetwork`, `claims.vettedTransporters`).                                  | Home trust strip, compare table, shippers, FAQ | Brief: "closed network … (not an open bidding marketplace)". What vetting involves is still NFC-5.                                            |
| No bidding: the fare is set before the transporter sees the load (`noBidding`).                                                               | `/transporters`, home audiences, hero variants | Brief: "not an open bidding marketplace".                                                                                                     |
| Transporters are fleet owners with 1–10 trucks.                                                                                               | `/transporters`, home audiences                | Brief, audiences: "Transporter / fleet owner (1-10 trucks)".                                                                                  |
| Applying takes about 2 minutes.                                                                                                               | `/transporters` hero, form lead, FAQ           | Phase 4 acceptance: "apply on a 360px phone in < 2 minutes". The form has two short steps.                                                    |
| No documents are uploaded on the website; they're collected over WhatsApp.                                                                    | `/transporters` vetting section, FAQ           | By construction: the form has no upload field.                                                                                                |
| "Get a callback in 15 min."                                                                                                                   | Lead button after an estimate                  | Phase 3 brief: "Get a callback in 15 min". Ops to confirm it (NFC-12). Set `company.callbackMinutes = null` to show "Request a call" instead. |
| The driver app is built for low-cost Android phones and weak signal, with updates on WhatsApp (`driverTripDetails`, `driverWhatsappUpdates`). | `/drivers`, home audiences                     | Brief: "driver-first UX (few taps, low-end Android, poor signal, WhatsApp updates)". The minimum Android version and app size are NFC-16.     |
| The driver app is on Google Play (`in.truckbuck.driver`).                                                                                     | `/drivers`, footer badges                      | Brief: "install the Android driver app (in.truckbuck.driver)".                                                                                |
| Full truckload (FTL): the truck carries one shipper's goods.                                                                                  | Home FAQ                                       | Definition of the service in the brief.                                                                                                       |
| Fare depends on road distance, truck type and pickup time; night and same-day pickups can cost more.                                          | Home FAQ, estimate result                      | By construction: `priceQuote` in `packages/pricing`. The rates themselves are samples (NFC-2).                                                |
| The quoted fare is a range, and the final fare is agreed before booking.                                                                      | Home FAQ, estimate result                      | By construction: the range is rounded outward. The final-fare process is NFC-13.                                                              |
| Truck types run "from mini trucks to large containers".                                                                                       | Home trucks section, `/trucks`                 | Generic on purpose. The real catalogue is NFC-1, and sample rows are dev-only.                                                                |
| If a transporter doesn't accept, the load is offered to the next vetted transporter.                                                          | `/how-it-works` FAQ, `/help`                   | Phase 4 brief lifecycle: "offer to vetted transporter -> accept or cascade".                                                                  |
| Vetting checks RC, insurance and permit for every truck, and each driver's licence (`vetVehicleDocs`, `vetDriverLicence`).                    | `/safety` steps 2–3, `/help`                   | Phase 4 brief: "documents needed (RC, insurance, permit, PAN, GST optional, bank details, driver licence)".                                   |
| Digital KYC (PAN + Aadhaar via DigiLocker/Setu) is "Coming soon"; today the owner's PAN is checked with the other documents (`vetKyc`).       | `/safety` step 1                               | Phase 6 brief: "mark as planned if not integrated". PAN is in the Phase 4 document list.                                                      |
| Driver rewards will be weighted on safety (`safetyWeightedRewards`, "Coming soon"); non-cash (fuel, recharge).                                | `/safety`, `/drivers`, `/help`                 | Master brief: "later, safety-weighted non-cash driver rewards"; Phase 4 brief: "non-cash (fuel, recharge)". Wording approval is NFC-17.       |
| Mission: "Make full-truck booking simple and fair for shippers, transporters and drivers."                                                    | `/about`                                       | Restates the brief's positioning lines for each audience. Not a factual claim.                                                                |
| GST is included in the estimate range; the website takes no payments; estimates and callbacks are free.                                       | `/help`, `/refund-policy`                      | By construction: `priceQuote` adds GST; the site has no payment flow.                                                                         |
| Data requests (access, correction, erasure) and complaints can be filed online.                                                               | `/grievance`, `/help`, `/privacy`              | By construction: the grievance form files `grievance` / `account_deletion` leads.                                                             |
| We use only a language cookie and Cloudflare Turnstile's security cookies; no advertising or analytics cookies.                               | `/privacy` (draft)                             | By construction, as of 2026-11-24. Re-check when analytics ship (Phase 9); a consent banner is needed only for non-essential cookies.         |

### Phase 7: city and lane pages

| Claim                                                                                            | Where                           | Source                                                                                                                                               |
| ------------------------------------------------------------------------------------------------ | ------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| TruckBuck serves Coimbatore, Tiruppur, Erode, Salem, Chennai, Madurai, Bengaluru and Kochi.      | `/truck-booking/<city>`, hub    | Client confirmation, 2026-11-24 (NFC-3).                                                                                                             |
| Road distance, transit times and fares per truck type on a lane.                                 | `/truck-booking/<from>-to-<to>` | Computed: Google Routes distance + `priceQuote` on the lane's rate cards. Noindex until both are real (no straight-line estimates, no sample rates). |
| "Inter-state consignments worth more than ₹50,000 generally need an e-way bill under GST rules." | Cross-state lane pages          | CGST Rules, 2017, Rule 138 (https://cbic-gst.gov.in). Worded "generally" because exemptions exist.                                                   |
| Highways, toll note and common goods per lane; industries per city.                              | Lane and city pages             | Ops facts in `lanes` / `service_areas`, shown only when `facts_reviewed` with a `facts_source` (NFC-3, NFC-15).                                      |

## Gated until confirmed

| Claim                                                      | Switch                                                             | Waiting on                                |
| ---------------------------------------------------------- | ------------------------------------------------------------------ | ----------------------------------------- |
| Live tracking / trip status updates                        | `liveTracking`, `claims.tripStatusUpdates`                         | NFC-11, NFC-13                            |
| Proof of delivery (photo + signature) on every trip        | `podPhotoSignature`, `claims.podEveryTrip`, `driverPod`            | NFC-11, NFC-13                            |
| GST invoice for shippers; "GST-registered company"         | `gstInvoices`, `claims.gstInvoice`, `company.gstin`                | NFC-11, NFC-4                             |
| KYC-verified drivers                                       | `claims.kycVerifiedDrivers`                                        | NFC-11                                    |
| Trip reports                                               | `tripReports`                                                      | NFC-11                                    |
| Team accounts (shown as "Coming soon")                     | `teamAccounts` (`roadmap`)                                         | Roadmap item, so it's never shown as live |
| Steady loads for transporters                              | `steadyLoads`                                                      | NFC-11                                    |
| Per-trip fee (%), minimum fee and payout timeline          | `transparentFee`, `onTimePayment`, `site_config` `transporter.fee` | NFC-11                                    |
| Assigning a driver in a few taps                           | `driverAssignment`                                                 | NFC-11, NFC-16                            |
| In-app navigation for drivers                              | `driverNavigation`                                                 | NFC-16                                    |
| Shipper rating and payment status in the booking lifecycle | `shipperRating`, `paymentStatus`                                   | NFC-11, NFC-13                            |
| Verification timeline for transporters                     | `vettingTimeline`                                                  | NFC-5                                     |
| Support hours, phone, email and WhatsApp number            | `company.*`                                                        | NFC-6, NFC-7, NFC-12                      |
| Legal name, CIN, GSTIN and registered office               | `company.*`                                                        | NFC-4                                     |
| Waiting, cancellation and payment terms on `/pricing`      | `site_config` `charges`                                            | NFC-2, NFC-11                             |
| Cities and lanes served (coverage map)                     | Supabase `cities` / `lanes` (sample rows are dev-only)             | NFC-3                                     |
| Testimonials and client logos                              | DB: `published` + consent/permission + `approved_by`/`approved_at` | NFC-9, NFC-10                             |
| Live counters (trips completed, transporters onboarded)    | `site_metrics` (real counts only) + `metrics.thresholds`           | NFC-11 (whether to publish numbers)       |
| First-trip review; auto-suspension below a rating          | `vetFirstTrip`, `vetRatingThreshold`, `company.suspendBelowRating` | NFC-5                                     |
| Incident process; insurance guidance                       | `incidentProcess`, `insuranceGuidance`                             | NFC-11, NFC-13                            |
| No speed-based incentives; planned rest stops              | `noSpeedIncentives`, `restStopPolicy`                              | NFC-11                                    |
| Company story, home city, team, founding year              | `company.story`, `homeRegion`, `team`, `foundedYear`               | NFC-18, NFC-4                             |
| MSME (Udyam) and DPIIT Startup India registrations         | `company.registrations`                                            | NFC-23                                    |
| Contact lines for shippers, transporters and press         | `company.contactLines`                                             | NFC-6                                     |
| Grievance Officer, response timelines, retention, courts   | `company.grievanceOfficer`, `grievanceTimelines`, etc.             | NFC-19                                    |
| Refund timeline; payment and cancellation terms (legal)    | `company.refundDays`, `site_config` `shipper.charges`              | NFC-11                                    |

## Removed for having no source

These were taken out of the copy in all three languages. They come back only with the client's wording.

- "No joining fee" / "Nothing to pay to join" (transporters). Replaced by the FAQ "How long does applying take?". This belongs to NFC-11.
- "Works on any Android phone" (drivers). Softened to what the brief says: built for low-cost phones. The minimum Android version is NFC-16.
- "32 ft containers": this came only from the sample catalogue. It's now "large containers" until the catalogue is in (NFC-1).
- Earlier phases already removed "tolls at actuals", "2 hours free waiting" and "fuel included". All three wait on NFC-2.
- "Our team stays with the trip until delivery" (`/how-it-works` FAQ). The blueprint lists a single point of contact as a claim to make only once confirmed (NFC-11, NFC-13).

## Legal pages (DRAFT)

- `/privacy`, `/terms`, `/refund-policy` and `/grievance` are drafts written for counsel to review. Each carries a "DRAFT – review by lawyer" banner until `company.legalReview.approved` is true (NFC-19).
- They describe policies (for example "we don't sell personal data", the refund rule, the transporter obligations). These are proposals for the client and counsel, not confirmed facts.
- Company and policy facts are `{tokens}` filled from `company.ts` and `site_config`. A missing one shows a marker in development and neutral wording ("the cancellation terms confirmed in your booking") in production.
- The driver app's location collection ("while a trip is active") needs confirming by the app team (NFC-16).

## Launch blocker

- Production deploys (`VERCEL_ENV=production`) fail until `company.legalName`, `registeredAddress` and `cin` or `gstin` are set, because the footer must show them on every page (`src/launch-check.ts`). Other builds print a warning.

## Translations

- The Hindi and Tamil copy is a draft and has not been reviewed by a native speaker (NFC-22).
- Until each language is signed off, its pages are hidden in production. They are `noindex`, left out of the switcher, the sitemap and hreflang, and show a "draft translation" note in previews.
- Sign-off means setting `translationReview[locale].reviewed = true`, with the reviewer's name, in `apps/marketing/src/i18n/locales.ts`.

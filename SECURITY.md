# Security: TruckBuck marketing site

Scope: `apps/marketing` (truckbuck.in) and its Supabase project. The site takes enquiries and shows public content. It has no logins, payments or admin. Keep the attack surface that small.

**Reporting a vulnerability:** email the security contact in `company.ts` (NFC-4, not set yet). Don't open a public issue.

---

## 1. Who can do what in Supabase

The site's server connects with the **publishable (anon) key**, which is public by design, plus a **site secret** (`SUPABASE_SITE_SECRET`, server-only). There's no secret or service-role key in the site at all: `src/env.server.ts` refuses to start if one is set, or if the "publishable" key is really a service-role key.

- **Reads:** row-level security (RLS) filters them, and column grants hide internal fields.
- **Writes:** only through `site_*` database functions that check the site secret. Each function is `SECURITY DEFINER` with a fixed `search_path`. The secret's SHA-256 hash is stored in `private.site_secret`, a schema the API doesn't expose.

Roles:

| Role                                                                                              | Who holds it                                                   | What it can do                                                                                                              |
| ------------------------------------------------------------------------------------------------- | -------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `anon` with the publishable key only                                                              | Anyone. The key is public.                                     | Read public content (table below). Write nothing. Call the `site_*` functions, but every one fails without the site secret. |
| record web vitals and estimates, read web-vitals p75 and the weekly aggregates. Can't read leads. |
| `authenticated`                                                                                   | Nobody. No logins.                                             | Same as the publishable key alone.                                                                                          |
| `service_role` / `postgres`                                                                       | Ops tooling and migrations only. Never deployed with the site. | Everything. Used for reading and handling leads, and for scheduled jobs.                                                    |

### Tables

| Table                 | RLS                | `anon` / `authenticated`                                                    | Columns exposed           | Writes                                                                                                                                         | Retention                                                                                                                 |
| --------------------- | ------------------ | --------------------------------------------------------------------------- | ------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| `truck_types`         | on                 | SELECT where `active`                                                       | all                       | ops only                                                                                                                                       | —                                                                                                                         |
| `rate_cards`          | on                 | SELECT where `active`                                                       | all (public price inputs) | ops only                                                                                                                                       | —                                                                                                                         |
| `service_areas`       | on                 | SELECT where `active`                                                       | all                       | ops only                                                                                                                                       | —                                                                                                                         |
| `lanes`               | on                 | SELECT where `active`                                                       | all                       | ops only                                                                                                                                       | —                                                                                                                         |
| `faqs`                | on                 | SELECT where `published`                                                    | all                       | ops only                                                                                                                                       | —                                                                                                                         |
| `testimonials`        | on                 | SELECT where `published AND consent_on_file AND approved_at IS NOT NULL`    | not `approved_by`         | ops only                                                                                                                                       | —                                                                                                                         |
| `client_logos`        | on                 | SELECT where `published AND permission_on_file AND approved_at IS NOT NULL` | not `approved_by`         | ops only                                                                                                                                       | —                                                                                                                         |
| `site_config`         | on                 | SELECT all rows                                                             | not `note`                | ops only                                                                                                                                       | —                                                                                                                         |
| `site_metrics`        | on                 | SELECT all rows                                                             | all                       | booking system job                                                                                                                             | —                                                                                                                         |
| `leads`               | on, no policies    | **none**                                                                    | none                      | `site_submit_lead` (allow-listed fields; `status` forced to `new`), `site_annotate_lead` (merges into `details`, rows < 1 h old only)          | `prune_leads(months)` deletes enquiries that never converted. Scheduled once the privacy policy sets the period (NFC-19). |
| `rate_limits`         | on, no policies    | **none**                                                                    | none                      | `site_rate_limit_hit`                                                                                                                          | 1 day (nightly `pg_cron`)                                                                                                 |
| `distance_cache`      | on, no policies    | **none**                                                                    | none                      | `site_distance_get` / `site_distance_put`                                                                                                      | 30 days (Google Maps terms; nightly `pg_cron`)                                                                            |
| `web_vitals`          | on, no policies    | **none**                                                                    | none                      | `site_record_vitals` (≤ 10 rows per call); `site_vitals_p75` reads aggregates                                                                  | 90 days (nightly `pg_cron`)                                                                                               |
| `estimate_log`        | on, no policies    | **none**                                                                    | none                      | `site_record_estimate` (anonymous: "City, State" places, coordinates rounded to ~10 km, no ids); `site_weekly_summary` returns aggregates only | 400 days (nightly `pg_cron`)                                                                                              |
| `private.site_secret` | schema not exposed | **none**                                                                    | none                      | `private.set_site_secret()` as postgres only                                                                                                   | —                                                                                                                         |

Internal functions `rate_limit_hit`, `prune_marketing_caches` and `prune_leads` can be executed by `service_role` only.

**Defaults are closed.** Default privileges in `public` grant nothing to `anon`/`authenticated` on new tables, sequences or functions. A new table is invisible to the site until a migration grants and adds a policy for it.

**Verified by** `apps/marketing/e2e/rls.spec.ts`, which uses the public key the way an attacker would. It checks that the private tables read nothing, that content tables are readable, that `approved_by` is refused, that content writes and direct lead inserts are refused, that every `site_*` function returns `forbidden` with a wrong secret, and that internal functions can't be called.

**Supabase advisors** (security): 0 errors.

- INFO "RLS enabled, no policy" on `leads`, `rate_limits`, `distance_cache`, `web_vitals` and `estimate_log`. This is intentional: deny-all.
- WARN "public can execute SECURITY DEFINER" on the nine `site_*` functions. This is intentional: each one checks the site secret first.

### Setting or rotating the site secret

1. Generate one: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`.
2. Register its hash in the Supabase SQL editor: `select private.set_site_secret('<secret>');`
3. Set `SUPABASE_SITE_SECRET` in Vercel (Production and Preview) and in the GitHub secrets used by `monitoring.yml`, then redeploy. The old secret stops working at step 2.

Migrations: `supabase/migrations/20261123130000_marketing_core.sql` and `20261125090000_phase8_least_privilege.sql`.

---

## 2. Abuse controls

| Entry point                                                                              | Controls                                                                                                                                                                                                                                                                                     |
| ---------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Lead forms (quote, callback, business, transporter, driver waitlist, support, grievance) | zod schema, honeypot field (answered like a success, nothing saved), Indian mobile validation (`normalizeIndianMobile`), 5 per IP per 10 min, Cloudflare Turnstile verified server-side, fare recomputed on the server (never trusted from the browser)                                      |
| `GET /api/estimate`                                                                      | zod schema, **bot-check cookie** (`tb_h`: HttpOnly, SameSite=Strict, HMAC-signed, 30 min, earned by one Turnstile solve at `POST /api/human`), 20 per IP per min on cache misses. Responses are cacheable for 5 minutes per identical input (`s-maxage=300`), so repeats cost no Maps calls. |
| `POST /api/human`                                                                        | zod, 10 per IP per min, Turnstile                                                                                                                                                                                                                                                            |
| `/api/places/*`, `/api/map`                                                              | zod, 120 and 30 per IP per min, Google calls server-side only                                                                                                                                                                                                                                |
| `/api/vitals`, `/api/client-errors`                                                      | zod (strict path pattern, bounded sizes), 30 and 10 per IP per min, always 204                                                                                                                                                                                                               |

Rate-limit keys are salted SHA-256 hashes of the IP (`RATE_LIMIT_SALT`). IPs aren't stored. Turnstile loads only when someone starts using a form, never on page load.

## 3. Google Maps keys

- **`GOOGLE_MAPS_API_KEY`** (server-only): Places API (New), Routes API, Geocoding API and Maps Static API. Browsers never see it, so an **HTTP-referrer restriction can't apply**; it would block our own server. Restrict it by **API** (only those four) and set daily quotas. If the host gives fixed egress IPs, add an IP restriction too.
- **`NEXT_PUBLIC_GOOGLE_MAPS_EMBED_KEY`** (public, optional): Maps Embed API only, **restricted by HTTP referrer** to `https://truckbuck.in/*` (and preview domains). It's loaded only when someone taps "Open interactive map".

The site never loads the Maps JavaScript or Places scripts.

## 4. HTTP headers

They're set for every response in `src/lib/security-headers.ts`.

**Content-Security-Policy:**

- `default-src 'self'`.
- Scripts from `'self'` plus Turnstile, with **Subresource Integrity**. `experimental.sri` adds a sha256 `integrity` attribute to every script tag, so a tampered chunk is refused.
- `object-src 'none'`, `base-uri 'self'`, `form-action 'self'`, `frame-ancestors 'none'`, `upgrade-insecure-requests`.
- `connect-src 'self'`: Sentry, vitals and Maps traffic all go through our own `/api` routes.

**Why not a nonce-based CSP:** nonces force every page to render per request, and the site is static/ISR by design. Inline bootstrap scripts therefore still need `'unsafe-inline'`. With no third-party script hosts and SRI on every script file, that's an accepted trade-off. Revisit if a third-party script is ever added.

**Other headers:**

- `Strict-Transport-Security: max-age=63072000; includeSubDomains`. Add `preload` after submitting to hstspreload.org.
- `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY` and `Referrer-Policy: strict-origin-when-cross-origin`.
- `Permissions-Policy: camera=(), microphone=(), geolocation=(self), payment=()`.
- `Cross-Origin-Opener-Policy: same-origin`.

Check the grade after deploy at https://securityheaders.com. All the headers it grades are present, so expect **A**. A+ would need the CSP without `'unsafe-inline'`.

## 5. Personal data

- **Leads:** never readable by any client key. The browser gets back only a reference like `TB-1A2B3C`.
- **Logs:** every server log goes through `src/server/log.ts`. It masks phone numbers, emails and IPs, and replaces personal fields (`name`, `phone`, `email`, `company`, `pickup`, `drop`, `details`, `message`, cookies, auth headers and tokens) with `[redacted]`.
- **Sentry** (server only, `SENTRY_DSN`): errors only. No tracing or replay. Collection of user info, cookies, headers, bodies and query strings is turned off, and `beforeSend` strips request data and masks messages. The browser never loads the Sentry SDK; its errors are posted to `/api/client-errors`, which forwards them.
- **Web vitals:** metric name, value, rating, URL path, device class and connection type. No IP, user agent or identifiers.
- **Retention:** see the table in section 1. The lead period is pending NFC-19.

## 5b. Analytics and lead alerts (Phase 9)

- **Consent:** GTM, GA4 and Clarity load only after the visitor accepts analytics cookies (`tb_consent`). Events carry no name, phone, email or address (`src/lib/analytics.ts` allow-lists parameters and drops phone/email-like strings). Server-side GA4 conversions are sent only with consent. Details in `docs/analytics.md`.
- **Lead alerts contain PII by design** (ops needs to call back). They go to:
  - the ops WhatsApp numbers (Meta);
  - the ops inbox (Resend);
  - the shared Sheet (Apps Script webhook, protected by `SHEET_WEBHOOK_SECRET`).

  Share the Sheet only with the ops team. Server logs never include lead names or numbers. The weekly client summary has counts only.

- **Cron:** `/api/cron/weekly-summary` requires `Authorization: Bearer $CRON_SECRET` (Vercel sends it), compared in constant time.
- **Cookies:**
  - `tb_consent`: the analytics choice.
  - `tb_cid`: random analytics id, set only after consent and deleted on reject.
  - `tb_exp`: A/B assignment, no identifier.
  - `tb_exp_qa`: QA override, session only.
  - `tb_h`: bot check.
  - `tb_locale`: language.

## 6. Supply chain and CI

- **Dependabot** (`.github/dependabot.yml`): weekly grouped updates for pnpm and GitHub Actions; security fixes immediately.
- **`security.yml`:**
  - gitleaks on every push and PR, with full history on `main`;
  - `pnpm audit --prod --audit-level high` on every push and PR, and weekly.
  - Also turn on **GitHub secret scanning and push protection**: Settings → Code security and analysis.
- **Install scripts:** blocked by default (`pnpm-workspace.yaml` → `allowBuilds`).
- **Patched Next.js:** 16.4.6. In Phase 8, `pnpm audit` flagged 7 advisories on 16.4.3, including Cache Components issues. The one remaining moderate advisory (`minimatch`) is in ESLint tooling only and never ships to users.
- **Monitoring** (`monitoring.yml`):
  - uptime of `/` and `/api/estimate` every 15 minutes;
  - a daily mobile p75 LCP/INP/CLS check from real users.
  - Either one opens a GitHub issue when it fails.

## 7. Checklist before launch

- [ ] Set `SUPABASE_SITE_SECRET` and register its hash. Remove any `SUPABASE_SECRET_KEY` from Vercel.
- [ ] `TURNSTILE_SECRET_KEY` and `NEXT_PUBLIC_TURNSTILE_SITE_KEY` (the build refuses production without them).
- [ ] Restrict the Maps keys as in section 3, and set quotas.
- [ ] `RATE_LIMIT_SALT`: a long random value.
- [ ] `SENTRY_DSN`, plus `vars.PROD_SITE_URL` and the monitoring secrets in GitHub.
- [ ] GitHub secret scanning and push protection on.
- [ ] Run securityheaders.com and the Supabase security advisor; record the results here.
- [ ] Lead retention period from counsel (NFC-19), then schedule `prune_leads`.

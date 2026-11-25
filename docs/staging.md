# Staging

**Staging is the `staging` branch, deployed by Vercel as a Preview deployment** (`VERCEL_ENV=preview`):

- The production-only launch guard (NFC-4 company facts) doesn't block it.
- Production requirements don't apply. For example, Turnstile falls back to Cloudflare's test keys when no keys are set.
- It's **never indexed**: every Preview deployment serves `robots.txt` with `Disallow: /` and an `X-Robots-Tag: noindex, nofollow` header on every response.

## Workflow

```
feature branch → PR → merge to staging → check on staging → merge staging → main (production)
```

Push to `staging` and Vercel deploys it automatically. Every other branch and PR still gets its own throwaway Preview URL.

## One-time Vercel setup (dashboard)

1. **Domain:** Project → Settings → Domains → Add `staging.truckbuck.in` → Git branch: `staging`. Add the DNS record Vercel shows (a CNAME to `cname.vercel-dns.com`).
2. **Protection:** Project → Settings → Deployment Protection → keep **Vercel Authentication** on for Preview, so only your team can open staging. If testers outside the team need access, use a shareable link or password protection.
3. **Environment variables:** Project → Settings → Environment Variables. Choose environment **Preview** and branch **`staging`**.

   | Variable                                                              | Staging value                                                                                                    |
   | --------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
   | `NEXT_PUBLIC_SITE_URL`                                                | `https://staging.truckbuck.in`                                                                                   |
   | `ALLOW_SAMPLE_DATA`                                                   | `true` (sample trucks, rates and cities until real data exists)                                                  |
   | `PREVIEW_UNREVIEWED_LOCALES`                                          | `true` (Hindi and Tamil drafts visible for review)                                                               |
   | `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SITE_SECRET`    | Same project as production for now, or a separate staging project (recommended once real leads flow)             |
   | `NEXT_PUBLIC_TURNSTILE_SITE_KEY`, `TURNSTILE_SECRET_KEY`              | Optional. Unset means Cloudflare test keys. To use the real widget, add `staging.truckbuck.in` to its hostnames. |
   | `NEXT_PUBLIC_GTM_ID`                                                  | Leave unset (keeps staging traffic out of GA4), or use a separate GTM environment                                |
   | `NEXT_PUBLIC_EXPERIMENTS`                                             | Optional, e.g. `hero,cta` to try A/B tests                                                                       |
   | Lead alerts (`WHATSAPP_*`, `RESEND_API_KEY`, `OPS_EMAILS`, `SHEET_*`) | Point at a **test** inbox, number and Sheet. Never at the real ops channels, or test leads will look real.       |

   Never set `SUPABASE_SECRET_KEY` or `SUPABASE_SERVICE_ROLE_KEY`: the build refuses to start.

4. Redeploy the `staging` branch: Deployments → the latest `staging` deployment → Redeploy.

## Notes

- **Shared database:** while staging and production share a Supabase project, leads submitted on staging land in the same `leads` table. With `ALLOW_SAMPLE_DATA=true`, quote leads priced from sample rates are marked `is_test = true`, and the weekly summary excludes them. Other forms aren't marked, so use names like "TEST".
- **Cron:** the weekly-summary cron (`vercel.json`) runs on Production only.

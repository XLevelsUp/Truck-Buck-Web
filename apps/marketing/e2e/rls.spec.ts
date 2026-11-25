import { expect, test } from "@playwright/test";

/*
 * Row-level security, verified the way an attacker would try it: the public
 * (publishable/anon) key against Supabase's REST API. That key is public, so
 * it must read only public content and write nothing without the site secret.
 * SECURITY.md is the matrix this test enforces.
 *
 * Needs SUPABASE_URL and SUPABASE_PUBLISHABLE_KEY (both public values);
 * skipped when they're not set.
 */
const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_PUBLISHABLE_KEY;
const WRONG_SECRET = "not-the-site-secret-0000000000000000000000";

test.describe("Supabase RLS with the public key", () => {
  test.skip(!url || !key, "SUPABASE_URL / SUPABASE_PUBLISHABLE_KEY not set");

  const headers = () => ({ apikey: key ?? "", Authorization: `Bearer ${key ?? ""}` });
  const json = () => ({ ...headers(), "Content-Type": "application/json" });

  for (const table of ["leads", "rate_limits", "distance_cache", "web_vitals"]) {
    test(`cannot read ${table}`, async ({ request }) => {
      const response = await request.get(`${url}/rest/v1/${table}?select=*&limit=1`, {
        headers: headers(),
      });
      // The grant is refused (401/403), or RLS returns an empty set. Never rows.
      if (response.ok()) expect(await response.json()).toEqual([]);
      else expect([401, 403]).toContain(response.status());
    });
  }

  for (const table of ["truck_types", "service_areas", "lanes", "rate_cards", "faqs"]) {
    test(`can read public content: ${table}`, async ({ request }) => {
      const response = await request.get(`${url}/rest/v1/${table}?select=*&limit=1`, {
        headers: headers(),
      });
      expect(response.status()).toBe(200);
    });
  }

  test("only approved, consented testimonials; approver names stay private", async ({
    request,
  }) => {
    const rows = await request.get(
      `${url}/rest/v1/testimonials?select=published,consent_on_file,approved_at`,
      { headers: headers() },
    );
    expect(rows.status()).toBe(200);
    for (const row of (await rows.json()) as {
      published: boolean;
      consent_on_file: boolean;
      approved_at: string | null;
    }[]) {
      expect(row.published && row.consent_on_file && row.approved_at).toBeTruthy();
    }
    const approver = await request.get(`${url}/rest/v1/testimonials?select=approved_by`, {
      headers: headers(),
    });
    expect([401, 403]).toContain(approver.status());
  });

  test("cannot write public content", async ({ request }) => {
    const response = await request.patch(`${url}/rest/v1/rate_cards?id=not.is.null`, {
      headers: { ...json(), Prefer: "return=minimal" },
      data: { base_fare_paise: 1 },
    });
    expect([401, 403]).toContain(response.status());
  });

  test("cannot insert a lead directly", async ({ request }) => {
    const response = await request.post(`${url}/rest/v1/leads`, {
      headers: { ...json(), Prefer: "return=minimal" },
      data: {
        type: "callback",
        name: "RLS probe",
        phone_e164: "+919876543210",
        consent_text_version: "probe",
      },
    });
    expect([401, 403]).toContain(response.status());
  });

  const rpcProbes: [string, Record<string, unknown>][] = [
    [
      "site_submit_lead",
      {
        p_lead: {
          type: "callback",
          name: "RLS probe",
          phone_e164: "+919876543210",
          consent_text_version: "probe",
        },
      },
    ],
    ["site_annotate_lead", { p_id: "00000000-0000-0000-0000-000000000000", p_details: {} }],
    ["site_rate_limit_hit", { p_key: "probe", p_limit: 1, p_window_seconds: 60 }],
    ["site_distance_get", { p_origin: "a", p_destination: "b" }],
    [
      "site_distance_put",
      {
        p_origin: "a",
        p_destination: "b",
        p_distance_m: 1,
        p_duration_s: 1,
        p_provider: "probe",
      },
    ],
    ["site_record_vitals", { p_rows: [] }],
    ["site_vitals_p75", { p_days: 1 }],
  ];
  for (const [fn, args] of rpcProbes) {
    test(`${fn} refuses a wrong site secret`, async ({ request }) => {
      const response = await request.post(`${url}/rest/v1/rpc/${fn}`, {
        headers: json(),
        data: { p_secret: WRONG_SECRET, ...args },
      });
      expect(response.ok()).toBe(false);
      expect(await response.text()).toContain("forbidden");
    });
  }

  for (const fn of ["rate_limit_hit", "prune_marketing_caches", "prune_leads"]) {
    test(`cannot call internal function ${fn}`, async ({ request }) => {
      const response = await request.post(`${url}/rest/v1/rpc/${fn}`, {
        headers: json(),
        data:
          fn === "rate_limit_hit"
            ? { p_key: "probe", p_limit: 1, p_window_seconds: 60 }
            : fn === "prune_leads"
              ? { p_months: 1 }
              : {},
      });
      expect(response.ok()).toBe(false);
    });
  }
});

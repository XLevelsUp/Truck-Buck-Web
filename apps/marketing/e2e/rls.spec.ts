import { expect, test } from "@playwright/test";

/*
 * Row-level security, verified the way an attacker would try it: the public
 * (publishable/anon) key against Supabase's REST API. The site writes leads
 * only from its server with the secret key; nobody else may read or write.
 *
 * Needs SUPABASE_URL and SUPABASE_PUBLISHABLE_KEY (both public values);
 * skipped when they're not set.
 */
const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_PUBLISHABLE_KEY;

test.describe("Supabase RLS with the public key", () => {
  test.skip(!url || !key, "SUPABASE_URL / SUPABASE_PUBLISHABLE_KEY not set");

  const headers = () => ({ apikey: key ?? "", Authorization: `Bearer ${key ?? ""}` });

  for (const table of ["leads", "rate_cards", "site_config", "rate_limits", "distance_cache"]) {
    test(`cannot read ${table}`, async ({ request }) => {
      const response = await request.get(`${url}/rest/v1/${table}?select=*&limit=1`, {
        headers: headers(),
      });
      // RLS returns an empty set (200) or the grant is refused (401/403). Never rows.
      if (response.ok()) expect(await response.json()).toEqual([]);
      else expect([401, 403]).toContain(response.status());
    });
  }

  test("cannot insert a lead", async ({ request }) => {
    const response = await request.post(`${url}/rest/v1/leads`, {
      headers: { ...headers(), "Content-Type": "application/json", Prefer: "return=minimal" },
      data: {
        type: "transporter",
        name: "RLS probe",
        phone_e164: "+919876543210",
        consent_text_version: "probe",
      },
    });
    expect([401, 403]).toContain(response.status());
  });

  test("cannot call the rate-limit function", async ({ request }) => {
    const response = await request.post(`${url}/rest/v1/rpc/rate_limit_hit`, {
      headers: { ...headers(), "Content-Type": "application/json" },
      data: { p_key: "probe", p_limit: 1, p_window_seconds: 60 },
    });
    expect(response.ok()).toBe(false);
  });
});

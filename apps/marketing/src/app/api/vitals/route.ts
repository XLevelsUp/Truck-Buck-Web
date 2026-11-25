import { z } from "zod";

import { allowRequest, clientIp } from "@/server/abuse";
import { siteRpc } from "@/server/supabase";

const PathSchema = z
  .string()
  .max(200)
  .regex(/^\/[\w\-/.]*$/);

const MetricSchema = z.object({
  name: z.enum(["LCP", "INP", "CLS", "FCP", "TTFB"]),
  value: z.number().min(0).max(600_000),
  rating: z.enum(["good", "needs-improvement", "poor"]),
  path: PathSchema,
  connection: z.string().max(20).optional(),
});
const BodySchema = z.array(MetricSchema).min(1).max(10);

/**
 * POST /api/vitals — real-user Core Web Vitals (sendBeacon). Anonymous: the
 * device class comes from the user agent, which is not stored; no IP is kept.
 * Always 204, so a beacon never retries or surfaces errors.
 */
export async function POST(request: Request) {
  const done = new Response(null, { status: 204 });
  const parsed = BodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return done;
  if (!(await allowRequest("vitals", clientIp(request.headers)))) return done;
  const device = /Mobi|Android|iPhone/i.test(request.headers.get("user-agent") ?? "")
    ? "mobile"
    : "desktop";
  await siteRpc("site_record_vitals", {
    p_rows: parsed.data.map((metric) => ({
      ...metric,
      device,
      connection: metric.connection ?? null,
    })),
  });
  return done;
}

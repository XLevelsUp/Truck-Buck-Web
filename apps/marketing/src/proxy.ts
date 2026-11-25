import { type NextRequest, NextResponse } from "next/server";

import { env } from "@/env";
import { isPrefixedLocale, LOCALE_COOKIE, localizedHref } from "@/i18n/locales";
import { isLocalePublished } from "@/i18n/publishing";
import {
  type Assignment,
  CONTROL,
  enabledExperiments,
  encodeAssignment,
  EXPERIMENT_COOKIE,
  experimentPaths,
  experiments,
  parseAssignment,
  serializeAssignment,
} from "@/lib/ab";

/** Crawlers, link previews, monitors and test browsers always get the control. */
const AUTOMATED =
  /bot|crawl|spider|slurp|preview|facebookexternalhit|whatsapp|headless|lighthouse|pagespeed|node|undici|curl|wget|python|java\//i;

const NINETY_DAYS = 60 * 60 * 24 * 90;
const QA_COOKIE = "tb_exp_qa";

/**
 * 1. Language memory: someone who picked Hindi or Tamil in the switcher
 *    (cookie) and lands on an English page that has a translation is sent to
 *    their language. Crawlers and first-time visitors carry no cookie.
 * 2. A/B tests (src/lib/ab.ts): human visitors to "/", "/shippers" and
 *    "/transporters" get a sticky variant cookie and the matching prerendered
 *    variant page (a rewrite — the URL doesn't change).
 */
export function proxy(request: NextRequest) {
  const choice = request.cookies.get(LOCALE_COOKIE)?.value;
  const path = request.nextUrl.pathname as `/${string}`;
  if (choice && isPrefixedLocale(choice) && isLocalePublished(choice)) {
    const url = request.nextUrl.clone();
    url.pathname = localizedHref(choice, path);
    return NextResponse.redirect(url, 307);
  }

  const page = experimentPaths[path];
  if (!page) return NextResponse.next();

  const enabled = enabledExperiments(env.NEXT_PUBLIC_EXPERIMENTS);
  const automated = AUTOMATED.test(request.headers.get("user-agent") ?? "");
  // QA overrides: ?exp=… for this request, remembered for the browser session.
  const qa = {
    ...parseAssignment(request.cookies.get(QA_COOKIE)?.value),
    ...parseAssignment(request.nextUrl.searchParams.get("exp")),
  };
  const hasQa = Object.keys(qa).length > 0;
  const stored = parseAssignment(request.cookies.get(EXPERIMENT_COOKIE)?.value);
  if (!hasQa && (enabled.length === 0 || automated)) return NextResponse.next();

  // Real assignment: only experiments that are on. Stored variants of an
  // experiment that was switched off are ignored (everyone gets its control).
  const assignment: Partial<Assignment> = {};
  let changed = false;
  for (const key of enabled) {
    const variants = experiments[key];
    const kept = stored[key];
    if (kept) {
      (assignment as Record<string, string>)[key] = kept;
    } else if (!automated) {
      (assignment as Record<string, string>)[key] =
        variants[Math.floor(Math.random() * variants.length)]!;
      changed = true;
    }
  }

  // Shippers/transporters only vary the hero.
  const full: Assignment = { ...CONTROL, ...assignment, ...qa };
  const effective = page === "home" ? full : { ...CONTROL, hero: full.hero };
  const url = request.nextUrl.clone();
  url.pathname = `/x/${page}/${encodeAssignment(effective)}`;
  url.searchParams.delete("exp");
  const response = NextResponse.rewrite(url);
  const secure = request.nextUrl.protocol === "https:";
  if (changed) {
    response.cookies.set(EXPERIMENT_COOKIE, serializeAssignment(assignment), {
      maxAge: NINETY_DAYS,
      path: "/",
      sameSite: "lax",
      secure,
    });
  }
  if (request.nextUrl.searchParams.has("exp")) {
    // Session cookie (no maxAge): QA forcing ends when the browser closes.
    response.cookies.set(QA_COOKIE, serializeAssignment(qa), {
      path: "/",
      sameSite: "lax",
      secure,
    });
  }
  return response;
}

export const config = {
  // Translated paths (src/i18n/locales.ts localizedPaths) + A/B test pages.
  matcher: ["/", "/drivers", "/transporters", "/shippers"],
};

import { type NextRequest, NextResponse } from "next/server";

import { isPrefixedLocale, LOCALE_COOKIE, localizedHref } from "@/i18n/locales";
import { isLocalePublished } from "@/i18n/publishing";

/**
 * Remembers the language choice: someone who picked Hindi or Tamil in the
 * switcher (cookie) and lands on an English page that has a translation is
 * sent to their language. Only runs on translated paths (see matcher).
 * Crawlers and first-time visitors carry no cookie, so they always get the
 * English page, and hreflang tells search engines about the others.
 */
export function proxy(request: NextRequest) {
  const choice = request.cookies.get(LOCALE_COOKIE)?.value;
  if (!choice || !isPrefixedLocale(choice) || !isLocalePublished(choice))
    return NextResponse.next();

  const path = request.nextUrl.pathname as `/${string}`;
  const url = request.nextUrl.clone();
  url.pathname = localizedHref(choice, path);
  return NextResponse.redirect(url, 307);
}

export const config = {
  // Keep in sync with localizedPaths in src/i18n/locales.ts.
  matcher: ["/", "/drivers", "/transporters"],
};

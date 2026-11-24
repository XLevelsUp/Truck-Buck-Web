import "../globals.css";

import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";

import { baseMetadata, SiteShell, siteViewport } from "@/components/site-shell";

/** Root layout for English (default-locale, unprefixed) pages. */
export const metadata: Metadata = baseMetadata("en");
export const viewport: Viewport = siteViewport;

export default function EnglishRootLayout({ children }: { children: ReactNode }) {
  return <SiteShell locale="en">{children}</SiteShell>;
}

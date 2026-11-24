import type { Metadata } from "next";

import { getContent } from "@/content";

/** Search results truncate titles beyond ~60 characters. */
export const TITLE_MAX = 60;

/**
 * Per-page metadata: title, description, canonical URL and Open Graph.
 * `path` is resolved against `metadataBase` (NEXT_PUBLIC_SITE_URL) set in the
 * root layout, so canonical and og:url are always absolute.
 */
export function pageMetadata({
  title,
  description,
  path,
}: {
  title?: string;
  description: string;
  path: `/${string}`;
}): Metadata {
  // The layout appends " | TruckBuck"; skip it when that would pass 60 characters.
  const suffix = ` | ${getContent().site.name}`;
  const fitted = title && title.length + suffix.length > TITLE_MAX ? { absolute: title } : title;
  return {
    ...(fitted ? { title: fitted } : {}),
    description,
    alternates: { canonical: path },
    openGraph: {
      ...(title ? { title } : {}),
      description,
      url: path,
    },
  };
}

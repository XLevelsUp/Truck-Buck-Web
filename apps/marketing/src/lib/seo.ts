import type { Metadata } from "next";

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
  return {
    ...(title ? { title } : {}),
    description,
    alternates: { canonical: path },
    openGraph: {
      ...(title ? { title } : {}),
      description,
      url: path,
    },
  };
}

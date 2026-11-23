import type { MetadataRoute } from "next";

import { getContent } from "@/content";
import { brandTheme } from "@/lib/brand";

/** Web app manifest: home-screen name and icons (Android "Add to Home screen"). */
export default function manifest(): MetadataRoute.Manifest {
  const { site } = getContent();
  return {
    name: `${site.name} — ${site.tagline}`,
    short_name: site.name,
    description: site.description,
    start_url: "/",
    display: "minimal-ui",
    theme_color: brandTheme.themeColor,
    background_color: brandTheme.background,
    lang: "en-IN",
    icons: [
      { src: "/brand/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/brand/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      {
        src: "/brand/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}

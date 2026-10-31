import type { MetadataRoute } from "next";

import { env } from "@/env";
import { routes } from "@/lib/routes";

export default function sitemap(): MetadataRoute.Sitemap {
  return Object.values(routes).map((route) => ({
    url: `${env.NEXT_PUBLIC_SITE_URL}${route.path === "/" ? "" : route.path}`,
    lastModified: route.lastModified,
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));
}

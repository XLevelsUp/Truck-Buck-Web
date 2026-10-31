import Link from "next/link";

import { Button } from "@truckbuck/ui/button";

import { getContent } from "@/content";
import { env } from "@/env";
import { routes } from "@/lib/routes";

export function SiteHeader() {
  const content = getContent();
  return (
    <header className="border-b bg-card/80">
      <div className="mx-auto flex h-16 max-w-(--container-content) items-center justify-between px-4 sm:px-6">
        <Link
          href={routes.home.path}
          className="flex items-center gap-2 rounded-sm text-lg font-bold tracking-tight focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
        >
          <span
            aria-hidden="true"
            className="grid size-8 place-items-center rounded-md bg-primary text-sm text-primary-foreground"
          >
            TB
          </span>
          {content.site.name}
        </Link>
        <Button asChild variant="accent" size="sm">
          <a href={env.NEXT_PUBLIC_PLAY_STORE_URL} rel="noopener" target="_blank">
            {content.home.primaryCta}
          </a>
        </Button>
      </div>
    </header>
  );
}

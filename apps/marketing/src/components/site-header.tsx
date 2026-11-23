import Link from "next/link";

import { Button } from "@truckbuck/ui/button";
import { Logo } from "@truckbuck/ui/logo";

import { getContent } from "@/content";
import { env } from "@/env";
import { routes } from "@/lib/routes";

export function SiteHeader() {
  const content = getContent();
  return (
    <header className="border-b bg-surface/80">
      <div className="mx-auto flex h-16 max-w-(--container-content) items-center justify-between px-4 md:px-6">
        <Link
          href={routes.home.path}
          className="-m-1 rounded-md p-1 focus-ring"
          aria-label={content.site.name}
        >
          <Logo title="" className="h-8" />
        </Link>
        <Button asChild variant="cta" size="sm">
          <a href={env.NEXT_PUBLIC_PLAY_STORE_URL} rel="noopener" target="_blank">
            {content.home.primaryCta}
          </a>
        </Button>
      </div>
    </header>
  );
}

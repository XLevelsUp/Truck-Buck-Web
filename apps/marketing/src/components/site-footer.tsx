import Link from "next/link";

import { getContent } from "@/content";
import { routes } from "@/lib/routes";

export function SiteFooter() {
  const content = getContent();
  return (
    <footer className="border-t bg-surface">
      <div className="mx-auto flex max-w-(--container-content) flex-col gap-4 px-4 py-8 text-sm text-muted-foreground md:flex-row md:items-center md:justify-between md:px-6">
        <p>
          © {content.site.name}. {content.footer.rights}
        </p>
        <nav aria-label="Legal">
          <ul className="flex gap-6">
            <li>
              <Link href={routes.privacy.path} className="hover:text-foreground hover:underline">
                {content.nav.privacy}
              </Link>
            </li>
            <li>
              <Link href={routes.terms.path} className="hover:text-foreground hover:underline">
                {content.nav.terms}
              </Link>
            </li>
          </ul>
        </nav>
      </div>
    </footer>
  );
}

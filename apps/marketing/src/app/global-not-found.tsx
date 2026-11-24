import "./globals.css";

import type { Metadata } from "next";
import Link from "next/link";

import { Logo } from "@truckbuck/ui/logo";

import { NotFoundContent } from "@/components/not-found-content";
import { getContent } from "@/content";

import { fontVariables } from "./fonts";

const { notFound, site } = getContent();

export const metadata: Metadata = {
  title: `${notFound.title} | ${site.name}`,
  robots: { index: false },
};

/**
 * 404 for URLs that match no route at all. With two root layouts ((en) and
 * [locale]) there is no single layout to build it from, so it is standalone.
 */
export default function GlobalNotFound() {
  return (
    <html lang="en-IN" className={fontVariables}>
      <body className="flex min-h-dvh flex-col">
        <header className="border-b bg-surface">
          <div className="mx-auto flex h-14 max-w-(--container-content) items-center page-gutter">
            <Link href="/" aria-label={site.name} className="-m-1 rounded-md p-1 focus-ring">
              <Logo title="" className="h-7" />
            </Link>
          </div>
        </header>
        <main id="main" className="flex-1">
          <NotFoundContent />
        </main>
      </body>
    </html>
  );
}

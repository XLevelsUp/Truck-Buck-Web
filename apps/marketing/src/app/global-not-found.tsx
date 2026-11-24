import "./globals.css";

import type { Metadata } from "next";
import Link from "next/link";

import { Button } from "@truckbuck/ui/button";
import { Logo } from "@truckbuck/ui/logo";

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
        <main
          id="main"
          className="mx-auto grid w-full max-w-(--container-prose) flex-1 content-center justify-items-start gap-4 page-gutter py-24"
        >
          <p className="text-sm font-semibold text-link">404</p>
          <h1 className="text-4xl font-bold">{notFound.title}</h1>
          <p className="text-muted-foreground">{notFound.body}</p>
          <Button asChild className="mt-4">
            <Link href="/">{notFound.cta}</Link>
          </Button>
        </main>
      </body>
    </html>
  );
}

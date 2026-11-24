import Link from "next/link";

import { Button } from "@truckbuck/ui/button";

import { getContent } from "@/content";

/** 404 inside a translated section (shown in English: the locale isn't known here). */
export default function NotFound() {
  const { notFound } = getContent();
  return (
    <section className="mx-auto grid max-w-(--container-prose) justify-items-start gap-4 page-gutter py-24">
      <p className="text-sm font-semibold text-link">404</p>
      <h1 className="text-4xl font-bold">{notFound.title}</h1>
      <p className="text-muted-foreground">{notFound.body}</p>
      <Button asChild className="mt-4">
        <Link href="/">{notFound.cta}</Link>
      </Button>
    </section>
  );
}

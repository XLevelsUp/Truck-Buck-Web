import type { Metadata } from "next";
import Link from "next/link";

import { Button } from "@truckbuck/ui/button";

import { getContent } from "@/content";
import { routes } from "@/lib/routes";

const { notFound } = getContent();

export const metadata: Metadata = {
  title: notFound.title,
  robots: { index: false },
};

export default function NotFound() {
  return (
    <section className="mx-auto flex max-w-(--container-prose) flex-col items-start px-4 py-24 sm:px-6">
      <p className="text-sm font-semibold text-primary">404</p>
      <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">{notFound.title}</h1>
      <p className="mt-4 text-muted-foreground">{notFound.body}</p>
      <Button asChild className="mt-8">
        <Link href={routes.home.path}>{notFound.cta}</Link>
      </Button>
    </section>
  );
}

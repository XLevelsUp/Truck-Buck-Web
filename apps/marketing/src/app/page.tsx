import type { Metadata } from "next";

import { Button } from "@truckbuck/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@truckbuck/ui/card";

import { getContent } from "@/content";
import { env } from "@/env";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  description: getContent().site.description,
  path: "/",
});

export default function HomePage() {
  const { home } = getContent();
  return (
    <>
      <section className="mx-auto max-w-(--container-content) px-4 py-20 sm:px-6 sm:py-28">
        <p className="text-sm font-semibold tracking-wide text-primary uppercase">{home.eyebrow}</p>
        <h1 className="mt-4 max-w-3xl text-4xl font-bold tracking-tight sm:text-display">
          {home.title}
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-8 text-muted-foreground">{home.lead}</p>
        <div className="mt-10 flex flex-wrap gap-4">
          <Button asChild size="lg">
            <a href={env.NEXT_PUBLIC_PLAY_STORE_URL} rel="noopener" target="_blank">
              {home.primaryCta}
            </a>
          </Button>
          <Button asChild size="lg" variant="outline">
            <a href="#how-it-works">{home.secondaryCta}</a>
          </Button>
        </div>
      </section>

      <section aria-labelledby="features" className="border-y bg-muted">
        <div className="mx-auto max-w-(--container-content) px-4 py-16 sm:px-6">
          <h2 id="features" className="text-2xl font-bold tracking-tight sm:text-3xl">
            {home.featuresTitle}
          </h2>
          <ul className="mt-8 grid gap-6 md:grid-cols-3">
            {home.features.map((feature) => (
              <li key={feature.title}>
                <Card className="h-full">
                  <CardHeader>
                    <CardTitle>{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="leading-7 text-muted-foreground">{feature.body}</p>
                  </CardContent>
                </Card>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section
        id="how-it-works"
        aria-labelledby="how-it-works-title"
        className="mx-auto max-w-(--container-content) scroll-mt-8 px-4 py-16 sm:px-6"
      >
        <h2 id="how-it-works-title" className="text-2xl font-bold tracking-tight sm:text-3xl">
          {home.stepsTitle}
        </h2>
        <ol className="mt-8 grid gap-4 md:grid-cols-3">
          {home.steps.map((step, index) => (
            <li key={step} className="flex gap-4 rounded-lg border bg-card p-5">
              <span
                aria-hidden="true"
                className="grid size-8 shrink-0 place-items-center rounded-full bg-primary text-sm font-semibold text-primary-foreground"
              >
                {index + 1}
              </span>
              <p className="leading-7">{step}</p>
            </li>
          ))}
        </ol>
      </section>
    </>
  );
}

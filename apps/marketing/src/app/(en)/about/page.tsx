/* eslint-disable @next/next/no-img-element -- team photos are optional, consented uploads at a fixed square size. */
import type { Metadata } from "next";
import Link from "next/link";

import { Button } from "@truckbuck/ui/button";

import { LiveCounters } from "@/components/live-counters";
import { MissingFact, type NfcRef } from "@/components/missing-fact";
import { FinalCta, PageHero } from "@/components/page/page-blocks";
import { Section, SectionHeading } from "@/components/page/section";
import { getContent } from "@/content";
import { company } from "@/content/company";
import { fill } from "@/lib/format";
import { routes } from "@/lib/routes";
import { pageMetadata } from "@/lib/seo";

const content = getContent();
const a = content.about;

export const metadata: Metadata = pageMetadata({
  title: a.meta.title,
  description: a.meta.description,
  path: routes.about.path,
});

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

/** One company fact: the value, a marker in development, or nothing in production. */
function FactRow({
  label,
  value,
  missing,
}: {
  label: string;
  value: string | null;
  missing: NfcRef;
}) {
  if (!value && process.env.NODE_ENV === "production") return null;
  return (
    <div className="grid gap-0.5 md:grid-cols-[14rem_1fr] md:gap-6">
      <dt className="font-semibold">{label}</dt>
      <dd className="text-muted-foreground">{value ?? <MissingFact what={missing} />}</dd>
    </div>
  );
}

/**
 * /about — mission from the brief's positioning; story, team, region,
 * registrations and company identity only from company.ts (NFC-4, NFC-18,
 * NFC-23). Nothing is filled in by us.
 */
export default function AboutPage() {
  const dev = process.env.NODE_ENV !== "production";
  const f = a.facts;
  return (
    <>
      <PageHero eyebrow={a.hero.eyebrow} title={a.hero.title} lead={a.hero.lead} />

      <Section labelledBy="mission-title">
        <div className="grid gap-10 md:grid-cols-2">
          <div className="grid content-start gap-3">
            <h2 id="mission-title" className="text-3xl font-extrabold">
              {a.missionTitle}
            </h2>
            <p className="text-2xl font-semibold text-balance">{a.mission}</p>
          </div>
          {company.story || dev ? (
            <div className="grid content-start gap-3">
              <h2 className="text-3xl font-extrabold">{a.storyTitle}</h2>
              {company.story ? (
                company.story.split(/\n{2,}/).map((paragraph) => (
                  <p key={paragraph} className="text-lg">
                    {paragraph}
                  </p>
                ))
              ) : (
                <MissingFact what="why TruckBuck was started, in the founders' words (NFC-18)" />
              )}
              {company.homeRegion ? (
                <p className="font-semibold">
                  {fill(a.homeRegion, { region: company.homeRegion })}
                </p>
              ) : (
                <MissingFact what="home city, only if true (NFC-18)" />
              )}
            </div>
          ) : null}
        </div>
      </Section>

      {company.team.length > 0 || dev ? (
        <Section labelledBy="team-title" tone="muted">
          <SectionHeading id="team-title" title={a.teamTitle} />
          {company.team.length > 0 ? (
            <ul className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {company.team.map((person) => (
                <li
                  key={person.name}
                  className="grid justify-items-start gap-3 rounded-xl border bg-surface p-5"
                >
                  {person.photoUrl ? (
                    <img
                      src={person.photoUrl}
                      alt={person.photoAlt ?? person.name}
                      width={96}
                      height={96}
                      className="size-24 rounded-full object-cover"
                    />
                  ) : (
                    <span
                      aria-hidden="true"
                      className="grid size-24 place-items-center rounded-full bg-primary text-2xl font-bold text-primary-foreground"
                    >
                      {initials(person.name)}
                    </span>
                  )}
                  <span className="grid">
                    <span className="text-lg font-bold">{person.name}</span>
                    <span className="text-muted-foreground">{person.role}</span>
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <MissingFact what="team names, roles and consented photos (NFC-18)" />
          )}
        </Section>
      ) : null}

      <Section labelledBy="company-title">
        <LiveCounters />
        <SectionHeading id="company-title" title={a.companyTitle} />
        <dl className="grid gap-4">
          <FactRow
            label={f.legalName}
            value={company.legalName}
            missing="registered legal name (NFC-4)"
          />
          <FactRow
            label={f.address}
            value={company.registeredAddress}
            missing="registered office (NFC-4)"
          />
          <FactRow label={f.cin} value={company.cin} missing="CIN (NFC-4)" />
          <FactRow label={f.gstin} value={company.gstin} missing="GSTIN (NFC-4)" />
          <FactRow
            label={f.founded}
            value={company.foundedYear === null ? null : String(company.foundedYear)}
            missing="year founded (NFC-4)"
          />
          <FactRow
            label={f.msme}
            value={company.registrations.msmeUdyam}
            missing="Udyam number, if registered (NFC-23)"
          />
          <FactRow
            label={f.startup}
            value={company.registrations.dpiitStartup}
            missing="DPIIT recognition number, if any (NFC-23)"
          />
        </dl>
      </Section>

      <FinalCta
        title={a.cta.title}
        body={a.cta.body}
        actions={
          <>
            <Button asChild variant="cta" size="lg">
              <Link href={routes.contact.path}>{content.nav.contact}</Link>
            </Button>
            <Button asChild variant="secondary" size="lg">
              <Link href={routes.transporters.path}>{content.transporters.hero.cta}</Link>
            </Button>
          </>
        }
      />
    </>
  );
}

"use client";

import { type FormEvent, useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

import {
  type AdvisorResult,
  type AdvisorTruck,
  type Material,
  recommendTruck,
} from "@truckbuck/pricing";
import { Button } from "@truckbuck/ui/button";
import { Field } from "@truckbuck/ui/field";
import { Input } from "@truckbuck/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@truckbuck/ui/select";

import type { Content } from "@/content";
import { fill, trimNumber } from "@/lib/format";

export type AdvisorCatalogTruck = AdvisorTruck & { name: string };

/** "Which truck do I need?" — weight + volume/material → a recommended truck class. */
export function TruckAdvisor({
  labels,
  trucks,
  optionalLabel,
}: {
  labels: Content["trucksPage"]["helper"];
  trucks: AdvisorCatalogTruck[];
  optionalLabel: string;
}) {
  const [material, setMaterial] = useState<Material>("general");
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<(AdvisorResult & { name?: string }) | null>(null);

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const weight = Number(data.get("weight"));
    const volume = Number(data.get("volume"));
    if (!(weight >= 0.1 && weight <= 60)) {
      setError(labels.weightError);
      setResult(null);
      return;
    }
    setError(null);
    const outcome = recommendTruck(
      { weightTonnes: weight, material, ...(volume > 0 ? { volumeCft: volume } : {}) },
      trucks,
    );
    setResult(
      outcome.kind === "match"
        ? {
            ...outcome,
            name: trucks.find((t) => t.slug === outcome.truck.slug)?.name ?? outcome.truck.slug,
          }
        : outcome,
    );
  }

  return (
    <div className="grid gap-6">
      <form onSubmit={onSubmit} noValidate className="grid gap-4 md:grid-cols-3 md:items-end">
        <Field label={labels.weight} error={error ?? undefined}>
          {(control) => (
            <Input
              {...control}
              name="weight"
              type="number"
              inputMode="decimal"
              min={0.1}
              max={60}
              step={0.1}
            />
          )}
        </Field>
        <Field
          label={labels.volume}
          hint={labels.volumeHint}
          optional
          optionalLabel={optionalLabel}
        >
          {(control) => (
            <Input {...control} name="volume" type="number" inputMode="numeric" min={1} step={1} />
          )}
        </Field>
        <Field label={labels.material}>
          {(control) => (
            <Select value={material} onValueChange={(value) => setMaterial(value as Material)}>
              <SelectTrigger {...control}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {labels.materials.map((m) => (
                  <SelectItem key={m.value} value={m.value}>
                    {m.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </Field>
        <div className="md:col-span-3">
          <Button type="submit" variant="primary" size="lg">
            {labels.submit}
          </Button>
        </div>
      </form>

      <div aria-live="polite">
        {result?.kind === "match" ? (
          <div className="grid gap-3 rounded-xl border border-primary bg-primary-soft p-5 text-primary-soft-foreground">
            <p className="text-xl font-bold">{fill(labels.result, { name: result.name ?? "" })}</p>
            <p>
              {fill(labels.why, {
                payload: trimNumber(result.truck.payloadTonnes),
                length: trimNumber(result.truck.lengthFt),
              })}
            </p>
            <div className="flex flex-wrap gap-3">
              <Button asChild variant="cta">
                <Link href={`/?truck=${result.truck.slug}#get-price`}>{labels.useIt}</Link>
              </Button>
              <Button asChild variant="link">
                <Link href={`/trucks/${result.truck.slug}`}>
                  {result.name} <ArrowRight aria-hidden="true" />
                </Link>
              </Button>
            </div>
          </div>
        ) : null}
        {result?.kind === "too_heavy" ? (
          <p className="rounded-xl bg-warning-soft p-5 font-medium text-warning-soft-foreground">
            {labels.tooHeavy}
          </p>
        ) : null}
        {result?.kind === "none" ? (
          <p className="rounded-xl bg-warning-soft p-5 font-medium text-warning-soft-foreground">
            {labels.none}
          </p>
        ) : null}
      </div>
    </div>
  );
}

import { getContent } from "@/content";
import { fill, trimNumber } from "@/lib/format";
import type { TruckType } from "@/server/catalog-types";

/** Spec rows for a truck, from catalogue data only (never typed into copy). */
export function truckSpecs(truck: TruckType, detailed = false): { label: string; value: string }[] {
  const content = getContent();
  const t = content.home.trucks;
  const p = content.trucksPage;
  const bodyType =
    content.trucks.bodyTypes[truck.bodyType as keyof typeof content.trucks.bodyTypes] ??
    truck.bodyType;
  const feet = (value: number) => fill(t.feet, { value: trimNumber(value) });
  return [
    { label: p.spec.payload, value: fill(t.tonnes, { value: trimNumber(truck.payloadTonnes) }) },
    { label: p.spec.length, value: feet(truck.lengthFt) },
    ...(detailed && truck.widthFt !== null
      ? [{ label: p.spec.width, value: feet(truck.widthFt) }]
      : []),
    ...(detailed && truck.heightFt !== null
      ? [{ label: p.spec.height, value: feet(truck.heightFt) }]
      : []),
    ...(detailed ? [{ label: p.spec.bodyType, value: bodyType }] : []),
    ...(detailed && truck.pallets !== null
      ? [{ label: p.spec.pallets, value: fill(p.palletsValue, { count: truck.pallets }) }]
      : []),
  ];
}

/** Advisor input shape for the client helper. */
export function advisorTrucks(trucks: TruckType[]) {
  return trucks.map((t) => ({
    slug: t.slug,
    name: t.name,
    bodyType: t.bodyType,
    payloadTonnes: t.payloadTonnes,
    lengthFt: t.lengthFt,
    widthFt: t.widthFt,
    heightFt: t.heightFt,
    pallets: t.pallets,
  }));
}

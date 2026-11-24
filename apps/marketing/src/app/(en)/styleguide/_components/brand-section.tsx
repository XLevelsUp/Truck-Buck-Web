/* eslint-disable @next/next/no-img-element -- previews of the generated asset routes at their exact pixel sizes; next/image would re-encode them. */
import {
  Bell,
  CalendarDays,
  FileCheck2,
  IndianRupee,
  MapPin,
  MessageCircle,
  Phone,
  ShieldCheck,
  Truck,
} from "lucide-react";

import { Logo } from "@truckbuck/ui/logo";
import { truckClassIcons } from "@truckbuck/ui/truck-icons";
import { TruckIllustration, truckIllustrationKinds } from "@truckbuck/ui/truck-illustration";

import { Code, Demo, Section } from "./layout";

const lucideSample = [
  { name: "Truck", Icon: Truck },
  { name: "MapPin", Icon: MapPin },
  { name: "IndianRupee", Icon: IndianRupee },
  { name: "Phone", Icon: Phone },
  { name: "MessageCircle", Icon: MessageCircle },
  { name: "ShieldCheck", Icon: ShieldCheck },
  { name: "FileCheck2", Icon: FileCheck2 },
  { name: "CalendarDays", Icon: CalendarDays },
  { name: "Bell", Icon: Bell },
] as const;

const assets = [
  "truckbuck-horizontal.svg",
  "truckbuck-horizontal-reversed.svg",
  "truckbuck-stacked.svg",
  "truckbuck-stacked-reversed.svg",
  "truckbuck-mark.svg",
  "favicon.svg",
  "icon-32.png",
  "apple-touch-icon.png",
  "icon-192.png",
  "icon-512.png",
  "icon-maskable-512.png",
] as const;

export function BrandSection() {
  return (
    <Section
      id="brand"
      title="Logo and icons"
      description="The logo and every icon are drawn from code (packages/ui/src/brand and truck-icons.tsx) so the favicons, social images and downloads can't drift from the source."
    >
      <Demo
        title="Lockups"
        note="Clear space around the logo: at least the height of the lane dashes × 2. Minimum size: mark 16px, horizontal 96px wide."
      >
        <div className="grid gap-6 md:grid-cols-2">
          <div className="grid place-items-center gap-6 rounded-lg border bg-background p-8">
            <Logo className="h-10" title="TruckBuck — horizontal" />
            <Logo variant="stacked" className="h-24" title="TruckBuck — stacked" />
            <Logo variant="mark" className="h-14" title="TruckBuck — mark" />
          </div>
          <div
            data-theme="dark"
            className="grid place-items-center gap-6 rounded-lg border bg-background p-8"
          >
            <Logo className="h-10" title="TruckBuck — horizontal, reversed" />
            <Logo variant="stacked" className="h-24" title="TruckBuck — stacked, reversed" />
            <Logo variant="mark" className="h-14" title="TruckBuck — mark on dark" />
          </div>
        </div>
      </Demo>

      <Demo
        title="Generated assets"
        note="Served from /brand/… at build time. Link these for partners and press."
      >
        <ul className="grid grid-cols-2 gap-4 md:grid-cols-4 xl:grid-cols-6">
          {assets.map((file) => (
            <li key={file} className="grid gap-2 text-xs">
              <a
                href={`/brand/${file}`}
                className="grid h-24 place-items-center rounded-lg border bg-surface-muted p-3 focus-ring"
              >
                <img src={`/brand/${file}`} alt={file} className="max-h-full max-w-full" />
              </a>
              <span className="font-mono break-all">{file}</span>
            </li>
          ))}
        </ul>
      </Demo>

      <Demo
        title="Truck classes"
        note="Custom set on lucide's grid: 24px, 2px stroke, round caps. Shown next to lucide's own truck for comparison."
      >
        <ul className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-5">
          <li className="grid justify-items-center gap-2 rounded-lg bg-surface-muted p-4 text-center text-sm">
            <Truck aria-hidden="true" className="size-12" />
            <span>lucide Truck</span>
          </li>
          {truckClassIcons.map(({ key, label, Icon }) => (
            <li
              key={key}
              className="grid justify-items-center gap-2 rounded-lg border p-4 text-center text-sm"
            >
              <Icon size={48} />
              <span className="font-semibold">{label}</span>
              <span className="flex items-center gap-2">
                <Icon size={24} />
                <Icon size={16} />
              </span>
            </li>
          ))}
        </ul>
      </Demo>

      <Demo
        title="Truck illustrations"
        note="One oblique 3/4 projection for every class (truck-illustration.tsx), filled from the illo-* tokens. Used wherever a truck has no photo yet (NFC-8). Brief for a commissioned set: docs/illustration-brief.md."
      >
        <ul className="sm:grid-cols-2 grid grid-cols-1 gap-4 lg:grid-cols-4">
          {truckIllustrationKinds.map((kind) => (
            <li
              key={kind}
              className="grid gap-2 rounded-lg bg-primary-soft p-2 text-center text-sm"
            >
              <TruckIllustration kind={kind} className="aspect-[4/3] w-full" />
              <Code>{kind}</Code>
            </li>
          ))}
        </ul>
      </Demo>

      <Demo
        title="Interface icons (lucide)"
        note="Use lucide for everything else. Decorative icons get aria-hidden; icon-only buttons need an aria-label."
      >
        <ul className="grid grid-cols-3 gap-4 md:grid-cols-5 xl:grid-cols-9">
          {lucideSample.map(({ name, Icon }) => (
            <li key={name} className="grid justify-items-center gap-2 text-xs">
              <Icon aria-hidden="true" className="size-6" />
              <Code>{name}</Code>
            </li>
          ))}
        </ul>
      </Demo>
    </Section>
  );
}

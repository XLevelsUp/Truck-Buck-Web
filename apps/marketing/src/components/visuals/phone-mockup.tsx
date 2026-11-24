import { CheckCircle2, FileCheck2, MapPin, ShieldCheck } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@truckbuck/ui/lib/utils";
import { LcvIcon } from "@truckbuck/ui/truck-icons";
import { TruckIllustration } from "@truckbuck/ui/truck-illustration";

import type { Content } from "@/content";

import { loopPhase } from "./loop";

type Screens = Content["home"]["how"]["screens"];

function Bar({ className }: { className: string }) {
  return <span aria-hidden="true" className={cn("block rounded-full bg-border", className)} />;
}

function Screen({ index, children }: { index: number; children: ReactNode }) {
  return (
    <div
      className={cn(
        "absolute inset-0 grid content-start gap-3 p-4 motion-safe:animate-[tb-phone-screen_10s_linear_infinite]",
        // Reduced motion: one still screen (the fare), nothing moves.
        index !== 1 && "motion-reduce:hidden",
        index !== 0 && "motion-safe:opacity-0",
      )}
      style={loopPhase(index)}
    >
      {children}
    </div>
  );
}

/**
 * The booking flow on a phone: route → fare → truck assigned → tracking to
 * delivery, cycling on the shared 10s loop. CSS only (no JS, no Lottie), a
 * few KB. Decorative: the page's own text carries the content, so it is
 * aria-hidden. Wrap it in <LoopFrame> for the pause button.
 */
export function PhoneMockup({ screens, className }: { screens: Screens; className?: string }) {
  return (
    <div
      aria-hidden="true"
      data-testid="phone-mockup"
      className={cn(
        "relative h-[26rem] w-56 shrink-0 rounded-[2.5rem] border-8 border-foreground bg-surface shadow-xl",
        className,
      )}
    >
      <span className="absolute top-2 left-1/2 h-1.5 w-14 -translate-x-1/2 rounded-full bg-foreground" />
      <div className="absolute inset-0 top-6 overflow-hidden rounded-b-[2rem]">
        <Screen index={0}>
          <p className="font-bold">{screens.route.title}</p>
          <span className="flex items-center gap-2 rounded-lg border p-2 text-sm">
            <MapPin className="size-4 shrink-0 text-primary" /> {screens.route.from}
          </span>
          <span className="flex items-center gap-2 rounded-lg border p-2 text-sm">
            <MapPin className="size-4 shrink-0 text-accent-border" /> {screens.route.to}
          </span>
          <span className="flex items-center gap-2 rounded-lg border border-primary bg-primary-soft p-2 text-sm text-primary-soft-foreground">
            <LcvIcon size={20} className="shrink-0" /> {screens.route.truck}
          </span>
          <span className="mt-2 grid place-items-center rounded-lg bg-accent py-3">
            <Bar className="h-2 w-16 bg-accent-foreground/70" />
          </span>
        </Screen>
        <Screen index={1}>
          <p className="font-bold">{screens.fare.title}</p>
          <span className="grid gap-2 rounded-xl bg-surface-muted p-3">
            <Bar className="h-6 w-40 bg-foreground/80" />
            <Bar className="h-2 w-24" />
          </span>
          <span className="text-sm text-muted-foreground">{screens.fare.note}</span>
          <Bar className="h-2 w-full" />
          <Bar className="h-2 w-5/6" />
          <span className="mt-2 grid place-items-center rounded-lg bg-accent py-2 text-accent-foreground">
            <CheckCircle2 className="size-4" />
          </span>
        </Screen>
        <Screen index={2}>
          <p className="font-bold">{screens.assigned.title}</p>
          <span className="block rounded-xl bg-primary-soft">
            <TruckIllustration kind="lcv" className="w-full" />
          </span>
          <span className="flex items-center gap-2 text-sm font-semibold">
            <ShieldCheck className="size-4 shrink-0 text-success" /> {screens.assigned.note}
          </span>
          <Bar className="h-2 w-3/4" />
        </Screen>
        <Screen index={3}>
          <p className="font-bold">{screens.track.title}</p>
          {/* Route line with the truck driving to the drop pin. */}
          <span className="relative block h-10">
            <span className="absolute top-1/2 right-3 left-3 border-t-2 border-dashed border-primary" />
            <MapPin className="absolute top-1/2 left-0 size-4 -translate-y-1/2 text-primary" />
            <MapPin className="absolute top-1/2 right-0 size-4 -translate-y-1/2 text-accent-border" />
            <span
              className="absolute inset-y-0 left-2 w-[calc(100%-3rem)] motion-safe:animate-[tb-phone-truck_10s_linear_infinite]"
              style={loopPhase(3)}
            >
              <span className="shadow absolute top-1/2 left-0 grid size-7 -translate-y-1/2 place-items-center rounded-full bg-primary text-primary-foreground">
                <LcvIcon size={16} />
              </span>
            </span>
          </span>
          <span className="flex items-center gap-2 rounded-lg bg-success-soft p-2 text-sm font-semibold text-success-soft-foreground">
            <CheckCircle2 className="size-4 shrink-0" /> {screens.track.title}
          </span>
          <span className="flex items-center gap-2 text-sm">
            <FileCheck2 className="size-4 shrink-0 text-primary" /> {screens.track.note}
          </span>
        </Screen>
      </div>
    </div>
  );
}

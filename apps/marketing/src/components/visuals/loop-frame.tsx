"use client";

import { type ReactNode, useState } from "react";
import { Pause, Play } from "lucide-react";

import { cn } from "@truckbuck/ui/lib/utils";

/**
 * Wraps looping decoration with a pause/play button (WCAG 2.2.2: motion that
 * runs over 5 seconds must be pausable). Pausing freezes every animation
 * inside via `data-loop-paused`. Under prefers-reduced-motion nothing moves,
 * so the button is hidden.
 */
export function LoopFrame({
  labels,
  children,
  className,
  buttonClassName,
}: {
  labels: { pause: string; play: string };
  children: ReactNode;
  className?: string;
  buttonClassName?: string;
}) {
  const [paused, setPaused] = useState(false);
  return (
    <div data-loop-paused={paused || undefined} className={cn("relative", className)}>
      {children}
      <button
        type="button"
        onClick={() => setPaused((value) => !value)}
        className={cn(
          "inline-flex min-h-9 items-center gap-1.5 rounded-full border bg-surface px-3 text-sm font-semibold focus-ring hover:bg-surface-muted motion-reduce:hidden",
          buttonClassName,
        )}
      >
        {paused ? (
          <Play aria-hidden="true" className="size-4" />
        ) : (
          <Pause aria-hidden="true" className="size-4" />
        )}
        {paused ? labels.play : labels.pause}
      </button>
    </div>
  );
}

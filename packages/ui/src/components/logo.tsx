import type { ComponentProps } from "react";

import {
  MARK_RADIUS,
  MARK_SIZE,
  markLane,
  markMonogram,
  WORDMARK_STROKE,
  WORDMARK_WIDTH,
  wordmarkGlyphs,
} from "../brand/logo-geometry";
import { cn } from "../lib/utils";

export interface LogoProps extends Omit<ComponentProps<"svg">, "children"> {
  /** horizontal: header/footer · stacked: splash, square spaces · mark: favicon, avatars, tight spaces */
  variant?: "horizontal" | "stacked" | "mark";
  /** Accessible name. Pass "" when a visible text label sits next to the logo. */
  title?: string;
}

function Mark({ transform }: { transform?: string }) {
  return (
    <g transform={transform}>
      <rect width={MARK_SIZE} height={MARK_SIZE} rx={MARK_RADIUS} className="fill-logo-tile" />
      <path
        d={markMonogram.paths.join("")}
        fill="none"
        strokeWidth={markMonogram.strokeWidth}
        className="stroke-logo-monogram"
      />
      <path
        d={markLane.path}
        fill="none"
        strokeWidth={markLane.strokeWidth}
        className="stroke-logo-lane"
      />
    </g>
  );
}

function Wordmark({ transform }: { transform: string }) {
  return (
    <g
      transform={transform}
      fill="none"
      strokeWidth={WORDMARK_STROKE}
      className="stroke-logo-wordmark"
    >
      {wordmarkGlyphs.map((glyph, index) => (
        <path key={index} transform={`translate(${glyph.x} 0)`} d={glyph.d} />
      ))}
    </g>
  );
}

const layouts = {
  mark: { viewBox: `0 0 ${MARK_SIZE} ${MARK_SIZE}`, ratio: 1 },
  horizontal: { viewBox: `0 0 ${40 + 12 + WORDMARK_WIDTH} 40`, ratio: (52 + WORDMARK_WIDTH) / 40 },
  stacked: { viewBox: `0 0 ${WORDMARK_WIDTH} 104`, ratio: WORDMARK_WIDTH / 104 },
} as const;

/**
 * The TruckBuck logo as inline SVG — themed by tokens (the wordmark inverts
 * in dark mode; the tile keeps its brand colours). Size it with a height
 * class (`h-8`); width follows the aspect ratio.
 */
export function Logo({
  variant = "horizontal",
  title = "TruckBuck",
  className,
  ...props
}: LogoProps) {
  const layout = layouts[variant];
  const labelled = title !== "";
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox={layout.viewBox}
      role={labelled ? "img" : undefined}
      aria-label={labelled ? title : undefined}
      aria-hidden={labelled ? undefined : true}
      data-slot="logo"
      className={cn("h-8 w-auto shrink-0", className)}
      style={{ aspectRatio: layout.ratio }}
      {...props}
    >
      {variant === "mark" ? <Mark /> : null}
      {variant === "horizontal" ? (
        <>
          <Mark transform="scale(0.625)" />
          <Wordmark transform="translate(52 -8)" />
        </>
      ) : null}
      {variant === "stacked" ? (
        <>
          <Mark transform={`translate(${(WORDMARK_WIDTH - MARK_SIZE) / 2} 0)`} />
          <Wordmark transform="translate(0 62)" />
        </>
      ) : null}
    </svg>
  );
}

import type { SVGProps } from "react";

/**
 * Flat 3/4-view truck illustrations, one per truck class, drawn from a single
 * oblique projection so every class shares the same angle, light and line
 * weight. Pure SVG: no image request, transparent background, crisp at any
 * size and well under 5 KB each.
 *
 * Colours come from the `illo-*` tokens. Pass `colors` (e.g. resolved token
 * values) where CSS variables aren't available, such as next/og images.
 *
 * These stand in until real photographs arrive (NFC-8); see
 * docs/illustration-brief.md for the commissioned set.
 */

export const truckIllustrationKinds = [
  "mini",
  "pickup",
  "lcv",
  "mcv",
  "container",
  "open",
  "trailer",
  "reefer",
] as const;
export type TruckIllustrationKind = (typeof truckIllustrationKinds)[number];

export type IlloRole =
  | "illo-cab"
  | "illo-cab-shade"
  | "illo-cab-top"
  | "illo-body"
  | "illo-body-shade"
  | "illo-body-top"
  | "illo-cargo"
  | "illo-cargo-shade"
  | "illo-chassis"
  | "illo-glass"
  | "illo-tyre"
  | "illo-hub"
  | "illo-plate"
  | "illo-cold"
  | "illo-shadow";

type BodyKind = "deck" | "box" | "container" | "highside" | "flatbed";

/** Dimensions in metres; x runs rear → front, y up, z near side → far side. */
interface TruckSpec {
  width: number;
  cab: { length: number; height: number; floor: number };
  body: { kind: BodyKind; length: number; height: number; floor: number; gap: number };
  wheel: number;
  /** Axle positions from the rear, in metres. */
  axles: readonly number[];
  reefer?: boolean;
}

const specs: Record<TruckIllustrationKind, TruckSpec> = {
  mini: {
    width: 1.5,
    cab: { length: 1.2, height: 1.85, floor: 0.55 },
    body: { kind: "deck", length: 2.2, height: 0.35, floor: 0.75, gap: 0.05 },
    wheel: 0.3,
    axles: [0.5, 3.0],
  },
  pickup: {
    width: 1.7,
    cab: { length: 1.7, height: 1.85, floor: 0.6 },
    body: { kind: "deck", length: 2.5, height: 0.45, floor: 0.8, gap: 0.05 },
    wheel: 0.36,
    axles: [0.7, 3.4],
  },
  lcv: {
    width: 2.1,
    cab: { length: 1.7, height: 2.35, floor: 0.8 },
    body: { kind: "box", length: 4.3, height: 2.0, floor: 1.0, gap: 0.1 },
    wheel: 0.42,
    axles: [1.1, 4.9],
  },
  mcv: {
    width: 2.4,
    cab: { length: 1.9, height: 2.7, floor: 0.95 },
    body: { kind: "box", length: 6.1, height: 2.3, floor: 1.15, gap: 0.12 },
    wheel: 0.5,
    axles: [1.3, 2.4, 6.9],
  },
  container: {
    width: 2.5,
    cab: { length: 2.0, height: 2.9, floor: 1.0 },
    body: { kind: "container", length: 9.7, height: 2.6, floor: 1.25, gap: 0.15 },
    wheel: 0.52,
    axles: [1.4, 2.5, 8.6, 10.9],
  },
  open: {
    width: 2.45,
    cab: { length: 1.95, height: 2.75, floor: 0.95 },
    body: { kind: "highside", length: 6.7, height: 1.4, floor: 1.15, gap: 0.12 },
    wheel: 0.5,
    axles: [1.3, 2.4, 7.6],
  },
  trailer: {
    width: 2.5,
    cab: { length: 2.1, height: 3.0, floor: 1.05 },
    body: { kind: "flatbed", length: 11.6, height: 0.28, floor: 1.35, gap: 0.4 },
    wheel: 0.52,
    axles: [1.0, 2.1, 3.2, 10.9, 13.3],
  },
  reefer: {
    width: 2.4,
    cab: { length: 1.9, height: 2.7, floor: 0.95 },
    body: { kind: "box", length: 6.1, height: 2.4, floor: 1.15, gap: 0.12 },
    wheel: 0.5,
    axles: [1.3, 2.4, 6.9],
    reefer: true,
  },
};

/** Catalogue icon_key → illustration. Unknown keys fall back to the LCV. */
export function illustrationKindFor(iconKey: string): TruckIllustrationKind {
  return (truckIllustrationKinds as readonly string[]).includes(iconKey)
    ? (iconKey as TruckIllustrationKind)
    : "lcv";
}

const VIEW_W = 400;
const VIEW_H = 300;
/** Oblique depth vector per metre of width: up and to the right. */
const DX = 0.42;
const DY = 0.26;
const MAX_SCALE = 52;

type Point = readonly [number, number];
type Paint = (role: IlloRole) => { className?: string; fill?: string };
type Stroke = (role: IlloRole) => { className?: string; stroke?: string };

interface Frame {
  s: number;
  ox: number;
  oy: number;
}

function project(f: Frame, x: number, y: number, z: number): Point {
  return [f.ox + (x + z * DX) * f.s, f.oy - (y + z * DY) * f.s];
}

const pts = (points: readonly Point[]) =>
  points.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" ");

interface BoxColours {
  side: IlloRole;
  front: IlloRole;
  top: IlloRole;
}

interface BoxArgs {
  f: Frame;
  paint: Paint;
  x0: number;
  x1: number;
  y0: number;
  y1: number;
  z0: number;
  z1: number;
  colours: BoxColours;
  id: string;
}

/** Side, front and roof of a box. A plain function (not a component) so Satori can serialise it. */
function box({ f, paint, x0, x1, y0, y1, z0, z1, colours, id }: BoxArgs) {
  const p = (x: number, y: number, z: number) => project(f, x, y, z);
  return [
    <polygon
      key={`${id}-side`}
      points={pts([p(x0, y0, z0), p(x1, y0, z0), p(x1, y1, z0), p(x0, y1, z0)])}
      {...paint(colours.side)}
    />,
    <polygon
      key={`${id}-front`}
      points={pts([p(x1, y0, z0), p(x1, y0, z1), p(x1, y1, z1), p(x1, y1, z0)])}
      {...paint(colours.front)}
    />,
    <polygon
      key={`${id}-top`}
      points={pts([p(x0, y1, z0), p(x1, y1, z0), p(x1, y1, z1), p(x0, y1, z1)])}
      {...paint(colours.top)}
    />,
  ];
}

const cabColours: BoxColours = { side: "illo-cab", front: "illo-cab-shade", top: "illo-cab-top" };
const bodyColours: BoxColours = {
  side: "illo-body",
  front: "illo-body-shade",
  top: "illo-body-top",
};
const chassisColours: BoxColours = {
  side: "illo-chassis",
  front: "illo-tyre",
  top: "illo-chassis",
};

// Literal class names so Tailwind generates them.
const fillClass: Record<IlloRole, string> = {
  "illo-cab": "fill-illo-cab",
  "illo-cab-shade": "fill-illo-cab-shade",
  "illo-cab-top": "fill-illo-cab-top",
  "illo-body": "fill-illo-body",
  "illo-body-shade": "fill-illo-body-shade",
  "illo-body-top": "fill-illo-body-top",
  "illo-cargo": "fill-illo-cargo",
  "illo-cargo-shade": "fill-illo-cargo-shade",
  "illo-chassis": "fill-illo-chassis",
  "illo-glass": "fill-illo-glass",
  "illo-tyre": "fill-illo-tyre",
  "illo-hub": "fill-illo-hub",
  "illo-plate": "fill-illo-plate",
  "illo-cold": "fill-illo-cold",
  "illo-shadow": "fill-illo-shadow",
};
const strokeClass: Record<IlloRole, string> = {
  "illo-cab": "stroke-illo-cab",
  "illo-cab-shade": "stroke-illo-cab-shade",
  "illo-cab-top": "stroke-illo-cab-top",
  "illo-body": "stroke-illo-body",
  "illo-body-shade": "stroke-illo-body-shade",
  "illo-body-top": "stroke-illo-body-top",
  "illo-cargo": "stroke-illo-cargo",
  "illo-cargo-shade": "stroke-illo-cargo-shade",
  "illo-chassis": "stroke-illo-chassis",
  "illo-glass": "stroke-illo-glass",
  "illo-tyre": "stroke-illo-tyre",
  "illo-hub": "stroke-illo-hub",
  "illo-plate": "stroke-illo-plate",
  "illo-cold": "stroke-illo-cold",
  "illo-shadow": "stroke-illo-shadow",
};
const classPaint: Paint = (role) => ({ className: fillClass[role] });
const classStroke: Stroke = (role) => ({ className: strokeClass[role] });

export interface TruckIllustrationProps extends Omit<SVGProps<SVGSVGElement>, "children"> {
  kind: TruckIllustrationKind;
  /** Accessible name. Omit when the truck's name is already next to it (decorative). */
  title?: string;
  /** Literal colours per role, for renderers without CSS variables (next/og). */
  colors?: Record<IlloRole, string>;
}

export function TruckIllustration({ kind, title, colors, ...props }: TruckIllustrationProps) {
  const spec = specs[kind];
  const paint: Paint = colors ? (role) => ({ fill: colors[role] }) : classPaint;
  const stroke: Stroke = colors ? (role) => ({ stroke: colors[role] }) : classStroke;

  const { width: W, cab, body, wheel: r } = spec;
  const bodyEnd = body.length;
  const cabX0 = bodyEnd + body.gap;
  const cabX1 = cabX0 + cab.length;
  const length = cabX1;
  const cargoTop = body.kind === "highside" ? body.height + 0.55 : body.height;
  const top = Math.max(cab.height, body.floor + cargoTop);

  const s = Math.min((VIEW_W - 40) / (length + W * DX), (VIEW_H - 70) / (top + W * DY), MAX_SCALE);
  const ox = (VIEW_W - (length + W * DX) * s) / 2;
  const oy = VIEW_H / 2 + 12 + ((top + W * DY) * s) / 2;
  const f: Frame = { s, ox, oy };
  const p = (x: number, y: number, z: number) => project(f, x, y, z);
  const strokeWidth = Math.max(1, s * 0.035);

  const bodyTop = body.floor + body.height;
  const wheels = spec.axles;

  return (
    <svg
      viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
      xmlns="http://www.w3.org/2000/svg"
      role={title ? "img" : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
      focusable="false"
      data-truck-illustration={kind}
      {...props}
    >
      {/* Ground shadow */}
      <polygon
        points={pts([
          p(-0.3, 0, -0.15),
          p(length + 0.3, 0, -0.15),
          p(length + 0.3, 0, W + 0.1),
          p(-0.3, 0, W + 0.1),
        ])}
        {...paint("illo-shadow")}
      />

      {/* Far-side wheels, mostly hidden by the chassis */}
      {wheels.map((x) => {
        const [cx, cy] = p(x, r, W - 0.15);
        return <circle key={`far-${x}`} cx={cx} cy={cy} r={r * s} {...paint("illo-tyre")} />;
      })}

      {/* Chassis rail */}
      {box({
        f,
        paint,
        x0: 0.25,
        x1: length - 0.25,
        y0: r * 0.75,
        y1: Math.min(body.floor, cab.floor) + 0.05,
        z0: W * 0.2,
        z1: W * 0.8,
        colours: chassisColours,
        id: "box1",
      })}

      {/* Load body */}
      {body.kind === "flatbed" ? (
        <>
          {box({
            f,
            paint,
            x0: 0,
            x1: bodyEnd,
            y0: body.floor,
            y1: bodyTop,
            z0: 0,
            z1: W,
            colours: { side: "illo-chassis", front: "illo-tyre", top: "illo-body-shade" },
            id: "box2",
          })}
          {Array.from({ length: Math.floor(bodyEnd / 1.6) }, (_, i) => {
            const x = 0.4 + i * 1.6;
            const [x1, y1] = p(x, bodyTop, 0);
            const [x2, y2] = p(x, bodyTop + 0.55, 0);
            return (
              <line
                key={`stake-${x}`}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                strokeWidth={strokeWidth * 2}
                strokeLinecap="round"
                {...stroke("illo-chassis")}
              />
            );
          })}
        </>
      ) : (
        box({
          f,
          paint,
          x0: 0,
          x1: bodyEnd,
          y0: body.floor,
          y1: bodyTop,
          z0: 0,
          z1: W,
          colours:
            body.kind === "deck" || body.kind === "highside"
              ? { side: "illo-body", front: "illo-body-shade", top: "illo-body-shade" }
              : bodyColours,
          id: "box3",
        })
      )}

      {/* Body details */}
      {body.kind === "container"
        ? Array.from({ length: Math.floor(bodyEnd / 0.55) - 1 }, (_, i) => {
            const x = 0.55 * (i + 1);
            const [x1, y1] = p(x, body.floor + 0.1, 0);
            const [x2, y2] = p(x, bodyTop - 0.1, 0);
            return (
              <line
                key={`rib-${x}`}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                strokeWidth={strokeWidth}
                {...stroke("illo-body-shade")}
              />
            );
          })
        : null}
      {body.kind === "highside"
        ? [0.33, 0.66].map((t) => {
            const y = body.floor + body.height * t;
            const [x1, y1] = p(0.05, y, 0);
            const [x2, y2] = p(bodyEnd - 0.05, y, 0);
            return (
              <line
                key={`board-${t}`}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                strokeWidth={strokeWidth}
                {...stroke("illo-body-shade")}
              />
            );
          })
        : null}
      {body.kind === "highside"
        ? // Tarpaulin-covered load
          box({
            f,
            paint,
            x0: 0.2,
            x1: bodyEnd - 0.2,
            y0: bodyTop - 0.1,
            y1: bodyTop + 0.5,
            z0: W * 0.1,
            z1: W * 0.9,
            colours: { side: "illo-cargo", front: "illo-cargo-shade", top: "illo-cargo" },
            id: "box4",
          })
        : null}
      {body.kind === "box" ? (
        <polygon
          points={pts([
            p(0, body.floor + 0.3, 0),
            p(bodyEnd, body.floor + 0.3, 0),
            p(bodyEnd, body.floor + 0.48, 0),
            p(0, body.floor + 0.48, 0),
          ])}
          {...paint(spec.reefer ? "illo-cold" : "illo-cab")}
        />
      ) : null}

      {/* Cab */}
      {box({
        f,
        paint,
        x0: cabX0,
        x1: cabX1,
        y0: cab.floor,
        y1: cab.height,
        z0: 0,
        z1: W,
        colours: cabColours,
        id: "box5",
      })}
      {/* Side window */}
      <polygon
        points={pts([
          p(cabX1 - cab.length * 0.55, cab.floor + (cab.height - cab.floor) * 0.55, 0),
          p(cabX1 - 0.1, cab.floor + (cab.height - cab.floor) * 0.55, 0),
          p(cabX1 - 0.1, cab.height - 0.14, 0),
          p(cabX1 - cab.length * 0.55, cab.height - 0.14, 0),
        ])}
        {...paint("illo-glass")}
      />
      {/* Windscreen */}
      <polygon
        points={pts([
          p(cabX1, cab.floor + (cab.height - cab.floor) * 0.55, W * 0.08),
          p(cabX1, cab.floor + (cab.height - cab.floor) * 0.55, W * 0.92),
          p(cabX1, cab.height - 0.12, W * 0.92),
          p(cabX1, cab.height - 0.12, W * 0.08),
        ])}
        {...paint("illo-glass")}
      />
      {/* Bumper, headlights and the yellow commercial plate */}
      <polygon
        points={pts([
          p(cabX1 + 0.02, cab.floor - 0.12, 0),
          p(cabX1 + 0.02, cab.floor - 0.12, W),
          p(cabX1 + 0.02, cab.floor + 0.08, W),
          p(cabX1 + 0.02, cab.floor + 0.08, 0),
        ])}
        {...paint("illo-chassis")}
      />
      {[0.12, W - 0.42].map((z) => (
        <polygon
          key={`lamp-${z}`}
          points={pts([
            p(cabX1 + 0.02, cab.floor + 0.18, z),
            p(cabX1 + 0.02, cab.floor + 0.18, z + 0.3),
            p(cabX1 + 0.02, cab.floor + 0.34, z + 0.3),
            p(cabX1 + 0.02, cab.floor + 0.34, z),
          ])}
          {...paint("illo-body-top")}
        />
      ))}
      <polygon
        points={pts([
          p(cabX1 + 0.03, cab.floor - 0.08, W / 2 - 0.25),
          p(cabX1 + 0.03, cab.floor - 0.08, W / 2 + 0.25),
          p(cabX1 + 0.03, cab.floor + 0.06, W / 2 + 0.25),
          p(cabX1 + 0.03, cab.floor + 0.06, W / 2 - 0.25),
        ])}
        {...paint("illo-plate")}
      />

      {/* Refrigeration unit on the body's front wall, above the cab */}
      {spec.reefer
        ? box({
            f,
            paint,
            x0: bodyEnd - 0.05,
            x1: bodyEnd + 0.35,
            y0: bodyTop - 0.85,
            y1: bodyTop - 0.12,
            z0: W * 0.2,
            z1: W * 0.8,
            colours: { side: "illo-cold", front: "illo-body-shade", top: "illo-body-top" },
            id: "box6",
          })
        : null}

      {/* Near-side wheels */}
      {wheels.map((x) => {
        const [cx, cy] = p(x, r, 0);
        return (
          <g key={`near-${x}`}>
            <circle cx={cx} cy={cy} r={r * s} {...paint("illo-tyre")} />
            <circle cx={cx} cy={cy} r={r * s * 0.45} {...paint("illo-hub")} />
          </g>
        );
      })}
    </svg>
  );
}

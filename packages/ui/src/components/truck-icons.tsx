import type { ComponentProps, ReactNode } from "react";

/*
 * Truck-class icons drawn on lucide's grid so they sit next to lucide icons
 * without looking foreign: 24×24 viewBox, 2px stroke, round caps and joins,
 * no fills, `currentColor`. All face right (direction of travel), wheels
 * on the same baseline (cy 18, r 2) so a row of them lines up.
 */

export interface TruckIconProps extends Omit<ComponentProps<"svg">, "children"> {
  /** Width and height in px. Default 24. */
  size?: number | string;
  strokeWidth?: number | string;
  /** Accessible name. Omit for decorative icons (the default: aria-hidden). */
  title?: string;
}

function createTruckIcon(displayName: string, paths: ReactNode) {
  function TruckIcon({ size = 24, strokeWidth = 2, title, ...props }: TruckIconProps) {
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        role={title ? "img" : undefined}
        aria-hidden={title ? undefined : true}
        aria-label={title}
        {...props}
      >
        {paths}
      </svg>
    );
  }
  TruckIcon.displayName = displayName;
  return TruckIcon;
}

/** Mini truck / small commercial vehicle (sub-1-tonne, e.g. Ace class). */
export const MiniTruckIcon = createTruckIcon(
  "MiniTruckIcon",
  <>
    <path d="M4 18H3a1 1 0 0 1-1-1v-4h12" />
    <path d="M14 18V9h4l3 4v4a1 1 0 0 1-1 1h-1" />
    <path d="M8 18h7" />
    <path d="M16 13h5" />
    <circle cx="6" cy="18" r="2" />
    <circle cx="17" cy="18" r="2" />
  </>,
);

/** Pickup (1–2 tonne): car-like cab, low open bed. */
export const PickupIcon = createTruckIcon(
  "PickupIcon",
  <>
    <path d="M4 18H3a1 1 0 0 1-1-1v-5h10V8h5l3 4 1.2.4a1 1 0 0 1 .8 1V17a1 1 0 0 1-1 1h-1" />
    <path d="M8 18h8" />
    <path d="M12 12h8" />
    <circle cx="6" cy="18" r="2" />
    <circle cx="18" cy="18" r="2" />
  </>,
);

/** LCV, 14–17 ft closed body. */
export const LcvIcon = createTruckIcon(
  "LcvIcon",
  <>
    <path d="M14 18V6H3a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h1" />
    <path d="M15 18H8" />
    <path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.62L18.3 9.37A1 1 0 0 0 17.52 9H14" />
    <circle cx="6" cy="18" r="2" />
    <circle cx="17" cy="18" r="2" />
  </>,
);

/** MCV, 19–22 ft closed body: taller box, twin rear axle. */
export const McvIcon = createTruckIcon(
  "McvIcon",
  <>
    <path d="M2 4h14v12H2z" />
    <path d="M16 8h3l3 4v5a1 1 0 0 1-1 1" />
    <path d="M11 18h6" />
    <circle cx="4.5" cy="18" r="2" />
    <circle cx="9" cy="18" r="2" />
    <circle cx="19" cy="18" r="2" />
  </>,
);

/** Container, 24 ft and above (SXL/MXL): ribbed box, three axles. */
export const ContainerTruckIcon = createTruckIcon(
  "ContainerTruckIcon",
  <>
    <path d="M2 15V5h14v10z" />
    <path d="M6 8v4" />
    <path d="M9 8v4" />
    <path d="M12 8v4" />
    <path d="M16 9h3.5l2.5 3.5V17a1 1 0 0 1-1 1" />
    <path d="M11 18h5.5" />
    <circle cx="4.5" cy="18" r="2" />
    <circle cx="9" cy="18" r="2" />
    <circle cx="19" cy="18" r="2" />
  </>,
);

/** Open body (dala / half-body): side boards, open top. */
export const OpenBodyIcon = createTruckIcon(
  "OpenBodyIcon",
  <>
    <path d="M2 8v8h12V8" />
    <path d="M2 12h12" />
    <path d="M14 10h4l3 3.5V17a1 1 0 0 1-1 1h-1" />
    <path d="M8 18h7" />
    <path d="M2 16v1a1 1 0 0 0 1 1h1" />
    <circle cx="6" cy="18" r="2" />
    <circle cx="17" cy="18" r="2" />
  </>,
);

/** Trailer (20/40 ft flatbed): tractor and a separate deck. */
export const TrailerIcon = createTruckIcon(
  "TrailerIcon",
  <>
    <path d="M2 14h13" />
    <path d="M4 14v2" />
    <path d="M9 14v2" />
    <path d="M15 14h1V9h3.5l2.5 3.5V17a1 1 0 0 1-1 1" />
    <circle cx="4.5" cy="18" r="2" />
    <circle cx="9" cy="18" r="2" />
    <circle cx="19" cy="18" r="2" />
  </>,
);

/** Refrigerated (reefer): closed body with a cooling unit and snowflake. */
export const ReeferTruckIcon = createTruckIcon(
  "ReeferTruckIcon",
  <>
    <path d="M14 18V6H3a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h1" />
    <path d="M15 18H8" />
    <path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.62L18.3 9.37A1 1 0 0 0 17.52 9H14" />
    <path d="M8 9v6" />
    <path d="m5.4 10.5 5.2 3" />
    <path d="m5.4 13.5 5.2-3" />
    <path d="M10 3h4v3" />
    <circle cx="6" cy="18" r="2" />
    <circle cx="17" cy="18" r="2" />
  </>,
);

/** All truck-class icons with their catalogue labels — for pickers and the styleguide. */
export const truckClassIcons = [
  { key: "mini", label: "Mini truck", Icon: MiniTruckIcon },
  { key: "pickup", label: "Pickup", Icon: PickupIcon },
  { key: "lcv", label: "LCV 14–17 ft", Icon: LcvIcon },
  { key: "mcv", label: "19–22 ft", Icon: McvIcon },
  { key: "container", label: "Container 24 ft+", Icon: ContainerTruckIcon },
  { key: "open", label: "Open body", Icon: OpenBodyIcon },
  { key: "trailer", label: "Trailer", Icon: TrailerIcon },
  { key: "reefer", label: "Refrigerated", Icon: ReeferTruckIcon },
] as const;

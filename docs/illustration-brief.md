# Illustration brief: truck classes

This brief is for a designer who will refine or replace the truck illustrations. Until then, the site ships a parametric set drawn in code:

- Component: `packages/ui/src/components/truck-illustration.tsx`
- Examples: `/styleguide` and `/trucks`

Treat that set as the reference for angle, palette and proportions. The commissioned set should look like the same family, drawn by hand.

## Where they appear

| Slot                                   | Frame                            | Notes                                         |
| -------------------------------------- | -------------------------------- | --------------------------------------------- |
| Truck cards (home carousel, `/trucks`) | 4:3, about 270–360 px wide       | Small. Must read as "which size" at a glance. |
| Truck detail page `/trucks/<slug>`     | 4:3, up to 560 px wide           | Largest use.                                  |
| Phone mockup, "truck assigned" screen  | 4:3, about 190 px wide           | Tiny. Simple shapes only.                     |
| Share images (OG, 1200×630)            | 460×566 light panel on the right | Light background, brand-blue field around it. |

The illustrations stay in use after real photos arrive (`docs/photography-shot-list.md`) wherever a photo is missing. So they must sit comfortably next to photos.

## Style

- **View.** Front 3/4, oblique.
  - The truck faces right, and we see the near side, the front and the roof.
  - The roof recedes up and to the right at about 32° (in code: a depth vector of 0.42 across and 0.26 up per metre of vehicle width).
  - Every class uses the same angle, so a row of cards reads as one set.
- **Scale.** True to relative size within a frame, up to a maximum. Small trucks look smaller than containers, but never tiny.
- **Light.** From the top left, the same for every class.
  - The side faces are the base colour.
  - The front faces are one step darker.
  - The roofs are one step lighter.
- **Rendering.** Flat fills only: no outlines, gradients, textures or drop shadows. The one exception is a single soft ground shadow (a flat translucent shape under the truck).
- **Detail.** Only enough to tell the classes apart:
  - windscreen and side window;
  - bumper, two headlamps and the yellow commercial plate;
  - container ribs;
  - open-body side boards and tarpaulin;
  - refrigeration unit.
  - No brand names, no number-plate text, no drivers.
- **Region.** Indian commercial vehicles, not US or EU trucks:
  - cab-over-engine cabs;
  - a yellow front plate;
  - Indian body styles: high-sided open bodies, MXL containers.

## Palette

Use only these colours. They're the design tokens (`illo-*` roles in `packages/ui/src/tokens/tokens.ts`). They stay the same in light and dark mode, except that the white body softens to warm grey in dark mode.

| Role              | Colour                   | Use                                    |
| ----------------- | ------------------------ | -------------------------------------- |
| Cab               | `#1F3A8A`                | Cab side (brand blue)                  |
| Cab, front        | `#182D6B`                | Cab front                              |
| Cab, roof         | `#3B5FC4`                | Cab roof                               |
| Body              | `#FFFFFF`                | Load body side                         |
| Body, front       | `#E2DFDA`                | Load body front, open-deck interior    |
| Body, roof        | `#EFEDEA`                | Load body roof                         |
| Cargo / tarpaulin | `#FCC54D`, `#D97706`     | Open-body load, side and front         |
| Chassis           | `#47443F`                | Chassis rails, bumper, flatbed         |
| Glass             | `#B5C6EE`                | Windows                                |
| Tyre / hub        | `#1E1D1B` / `#A39E96`    | Wheels                                 |
| Plate             | `#F59E0B`                | Front plate (Indian commercial yellow) |
| Cold stripe       | `#38BDF8`                | Refrigerated truck only                |
| Ground shadow     | `#131211` at 18% opacity | One flat shape under the truck         |

## Classes

These match `icon_key` in the truck catalogue. The real list depends on NFC-1.

| `icon_key`  | Class                       | Must show                                                                       |
| ----------- | --------------------------- | ------------------------------------------------------------------------------- |
| `mini`      | Mini truck (Tata Ace class) | Small cab, short open deck with low sides, 4 small wheels                       |
| `pickup`    | Pickup 8 ft                 | Pickup cab, low-sided bed                                                       |
| `lcv`       | LCV 14–17 ft                | Cab plus closed box, single rear axle, blue stripe on the box                   |
| `mcv`       | Truck 20 ft                 | Bigger cab, longer closed box, twin rear axles                                  |
| `container` | Container 32 ft MXL         | Long ribbed container, multiple axles                                           |
| `open`      | Open body 22 ft             | High side boards, tarpaulin-covered load                                        |
| `reefer`    | Refrigerated 20 ft          | Closed box with cold stripe, refrigeration unit on the front wall above the cab |
| `trailer`   | Trailer                     | Tractor unit plus flatbed with stake posts (only if TruckBuck books trailers)   |

## Deliverables

- **SVG master per class.** 400×300 viewBox (4:3) with a transparent background.
  - Fill colours as the hex values above. We map them to tokens.
  - Under 10 KB each after SVGO. No embedded raster images or fonts.
- **Raster exports per class.** Transparent background, 4:3:
  - 800×600 and 1600×1200;
  - AVIF and WebP;
  - **under 200 KB each** (aim for under 60 KB).
- **Safe area.** The truck, ground shadow included, fits inside the frame with at least 20 px clear on every side at 400×300.
- **File names.** `truck-<icon_key>.svg`, `truck-<icon_key>@800.avif`, and so on.
- **Alt text.** We write it ourselves: the class name plus what it carries. It goes in the catalogue `image_alt` field, not in the file.

## Not in scope

- People, landscapes, city skylines and maps. Maps on the site are generated from route data.
- Animated versions. The booking-flow animation is CSS (`src/components/visuals/phone-mockup.tsx`) and uses these trucks as still images.

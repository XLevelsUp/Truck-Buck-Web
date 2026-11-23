import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { contrastRatio, formatRatio } from "./contrast";
import { buildTokensCss } from "./css";
import { colorRoles, contrastPairs, type ThemeName, themes } from "./tokens";

const themeNames: ThemeName[] = ["light", "dark"];

describe("colour tokens", () => {
  it.each(themeNames)("%s theme defines every role", (theme) => {
    expect(Object.keys(themes[theme]).sort()).toEqual([...colorRoles].sort());
  });

  for (const theme of themeNames) {
    describe(`${theme} theme meets WCAG 2.2 AA`, () => {
      it.each(contrastPairs.map((p) => [p.fg, p.bg, p.min] as const))(
        "%s on %s ≥ %s:1",
        (fg, bg, min) => {
          const ratio = contrastRatio(themes[theme][fg], themes[theme][bg]);
          expect(ratio, `${fg} on ${bg} is ${formatRatio(ratio)}`).toBeGreaterThanOrEqual(min);
        },
      );
    });
  }

  it("keeps the logo tile identical in both themes", () => {
    expect(themes.dark["logo-tile"]).toBe(themes.light["logo-tile"]);
  });
});

describe("contrast maths", () => {
  it("matches the WCAG reference values", () => {
    expect(contrastRatio("#000000", "#FFFFFF")).toBeCloseTo(21, 5);
    expect(contrastRatio("#777777", "#FFFFFF")).toBeCloseTo(4.48, 2);
  });

  it("truncates rather than rounds, so a failing ratio never looks like a pass", () => {
    expect(formatRatio(4.499)).toBe("4.49:1");
  });
});

describe("generated tokens.css", () => {
  it("is up to date with tokens.ts (run `pnpm --filter @truckbuck/ui tokens`)", () => {
    const onDisk = readFileSync(join(import.meta.dirname, "../styles/tokens.css"), "utf8");
    expect(onDisk).toBe(buildTokensCss());
  });
});

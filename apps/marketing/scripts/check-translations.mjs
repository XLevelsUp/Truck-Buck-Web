/**
 * Checks that the Hindi and Tamil dictionaries cover every copy key the
 * localized pages (/, /drivers, /transporters) and the shared shell render,
 * so no English string leaks onto a /hi or /ta page.
 *
 * Node strips the TypeScript types when it imports the content files.
 * Run: node scripts/check-translations.mjs
 */
import { en } from "../src/content/en.ts";
import { hi } from "../src/content/hi.ts";
import { ta } from "../src/content/ta.ts";

/** Key paths rendered on localized pages. Arrays are compared by length. */
const SCOPES = [
  "site",
  "nav",
  "cta",
  "whatsapp",
  "home",
  "common",
  "forms",
  "transporters",
  "drivers",
  "notFound",
  "footer",
  "features.steadyLoads",
  "features.noBidding",
  "features.transparentFee",
  "features.onTimePayment",
  "features.driverAssignment",
  "pageFaqs.home",
  "pageFaqs.transporters",
  "pageFaqs.drivers",
];

/** Brand names and number formats: identical in every language, so English is correct. */
const LANGUAGE_NEUTRAL = new Set([
  "site.name",
  "cta.whatsapp",
  "cta.playStoreLarge",
  "cta.appStoreSoon",
  "home.result.range",
  "transporters.form.fleetSizeOptions",
]);

const get = (obj, path) => path.split(".").reduce((o, k) => (o == null ? o : o[k]), obj);

function diff(source, target, path, out) {
  if (LANGUAGE_NEUTRAL.has(path)) return;
  if (typeof source === "string") {
    if (typeof target !== "string") out.push(path);
    return;
  }
  if (Array.isArray(source)) {
    if (!Array.isArray(target) || target.length !== source.length)
      out.push(`${path} (array length)`);
    else source.forEach((item, i) => diff(item, target[i], `${path}[${i}]`, out));
    return;
  }
  if (source && typeof source === "object") {
    for (const key of Object.keys(source)) diff(source[key], target?.[key], `${path}.${key}`, out);
  }
}

let failed = false;
for (const [name, dict] of Object.entries({ hi, ta })) {
  const missing = [];
  for (const scope of SCOPES) diff(get(en, scope), get(dict, scope), scope, missing);
  if (missing.length > 0) {
    failed = true;
    console.error(`\n${name}: ${missing.length} missing keys`);
    for (const key of missing) console.error(`  ${key}`);
  }
}

// Hero variant "a" is the control: it must match the copy the page shows without a test.
const controls = {
  home: { ...en.home.hero, cta: en.home.widget.submit },
  shippers: en.shippers.hero,
  transporters: en.transporters.hero,
};
for (const [page, control] of Object.entries(controls)) {
  for (const key of ["title", "lead", "cta"]) {
    if (en.heroVariants[page].a[key] !== control[key]) {
      failed = true;
      console.error(`heroVariants.${page}.a.${key} differs from the page's own hero copy`);
    }
  }
}

if (failed) process.exit(1);
// eslint-disable-next-line no-console -- CLI result line.
console.log(`hi and ta cover all ${SCOPES.length} localized scopes; hero controls match.`);

import { company } from "./content/company.ts";

/**
 * Facts the site cannot launch without. The footer must show the legal name,
 * registered address and CIN or GSTIN on every page (Phase 6), so a
 * production deploy fails until they are in src/content/company.ts (NFC-4).
 * Preview and local builds only warn, so work can continue without them.
 */
export function launchProblems(): string[] {
  const problems: string[] = [];
  if (!company.legalName) problems.push("company.legalName (NFC-4)");
  if (!company.registeredAddress) problems.push("company.registeredAddress (NFC-4)");
  if (!company.cin && !company.gstin) problems.push("company.cin or company.gstin (NFC-4)");
  return problems;
}

export function assertLaunchReady(): void {
  const problems = launchProblems();
  if (problems.length === 0) return;
  const message = `Missing company facts the footer must show:\n  - ${problems.join("\n  - ")}`;
  if (process.env.VERCEL_ENV === "production") {
    throw new Error(`❌ Production deploy blocked. ${message}`);
  }
  if (process.env.NODE_ENV === "production") console.warn(`⚠ Not launch-ready. ${message}`);
}

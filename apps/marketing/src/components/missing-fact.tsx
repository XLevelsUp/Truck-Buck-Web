import { getContent } from "@/content";

/**
 * A reference to an item on the NEEDS-FROM-CLIENT checklist (docs/blueprint.md §11).
 * The type makes every marker name its checklist item, e.g. "GSTIN (NFC-4)".
 */
export type NfcRef = `${string}(NFC-${number})`;

/**
 * Marks a fact we are waiting on from the client. Visible in development so
 * gaps are obvious; renders nothing in production, so the site never shows
 * an invented value.
 */
export function MissingFact({ what }: { what: NfcRef }) {
  if (process.env.NODE_ENV === "production") return null;
  return (
    <span
      data-testid="missing-fact"
      className="inline-flex items-center gap-1 rounded-sm border border-dashed border-warning bg-warning-soft px-1.5 text-xs font-semibold text-warning-soft-foreground"
    >
      {getContent().missingFact.label}: {what}
    </span>
  );
}

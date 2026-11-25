"use client";

import { useEffect } from "react";

import { track } from "@/lib/analytics";
import type { Assignment, ExperimentKey } from "@/lib/experiments";

/**
 * Reports which variants this visitor saw (experiment_viewed), once per page
 * view, for the experiments that are switched on. Sent only after analytics
 * consent, like every event.
 */
export function ExperimentExposure({
  assignment,
  enabled,
}: {
  assignment: Partial<Assignment>;
  enabled: readonly ExperimentKey[];
}) {
  useEffect(() => {
    for (const key of enabled) {
      const variant = assignment[key];
      if (variant) track("experiment_viewed", { experiment: key, variant });
    }
  }, [assignment, enabled]);
  return null;
}

"use client";

import { useState } from "react";

import { SegmentedControl } from "@truckbuck/ui/segmented-control";

type Mode = "system" | "light" | "dark";

/** Forces light or dark on <html> (data-theme) for previewing; "System" follows the OS. */
export function ThemeSwitcher() {
  const [mode, setMode] = useState<Mode>("system");
  return (
    <SegmentedControl
      aria-label="Preview theme"
      size="sm"
      value={mode}
      onValueChange={(value) => {
        const next = value as Mode;
        setMode(next);
        const root = document.documentElement;
        if (next === "system") delete root.dataset.theme;
        else root.dataset.theme = next;
      }}
      options={[
        { value: "system", label: "System" },
        { value: "light", label: "Light" },
        { value: "dark", label: "Dark" },
      ]}
    />
  );
}

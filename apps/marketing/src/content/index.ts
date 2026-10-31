import { type Content, en } from "./en";

export type { Content };

/** Single entry point for copy. Takes a locale later; English only for now. */
export function getContent(): Content {
  return en;
}

import type { en } from "./en";

/** `as const` literals widened to plain strings/numbers, so translations type-check. */
type Widen<T> = T extends string
  ? string
  : T extends number
    ? number
    : T extends boolean
      ? boolean
      : T extends readonly (infer U)[]
        ? readonly Widen<U>[]
        : T extends object
          ? { readonly [K in keyof T]: Widen<T[K]> }
          : T;

export type Content = Widen<typeof en>;

/** A translation: any subset of the English tree. Arrays replace, objects merge. */
export type Translation = DeepPartial<Content>;
type DeepPartial<T> = T extends readonly unknown[]
  ? T
  : T extends object
    ? { readonly [K in keyof T]?: DeepPartial<T[K]> }
    : T;

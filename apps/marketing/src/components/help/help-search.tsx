"use client";

import {
  type ReactNode,
  useDeferredValue,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import Link from "next/link";
import Fuse from "fuse.js";
import { Search } from "lucide-react";

import { Input } from "@truckbuck/ui/input";

export interface SearchableFaq {
  slug: string;
  question: string;
  answer: string;
  category: string;
}

/**
 * Fuzzy, typo-tolerant search over every help answer, in the browser
 * (Fuse.js, ~6 KB). With an empty query the server-rendered topic list
 * (children) shows, so the hub works without JavaScript too.
 */
export function HelpSearch({
  faqs,
  labels,
  children,
}: {
  faqs: SearchableFaq[];
  labels: {
    search: string;
    placeholder: string;
    results: string;
    resultsOne: string;
    noResults: string;
  };
  children: ReactNode;
}) {
  const id = useId();
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // Uncontrolled input: text typed before hydration (slow phones) is kept and
  // searched. Otherwise ?q= (the site search box in Google results) fills it.
  useEffect(() => {
    const input = inputRef.current;
    if (!input) return;
    const fromUrl = new URLSearchParams(window.location.search).get("q")?.slice(0, 100) ?? "";
    const initial = input.value || fromUrl;
    if (!initial) return;
    input.value = initial;
    queueMicrotask(() => setQuery(initial));
  }, []);
  const deferred = useDeferredValue(query.trim());
  const fuse = useMemo(
    () =>
      new Fuse(faqs, {
        keys: [
          { name: "question", weight: 0.7 },
          { name: "answer", weight: 0.3 },
        ],
        threshold: 0.4,
        ignoreLocation: true,
        minMatchCharLength: 2,
      }),
    [faqs],
  );
  const results = deferred.length >= 2 ? fuse.search(deferred, { limit: 12 }) : null;
  const status =
    results === null
      ? ""
      : results.length === 0
        ? labels.noResults.replace("{query}", deferred)
        : results.length === 1
          ? labels.resultsOne
          : labels.results.replace("{count}", String(results.length));

  return (
    <div className="grid gap-8">
      <search className="grid max-w-2xl gap-2">
        <label htmlFor={id} className="font-semibold">
          {labels.search}
        </label>
        <div className="relative">
          <Search
            aria-hidden="true"
            className="pointer-events-none absolute top-1/2 left-3 size-5 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            id={id}
            type="search"
            ref={inputRef}
            defaultValue=""
            onChange={(event) => setQuery(event.target.value)}
            placeholder={labels.placeholder}
            autoComplete="off"
            enterKeyHint="search"
            className="pl-10"
          />
        </div>
        <p role="status" aria-live="polite" className="min-h-6 text-sm text-muted-foreground">
          {status}
        </p>
      </search>

      {results === null ? (
        children
      ) : results.length > 0 ? (
        <ul className="grid gap-3" data-testid="help-results">
          {results.map(({ item }) => (
            <li key={item.slug}>
              <Link
                href={`/help/${item.slug}`}
                className="grid gap-1 rounded-xl border bg-surface p-4 focus-ring hover:bg-surface-muted"
              >
                <span className="text-sm font-semibold text-muted-foreground">{item.category}</span>
                <span className="text-lg font-bold">{item.question}</span>
                <span className="line-clamp-2 text-muted-foreground">{item.answer}</span>
              </Link>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

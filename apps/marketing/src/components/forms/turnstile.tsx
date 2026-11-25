"use client";

import { useEffect, useRef } from "react";

import type { TurnstileAction } from "@/lib/turnstile-actions";

interface TurnstileApi {
  render: (element: HTMLElement, options: Record<string, unknown>) => string;
  remove: (widgetId: string) => void;
}

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

const SCRIPT_SRC = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
let loader: Promise<TurnstileApi> | null = null;

/** Loads Cloudflare Turnstile once, on demand — never on the critical path. */
function loadTurnstile(): Promise<TurnstileApi> {
  if (window.turnstile) return Promise.resolve(window.turnstile);
  loader ??= new Promise<TurnstileApi>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = SCRIPT_SRC;
    script.async = true;
    script.onload = () =>
      window.turnstile ? resolve(window.turnstile) : reject(new Error("turnstile"));
    script.onerror = () => {
      loader = null;
      reject(new Error("turnstile"));
    };
    document.head.append(script);
  });
  return loader;
}

/**
 * Invisible-unless-needed bot check ("interaction-only"). Mount it with the
 * lead form; it reports a token (or null when it expires).
 */
export function Turnstile({
  siteKey,
  onToken,
  action,
}: {
  siteKey: string;
  onToken: (token: string | null) => void;
  action: TurnstileAction;
}) {
  const container = useRef<HTMLDivElement>(null);
  const callback = useRef(onToken);
  useEffect(() => {
    callback.current = onToken;
  });

  useEffect(() => {
    let widgetId: string | null = null;
    let cancelled = false;
    loadTurnstile()
      .then((api) => {
        if (cancelled || !container.current) return;
        widgetId = api.render(container.current, {
          sitekey: siteKey,
          action,
          appearance: "interaction-only",
          size: "flexible",
          callback: (token: string) => callback.current(token),
          "expired-callback": () => callback.current(null),
          "error-callback": () => callback.current(null),
        });
      })
      .catch(() => callback.current(null));
    return () => {
      cancelled = true;
      if (widgetId && window.turnstile) window.turnstile.remove(widgetId);
    };
  }, [siteKey, action]);

  return <div ref={container} className="empty:hidden" />;
}

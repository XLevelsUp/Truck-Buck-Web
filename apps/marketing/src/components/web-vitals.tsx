"use client";

import { useEffect } from "react";
import { useReportWebVitals } from "next/web-vitals";

interface Metric {
  name: string;
  value: number;
  rating: "good" | "needs-improvement" | "poor";
}

const TRACKED = new Set(["LCP", "INP", "CLS", "FCP", "TTFB"]);
let queue: object[] = [];

function flush() {
  if (queue.length === 0) return;
  const body = JSON.stringify(queue.slice(0, 10));
  queue = [];
  const blob = new Blob([body], { type: "application/json" });
  if (!navigator.sendBeacon("/api/vitals", blob)) {
    void fetch("/api/vitals", { method: "POST", body, keepalive: true }).catch(() => {});
  }
}

const connection = () =>
  (navigator as Navigator & { connection?: { effectiveType?: string } }).connection?.effectiveType;

/**
 * Real-user monitoring: Core Web Vitals go to /api/vitals (anonymous, batched,
 * sent when the page is hidden), and uncaught errors to /api/client-errors.
 * No third-party SDK in the browser.
 */
export function WebVitals() {
  useReportWebVitals((metric: Metric) => {
    if (!TRACKED.has(metric.name)) return;
    const type = connection();
    queue.push({
      name: metric.name,
      value:
        metric.name === "CLS" ? Math.round(metric.value * 1000) / 1000 : Math.round(metric.value),
      rating: metric.rating,
      path: window.location.pathname,
      ...(type ? { connection: type } : {}),
    });
  });

  useEffect(() => {
    const onHide = () => {
      if (document.visibilityState === "hidden") flush();
    };
    let reported = 0;
    const report = (message: string, source: string) => {
      if (reported++ >= 3) return;
      void fetch("/api/client-errors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: message.slice(0, 500) || "Unknown error",
          source: source.slice(0, 300),
          path: window.location.pathname,
        }),
        keepalive: true,
      }).catch(() => {});
    };
    const describe = (value: unknown) =>
      value instanceof Error ? `${value.name}: ${value.message}` : String(value);
    const onError = (event: ErrorEvent) =>
      report(describe(event.error ?? event.message), event.filename);
    const onRejection = (event: PromiseRejectionEvent) => report(describe(event.reason), "promise");

    document.addEventListener("visibilitychange", onHide);
    window.addEventListener("pagehide", flush);
    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onRejection);
    return () => {
      document.removeEventListener("visibilitychange", onHide);
      window.removeEventListener("pagehide", flush);
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onRejection);
    };
  }, []);

  return null;
}

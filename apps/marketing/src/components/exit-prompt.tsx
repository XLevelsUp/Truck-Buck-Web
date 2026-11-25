"use client";

import { useEffect, useRef, useState } from "react";
import { MessageCircle, X } from "lucide-react";

import { Button } from "@truckbuck/ui/button";

import { currentPage, track } from "@/lib/analytics";
import { LEAD_SENT_KEY } from "@/lib/lead-sent";

export interface ExitPromptLabels {
  title: string;
  body: string;
  cta: string;
  close: string;
}

const SEEN_KEY = "tb_exit_prompt_seen";
const ARM_AFTER_MS = 8_000;

const flag = (key: string) => {
  try {
    return window.sessionStorage.getItem(key) === "1";
  } catch {
    return true; // storage blocked: don't risk prompting repeatedly
  }
};

/**
 * Desktop-only exit-intent prompt: "Get your quote on WhatsApp". Shown at most
 * once per session, only with a fine pointer on a wide screen (never on
 * phones or tablets), only after 8 s on the page, and never after a lead was
 * sent. A native <dialog>: focus moves in, Escape closes, focus returns.
 */
export function ExitPrompt({
  whatsappHref,
  labels,
}: {
  whatsappHref: string;
  labels: ExitPromptLabels;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [armed, setArmed] = useState(false);

  useEffect(() => {
    const desktop = window.matchMedia("(pointer: fine) and (min-width: 1024px)");
    if (!desktop.matches || flag(SEEN_KEY) || flag(LEAD_SENT_KEY)) return;
    const timer = window.setTimeout(() => setArmed(true), ARM_AFTER_MS);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!armed) return;
    const onLeave = (event: MouseEvent) => {
      // Leaving through the top edge (towards the tab bar / address bar).
      if (event.relatedTarget !== null || event.clientY > 0) return;
      if (flag(SEEN_KEY) || flag(LEAD_SENT_KEY) || document.querySelector("dialog[open]")) return;
      try {
        window.sessionStorage.setItem(SEEN_KEY, "1");
      } catch {
        // ignore
      }
      dialog.current?.showModal();
      track("exit_prompt_shown", { page: currentPage() });
      document.removeEventListener("mouseout", onLeave);
    };
    document.addEventListener("mouseout", onLeave);
    return () => document.removeEventListener("mouseout", onLeave);
  }, [armed]);

  return (
    <dialog
      ref={dialog}
      aria-labelledby="exit-prompt-title"
      data-testid="exit-prompt"
      data-track-placement="exit_prompt"
      className="m-auto w-[min(28rem,calc(100vw-2rem))] rounded-2xl border bg-surface p-6 text-foreground shadow-xl backdrop:bg-overlay"
      onClick={(event) => {
        // Click on the backdrop closes.
        if (event.target === dialog.current) dialog.current?.close();
      }}
    >
      <div className="grid gap-4">
        <div className="flex items-start justify-between gap-4">
          <h2 id="exit-prompt-title" className="text-xl font-bold">
            {labels.title}
          </h2>
          <button
            type="button"
            onClick={() => dialog.current?.close()}
            className="-m-2 inline-flex size-10 items-center justify-center rounded-full focus-ring hover:bg-surface-muted"
          >
            <X aria-hidden="true" className="size-5" />
            <span className="sr-only">{labels.close}</span>
          </button>
        </div>
        <p className="text-muted-foreground">{labels.body}</p>
        <Button asChild variant="cta" size="lg" block>
          <a
            href={whatsappHref}
            target="_blank"
            rel="noopener"
            onClick={() => {
              track("exit_prompt_clicked", { page: currentPage() });
              dialog.current?.close();
            }}
          >
            <MessageCircle aria-hidden="true" /> {labels.cta}
          </a>
        </Button>
      </div>
    </dialog>
  );
}

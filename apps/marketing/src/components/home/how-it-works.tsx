import { loopPhase } from "@/components/visuals/loop";
import { LoopFrame } from "@/components/visuals/loop-frame";
import { PhoneMockup } from "@/components/visuals/phone-mockup";
import { getContent } from "@/content";
import type { Locale } from "@/i18n/locales";

import { Section, SectionHeading } from "./sections";

/**
 * "Book a truck like a cab": four steps beside a phone that cycles through
 * them on the shared 10s loop (CSS only). The phone is decorative — the
 * ordered list carries the content. A pause button stops the loop; under
 * prefers-reduced-motion it shows one still screen.
 */
export function HowItWorks({ locale = "en" }: { locale?: Locale }) {
  const content = getContent(locale);
  const h = content.home.how;
  return (
    <Section labelledBy="how-title" tone="muted">
      <SectionHeading id="how-title" eyebrow={h.eyebrow} title={h.title} lead={h.lead} />
      <LoopFrame
        labels={{ pause: content.common.pauseAnimation, play: content.common.playAnimation }}
        className="grid items-center gap-10 md:grid-cols-[1fr_auto] lg:gap-16"
        buttonClassName="justify-self-center md:col-start-2"
      >
        <ol className="grid gap-3">
          {h.steps.map((step, index) => (
            <li
              key={step.title}
              className="relative flex gap-4 overflow-hidden rounded-xl border bg-surface p-4"
            >
              {/* Highlight fades with the matching phone screen (opacity only: no repaints). */}
              <span
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 border-l-4 border-primary bg-primary-soft opacity-0 motion-safe:animate-[tb-step-active_10s_linear_infinite]"
                style={loopPhase(index)}
              />
              <span
                aria-hidden="true"
                className="relative grid size-9 shrink-0 place-items-center rounded-full bg-primary font-bold text-primary-foreground"
              >
                {index + 1}
              </span>
              <span className="relative grid gap-0.5">
                <span className="text-lg font-bold">{step.title}</span>
                <span className="text-muted-foreground">{step.body}</span>
              </span>
            </li>
          ))}
        </ol>

        <PhoneMockup screens={h.screens} className="mx-auto" />
      </LoopFrame>
    </Section>
  );
}

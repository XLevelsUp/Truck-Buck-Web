import { EstimateWidget } from "@/components/estimate/estimate-widget";
import type { WidgetConfig, WidgetLabels } from "@/components/estimate/labels";
import { LoopFrame } from "@/components/visuals/loop-frame";
import { PhoneMockup } from "@/components/visuals/phone-mockup";
import { getContent } from "@/content";
import type { Locale } from "@/i18n/locales";
import { type Assignment, CONTROL, heroCopy } from "@/lib/experiments";

/**
 * Above the fold at 360×740: H1 (the LCP element — text, no image), one-line
 * sub, then the fare widget (prerendered empty; reads shared-link params
 * after hydration).
 */
export function Hero({
  labels,
  config,
  locale = "en",
  assignment = CONTROL,
}: {
  labels: WidgetLabels;
  config: WidgetConfig;
  locale?: Locale;
  /** A/B assignment (English only; see src/lib/experiments.ts). */
  assignment?: Assignment | undefined;
}) {
  const { home, common, experiments } = getContent(locale);
  const hero = heroCopy("home", locale, assignment.hero);
  const submit = assignment.cta === "book_truck" ? experiments.ctaBook : hero.cta;
  return (
    <section
      aria-labelledby="hero-title"
      data-hero-variant={hero.variant}
      className="border-b bg-background"
    >
      <div className="mx-auto grid max-w-(--container-content) gap-6 page-gutter pt-6 pb-10 md:pt-10 lg:grid-cols-[1fr_minmax(0,32rem)] lg:gap-12 lg:py-16">
        <div className="grid content-start gap-3 lg:pt-8">
          <h1 id="hero-title" className="text-display font-extrabold text-balance">
            {hero.title}
          </h1>
          <p className="max-w-prose text-lg text-muted-foreground">{hero.lead}</p>
          {/* Large screens only: on phones the fare widget comes straight after the H1. */}
          <LoopFrame
            labels={{ pause: common.pauseAnimation, play: common.playAnimation }}
            className="mt-6 hidden justify-items-start gap-3 lg:grid"
          >
            <PhoneMockup screens={home.how.screens} className="h-[24rem] w-52" />
          </LoopFrame>
        </div>
        <div
          id="get-price"
          className="scroll-mt-20 rounded-2xl border bg-surface p-4 shadow-lg md:p-6"
        >
          <h2 className="mb-4 text-xl font-bold">{home.widget.title}</h2>
          <EstimateWidget
            labels={{ ...labels, widget: { ...labels.widget, submit } }}
            config={config}
            truckFirst={assignment.widget_order === "truck_first"}
            whatsappFirst={assignment.primary_action === "whatsapp"}
          />
        </div>
      </div>
    </section>
  );
}

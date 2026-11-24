import Link from "next/link";
import { MessageCircle } from "lucide-react";

import { Button } from "@truckbuck/ui/button";

import { getContent } from "@/content";
import { routes } from "@/lib/routes";
import { whatsappUrl } from "@/lib/whatsapp";

/** "Still need help?" → WhatsApp when a number is configured, and the contact form always. */
export function StillNeedHelp() {
  const content = getContent();
  const s = content.help.stillNeedHelp;
  const whatsapp = whatsappUrl(content.whatsapp.general);
  return (
    <aside
      aria-labelledby="still-need-help"
      className="grid gap-3 rounded-2xl bg-surface-brand p-6 text-surface-brand-foreground md:p-8"
    >
      <h2 id="still-need-help" className="text-2xl font-bold">
        {s.title}
      </h2>
      <p className="text-lg">{s.body}</p>
      <div className="flex flex-wrap gap-3">
        {whatsapp ? (
          <Button asChild variant="cta" size="lg">
            <a href={whatsapp} target="_blank" rel="noopener">
              <MessageCircle aria-hidden="true" /> {s.whatsapp}
            </a>
          </Button>
        ) : null}
        <Button asChild variant={whatsapp ? "secondary" : "cta"} size="lg">
          <Link href={routes.contact.path}>{s.contact}</Link>
        </Button>
      </div>
    </aside>
  );
}

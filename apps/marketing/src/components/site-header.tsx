import Link from "next/link";

import { Button } from "@truckbuck/ui/button";
import { Logo } from "@truckbuck/ui/logo";

import { getContent } from "@/content";
import { isLocalizedPath, type Locale, localizedHref } from "@/i18n/locales";
import { getPriceHrefFor, primaryNav, routes } from "@/lib/routes";
import { whatsappUrl } from "@/lib/whatsapp";

import { LanguageSwitcher } from "./language-switcher";
import { MobileNav } from "./mobile-nav";

/** Header: logo, five nav links (lg+), Get a price, and a drawer on smaller screens. */
export function SiteHeader({
  locale = "en",
  availableLocales = ["en"],
}: {
  locale?: Locale;
  availableLocales?: Locale[];
}) {
  const content = getContent(locale);
  const links = primaryNav.map((item) => ({
    // Translated pages link to their own locale's version where one exists.
    href: isLocalizedPath(item.href) ? localizedHref(locale, item.href) : item.href,
    label: content.nav[item.key],
  }));
  return (
    <header className="sticky top-0 z-sticky border-b bg-surface">
      <div className="mx-auto flex h-14 max-w-(--container-content) items-center justify-between gap-4 page-gutter md:h-16">
        <Link
          href={localizedHref(locale, routes.home.path)}
          className="-m-1 rounded-md p-1 focus-ring"
          aria-label={content.site.name}
        >
          <Logo title="" className="h-7 md:h-8" />
        </Link>

        <nav aria-label={content.nav.primary} className="hidden xl:block">
          <ul className="flex items-center gap-1">
            {links.map((link) => (
              <li key={link.href + link.label}>
                <Link
                  href={link.href}
                  className="rounded-md px-3 py-2 font-medium whitespace-nowrap text-foreground focus-ring hover:bg-surface-muted"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex items-center gap-2">
          <LanguageSwitcher
            current={locale}
            available={availableLocales}
            label={content.common.languageLabel}
            compact
            className="hidden md:block"
          />
          <Button asChild variant="cta" size="sm" className="hidden xs:inline-flex">
            <Link href={getPriceHrefFor(locale)}>
              <span className="md:hidden">{content.cta.getPriceShort}</span>
              <span className="hidden md:inline">{content.cta.getPrice}</span>
            </Link>
          </Button>
          <MobileNav
            links={links}
            labels={{
              open: content.nav.openMenu,
              close: content.nav.closeMenu,
              title: content.nav.menuTitle,
              description: content.nav.menuDescription,
              getPrice: content.cta.getPrice,
              whatsapp: content.cta.chatOnWhatsapp,
            }}
            getPriceHref={getPriceHrefFor(locale)}
            whatsappHref={whatsappUrl(content.whatsapp.general)}
            language={{
              current: locale,
              available: availableLocales,
              label: content.common.languageLabel,
            }}
          />
        </div>
      </div>
    </header>
  );
}

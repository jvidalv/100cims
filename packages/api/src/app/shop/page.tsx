import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";

import { asAppLocale } from "@/api/lib/locale";
import { buildFooterStrings } from "@/app/challenges/_components/build-footer-strings";
import { SiteFooter } from "@/components/site-footer";
import { SITE_URL } from "@/lib/app-links";
import { getActiveMerch } from "@/lib/merch-helpers";
import { formatPrice, localizeMerch } from "@/lib/merch-format";

export const metadata: Metadata = {
  title: "Shop · Cims, sempre amunt",
  description:
    "Merchandising of the Cims, sempre amunt project — t-shirts, caps, mugs and more.",
  alternates: { canonical: `${SITE_URL}/shop` },
};

export default async function ShopPage() {
  const [localeRaw, t, merch] = await Promise.all([
    getLocale(),
    getTranslations("shop-page"),
    getActiveMerch(),
  ]);
  const locale = asAppLocale(localeRaw);

  return (
    <div lang={locale} className="min-h-screen flex flex-col">
      <main className="flex-1">
        <section className="py-16 sm:py-24 px-4">
          <div className="max-w-6xl mx-auto">
            <h1 className="text-4xl sm:text-6xl font-black mb-4 text-center">
              {t("list-title")}
            </h1>
            <p className="text-lg text-muted-foreground text-center mb-12 max-w-2xl mx-auto">
              {t("list-subtitle")}
            </p>

            {merch.length === 0 ? (
              <p className="text-center text-muted-foreground">
                {t("list-empty")}
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {merch.map((m) => {
                  const { name } = localizeMerch(m, locale);
                  const image = m.imageUrls[0];
                  return (
                    <a
                      key={m.id}
                      href={`/shop/${m.slug}`}
                      className="group rounded-xl overflow-hidden bg-background border hover:border-primary transition-colors"
                    >
                      {image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={image}
                          alt={name}
                          loading="lazy"
                          width={600}
                          height={600}
                          className="w-full aspect-square object-cover group-hover:scale-105 transition-transform"
                        />
                      ) : (
                        <div className="w-full aspect-square bg-muted" />
                      )}
                      <div className="p-5 flex items-start justify-between gap-3">
                        <div>
                          <h2 className="font-bold mb-1">{name}</h2>
                          <p className="text-sm text-muted-foreground">
                            {formatPrice(m.price, locale)}
                          </p>
                        </div>
                        {m.shopUrl ? (
                          <span className="text-xs px-2 py-1 rounded-full border border-border/60 text-muted-foreground">
                            {t("external-badge")}
                          </span>
                        ) : null}
                      </div>
                    </a>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      </main>
      <SiteFooter strings={buildFooterStrings(locale)} />
    </div>
  );
}

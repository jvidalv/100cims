import type { Metadata } from "next";
import { Heart } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { asAppLocale } from "@/api/lib/locale";
import { CHALLENGE_CONTENT } from "@/app/challenges/content";
import { buildFooterStrings } from "@/app/challenges/_components/build-footer-strings";
import { SiteFooter } from "@/components/site-footer";
import { routing } from "@/i18n/routing";
import { getLocalizedAlternates } from "@/lib/hreflang";
import { getActiveMerch } from "@/lib/merch-helpers";
import { formatPrice, localizeMerch } from "@/lib/merch-format";

const HERO_IMAGE = CHALLENGE_CONTENT["100-cims"].heroImageUrl;

interface Props {
  params: Promise<{ locale: string }>;
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const locale = asAppLocale((await params).locale);
  const t = await getTranslations({ locale, namespace: "shop-page" });
  return {
    title: `${t("list-title")} · Cims, sempre amunt`,
    description: t("list-subtitle"),
    alternates: getLocalizedAlternates(locale, "/shop"),
  };
}

export default async function ShopPage({ params }: Props) {
  const locale = asAppLocale((await params).locale);
  setRequestLocale(locale);
  const [t, merch] = await Promise.all([
    getTranslations("shop-page"),
    getActiveMerch(),
  ]);

  return (
    <div lang={locale} className="min-h-screen flex flex-col">
      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden border-b border-border/40">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={HERO_IMAGE}
            alt=""
            aria-hidden
            fetchPriority="high"
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-background via-background/80 to-background" />
          <div className="relative max-w-6xl mx-auto px-4 py-24 sm:py-32">
            <p className="text-sm font-semibold tracking-widest uppercase text-primary mb-4">
              {t("hero-eyebrow")}
            </p>
            <h1 className="text-4xl sm:text-6xl font-black leading-tight mb-6 max-w-3xl">
              {t("hero-title")}
            </h1>
            <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl">
              {t("hero-body")}
            </p>
          </div>
        </section>

        {/* Supports the project */}
        <section className="py-12 px-4">
          <div className="max-w-4xl mx-auto rounded-2xl border border-primary/20 bg-primary/5 p-8 sm:p-10">
            <div className="flex items-start gap-5">
              <div className="shrink-0 w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Heart className="w-6 h-6 text-primary" aria-hidden />
              </div>
              <div>
                <h2 className="text-xl font-bold mb-2">
                  {t("supports-title")}
                </h2>
                <p className="text-muted-foreground leading-relaxed">
                  {t("supports-body")}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Product grid */}
        <section className="py-16 sm:py-24 px-4">
          <div className="max-w-6xl mx-auto">
            {merch.length === 0 ? (
              <div className="max-w-2xl mx-auto rounded-2xl border border-border/60 bg-muted/20 p-10 text-center">
                <p className="text-muted-foreground">{t("list-empty")}</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {merch.map((m) => {
                  const { name } = localizeMerch(m, locale);
                  const image = m.imageUrls[0];
                  return (
                    <a
                      key={m.id}
                      href={`/${locale}/shop/${m.slug}`}
                      className="group rounded-2xl overflow-hidden bg-background border border-border/60 transition-all duration-300 hover:-translate-y-1 hover:border-border hover:shadow-xl"
                    >
                      <div className="relative">
                        {image ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={image}
                            alt={name}
                            loading="lazy"
                            width={600}
                            height={600}
                            className="w-full aspect-square object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="w-full aspect-square bg-muted" />
                        )}
                        <div className="absolute bottom-3 left-3 px-3 py-1 rounded-full bg-background/90 backdrop-blur text-sm font-bold">
                          {formatPrice(m.price, locale)}
                        </div>
                        {m.shopUrl ? (
                          <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-background/90 backdrop-blur text-xs text-muted-foreground">
                            {t("external-badge")}
                          </div>
                        ) : null}
                      </div>
                      <div className="p-5">
                        <h2 className="text-lg font-bold">{name}</h2>
                      </div>
                    </a>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      </main>
      <SiteFooter strings={buildFooterStrings(locale)} locale={locale} />
    </div>
  );
}

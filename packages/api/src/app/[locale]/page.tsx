import type { Metadata } from "next";
import {
  Map as MapIcon,
  Mountain,
  Trophy,
  Users,
  type LucideIcon,
} from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { asAppLocale } from "@/api/lib/locale";
import { CHALLENGE_CONTENT } from "@/app/challenges/content";
import { buildFooterStrings } from "@/app/challenges/_components/build-footer-strings";
import { DownloadButton } from "@/app/_components/download-button";
import { SiteFooter } from "@/components/site-footer";
import { AppleIcon, PlayStoreIcon } from "@/components/store-icons";
import { Button } from "@/components/ui/button";
import { routing } from "@/i18n/routing";
import { ANDROID_APP_URL, IOS_APP_URL, SITE_URL } from "@/lib/app-links";
import { JsonLd } from "@/components/json-ld";
import { getLocalizedAlternates } from "@/lib/hreflang";
import { getActiveMerch } from "@/lib/merch-helpers";
import { localizeMerch } from "@/lib/merch-format";
import { MerchPrice } from "@/components/merch-price";

const FEATURED_SLUG = "100-cims";
const SHOP_PREVIEW_LIMIT = 4;

const OTHER_CHALLENGES = Object.entries(CHALLENGE_CONTENT).filter(
  ([slug]) => slug !== FEATURED_SLUG,
);

const FEATURED_IMAGE_URL = CHALLENGE_CONTENT[FEATURED_SLUG].heroImageUrl;

const SCREENSHOTS = [
  { src: "/assets/1.png", alt: "App homepage showing challenges" },
  { src: "/assets/2.png", alt: "User profile with summits" },
  { src: "/assets/3.png", alt: "Mountain map view" },
  { src: "/assets/4.png", alt: "Mountain detail page" },
];

interface FeatureCard {
  id: 1 | 2 | 3 | 4;
  Icon: LucideIcon;
  /** Tailwind tokens for the icon bubble background and glow ring. */
  tint: string;
  iconTint: string;
  ring: string;
}

const FEATURES: readonly FeatureCard[] = [
  {
    id: 1,
    Icon: Mountain,
    tint: "bg-primary/10",
    iconTint: "text-primary",
    ring: "group-hover:shadow-primary/30",
  },
  {
    id: 2,
    Icon: Trophy,
    tint: "bg-amber-500/10",
    iconTint: "text-amber-400",
    ring: "group-hover:shadow-amber-500/30",
  },
  {
    id: 3,
    Icon: MapIcon,
    tint: "bg-emerald-500/10",
    iconTint: "text-emerald-400",
    ring: "group-hover:shadow-emerald-500/30",
  },
  {
    id: 4,
    Icon: Users,
    tint: "bg-sky-500/10",
    iconTint: "text-sky-400",
    ring: "group-hover:shadow-sky-500/30",
  },
];

interface Props {
  params: Promise<{ locale: string }>;
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const locale = asAppLocale((await params).locale);
  const t = await getTranslations({ locale, namespace: "home-page" });
  const alternates = getLocalizedAlternates(locale, "");
  const title = t("title");
  const description = t("subtitle");
  const ogImage = `${SITE_URL}/assets/logo.png`;
  return {
    title,
    description,
    alternates,
    openGraph: {
      type: "website",
      url: alternates.canonical,
      siteName: "Cims, sempre amunt",
      title,
      description,
      images: [{ url: ogImage, width: 1024, height: 554, alt: title }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImage],
    },
  };
}

export default async function Home({ params }: Props) {
  const locale = asAppLocale((await params).locale);
  setRequestLocale(locale);
  const [t, shop] = await Promise.all([
    getTranslations("home-page"),
    getActiveMerch(),
  ]);
  const shopPreview = shop.slice(0, SHOP_PREVIEW_LIMIT);
  const shopHref = (slug: string) => `/${locale}/shop/${slug}`;

  const siteName = "Cims, sempre amunt";
  const ogImage = `${SITE_URL}/assets/logo.png`;
  const organizationLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: siteName,
    url: SITE_URL,
    logo: ogImage,
    sameAs: [IOS_APP_URL, ANDROID_APP_URL],
  };
  const websiteLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: siteName,
    url: SITE_URL,
    inLanguage: locale,
  };
  const mobileAppLd = {
    "@context": "https://schema.org",
    "@type": "MobileApplication",
    name: siteName,
    operatingSystem: "iOS, Android",
    applicationCategory: "SportsApplication",
    offers: { "@type": "Offer", price: "0", priceCurrency: "EUR" },
    downloadUrl: [IOS_APP_URL, ANDROID_APP_URL],
  };

  return (
    <div className="min-h-screen flex flex-col">
      <JsonLd data={organizationLd} />
      <JsonLd data={websiteLd} />
      <JsonLd data={mobileAppLd} />
      <main className="flex-1">
        <section className="flex flex-col items-center justify-center py-8 sm:py-10 px-4">
          <h1 className="sr-only">{t("title")}</h1>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/assets/logo.png"
            alt={t("title")}
            className="rounded mb-6 shadow-lg h-32"
          />
          <p className="text-lg sm:text-2xl text-center text-muted-foreground mb-8 max-w-2xl">
            {t("subtitle")}
          </p>
          <DownloadButton label={t("download")} />
        </section>

        <section className="py-8 px-4">
          <div className="max-w-7xl mx-auto overflow-x-auto scrollbar-none">
            <div className="flex gap-6 justify-center min-w-max">
              {SCREENSHOTS.map((s) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={s.src}
                  src={s.src}
                  alt={s.alt}
                  className="rounded-2xl border shadow-lg"
                  width={320}
                  height={693}
                />
              ))}
            </div>
          </div>
        </section>

        <section className="py-24 px-4">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-4xl sm:text-5xl font-black text-center mb-4">
              {t("features-title")}
            </h2>
            <div className="mx-auto mb-16 h-1 w-16 rounded-full bg-primary/60" />

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {FEATURES.map(({ id, Icon, tint, iconTint, ring }) => (
                <article
                  key={id}
                  className={`group relative p-7 rounded-2xl bg-background/80 backdrop-blur border border-border/60 transition-all duration-300 hover:-translate-y-1 hover:border-border hover:shadow-xl ${ring}`}
                >
                  <div
                    className={`inline-flex items-center justify-center w-12 h-12 rounded-xl ${tint} mb-5 transition-transform duration-300 group-hover:scale-110`}
                  >
                    <Icon className={`w-6 h-6 ${iconTint}`} aria-hidden />
                  </div>
                  <h3 className="text-lg font-bold mb-2 leading-tight">
                    {t(`feature-${id}-title`)}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {t(`feature-${id}-description`)}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="py-16 px-4">
          <div className="max-w-5xl mx-auto">
            <a
              href="/100cims"
              className="group block rounded-2xl border overflow-hidden bg-background hover:border-primary transition-colors"
            >
              <div className="grid md:grid-cols-2 gap-0">
                <div className="p-8 sm:p-12 bg-gradient-to-br from-primary/10 to-primary/5">
                  <div className="text-sm font-semibold text-primary mb-2 uppercase tracking-wide">
                    {t("featured-challenge-eyebrow")}
                  </div>
                  <h2 className="text-3xl sm:text-5xl font-black mb-4">
                    {t("featured-challenge-title")}
                  </h2>
                  <p className="text-lg text-muted-foreground mb-6">
                    {t("featured-challenge-body")}
                  </p>
                  <span className="inline-block text-lg font-bold text-primary">
                    {t("featured-challenge-cta")}
                  </span>
                </div>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={FEATURED_IMAGE_URL}
                  alt="100 Cims"
                  loading="lazy"
                  width={800}
                  height={600}
                  className="w-full h-full object-cover aspect-[4/3] md:aspect-auto min-h-[260px] group-hover:scale-105 transition-transform"
                />
              </div>
            </a>
          </div>
        </section>

        <section className="py-16 px-4 bg-muted/30">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl sm:text-4xl font-bold text-center mb-3">
              {t("challenges-title")}
            </h2>
            <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
              {t("challenges-subtitle")}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {OTHER_CHALLENGES.map(([slug, content]) => (
                <a
                  key={slug}
                  href={`/challenges/${slug}`}
                  className="group rounded-xl overflow-hidden bg-background border hover:border-primary transition-colors"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={content.heroImageUrl}
                    alt={content.shortName}
                    loading="lazy"
                    width={600}
                    height={400}
                    className="w-full aspect-[3/2] object-cover group-hover:scale-105 transition-transform"
                  />
                  <div className="p-5">
                    <h3 className="text-lg font-bold mb-2">
                      {content.shortName}
                    </h3>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {content.heroTagline}
                    </p>
                  </div>
                </a>
              ))}
            </div>
          </div>
        </section>

        {shopPreview.length > 0 ? (
          <section className="py-16 px-4">
            <div className="max-w-6xl mx-auto">
              <div className="flex items-end justify-between mb-12 gap-4 flex-wrap">
                <div>
                  <h2 className="text-3xl sm:text-4xl font-bold mb-3">
                    {t("shop-title")}
                  </h2>
                  <p className="text-muted-foreground max-w-2xl">
                    {t("shop-subtitle")}
                  </p>
                </div>
                <a
                  href={`/${locale}/shop`}
                  className="text-lg font-bold text-primary whitespace-nowrap"
                >
                  {t("shop-cta")}
                </a>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {shopPreview.map((m) => {
                  const { name } = localizeMerch(m, locale);
                  const image = m.imageUrls[0];
                  return (
                    <a
                      key={m.id}
                      href={shopHref(m.slug)}
                      className="group rounded-xl overflow-hidden bg-background border hover:border-primary transition-colors"
                    >
                      {image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={image}
                          alt={name}
                          loading="lazy"
                          width={400}
                          height={400}
                          className="w-full aspect-square object-cover group-hover:scale-105 transition-transform"
                        />
                      ) : (
                        <div className="w-full aspect-square bg-muted" />
                      )}
                      <div className="p-4">
                        <h3 className="font-bold text-sm mb-1 line-clamp-1">
                          {name}
                        </h3>
                        <MerchPrice
                          price={m.price}
                          discountedPrice={m.discountedPrice}
                          locale={locale}
                          className="text-sm text-muted-foreground"
                        />
                      </div>
                    </a>
                  );
                })}
              </div>
            </div>
          </section>
        ) : null}

        <section className="py-16 px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              {t("cta-title")}
            </h2>
            <p className="text-xl text-muted-foreground mb-8">
              {t("cta-subtitle")}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <a href={IOS_APP_URL} target="_blank" rel="noopener">
                <Button size="lg" className="font-bold gap-2">
                  <AppleIcon />
                  App Store
                </Button>
              </a>
              <a href={ANDROID_APP_URL} target="_blank" rel="noopener">
                <Button size="lg" variant="outline" className="font-bold gap-2">
                  <PlayStoreIcon />
                  Google Play
                </Button>
              </a>
            </div>
            <p className="text-sm text-muted-foreground mt-4">
              {t("available-on")}
            </p>
          </div>
        </section>
      </main>

      <SiteFooter strings={buildFooterStrings(locale)} locale={locale} />
    </div>
  );
}

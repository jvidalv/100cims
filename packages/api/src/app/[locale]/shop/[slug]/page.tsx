import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

import { asAppLocale } from "@/api/lib/locale";
import { truncate } from "@/api/lib/discord";
import { buildFooterStrings } from "@/app/challenges/_components/build-footer-strings";
import { MerchRequestForm } from "@/app/[locale]/shop/_components/merch-request-form";
import { ProductDetailClient } from "@/app/[locale]/shop/_components/product-detail-client";
import { SiteFooter } from "@/components/site-footer";
import { Button } from "@/components/ui/button";
import { getLocalizedAlternates } from "@/lib/hreflang";
import {
  getActiveMerch,
  getMerchBySlug,
  type MerchRow,
} from "@/lib/merch-helpers";
import { localizeMerch } from "@/lib/merch-format";
import { MerchPrice } from "@/components/merch-price";
import { routing } from "@/i18n/routing";

export const dynamicParams = false;

interface RouteParams {
  locale: string;
  slug: string;
}

interface Props {
  params: Promise<RouteParams>;
}

export async function generateStaticParams(): Promise<
  { locale: string; slug: string }[]
> {
  const merch = await getActiveMerch();
  return routing.locales.flatMap((locale) =>
    merch.map((m) => ({ locale, slug: m.slug })),
  );
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, locale: localeRaw } = await params;
  const locale = asAppLocale(localeRaw);
  const row = await getMerchBySlug(slug);
  if (!row) return {};
  const { name, description } = localizeMerch(row, locale);
  const image = row.imageUrls[0];
  const alternates = getLocalizedAlternates(locale, `/shop/${slug}`);
  return {
    title: `${name} · Cims, sempre amunt`,
    description: description ? truncate(description, 160) : undefined,
    alternates,
    openGraph: {
      type: "website",
      url: alternates.canonical,
      siteName: "Cims, sempre amunt",
      title: name,
      description: description ? truncate(description, 160) : undefined,
      images: image
        ? [{ url: image, width: 1200, height: 1200, alt: name }]
        : undefined,
    },
    twitter: image
      ? {
          card: "summary_large_image",
          title: name,
          description: description ? truncate(description, 160) : undefined,
          images: [image],
        }
      : undefined,
  };
}

const BuyBlock = ({
  row,
  name,
  t,
}: {
  row: MerchRow;
  name: string;
  t: Awaited<ReturnType<typeof getTranslations<"shop-page">>>;
}) => {
  if (row.shopUrl) {
    return (
      <a href={row.shopUrl} target="_blank" rel="noopener">
        <Button size="lg" className="font-bold">
          {t("external-cta")}
        </Button>
      </a>
    );
  }
  return <MerchRequestForm productName={name} hasSize={row.hasSize} />;
};

export default async function MerchDetailPage({ params }: Props) {
  const { slug, locale: localeRaw } = await params;
  const locale = asAppLocale(localeRaw);
  setRequestLocale(locale);
  const [t, row] = await Promise.all([
    getTranslations("shop-page"),
    getMerchBySlug(slug),
  ]);
  if (!row) notFound();

  const { name, description } = localizeMerch(row, locale);

  return (
    <div lang={locale} className="min-h-screen flex flex-col">
      <main className="flex-1">
        <section className="py-12 sm:py-16 px-4">
          <div className="max-w-6xl mx-auto">
            <a
              href={`/${locale}/shop`}
              className="inline-block text-sm text-muted-foreground hover:text-foreground mb-8"
            >
              {t("back-to-list")}
            </a>
            <ProductDetailClient
              name={name}
              defaultImages={row.imageUrls}
              variants={row.variants}
              colorLabel={t("color-label")}
              rightColumnAboveColor={
                <>
                  <div>
                    <h1 className="text-3xl sm:text-5xl font-black mb-2">
                      {name}
                    </h1>
                    <MerchPrice
                      price={row.price}
                      discountedPrice={row.discountedPrice}
                      locale={locale}
                      className="text-2xl font-bold gap-3"
                      primaryClassName="text-primary"
                      strikethroughClassName="text-lg font-medium text-muted-foreground"
                    />
                  </div>
                  {description ? (
                    <p className="text-lg text-muted-foreground leading-relaxed whitespace-pre-line">
                      {description}
                    </p>
                  ) : null}
                </>
              }
              rightColumnBelowColor={<BuyBlock row={row} name={name} t={t} />}
            />
          </div>
        </section>
      </main>
      <SiteFooter strings={buildFooterStrings(locale)} locale={locale} />
    </div>
  );
}

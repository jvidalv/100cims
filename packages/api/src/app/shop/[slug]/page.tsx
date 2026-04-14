import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";

import { asAppLocale } from "@/api/lib/locale";
import { truncate } from "@/api/lib/discord";
import { buildFooterStrings } from "@/app/challenges/_components/build-footer-strings";
import { MerchRequestForm } from "@/app/shop/_components/merch-request-form";
import { SiteFooter } from "@/components/site-footer";
import { Button } from "@/components/ui/button";
import { SITE_URL } from "@/lib/app-links";
import {
  getActiveMerch,
  getMerchBySlug,
  type MerchRow,
} from "@/lib/merch-helpers";
import { formatPrice, localizeMerch } from "@/lib/merch-format";

export const dynamicParams = false;

interface RouteParams {
  slug: string;
}

interface Props {
  params: Promise<RouteParams>;
}

export async function generateStaticParams(): Promise<RouteParams[]> {
  const merch = await getActiveMerch();
  return merch.map((m) => ({ slug: m.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const [row, localeRaw] = await Promise.all([getMerchBySlug(slug), getLocale()]);
  if (!row) return {};
  const locale = asAppLocale(localeRaw);
  const { name, description } = localizeMerch(row, locale);
  const url = `${SITE_URL}/shop/${slug}`;
  const image = row.imageUrls[0];
  return {
    title: `${name} · Cims, sempre amunt`,
    description: description ? truncate(description, 160) : undefined,
    alternates: { canonical: url },
    openGraph: {
      type: "website",
      url,
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

const Gallery = ({ images, name }: { images: string[]; name: string }) => {
  if (!images.length) {
    return <div className="w-full aspect-square bg-muted rounded-xl" />;
  }
  const [main, ...rest] = images;
  return (
    <div className="flex flex-col gap-4">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={main}
        alt={name}
        width={1200}
        height={1200}
        fetchPriority="high"
        className="w-full aspect-square object-cover rounded-xl border"
      />
      {rest.length ? (
        <div className="grid grid-cols-3 gap-3">
          {rest.slice(0, 3).map((src) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={src}
              src={src}
              alt={name}
              loading="lazy"
              width={400}
              height={400}
              className="w-full aspect-square object-cover rounded-lg border"
            />
          ))}
        </div>
      ) : null}
    </div>
  );
};

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
  const { slug } = await params;
  const [localeRaw, t, row] = await Promise.all([
    getLocale(),
    getTranslations("shop-page"),
    getMerchBySlug(slug),
  ]);
  if (!row) notFound();

  const locale = asAppLocale(localeRaw);
  const { name, description } = localizeMerch(row, locale);

  return (
    <div lang={locale} className="min-h-screen flex flex-col">
      <main className="flex-1">
        <section className="py-12 sm:py-16 px-4">
          <div className="max-w-6xl mx-auto">
            <a
              href="/shop"
              className="inline-block text-sm text-muted-foreground hover:text-foreground mb-8"
            >
              {t("back-to-list")}
            </a>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              <Gallery images={row.imageUrls} name={name} />
              <div className="flex flex-col gap-6">
                <div>
                  <h1 className="text-3xl sm:text-5xl font-black mb-2">
                    {name}
                  </h1>
                  <p className="text-2xl text-primary font-bold">
                    {formatPrice(row.price, locale)}
                  </p>
                </div>
                {description ? (
                  <p className="text-lg text-muted-foreground leading-relaxed whitespace-pre-line">
                    {description}
                  </p>
                ) : null}
                <BuyBlock row={row} name={name} t={t} />
              </div>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter strings={buildFooterStrings(locale)} />
    </div>
  );
}

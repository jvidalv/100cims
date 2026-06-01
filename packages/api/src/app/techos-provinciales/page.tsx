import type { Metadata } from "next";

import { buildFooterStrings } from "@/app/challenges/_components/build-footer-strings";
import { SiteFooter } from "@/components/site-footer";
import { ANDROID_APP_URL, IOS_APP_URL, SITE_URL } from "@/lib/app-links";

import { Cta } from "./_components/cta";
import { Faq } from "./_components/faq";
import { FeaturedPeaks } from "./_components/featured-peaks";
import { Hero } from "./_components/hero";
import { HowItWorks } from "./_components/how-it-works";
import { Stats } from "./_components/stats";
import { WhatIs } from "./_components/what-is";

const CANONICAL = `${SITE_URL}/techos-provinciales`;

export const metadata: Metadata = {
  title:
    "Techos Provinciales · El pico más alto de cada provincia de España | Cims, sempre amunt",
  description:
    "La app gratuita y sin anuncios para seguir tu progreso ascendiendo el techo de cada provincia de España: 47 cumbres, del Teide a los discretos altos de la meseta.",
  alternates: { canonical: CANONICAL },
  openGraph: {
    type: "website",
    url: CANONICAL,
    siteName: "Cims, sempre amunt",
    title: "Techos Provinciales · El pico más alto de cada provincia",
    description:
      "Sigue tu progreso en los 47 techos provinciales de España desde la app. Gratis, iOS y Android.",
    locale: "es_ES",
  },
  twitter: {
    card: "summary_large_image",
    title: "Techos Provinciales · 47 cumbres en tu móvil",
    description:
      "App gratuita para registrar el techo de cada provincia de España. iOS y Android.",
  },
};

const MobileAppJsonLd = () => {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "MobileApplication",
    name: "Cims, sempre amunt",
    operatingSystem: "iOS, Android",
    applicationCategory: "SportsApplication",
    description:
      "App para seguir tu progreso ascendiendo los 47 techos provinciales de España y decenas de otras listas de montañas.",
    offers: { "@type": "Offer", price: "0", priceCurrency: "EUR" },
    inLanguage: "es",
    url: CANONICAL,
    downloadUrl: [IOS_APP_URL, ANDROID_APP_URL],
  };
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
};

export default function TechosProvincialesPage() {
  return (
    <div lang="es" className="min-h-screen flex flex-col">
      <MobileAppJsonLd />
      <main className="flex-1">
        <Hero />
        <WhatIs />
        <Stats />
        <HowItWorks />
        <FeaturedPeaks />
        <Faq />
        <Cta />
      </main>

      <SiteFooter strings={buildFooterStrings("es")} />
    </div>
  );
}

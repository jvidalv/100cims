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

const CANONICAL = `${SITE_URL}/ehun-mendiak`;

export const metadata: Metadata = {
  title:
    "Ehun Mendiak · 100 cumbres del centenario de la EMF | Cims, sempre amunt",
  description:
    "La app gratuita y sin anuncios para seguir tu progreso en las 100 cumbres vasco-navarras del Centenario Especial del 100 Aniversario de la Federación Vasco-Navarra de Alpinismo.",
  alternates: { canonical: CANONICAL },
  openGraph: {
    type: "website",
    url: CANONICAL,
    siteName: "Cims, sempre amunt",
    title: "Ehun Mendiak · 100 cumbres del centenario",
    description:
      "Sigue tu progreso en las 100 cumbres del centenario de la EMF desde la app. Gratis, iOS y Android.",
    locale: "es_ES",
  },
  twitter: {
    card: "summary_large_image",
    title: "Ehun Mendiak · 100 cumbres al móvil",
    description:
      "App gratis para registrar las 100 cumbres del Centenario de la EMF. iOS y Android.",
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
      "App para seguir tu progreso en las 100 cumbres vasco-navarras del centenario y decenas de otras listas de montañas.",
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

export default function EhunMendiakPage() {
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

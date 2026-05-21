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

const CANONICAL = `${SITE_URL}/sostres-comarcals`;

export const metadata: Metadata = {
  title:
    "Sostres Comarcals de Catalunya · El cim de cada comarca | Cims, sempre amunt",
  description:
    "L'app gratuïta i sense anuncis per seguir el teu progrés pujant el sostre de cada comarca de Catalunya: 41 cims, de la Pica d'Estats al Tibidabo.",
  alternates: { canonical: CANONICAL },
  openGraph: {
    type: "website",
    url: CANONICAL,
    siteName: "Cims, sempre amunt",
    title: "Sostres Comarcals de Catalunya · El cim de cada comarca",
    description:
      "Segueix el teu progrés pujant els 41 sostres comarcals de Catalunya des de l'app. Gratis, iOS i Android.",
    locale: "ca_ES",
  },
  twitter: {
    card: "summary_large_image",
    title: "Sostres Comarcals de Catalunya · 41 cims al mòbil",
    description:
      "App gratuïta per registrar el sostre de cada comarca de Catalunya. iOS i Android.",
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
      "App per seguir el teu progrés pujant els 41 sostres comarcals de Catalunya i desenes d'altres llistes de muntanyes.",
    offers: { "@type": "Offer", price: "0", priceCurrency: "EUR" },
    inLanguage: "ca",
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

export default function SostresComarcalsPage() {
  return (
    <div lang="ca" className="min-h-screen flex flex-col">
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

      <SiteFooter strings={buildFooterStrings("ca")} />
    </div>
  );
}

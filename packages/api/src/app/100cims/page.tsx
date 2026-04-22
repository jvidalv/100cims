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

const CANONICAL = `${SITE_URL}/100cims`;

export const metadata: Metadata = {
  title: "100 Cims · Registra els teus cims al mòbil | Cims, sempre amunt",
  description:
    "L'app per seguir el teu progrés al repte dels 100 Cims i altres llistes de cims de Catalunya. Gratuïta, sense anuncis, iOS i Android.",
  alternates: { canonical: CANONICAL },
  openGraph: {
    type: "website",
    url: CANONICAL,
    siteName: "Cims, sempre amunt",
    title: "100 Cims · Registra els teus cims al mòbil",
    description:
      "Segueix el teu progrés al repte dels 100 Cims des del mòbil. Gratuïta, iOS i Android.",
    locale: "ca_ES",
  },
  twitter: {
    card: "summary_large_image",
    title: "100 Cims · Registra els teus cims",
    description:
      "Segueix el teu progrés al repte dels 100 Cims des del mòbil. Gratuïta.",
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
      "App per seguir el teu progrés al repte dels 100 Cims i altres llistes de cims.",
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

export default function CimsPage() {
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

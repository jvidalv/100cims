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

const CANONICAL = `${SITE_URL}/three-peaks`;

export const metadata: Metadata = {
  title:
    "National Three Peaks Challenge · Track Ben Nevis, Scafell Pike & Snowdon | Cims, sempre amunt",
  description:
    "Free iOS & Android app to track your progress on the UK's National Three Peaks Challenge — Ben Nevis, Scafell Pike and Yr Wyddfa (Snowdon). No ads, no tracking.",
  alternates: { canonical: CANONICAL },
  openGraph: {
    type: "website",
    url: CANONICAL,
    siteName: "Cims, sempre amunt",
    title:
      "National Three Peaks Challenge · Track Ben Nevis, Scafell Pike & Snowdon",
    description:
      "Track your progress on the UK's National Three Peaks from the app. Free, iOS and Android.",
    locale: "en_GB",
  },
  twitter: {
    card: "summary_large_image",
    title: "National Three Peaks Challenge · Track on mobile",
    description:
      "Track Ben Nevis, Scafell Pike and Yr Wyddfa (Snowdon) from the app. Free.",
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
      "App to track your progress on the UK's National Three Peaks Challenge and dozens of other summit lists.",
    offers: { "@type": "Offer", price: "0", priceCurrency: "EUR" },
    inLanguage: "en",
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

export default function ThreePeaksPage() {
  return (
    <div lang="en" className="min-h-screen flex flex-col">
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

      <SiteFooter strings={buildFooterStrings("en")} />
    </div>
  );
}

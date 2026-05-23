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

const CANONICAL = `${SITE_URL}/philippine-ultras`;

export const metadata: Metadata = {
  title:
    "Philippine Ultras · The 29 ultra-prominent peaks of the Philippines | Cims, sempre amunt",
  description:
    "The free, ad-free app to track your progress climbing the 29 ultra-prominent peaks of the Philippines — from Mount Apo to Mount Mambajao.",
  alternates: { canonical: CANONICAL },
  openGraph: {
    type: "website",
    url: CANONICAL,
    siteName: "Cims, sempre amunt",
    title: "Philippine Ultras · 29 ultra-prominent peaks",
    description:
      "Track your progress climbing the 29 ultras of the Philippines from the app. Free, iOS and Android.",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Philippine Ultras · 29 peaks on your phone",
    description:
      "Free app to log the 29 ultra-prominent peaks of the Philippines. iOS and Android.",
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
      "App to track your progress climbing the 29 ultra-prominent peaks of the Philippines and dozens of other mountain lists.",
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

export default function PhilippineUltrasPage() {
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

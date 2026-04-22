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

const CANONICAL = `${SITE_URL}/scottish-munros`;

export const metadata: Metadata = {
  title:
    "Scottish Munros · Track all 282 Munros on iOS & Android | Cims, sempre amunt",
  description:
    "Free, ad-free app to track your progress on the 282 Scottish Munros — every mountain in Scotland over 3,000 ft. Log ascents with photo and date, share your progress, follow other Munro-baggers.",
  alternates: { canonical: CANONICAL },
  openGraph: {
    type: "website",
    url: CANONICAL,
    siteName: "Cims, sempre amunt",
    title: "Scottish Munros · Track all 282 Munros on iOS & Android",
    description:
      "Track your progress on the 282 Scottish Munros from the app. Free, iOS and Android.",
    locale: "en_GB",
  },
  twitter: {
    card: "summary_large_image",
    title: "Scottish Munros · Track all 282 on mobile",
    description:
      "Free app to track every Munro you climb in Scotland. iOS and Android.",
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
      "App to track your progress on the 282 Scottish Munros and dozens of other summit lists.",
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

export default function ScottishMunrosPage() {
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

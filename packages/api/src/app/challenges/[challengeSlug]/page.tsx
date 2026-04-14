import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { CHALLENGE_CONTENT, isOfficialSlug } from "@/app/challenges/content";
import { ChallengeCta } from "@/app/challenges/_components/challenge-cta";
import { ChallengeFaq } from "@/app/challenges/_components/challenge-faq";
import { ChallengeFeaturedPeaks } from "@/app/challenges/_components/challenge-featured-peaks";
import { ChallengeHero } from "@/app/challenges/_components/challenge-hero";
import { ChallengeHowItWorks } from "@/app/challenges/_components/challenge-how-it-works";
import { ChallengeStats } from "@/app/challenges/_components/challenge-stats";
import { ChallengeWhatIs } from "@/app/challenges/_components/challenge-what-is";
import { buildFooterStrings } from "@/app/challenges/_components/build-footer-strings";
import { SiteFooter } from "@/components/site-footer";
import { ANDROID_APP_URL, IOS_APP_URL, SITE_URL } from "@/lib/app-links";
import {
  getFeaturedPeaksForChallenge,
  getOfficialChallengeBySlug,
} from "@/lib/challenge-helpers";

const OG_LOCALE = {
  ca: "ca_ES",
  es: "es_ES",
  en: "en_US",
} as const;

export const dynamicParams = false;

interface RouteParams {
  challengeSlug: string;
}

interface Props {
  params: Promise<RouteParams>;
}

export function generateStaticParams(): RouteParams[] {
  return Object.keys(CHALLENGE_CONTENT).map((challengeSlug) => ({
    challengeSlug,
  }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { challengeSlug } = await params;
  if (!isOfficialSlug(challengeSlug)) return {};
  const content = CHALLENGE_CONTENT[challengeSlug];
  const url = `${SITE_URL}/challenges/${challengeSlug}`;
  const image = `${SITE_URL}/assets/1.png`;

  return {
    title: content.title,
    description: content.description,
    alternates: { canonical: url },
    openGraph: {
      type: "website",
      url,
      siteName: "Cims, sempre amunt",
      title: content.title,
      description: content.description,
      images: [{ url: image, width: 1200, height: 630, alt: content.title }],
      locale: OG_LOCALE[content.locale],
    },
    twitter: {
      card: "summary_large_image",
      title: content.title,
      description: content.description,
      images: [image],
    },
  };
}

const MobileAppJsonLd = ({ url, name }: { url: string; name: string }) => {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "MobileApplication",
    name: "Cims, sempre amunt",
    operatingSystem: "iOS, Android",
    applicationCategory: "SportsApplication",
    description: `App per registrar ${name}.`,
    offers: { "@type": "Offer", price: "0", priceCurrency: "EUR" },
    url,
    downloadUrl: [IOS_APP_URL, ANDROID_APP_URL],
  };
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
};

export default async function ChallengePage({ params }: Props) {
  const { challengeSlug } = await params;
  if (!isOfficialSlug(challengeSlug)) notFound();
  const content = CHALLENGE_CONTENT[challengeSlug];

  const challenge = await getOfficialChallengeBySlug(challengeSlug);
  if (!challenge) notFound();

  const peaks = await getFeaturedPeaksForChallenge(challenge.id, 12);
  const url = `${SITE_URL}/challenges/${challengeSlug}`;
  const footerStrings = buildFooterStrings(content.locale);

  return (
    <div lang={content.locale} className="min-h-screen flex flex-col">
      <MobileAppJsonLd url={url} name={challenge.name} />
      <main className="flex-1">
        <ChallengeHero
          name={challenge.name}
          emoji={challenge.emoji}
          tagline={content.heroTagline}
          imageUrl={content.heroImageUrl}
        />
        <ChallengeWhatIs
          title={content.whatIsTitle}
          paragraphs={content.whatIsParagraphs}
        />
        <ChallengeStats
          locale={content.locale}
          summitCount={challenge.summitCount}
          mountainCount={challenge.mountainCount}
        />
        <ChallengeHowItWorks locale={content.locale} />
        <ChallengeFeaturedPeaks locale={content.locale} peaks={peaks} />
        <ChallengeFaq locale={content.locale} items={content.faqs} />
        <ChallengeCta locale={content.locale} />
      </main>
      <SiteFooter strings={footerStrings} />
    </div>
  );
}

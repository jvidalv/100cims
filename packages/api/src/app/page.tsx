"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { CHALLENGE_CONTENT } from "@/app/challenges/content";
import { SiteFooter, type SiteFooterStrings } from "@/components/site-footer";
import { AppleIcon, PlayStoreIcon } from "@/components/store-icons";
import { Button } from "@/components/ui/button";
import { ANDROID_APP_URL, IOS_APP_URL } from "@/lib/app-links";

const FEATURED_SLUG = "100-cims";

const OTHER_CHALLENGES = Object.entries(CHALLENGE_CONTENT).filter(
  ([slug]) => slug !== FEATURED_SLUG,
);

const FEATURED_IMAGE_URL = CHALLENGE_CONTENT[FEATURED_SLUG].heroImageUrl;

export default function Home() {
  const t = useTranslations("home-page");
  const footer = useTranslations("footer");
  const [isIos, setIsIos] = useState(false);

  useEffect(() => {
    setIsIos(/iPhone|iPad|iPod|Macintosh/i.test(navigator.userAgent));
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1">
        {/* Hero Section */}
        <section className="flex flex-col items-center justify-center py-8 sm:py-10 px-4">
          <img
            src="/assets/logo.png"
            alt="Join cims"
            className="rounded mb-6 shadow-lg h-32"
          />
          <p className="text-lg sm:text-2xl text-center text-muted-foreground mb-8 max-w-2xl">
            {t("subtitle")}
          </p>
          <a href={isIos ? IOS_APP_URL : ANDROID_APP_URL} target="_blank">
            <Button size="lg" className="font-bold text-xl">
              {t("download")}
            </Button>
          </a>
        </section>

        {/* Screenshots Section */}
        <section className="py-8 px-4">
          <div className="max-w-7xl mx-auto overflow-x-auto scrollbar-none">
            <div className="flex gap-6 justify-center min-w-max">
              {[
                {
                  src: "/assets/1.png",
                  alt: "App homepage showing challenges",
                },
                { src: "/assets/2.png", alt: "User profile with summits" },
                { src: "/assets/3.png", alt: "Mountain map view" },
                { src: "/assets/4.png", alt: "Mountain detail page" },
              ].map((s) => (
                <img
                  key={s.src}
                  src={s.src}
                  alt={s.alt}
                  className="rounded-2xl border shadow-lg"
                  width={320}
                  height={693}
                />
              ))}
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-16 px-4 bg-muted/30">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-3xl sm:text-4xl font-bold text-center mb-12">
              {t("features-title")}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
              <div className="p-6 rounded-xl bg-background border">
                <h3 className="text-xl font-bold mb-2">
                  {t("feature-1-title")}
                </h3>
                <p className="text-muted-foreground">
                  {t("feature-1-description")}
                </p>
              </div>
              <div className="p-6 rounded-xl bg-background border">
                <h3 className="text-xl font-bold mb-2">
                  {t("feature-2-title")}
                </h3>
                <p className="text-muted-foreground">
                  {t("feature-2-description")}
                </p>
              </div>
              <div className="p-6 rounded-xl bg-background border">
                <h3 className="text-xl font-bold mb-2">
                  {t("feature-3-title")}
                </h3>
                <p className="text-muted-foreground">
                  {t("feature-3-description")}
                </p>
              </div>
              <div className="p-6 rounded-xl bg-background border">
                <h3 className="text-xl font-bold mb-2">
                  {t("feature-4-title")}
                </h3>
                <p className="text-muted-foreground">
                  {t("feature-4-description")}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Featured 100 Cims */}
        <section className="py-16 px-4">
          <div className="max-w-5xl mx-auto">
            <a
              href="/100cims"
              className="group block rounded-2xl border overflow-hidden bg-background hover:border-primary transition-colors"
            >
              <div className="grid md:grid-cols-2 gap-0">
                <div className="p-8 sm:p-12 bg-gradient-to-br from-primary/10 to-primary/5">
                  <div className="text-sm font-semibold text-primary mb-2 uppercase tracking-wide">
                    {t("featured-challenge-eyebrow")}
                  </div>
                  <h2 className="text-3xl sm:text-5xl font-black mb-4">
                    {t("featured-challenge-title")}
                  </h2>
                  <p className="text-lg text-muted-foreground mb-6">
                    {t("featured-challenge-body")}
                  </p>
                  <span className="inline-block text-lg font-bold text-primary">
                    {t("featured-challenge-cta")}
                  </span>
                </div>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={FEATURED_IMAGE_URL}
                  alt="100 Cims"
                  loading="lazy"
                  width={800}
                  height={600}
                  className="w-full h-full object-cover aspect-[4/3] md:aspect-auto min-h-[260px] group-hover:scale-105 transition-transform"
                />
              </div>
            </a>
          </div>
        </section>

        {/* All official challenges */}
        <section className="py-16 px-4 bg-muted/30">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl sm:text-4xl font-bold text-center mb-3">
              {t("challenges-title")}
            </h2>
            <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
              {t("challenges-subtitle")}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {OTHER_CHALLENGES.map(([slug, content]) => (
                <a
                  key={slug}
                  href={`/challenges/${slug}`}
                  className="group rounded-xl overflow-hidden bg-background border hover:border-primary transition-colors"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={content.heroImageUrl}
                    alt={content.shortName}
                    loading="lazy"
                    width={600}
                    height={400}
                    className="w-full aspect-[3/2] object-cover group-hover:scale-105 transition-transform"
                  />
                  <div className="p-5">
                    <h3 className="text-lg font-bold mb-2">
                      {content.shortName}
                    </h3>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {content.heroTagline}
                    </p>
                  </div>
                </a>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              {t("cta-title")}
            </h2>
            <p className="text-xl text-muted-foreground mb-8">
              {t("cta-subtitle")}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <a href={IOS_APP_URL} target="_blank">
                <Button size="lg" className="font-bold gap-2">
                  <AppleIcon />
                  App Store
                </Button>
              </a>
              <a href={ANDROID_APP_URL} target="_blank">
                <Button size="lg" variant="outline" className="font-bold gap-2">
                  <PlayStoreIcon />
                  Google Play
                </Button>
              </a>
            </div>
            <p className="text-sm text-muted-foreground mt-4">
              {t("available-on")}
            </p>
          </div>
        </section>
      </main>

      <SiteFooter
        strings={
          {
            tagline: footer("tagline"),
            rights: footer("rights"),
            colApp: footer("col-app"),
            colAppHome: footer("col-app-home"),
            colAppChallenge: footer("col-app-challenge"),
            colAppIos: footer("col-app-ios"),
            colAppAndroid: footer("col-app-android"),
            colLegal: footer("col-legal"),
            privacyPolicy: footer("privacy-policy"),
            termsOfService: footer("terms-of-service"),
            colContact: footer("col-contact"),
            colContactHelp: footer("col-contact-help"),
            madeBy: footer("made-by"),
            colChallenges: footer("col-challenges"),
            colAppShop: footer("col-app-shop"),
          } satisfies SiteFooterStrings
        }
      />
    </div>
  );
}

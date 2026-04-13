"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";

const iosLink =
  "https://apps.apple.com/app/100cims/id6740161401?platform=iphone";
const androidLink =
  "https://play.google.com/store/apps/details?id=app.x100cims.x100cims";

const AppleIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
  </svg>
);

const PlayStoreIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
    <path d="M3,20.5V3.5C3,2.91 3.34,2.39 3.84,2.15L13.69,12L3.84,21.85C3.34,21.6 3,21.09 3,20.5M16.81,15.12L6.05,21.34L14.54,12.85L16.81,15.12M20.16,10.81C20.5,11.08 20.75,11.5 20.75,12C20.75,12.5 20.53,12.9 20.18,13.18L17.89,14.5L15.39,12L17.89,9.5L20.16,10.81M6.05,2.66L16.81,8.88L14.54,11.15L6.05,2.66Z" />
  </svg>
);

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
        <section className="flex flex-col items-center justify-center py-16 sm:py-24 px-4">
          <img
            src="/assets/icon.png"
            alt="Cims app icon"
            width={100}
            height={100}
            className="rounded-2xl mb-6 shadow-lg"
          />
          <h1 className="text-5xl sm:text-6xl text-center font-black mb-2">
            {t.rich("title", {
              appName: (chunk) => <span className="text-primary">{chunk}</span>,
            })}
          </h1>
          <p className="text-xl text-center text-muted-foreground mb-8 max-w-2xl">
            {t("subtitle")}
          </p>
          <a href={isIos ? iosLink : androidLink} target="_blank">
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
              <a href={iosLink} target="_blank">
                <Button size="lg" className="font-bold gap-2">
                  <AppleIcon />
                  App Store
                </Button>
              </a>
              <a href={androidLink} target="_blank">
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

      {/* Footer */}
      <footer className="border-t py-8 px-4">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex gap-6 text-sm">
            <a
              href="/privacy-policy"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              {footer("privacy-policy")}
            </a>
            <a
              href="/terms-of-service"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              {footer("terms-of-service")}
            </a>
            <a
              href="/contact"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              {footer("contact")}
            </a>
          </div>
          <p className="text-sm text-muted-foreground">
            {footer("made-by")}{" "}
            <a
              href="https://josepvidal.dev"
              target="_blank"
              className="text-foreground hover:underline"
            >
              Josep Vidal
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}

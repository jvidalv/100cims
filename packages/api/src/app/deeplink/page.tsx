"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

import { AppleIcon, PlayStoreIcon } from "@/components/store-icons";
import { Button } from "@/components/ui/button";
import { detectPlatform, resolveStoreUrl, SITE_URL } from "@/lib/app-links";

const Content = () => {
  const searchParams = useSearchParams();
  const [mounted, setMounted] = useState(false);

  const link = searchParams.get("link");
  const platform = mounted ? detectPlatform(navigator.userAgent) : "other";

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    if (!link || platform === "other") {
      window.location.href = SITE_URL;
      return;
    }

    // Best-effort auto-open. In-app browsers (Instagram, WhatsApp, etc.)
    // silently ignore this, which is why the tap button below is the real
    // fix — it works because it's an actual user gesture.
    window.location.href = link;
  }, [mounted, link, platform]);

  if (!mounted || !link || platform === "other") return null;

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6">
      <div className="flex w-full max-w-sm flex-col items-center gap-6 rounded-3xl border border-border/40 bg-card/40 px-8 py-10 text-center">
        <img
          src="/assets/logo.png"
          alt="100cims"
          width={88}
          height={88}
          className="rounded-2xl shadow-lg"
        />
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-bold">Obrir a l&apos;app 100cims</h1>
          <p className="text-base text-muted-foreground">
            Si l&apos;app no s&apos;ha obert automàticament, toca el botó.
          </p>
        </div>
        <a href={link} className="w-full">
          <Button size="lg" className="w-full font-bold">
            Obrir a l&apos;app
          </Button>
        </a>
        <a
          href={resolveStoreUrl(platform)}
          target="_blank"
          rel="noopener"
          className="flex items-center gap-2 text-sm text-muted-foreground underline-offset-4 hover:underline"
        >
          {platform === "ios" ? <AppleIcon /> : <PlayStoreIcon />}
          No tens l&apos;app? Instal·la-la
        </a>
      </div>
    </main>
  );
};

export default function DeeplinkPage() {
  return (
    <Suspense>
      <Content />
    </Suspense>
  );
}

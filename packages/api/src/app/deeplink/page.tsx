"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

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
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 px-6 text-center">
      <h1 className="text-2xl font-semibold">Obrir a l&apos;app 100cims</h1>
      <p className="text-base text-muted-foreground">
        Si l&apos;app no s&apos;ha obert automàticament, toca el botó.
      </p>
      <a href={link}>
        <Button size="lg" className="font-bold">
          Obrir a l&apos;app
        </Button>
      </a>
      <a
        href={resolveStoreUrl(platform)}
        target="_blank"
        rel="noopener"
        className="text-sm text-muted-foreground underline"
      >
        No tens l&apos;app? Instal·la-la
      </a>
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

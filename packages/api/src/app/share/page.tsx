"use client";

import { useEffect } from "react";

import { AppleIcon, PlayStoreIcon } from "@/components/store-icons";
import { Button } from "@/components/ui/button";
import { ANDROID_APP_URL, detectPlatform, IOS_APP_URL } from "@/lib/app-links";

export default function SharePage() {
  useEffect(() => {
    const platform = detectPlatform(navigator.userAgent);
    if (platform === "ios") window.location.replace(IOS_APP_URL);
    if (platform === "android") window.location.replace(ANDROID_APP_URL);
  }, []);

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
          <h1 className="text-2xl font-bold">Descarrega 100cims</h1>
          <p className="text-base text-muted-foreground">
            El repte de fer els 100 cims, al teu mòbil.
          </p>
        </div>
        <div className="flex w-full flex-col gap-3">
          <a href={IOS_APP_URL} target="_blank" rel="noopener">
            <Button size="lg" className="w-full gap-2 font-bold">
              <AppleIcon />
              App Store
            </Button>
          </a>
          <a href={ANDROID_APP_URL} target="_blank" rel="noopener">
            <Button
              size="lg"
              variant="outline"
              className="w-full gap-2 font-bold"
            >
              <PlayStoreIcon />
              Google Play
            </Button>
          </a>
        </div>
      </div>
    </main>
  );
}

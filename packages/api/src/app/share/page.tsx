"use client";

import { useLayoutEffect, useState } from "react";

import { ANDROID_APP_URL, IOS_APP_URL } from "@/lib/app-links";

type Platform = "ios" | "android" | "other";

const detectPlatform = (ua: string): Platform => {
  if (/iPhone|iPad|iPod/i.test(ua)) return "ios";
  if (/Android/i.test(ua)) return "android";
  return "other";
};

export default function SharePage() {
  const [platform, setPlatform] = useState<Platform | null>(null);

  useLayoutEffect(() => {
    const p = detectPlatform(navigator.userAgent);
    if (p === "ios") {
      window.location.href = IOS_APP_URL;
      return;
    }
    if (p === "android") {
      window.location.href = ANDROID_APP_URL;
      return;
    }
    setPlatform("other");
  }, []);

  if (platform !== "other") return null;

  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-6 px-6 py-12 text-center">
      <h1 className="text-4xl font-bold">Cims</h1>
      <p className="max-w-md text-muted-foreground">
        Track your summits, plan your outings, and share them with people.
        Download Cims on your phone:
      </p>
      <div className="flex flex-col sm:flex-row gap-3">
        <a
          href={IOS_APP_URL}
          className="rounded bg-foreground text-background px-6 py-3 font-semibold"
        >
          App Store
        </a>
        <a
          href={ANDROID_APP_URL}
          className="rounded bg-foreground text-background px-6 py-3 font-semibold"
        >
          Google Play
        </a>
      </div>
    </main>
  );
}

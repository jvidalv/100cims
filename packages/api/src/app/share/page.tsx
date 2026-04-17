"use client";

import { useLayoutEffect } from "react";

import { ANDROID_APP_URL, IOS_APP_URL } from "@/lib/app-links";

const resolveRedirect = (ua: string): string => {
  if (/iPhone|iPad|iPod|Macintosh/i.test(ua)) return IOS_APP_URL;
  if (/Android/i.test(ua)) return ANDROID_APP_URL;
  return "/";
};

export default function SharePage() {
  useLayoutEffect(() => {
    window.location.replace(resolveRedirect(navigator.userAgent));
  }, []);

  return null;
}

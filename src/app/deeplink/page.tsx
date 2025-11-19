"use client";

import { Suspense, useLayoutEffect } from "react";
import { useSearchParams } from "next/navigation";

const MOBILE_USER_AGENT_REGEX = /Android|iPhone|iPad|iPod/i;
const FALLBACK_URL = "https://cims-sempre-amunt.app";

const Content = () => {
  const searchParams = useSearchParams();

  useLayoutEffect(() => {
    const link = searchParams.get("link");
    if (!link) {
      window.location.href = FALLBACK_URL;
      return;
    }

    const isMobile = MOBILE_USER_AGENT_REGEX.test(navigator.userAgent);

    if (!isMobile) {
      window.location.href = FALLBACK_URL;
      return;
    }

    window.location.href = link;
  }, [searchParams]);

  return null;
};

export default function DeeplinkPage() {
  return (
    <Suspense>
      <Content />
    </Suspense>
  );
}

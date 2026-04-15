"use client";

import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { ANDROID_APP_URL, IOS_APP_URL } from "@/lib/app-links";

export const DownloadButton = ({ label }: { label: string }) => {
  const [isIos, setIsIos] = useState(false);

  useEffect(() => {
    setIsIos(/iPhone|iPad|iPod|Macintosh/i.test(navigator.userAgent));
  }, []);

  return (
    <a href={isIos ? IOS_APP_URL : ANDROID_APP_URL} target="_blank">
      <Button size="lg" className="font-bold text-xl">
        {label}
      </Button>
    </a>
  );
};

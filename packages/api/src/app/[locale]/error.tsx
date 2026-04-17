"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { useEffect } from "react";

import { ErrorLayout } from "@/components/error-layout";
import { Button } from "@/components/ui/button";

interface Props {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function LocaleError({ error, reset }: Props) {
  const t = useTranslations("error-page");

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <ErrorLayout
      eyebrow={t("server-eyebrow")}
      title={t("server-title")}
      body={t("server-body")}
      digest={error.digest}
      actions={
        <>
          <Button type="button" size="lg" className="font-bold" onClick={reset}>
            {t("retry")}
          </Button>
          <Button asChild size="lg" variant="outline" className="font-bold">
            <Link href="/">{t("go-home")}</Link>
          </Button>
        </>
      }
    />
  );
}

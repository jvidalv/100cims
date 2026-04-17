import Link from "next/link";
import { getTranslations } from "next-intl/server";

import { ErrorLayout } from "@/components/error-layout";
import { Button } from "@/components/ui/button";

export default async function LocaleNotFound() {
  const t = await getTranslations("error-page");
  return (
    <ErrorLayout
      eyebrow={t("not-found-eyebrow")}
      title={t("not-found-title")}
      body={t("not-found-body")}
      actions={
        <>
          <Button asChild size="lg" className="font-bold">
            <Link href="/">{t("go-home")}</Link>
          </Button>
          <Button asChild size="lg" variant="outline" className="font-bold">
            <Link href="/challenges">{t("browse-challenges")}</Link>
          </Button>
        </>
      }
    />
  );
}

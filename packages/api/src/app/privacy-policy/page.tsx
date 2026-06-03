import { useTranslations } from "next-intl";

import { buildFooterStrings } from "@/app/challenges/_components/build-footer-strings";
import { SiteFooter } from "@/components/site-footer";

export default function PrivacyPolicy() {
  const t = useTranslations("privacy-policy");

  return (
    <>
      <main className="mx-auto w-full max-w-3xl px-6 py-12">
        <h1 className="mb-4 text-5xl font-black">{t("title")}</h1>
        <p className="text-lg text-muted-foreground">{t("content")}</p>
      </main>
      <SiteFooter strings={buildFooterStrings("en")} />
    </>
  );
}

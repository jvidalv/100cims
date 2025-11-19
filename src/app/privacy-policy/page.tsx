import { useTranslations } from "next-intl";
import Image from "next/image";

export default function PrivacyPolicy() {
  const t = useTranslations("privacy-policy");

  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-12">
      <h1 className="mb-4 text-5xl font-black">{t("title")}</h1>
      <p className="text-lg text-muted-foreground">{t("content")}</p>
      <footer className="mt-16 pb-12 row-start-3 flex gap-6 flex-wrap items-center justify-center">
        <a
          className="flex items-center gap-2 hover:underline hover:underline-offset-4"
          href="https://expofast.app"
        >
          <Image
            aria-hidden
            src="/globe.svg"
            alt="Globe icon"
            width={16}
            height={16}
          />
          Powered by expofast →
        </a>
      </footer>
    </main>
  );
}

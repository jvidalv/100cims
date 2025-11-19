import Image from "next/image";
import { use } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { headers } from "next/headers";

const iosLink =
  "https://apps.apple.com/app/100cims/id6740161401?platform=iphone";
const androidLink =
  "https://play.google.com/store/apps/details?id=app.x100cims.x100cims";

export default function Home() {
  const t = useTranslations("home-page");
  const params = use(headers());
  const isIos = params.get("X-Device-Type") === "ios";

  return (
    <div>
      <main className="flex flex-col min-h-screen items-center justify-center mx-auto max-w-4xl py-8 sm:py-0">
        <h1 className="text-5xl sm:text-6xl text-center font-black mb-1 px-4">
          {t.rich("title", {
            appName: (chunk) => <span className="text-primary">{chunk}</span>,
          })}
        </h1>
        <p className="text-xl text-center text-muted-foreground mb-8 px-4">
          {t("subtitle")}
        </p>
        <a href={isIos ? iosLink : androidLink} target="_blank">
          <Button size="lg" className="mb-8 font-bold text-xl">
            {t("download")} ↓
          </Button>
        </a>
        <div className="px-4 max-w-screen overflow-y-scroll sm:overflow-y-auto sm:max-w-none flex gap-4">
          <Image
            src="/assets/1.jpg"
            alt="App homepage"
            className="rounded-2xl border"
            width={300}
            height={500}
            priority
          />
          <Image
            src="/assets/3.jpg"
            alt="App mountain list"
            className="rounded-2xl border"
            width={300}
            height={550}
            priority
          />
          <Image
            src="/assets/2.jpg"
            alt="App mountain view"
            className="rounded-2xl border"
            width={300}
            height={550}
            priority
          />
        </div>
      </main>
      <footer className="pb-12 row-start-3 flex gap-6 flex-wrap items-center justify-center">
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
    </div>
  );
}

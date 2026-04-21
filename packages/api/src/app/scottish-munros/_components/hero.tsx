import { Button } from "@/components/ui/button";
import { ANDROID_APP_URL, IOS_APP_URL } from "@/lib/app-links";

import { getEnTranslator } from "./t";

export const Hero = () => {
  const t = getEnTranslator();
  return (
    <section className="flex flex-col items-center justify-center py-16 sm:py-24 px-4">
      <img
        src="/assets/logo.png"
        alt="Cims, sempre amunt app icon"
        width={150}
        height={150}
        className="rounded-2xl mb-6 shadow-lg"
      />
      <h1 className="text-5xl sm:text-6xl text-center font-black mb-4">
        <span className="text-primary">Scottish Munros</span> · Track all 282
      </h1>
      <p className="text-xl text-center text-muted-foreground mb-8 max-w-2xl">
        {t("hero-subtitle")}
      </p>
      <div className="flex flex-col sm:flex-row gap-3">
        <a href={IOS_APP_URL} target="_blank" rel="noopener">
          <Button size="lg" className="font-bold text-xl">
            {t("hero-cta")}
          </Button>
        </a>
        <a href={ANDROID_APP_URL} target="_blank" rel="noopener">
          <Button size="lg" variant="outline" className="font-bold text-xl">
            Google Play
          </Button>
        </a>
      </div>
    </section>
  );
};

import { AppleIcon, PlayStoreIcon } from "@/components/store-icons";
import { Button } from "@/components/ui/button";
import { ANDROID_APP_URL, IOS_APP_URL } from "@/lib/app-links";

import { getEnTranslator } from "./t";

export const Cta = () => {
  const t = getEnTranslator();
  return (
    <section className="py-16 px-4">
      <div className="max-w-3xl mx-auto text-center">
        <h2 className="text-3xl sm:text-4xl font-bold mb-4">
          {t("cta-title")}
        </h2>
        <p className="text-xl text-muted-foreground mb-8">
          {t("cta-subtitle")}
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <a href={IOS_APP_URL} target="_blank" rel="noopener">
            <Button size="lg" className="font-bold gap-2">
              <AppleIcon />
              App Store
            </Button>
          </a>
          <a href={ANDROID_APP_URL} target="_blank" rel="noopener">
            <Button size="lg" variant="outline" className="font-bold gap-2">
              <PlayStoreIcon />
              Google Play
            </Button>
          </a>
        </div>
        <p className="text-sm text-muted-foreground mt-4">
          {t("available-on")}
        </p>
      </div>
    </section>
  );
};

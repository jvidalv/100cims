import type { SiteFooterStrings } from "@/components/site-footer";
import type { ChallengeLocale } from "@/app/challenges/content/schema";
import { getFooterTranslator } from "@/lib/locale-dictionaries";

export const buildFooterStrings = (
  locale: ChallengeLocale,
): SiteFooterStrings => {
  const t = getFooterTranslator(locale);
  return {
    tagline: t("tagline"),
    rights: t("rights"),
    colApp: t("col-app"),
    colAppHome: t("col-app-home"),
    colAppChallenge: t("col-app-challenge"),
    colAppThreePeaks: t("col-app-three-peaks"),
    colAppScottishMunros: t("col-app-scottish-munros"),
    colAppIos: t("col-app-ios"),
    colAppAndroid: t("col-app-android"),
    colLegal: t("col-legal"),
    privacyPolicy: t("privacy-policy"),
    termsOfService: t("terms-of-service"),
    colContact: t("col-contact"),
    colContactHelp: t("col-contact-help"),
    madeBy: t("made-by"),
    colChallenges: t("col-challenges"),
    colAppShop: t("col-app-shop"),
    language: {
      label: t("language-label"),
      en: t("language-en"),
      ca: t("language-ca"),
      es: t("language-es"),
    },
  };
};

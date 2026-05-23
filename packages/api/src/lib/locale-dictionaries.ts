import { createTranslator } from "next-intl";
import type { AbstractIntlMessages } from "next-intl";

import caMessages from "../../messages/ca.json";
import enMessages from "../../messages/en.json";
import esMessages from "../../messages/es.json";

import type { ChallengeLocale } from "@/app/challenges/content/schema";

const MESSAGES_BY_LOCALE: Record<ChallengeLocale, AbstractIntlMessages> = {
  ca: caMessages,
  es: esMessages,
  en: enMessages,
};

export const getChallengeTemplateTranslator = (locale: ChallengeLocale) =>
  createTranslator({
    locale,
    messages: MESSAGES_BY_LOCALE[locale],
    namespace: "challenge-template",
  });

export const getFooterTranslator = (locale: ChallengeLocale) =>
  createTranslator({
    locale,
    messages: MESSAGES_BY_LOCALE[locale],
    namespace: "footer",
  });

type LandingPageNamespace =
  | "100cims-page"
  | "three-peaks-page"
  | "scottish-munros-page"
  | "picos-de-europa-page"
  | "picos-de-andalucia-page"
  | "cumbres-alicante-page"
  | "ehun-mendiak-page"
  | "sostres-comarcals-page"
  | "philippine-ultras-page"
  | "techos-provinciales-page";

export const getLandingPageTranslator = (
  locale: ChallengeLocale,
  namespace: LandingPageNamespace,
) =>
  createTranslator({
    locale,
    messages: MESSAGES_BY_LOCALE[locale],
    namespace,
  });

import { type AppLocale, normalizeAppLocale } from "@/api/lib/locale";

const planJoined = {
  en: (name: string) => `${name} joined your plan`,
  ca: (name: string) => `${name} s'ha unit al teu pla`,
  es: (name: string) => `${name} se ha unido a tu plan`,
} satisfies Record<AppLocale, (name: string) => string>;

const planLeft = {
  en: (name: string) => `${name} left your plan`,
  ca: (name: string) => `${name} ha deixat el teu pla`,
  es: (name: string) => `${name} ha dejado tu plan`,
} satisfies Record<AppLocale, (name: string) => string>;

const planChat = {
  en: "New message",
  ca: "Missatge nou",
  es: "Mensaje nuevo",
} satisfies Record<AppLocale, string>;

const mountainSuggestionTitle = {
  en: (km: number) => `${km} km from your next cim`,
  ca: (km: number) => `A ${km} km del teu proper cim`,
  es: (km: number) => `A ${km} km de tu próxima cima`,
} satisfies Record<AppLocale, (km: number) => string>;

const mountainSuggestionBody = {
  en: (name: string, done: number, total: number) =>
    `${name} — ${done} of ${total} done. Up for it?`,
  ca: (name: string, done: number, total: number) =>
    `${name} — ${done} de ${total} fets. T'animes?`,
  es: (name: string, done: number, total: number) =>
    `${name} — ${done} de ${total} hechos. ¿Te animas?`,
} satisfies Record<AppLocale, (name: string, done: number, total: number) => string>;

export const pushPlanJoined = (locale: string | null, name: string) =>
  planJoined[normalizeAppLocale(locale)](name);

export const pushPlanLeft = (locale: string | null, name: string) =>
  planLeft[normalizeAppLocale(locale)](name);

export const pushPlanChat = (locale: string | null) =>
  planChat[normalizeAppLocale(locale)];

export const pushMountainSuggestionTitle = (locale: string | null, km: number) =>
  mountainSuggestionTitle[normalizeAppLocale(locale)](km);

export const pushMountainSuggestionBody = (
  locale: string | null,
  name: string,
  progress: { done: number; total: number },
) =>
  mountainSuggestionBody[normalizeAppLocale(locale)](
    name,
    progress.done,
    progress.total,
  );

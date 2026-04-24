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

const planReminder = {
  en: "Coming up in 2 days — ready?",
  ca: "En 2 dies — tot a punt?",
  es: "En 2 días — ¿todo listo?",
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
} satisfies Record<
  AppLocale,
  (name: string, done: number, total: number) => string
>;

export const pushPlanJoined = (locale: string | null, name: string) =>
  planJoined[normalizeAppLocale(locale)](name);

export const pushPlanLeft = (locale: string | null, name: string) =>
  planLeft[normalizeAppLocale(locale)](name);

export const pushPlanChat = (locale: string | null) =>
  planChat[normalizeAppLocale(locale)];

export const pushPlanReminder = (locale: string | null) =>
  planReminder[normalizeAppLocale(locale)];

const summitTaggedTitle = {
  en: (mountainName: string) => `New summit of ${mountainName}`,
  ca: (mountainName: string) => `Nou cim del ${mountainName}`,
  es: (mountainName: string) => `Nueva cima del ${mountainName}`,
} satisfies Record<AppLocale, (mountainName: string) => string>;

const summitTaggedBody = {
  en: (name: string) => `${name} added you to a summit`,
  ca: (name: string) => `${name} t'ha afegit a un cim`,
  es: (name: string) => `${name} te ha añadido a una cima`,
} satisfies Record<AppLocale, (name: string) => string>;

export const pushSummitTaggedTitle = (
  locale: string | null,
  mountainName: string,
) => summitTaggedTitle[normalizeAppLocale(locale)](mountainName);

export const pushSummitTaggedBody = (locale: string | null, name: string) =>
  summitTaggedBody[normalizeAppLocale(locale)](name);

export const pushMountainSuggestionTitle = (
  locale: string | null,
  km: number,
) => mountainSuggestionTitle[normalizeAppLocale(locale)](km);

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

const shopRequestTitle = {
  en: "New merch request",
  ca: "Nova comanda de merch",
  es: "Nuevo pedido de merch",
} satisfies Record<AppLocale, string>;

const shopRequestBody = {
  en: (senderEmail: string, preview: string) =>
    `From ${senderEmail}: ${preview}`,
  ca: (senderEmail: string, preview: string) => `De ${senderEmail}: ${preview}`,
  es: (senderEmail: string, preview: string) => `De ${senderEmail}: ${preview}`,
} satisfies Record<AppLocale, (senderEmail: string, preview: string) => string>;

export const pushShopRequestTitle = (locale: string | null) =>
  shopRequestTitle[normalizeAppLocale(locale)];

export const pushShopRequestBody = (
  locale: string | null,
  senderEmail: string,
  preview: string,
) => shopRequestBody[normalizeAppLocale(locale)](senderEmail, preview);

const planForSavedMountainTitle = {
  en: (mountainName: string) => `New plan for ${mountainName}`,
  ca: (mountainName: string) => `Nou pla pel ${mountainName}`,
  es: (mountainName: string) => `Nuevo plan para ${mountainName}`,
} satisfies Record<AppLocale, (mountainName: string) => string>;

const planForSavedMountainBody = {
  en: (creatorName: string, planTitle: string) =>
    `${creatorName} just created: ${planTitle}`,
  ca: (creatorName: string, planTitle: string) =>
    `${creatorName} acaba de crear: ${planTitle}`,
  es: (creatorName: string, planTitle: string) =>
    `${creatorName} acaba de crear: ${planTitle}`,
} satisfies Record<
  AppLocale,
  (creatorName: string, planTitle: string) => string
>;

export const pushPlanForSavedMountainTitle = (
  locale: string | null,
  mountainName: string,
) => planForSavedMountainTitle[normalizeAppLocale(locale)](mountainName);

export const pushPlanForSavedMountainBody = (
  locale: string | null,
  creatorName: string,
  planTitle: string,
) =>
  planForSavedMountainBody[normalizeAppLocale(locale)](creatorName, planTitle);

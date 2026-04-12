type PushLocale = "en" | "ca" | "es";

const planJoined = {
  en: (name: string) => `${name} joined your plan`,
  ca: (name: string) => `${name} s'ha unit al teu pla`,
  es: (name: string) => `${name} se ha unido a tu plan`,
} satisfies Record<PushLocale, (name: string) => string>;

const planLeft = {
  en: (name: string) => `${name} left your plan`,
  ca: (name: string) => `${name} ha deixat el teu pla`,
  es: (name: string) => `${name} ha dejado tu plan`,
} satisfies Record<PushLocale, (name: string) => string>;

const normalizeLocale = (locale: string | null | undefined): PushLocale => {
  if (!locale) return "en";
  const short = locale.toLowerCase().split(/[-_]/)[0];
  if (short === "ca" || short === "es") return short;
  return "en";
};

export const pushPlanJoined = (locale: string | null, name: string) =>
  planJoined[normalizeLocale(locale)](name);

export const pushPlanLeft = (locale: string | null, name: string) =>
  planLeft[normalizeLocale(locale)](name);

export const pushPlanChat = (name: string, message: string) =>
  `${name}: ${message}`;

import type { ReactElement } from "react";
import { Resend } from "resend";

import { ReengageColdEmail } from "../../../emails/reengage-cold";
import { ReengageSummerEmail } from "../../../emails/reengage-summer";
import { WelcomeEmail, type WelcomeEmailLocale } from "../../../emails/welcome";

import { signEmailToken } from "@/api/lib/email-tokens";
import { SITE_URL } from "@/lib/app-links";

export const EMAIL_SLUGS = {
  welcome: "welcome",
  reengageCold: "reengage_cold",
  reengageSummer: "reengage_summer",
} as const;

// All current templates share the same locale set; kept as a single alias so
// subject lookups, pickLocale, and template props all agree.
type EmailLocale = WelcomeEmailLocale;

const subjects: Record<string, Record<EmailLocale, string>> = {
  welcome: {
    en: "Welcome to Cims",
    ca: "Benvingut a Cims",
    es: "Bienvenido a Cims",
  },
  reengage_cold: {
    en: "Your mountains are waiting",
    ca: "Els teus cims t'esperen",
    es: "Tus cimas te esperan",
  },
  reengage_summer: {
    en: "Summer's the season for it",
    ca: "L'estiu és la temporada",
    es: "El verano es la temporada",
  },
};

const pickLocale = (raw: string | null | undefined): EmailLocale => {
  const short = raw?.trim().toLowerCase().split(/[-_]/)[0];
  return short === "ca" || short === "es" ? short : "en";
};

const getResend = () =>
  process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

// Positive-assertion safety gate. Emails only flow in production; every other
// environment drops silently regardless of whether RESEND_API_KEY is set.
// The admin "Send test" button bypasses via sendRenderedEmail({ force: true }).
const isProduction = () => process.env.NODE_ENV === "production";

export const subjectForTemplate = (
  slug: string,
  locale: EmailLocale,
): string => {
  return subjects[slug]?.[locale] ?? `[${slug}] Cims`;
};

const dropOutsideProduction = (slug: string): boolean => {
  if (!isProduction()) {
    console.log(
      `[email] skipped outside production (NODE_ENV=${process.env.NODE_ENV ?? "undefined"}) slug=${slug}`,
    );
    return true;
  }
  return false;
};

const buildUnsubscribeUrl = async (
  userId: string,
  locale: EmailLocale,
): Promise<string> => {
  const token = await signEmailToken(userId, "unsubscribe");
  return `${SITE_URL}/unsubscribe?token=${encodeURIComponent(token)}&lang=${locale}`;
};

// RFC 8058: Gmail/Apple Mail/Outlook show a native "Unsubscribe" button when
// these headers are present. The POST variant lets clients one-click without
// rendering our page; the URL must accept POST too (see unsubscribe.post.ts).
const listUnsubscribeHeaders = (unsubscribeUrl: string) => ({
  "List-Unsubscribe": `<${unsubscribeUrl}>`,
  "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
});

export type EmailRecipient = {
  id: string;
  email: string;
  firstName: string | null;
  locale: string | null;
};

export const sendWelcomeEmail = async (user: EmailRecipient): Promise<void> => {
  if (dropOutsideProduction(EMAIL_SLUGS.welcome)) return;
  const from = process.env.RESEND_FROM_EMAIL;
  const resend = getResend();
  if (!resend || !from) return;

  try {
    const locale = pickLocale(user.locale);
    const unsubscribeUrl = await buildUnsubscribeUrl(user.id, locale);
    await resend.emails.send({
      from,
      to: user.email,
      subject: subjects.welcome[locale],
      react: WelcomeEmail({
        firstName: user.firstName,
        locale,
        unsubscribeUrl,
      }),
      headers: listUnsubscribeHeaders(unsubscribeUrl),
    });
  } catch (e) {
    console.error("[sendWelcomeEmail] failed", e);
  }
};

type CampaignTemplate = (props: {
  firstName: string | null;
  locale: EmailLocale;
  unsubscribeUrl: string;
}) => ReactElement;

const sendCampaignEmail = async (
  slug: string,
  template: CampaignTemplate,
  user: EmailRecipient,
): Promise<boolean> => {
  if (dropOutsideProduction(slug)) return false;
  const from = process.env.RESEND_FROM_EMAIL;
  const resend = getResend();
  if (!resend || !from) return false;

  try {
    const locale = pickLocale(user.locale);
    const unsubscribeUrl = await buildUnsubscribeUrl(user.id, locale);
    await resend.emails.send({
      from,
      to: user.email,
      subject: subjectForTemplate(slug, locale),
      react: template({ firstName: user.firstName, locale, unsubscribeUrl }),
      headers: listUnsubscribeHeaders(unsubscribeUrl),
    });
    return true;
  } catch (e) {
    console.error(`[sendCampaignEmail:${slug}] failed`, e);
    return false;
  }
};

export const sendReengageColdEmail = (user: EmailRecipient) =>
  sendCampaignEmail(EMAIL_SLUGS.reengageCold, ReengageColdEmail, user);

export const sendReengageSummerEmail = (user: EmailRecipient) =>
  sendCampaignEmail(EMAIL_SLUGS.reengageSummer, ReengageSummerEmail, user);

export const sendRenderedEmail = async (
  args: {
    to: string;
    subject: string;
    react: ReactElement;
    headers?: Record<string, string>;
  },
  options: { force?: boolean } = {},
): Promise<{ ok: boolean; error?: string }> => {
  if (!options.force && !isProduction()) {
    return {
      ok: false,
      error: `Email sending is disabled outside production (NODE_ENV=${process.env.NODE_ENV ?? "undefined"})`,
    };
  }
  const from = process.env.RESEND_FROM_EMAIL;
  const resend = getResend();
  if (!resend || !from) {
    return { ok: false, error: "Email sending is not configured on this env" };
  }
  try {
    await resend.emails.send({
      from,
      to: args.to,
      subject: args.subject,
      react: args.react,
      headers: args.headers,
    });
    return { ok: true };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown send error";
    console.error("[sendRenderedEmail] failed", e);
    return { ok: false, error: msg };
  }
};

import { Resend } from "resend";

import { WelcomeEmail, type WelcomeEmailLocale } from "../../../emails/welcome";

const subjects: Record<WelcomeEmailLocale, string> = {
  en: "Welcome to Cims",
  ca: "Benvingut a Cims",
  es: "Bienvenido a Cims",
};

const pickLocale = (raw: string | null | undefined): WelcomeEmailLocale => {
  const short = raw?.trim().toLowerCase().split(/[-_]/)[0];
  return short === "ca" || short === "es" ? short : "en";
};

const getResend = () =>
  process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

export const sendWelcomeEmail = async (user: {
  email: string;
  firstName: string | null;
  locale: string | null;
}): Promise<void> => {
  const from = process.env.RESEND_FROM_EMAIL;
  const resend = getResend();
  if (!resend || !from) return;

  const locale = pickLocale(user.locale);

  try {
    await resend.emails.send({
      from,
      to: user.email,
      subject: subjects[locale],
      react: WelcomeEmail({ firstName: user.firstName, locale }),
    });
  } catch (e) {
    console.error("[sendWelcomeEmail] failed", e);
  }
};

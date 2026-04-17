import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { asAppLocale } from "@/api/lib/locale";
import { routing } from "@/i18n/routing";
import { getLocalizedAlternates } from "@/lib/hreflang";

import { ContactForm } from "./_contact-form";

interface Props {
  params: Promise<{ locale: string }>;
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const locale = asAppLocale((await params).locale);
  const t = await getTranslations({ locale, namespace: "contact-page" });
  return {
    title: `${t("title")} · Cims, sempre amunt`,
    description: t("subtitle"),
    alternates: getLocalizedAlternates(locale, "/contact"),
  };
}

export default async function ContactPage({ params }: Props) {
  const locale = asAppLocale((await params).locale);
  setRequestLocale(locale);
  return <ContactForm />;
}

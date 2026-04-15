import {
  Hr,
  Img,
  Link,
  Section,
  Text,
} from "@react-email/components";

import {
  ANDROID_APP_URL,
  IOS_APP_URL,
  SITE_URL,
} from "@/lib/app-links";

export type FooterLocale = "en" | "ca" | "es";

type Props = {
  locale: FooterLocale;
  unsubscribeUrl: string;
  // Optional preamble override (e.g. "you received this because you signed up"
  // vs "...because we miss you"). Templates pass their own copy here.
  context?: string;
};

const HOST = SITE_URL;

// Official store badges. Drop the corresponding PNG files into
// packages/api/public/emails/ following the existing logo-on-black.png pattern.
//   - app-store-badge.png  : Apple "Download on the App Store" (240×80 @2x)
//   - play-store-badge.png : Google "Get it on Google Play"   (256×80 @2x)
// Source: https://developer.apple.com/app-store/marketing/guidelines/
// Source: https://play.google.com/intl/en_us/badges/
const APP_STORE_BADGE = `${HOST}/emails/app-store-badge.png`;
const PLAY_STORE_BADGE = `${HOST}/emails/play-store-badge.png`;

const defaultPreamble: Record<FooterLocale, string> = {
  en: "You received this because you signed up for Cims.",
  ca: "Has rebut això perquè t'has registrat a Cims.",
  es: "Recibiste esto porque te registraste en Cims.",
};

const unsubscribeLabel: Record<FooterLocale, string> = {
  en: "Unsubscribe",
  ca: "Dona't de baixa",
  es: "Date de baja",
};

const visitLabel: Record<FooterLocale, string> = {
  en: "Visit cims-sempre-amunt.app",
  ca: "Visita cims-sempre-amunt.app",
  es: "Visita cims-sempre-amunt.app",
};

const appStoreAlt: Record<FooterLocale, string> = {
  en: "Download on the App Store",
  ca: "Baixa-la a l'App Store",
  es: "Descárgala en el App Store",
};

const playStoreAlt: Record<FooterLocale, string> = {
  en: "Get it on Google Play",
  ca: "Aconsegueix-la a Google Play",
  es: "Disponible en Google Play",
};

export function EmailFooter({ locale, unsubscribeUrl, context }: Props) {
  return (
    <>
      <Hr className="my-6 border-slate-200" />
      <Section className="text-center">
        <Link
          href={HOST}
          className="text-sm font-medium text-slate-700 no-underline"
        >
          {visitLabel[locale]}
        </Link>
      </Section>
      <Section className="mt-4 text-center">
        <Link href={IOS_APP_URL}>
          <Img
            src={APP_STORE_BADGE}
            alt={appStoreAlt[locale]}
            height="40"
            className="mx-1 inline-block"
          />
        </Link>
        <Link href={ANDROID_APP_URL}>
          <Img
            src={PLAY_STORE_BADGE}
            alt={playStoreAlt[locale]}
            height="40"
            className="mx-1 inline-block"
          />
        </Link>
      </Section>
      <Text className="m-0 mt-6 text-center text-xs text-slate-500">
        {context ?? defaultPreamble[locale]}{" "}
        <Link
          href={unsubscribeUrl}
          className="text-slate-500 underline"
        >
          {unsubscribeLabel[locale]}
        </Link>
      </Text>
    </>
  );
}

export default EmailFooter;

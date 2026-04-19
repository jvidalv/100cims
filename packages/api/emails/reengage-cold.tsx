import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Preview,
  Section,
  Tailwind,
  Text,
} from "@react-email/components";

import { SITE_URL } from "@/lib/app-links";

import { EmailFooter } from "./_components/footer";

export type ReengageColdLocale = "en" | "ca" | "es";

type Props = {
  firstName: string | null;
  locale: ReengageColdLocale;
  unsubscribeUrl: string;
};

const MOUNTAINS_DEEPLINK = `${SITE_URL}/deeplink?link=centcims%3A%2F%2F%2Fmountains`;

const LOGO_URL = `${SITE_URL}/emails/logo-on-black.png`;

type Copy = {
  preview: string;
  greeting: (firstName: string | null) => string;
  intro: string;
  featuresTitle: string;
  feat1: { q: string; a: string };
  feat2: { q: string; a: string };
  feat3: { q: string; a: string };
  ctaTitle: string;
  ctaIntro: string;
  cta: string;
  footer: string;
};

const copy = {
  en: {
    preview: "Your mountains are waiting.",
    greeting: (firstName) => `Hey ${firstName ?? "climber"},`,
    intro:
      "You signed up for Cims a while back and haven't logged much yet — no pressure, just a quick reminder of what's here.",
    featuresTitle: "Three things to try",
    feat1: {
      q: "Log a summit",
      a: "Open a mountain, add a photo and the date. If it was years ago, you can log it without a photo too.",
    },
    feat2: {
      q: "Climb the leaderboards",
      a: "Every summit counts toward per-challenge rankings. See where you stand among everyone chasing the same peaks.",
    },
    feat3: {
      q: "Plan with friends",
      a: "Pick mountains, set a date, share the link. Your group chats in-app until the hike.",
    },
    ctaTitle: "Pick up where you left off",
    ctaIntro:
      "Open the app and see the peaks nearest you, or the ones friends are summiting. A thousand mountains won't climb themselves.",
    cta: "Open Cims",
    footer:
      "You're getting this because you signed up for Cims. Too quiet? Use the unsubscribe link below.",
  },
  ca: {
    preview: "Els teus cims t'esperen.",
    greeting: (firstName) => `Hola, ${firstName ?? "muntanyenc"},`,
    intro:
      "Et vas apuntar a Cims fa temps i no has registrat gaire — sense pressió, només un recordatori del que hi ha.",
    featuresTitle: "Tres coses per provar",
    feat1: {
      q: "Registra un cim",
      a: "Obre la muntanya, posa foto i data. Si va ser fa anys, sense foto també val.",
    },
    feat2: {
      q: "Puja al rànquing",
      a: "Cada cim suma al rànquing del repte. Mira on ets entre els que busquen els mateixos cims.",
    },
    feat3: {
      q: "Organitza una sortida",
      a: "Tria muntanyes, data, comparteix l'enllaç. Teniu xat a l'app fins al dia.",
    },
    ctaTitle: "Torna-hi",
    ctaIntro:
      "Obre l'app i mira els cims a prop, o els que està fent la gent. Les muntanyes no es pugen soles.",
    cta: "Obre Cims",
    footer:
      "Has rebut aquest correu perquè t'has registrat a Cims. Massa silenci? Fes servir l'enllaç per donar-te de baixa a sota.",
  },
  es: {
    preview: "Tus cimas te esperan.",
    greeting: (firstName) => `Hola, ${firstName ?? "montañero"},`,
    intro:
      "Te apuntaste a Cims hace tiempo y aún no has registrado mucho — sin presión, solo un recordatorio de lo que hay.",
    featuresTitle: "Tres cosas para probar",
    feat1: {
      q: "Registra una cima",
      a: "Abre la montaña, pon foto y fecha. Si fue hace años, sin foto también vale.",
    },
    feat2: {
      q: "Sube en el ranking",
      a: "Cada cima suma al ranking del reto. Mira dónde estás entre los que buscan las mismas cimas.",
    },
    feat3: {
      q: "Monta una salida",
      a: "Elige montañas, fecha, comparte el enlace. Tenéis chat en la app hasta el día.",
    },
    ctaTitle: "Vuelve",
    ctaIntro:
      "Abre la app y mira las cimas cerca, o las que está haciendo la gente. Las montañas no se suben solas.",
    cta: "Abrir Cims",
    footer:
      "Recibes este correo porque te registraste en Cims. ¿Demasiado silencio? Usa el enlace para darte de baja abajo.",
  },
} satisfies Record<ReengageColdLocale, Copy>;

export function ReengageColdEmail({
  firstName,
  locale,
  unsubscribeUrl,
}: Props) {
  const t = copy[locale];
  return (
    <Tailwind>
      <Html lang={locale}>
        <Head />
        <Preview>{t.preview}</Preview>
        <Body className="bg-slate-50 font-sans">
          <Container className="mx-auto my-10 max-w-xl overflow-hidden rounded-xl bg-white">
            <Section className="bg-black px-8 py-6 text-center">
              <Img
                src={LOGO_URL}
                alt="Cims"
                width="148"
                height="80"
                className="mx-auto block"
              />
            </Section>
            <Section className="p-8">
              <Heading className="m-0 mb-2 text-2xl font-bold text-slate-900">
                {t.greeting(firstName)}
              </Heading>
              <Text className="text-slate-700">{t.intro}</Text>

              <Hr className="my-6 border-slate-200" />

              <Heading
                as="h2"
                className="m-0 mb-3 text-lg font-semibold text-slate-900"
              >
                {t.featuresTitle}
              </Heading>
              {[t.feat1, t.feat2, t.feat3].map((item, i) => (
                <Section key={i} className="mb-4">
                  <Text className="m-0 mb-1 font-semibold text-slate-900">
                    {item.q}
                  </Text>
                  <Text className="m-0 text-slate-700">{item.a}</Text>
                </Section>
              ))}

              <Hr className="my-6 border-slate-200" />

              <Heading
                as="h2"
                className="m-0 mb-3 text-lg font-semibold text-slate-900"
              >
                {t.ctaTitle}
              </Heading>
              <Text className="text-slate-700">{t.ctaIntro}</Text>
              <Section className="mt-6 text-center">
                <Button
                  href={MOUNTAINS_DEEPLINK}
                  className="rounded-md bg-rose-500 px-6 py-3 text-sm font-semibold text-white no-underline"
                >
                  {t.cta} →
                </Button>
              </Section>

              <EmailFooter
                locale={locale}
                unsubscribeUrl={unsubscribeUrl}
                context={t.footer}
              />
            </Section>
          </Container>
        </Body>
      </Html>
    </Tailwind>
  );
}

export default ReengageColdEmail;

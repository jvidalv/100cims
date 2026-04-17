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

import { EmailFooter } from "./_components/footer";

export type WelcomeEmailLocale = "en" | "ca" | "es";

type Props = {
  firstName: string | null;
  locale: WelcomeEmailLocale;
  unsubscribeUrl: string;
};

// Deep link matches packages/app/lib/deeplink.ts at runtime — the app handler
// lives on the marketing domain and bounces into the custom scheme.
const SUPPORT_DEEPLINK =
  "https://cims-sempre-amunt.app/deeplink?link=centcims%3A%2F%2F%2Fsupport";

// White logo flattened onto solid black so the asset reads correctly in any
// email client (transparency is unreliable in mail). Pre-rendered by
// scripts/build-email-assets.ts; re-run that script if the source changes.
const LOGO_URL = "https://cims-sempre-amunt.app/emails/logo-on-black.png";

type Copy = {
  preview: string;
  greeting: (firstName: string | null) => string;
  intro: string;
  faqTitle: string;
  faq1: { q: string; a: string };
  faq2: { q: string; a: string };
  faq3: { q: string; a: string };
  supportTitle: string;
  supportIntro: string;
  supportCta: string;
  footer: string;
};

const copy = {
  en: {
    preview: "Welcome to Cims — here's how to get started.",
    greeting: (firstName) => `Welcome, ${firstName ?? "climber"}!`,
    intro:
      "You're in. Cims helps you track the mountains you summit and plan your next ones with friends. Here's a quick primer to get going.",
    faqTitle: "The basics",
    faq1: {
      q: "How do I upload a summit?",
      a: "Open a mountain, tap the camera button, pick a photo and the date you summited. That's it — it's added to your list.",
    },
    faq2: {
      q: "I just downloaded the app and have lots of older summits to register. How do I add them?",
      a: "You can register older summits without a photo — open a mountain and add the date. It's manual for each one for now, but it keeps your history complete.",
    },
    faq3: {
      q: "How do I plan a hike with friends?",
      a: "Open the Plans tab and tap New plan. Pick mountains, set a date, and share the invite link. Everyone in the plan can chat from the app.",
    },
    supportTitle: "How is Cims maintained?",
    supportIntro:
      "Cims is built and paid for by people who love mountains. If you want to help keep it running — no ads, no tracking — grab some merch. T-shirts, mugs, caps, buffs. Every bit helps cover hosting.",
    supportCta: "Support Cims",
    footer:
      "You received this email because you signed up for Cims. Questions or ideas? Just reply.",
  },
  ca: {
    preview: "Benvingut a Cims — aquí tens com començar.",
    greeting: (firstName) => `Benvingut, ${firstName ?? "muntanyenc"}!`,
    intro:
      "Ja hi ets. Cims t'ajuda a portar un registre dels cims que fas i a planificar les properes sortides. Aquí tens el bàsic per començar.",
    faqTitle: "Com funciona",
    faq1: {
      q: "Com registro un cim?",
      a: "Obre la muntanya, toca la càmera, tria la foto i la data. Llest — queda al teu registre.",
    },
    faq2: {
      q: "I si tinc cims antics?",
      a: "Pots registrar-los sense foto: obre la muntanya i posa la data. De moment s'ha de fer un a un.",
    },
    faq3: {
      q: "Com organitzo una sortida?",
      a: "Pestanya Plans → Nou pla. Tria muntanyes, data, comparteix l'enllaç. Tothom del pla té xat dins l'app.",
    },
    supportTitle: "Qui paga tot això?",
    supportIntro:
      "Cims el fem gent que estima la muntanya. Si el vols ajudar a seguir — sense anuncis, sense rastreig — passa't per la botiga. Samarretes, tasses, gorres, buffs. Tot ajuda.",
    supportCta: "Dona suport a Cims",
    footer:
      "T'has registrat a Cims, per això rebem aquest correu. Preguntes o idees? Respon i ja ens arriba.",
  },
  es: {
    preview: "Bienvenido a Cims — aquí tienes cómo empezar.",
    greeting: (firstName) => `¡Bienvenido, ${firstName ?? "montañero"}!`,
    intro:
      "Ya estás dentro. Cims te ayuda a llevar registro de las cimas que coronas y planificar las próximas salidas. Aquí tienes lo básico para empezar.",
    faqTitle: "Cómo va",
    faq1: {
      q: "¿Cómo registro una cima?",
      a: "Abre la montaña, toca la cámara, elige la foto y la fecha. Listo — se queda en tu registro.",
    },
    faq2: {
      q: "¿Y si tengo cimas antiguas?",
      a: "Puedes registrarlas sin foto: abre la montaña y pon la fecha. De momento una a una.",
    },
    faq3: {
      q: "¿Cómo organizo una salida?",
      a: "Pestaña Planes → Nuevo plan. Elige montañas, fecha, comparte el enlace. Todos los del plan tenéis chat en la app.",
    },
    supportTitle: "¿Quién paga todo esto?",
    supportIntro:
      "Cims lo hacemos gente que amamos la montaña. Si quieres ayudar a que siga — sin anuncios, sin rastreo — pásate por la tienda. Camisetas, tazas, gorras, buffs. Todo ayuda.",
    supportCta: "Apoya Cims",
    footer:
      "Te registraste en Cims, por eso recibes este correo. ¿Preguntas o ideas? Responde y nos llega.",
  },
} satisfies Record<WelcomeEmailLocale, Copy>;

export function WelcomeEmail({ firstName, locale, unsubscribeUrl }: Props) {
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
              {t.faqTitle}
            </Heading>
            {[t.faq1, t.faq2, t.faq3].map((item, i) => (
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
              {t.supportTitle}
            </Heading>
            <Text className="text-slate-700">{t.supportIntro}</Text>
            <Section className="mt-6 text-center">
              <Button
                href={SUPPORT_DEEPLINK}
                className="rounded-md bg-rose-500 px-6 py-3 text-sm font-semibold text-white no-underline"
              >
                {t.supportCta} →
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

export default WelcomeEmail;

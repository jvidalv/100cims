import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Tailwind,
  Text,
} from "@react-email/components";

export type WelcomeEmailLocale = "en" | "ca" | "es";

type Props = {
  firstName: string | null;
  locale: WelcomeEmailLocale;
};

// Deep link matches packages/app/lib/deeplink.ts at runtime — the app handler
// lives on the marketing domain and bounces into the custom scheme.
const SUPPORT_DEEPLINK =
  "https://cims-sempre-amunt.app/deeplink?link=centcims%3A%2F%2F%2Fsupport";

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
      q: "I'm back from a trip with a dozen summits. How do I upload them all?",
      a: "From your profile, go to your summit list and use batch upload. Pick several photos at once and match each one to a mountain and date.",
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
      "Ja hi ets. Cims t'ajuda a registrar els cims que has fet i a planificar els següents amb amics. Aquí tens els bàsics per començar.",
    faqTitle: "Els bàsics",
    faq1: {
      q: "Com pujo un cim?",
      a: "Obre una muntanya, toca el botó de la càmera, tria una foto i la data en què vas fer el cim. Ja està — queda afegit a la teva llista.",
    },
    faq2: {
      q: "Torno d'una sortida amb una dotzena de cims. Com els pujo tots?",
      a: "Des del teu perfil, ves a la llista de cims i fes servir la càrrega en lot. Tria diverses fotos alhora i associa cada una amb una muntanya i una data.",
    },
    faq3: {
      q: "Com planifico una sortida amb amics?",
      a: "Obre la pestanya Plans i toca Nou pla. Escull muntanyes, posa una data i comparteix l'enllaç. Tothom del pla pot xatejar des de l'app.",
    },
    supportTitle: "Com es manté Cims?",
    supportIntro:
      "Cims el fan i el paguen persones que estimen la muntanya. Si vols ajudar a mantenir-lo — sense anuncis, sense seguiment — mira el merxandatge. Samarretes, tasses, gorres, buffs. Tot ajuda a cobrir l'hostatge.",
    supportCta: "Dona suport a Cims",
    footer:
      "Has rebut aquest correu perquè t'has registrat a Cims. Preguntes o idees? Respon i ens arribarà.",
  },
  es: {
    preview: "Bienvenido a Cims — aquí tienes cómo empezar.",
    greeting: (firstName) => `¡Bienvenido, ${firstName ?? "montañero"}!`,
    intro:
      "Ya estás dentro. Cims te ayuda a registrar las cimas que haces y a planificar las siguientes con amigos. Aquí tienes los básicos para empezar.",
    faqTitle: "Lo básico",
    faq1: {
      q: "¿Cómo subo una cima?",
      a: "Abre una montaña, toca el botón de la cámara, elige una foto y la fecha en que hiciste cima. Ya está — se añade a tu lista.",
    },
    faq2: {
      q: "Vuelvo de una salida con una docena de cimas. ¿Cómo las subo todas?",
      a: "Desde tu perfil, ve a la lista de cimas y usa la carga por lotes. Elige varias fotos a la vez y asocia cada una con una montaña y una fecha.",
    },
    faq3: {
      q: "¿Cómo planifico una salida con amigos?",
      a: "Abre la pestaña Planes y pulsa Nuevo plan. Escoge montañas, pon una fecha y comparte el enlace. Todos los del plan pueden chatear desde la app.",
    },
    supportTitle: "¿Cómo se mantiene Cims?",
    supportIntro:
      "Cims lo hacen y lo pagan personas que aman la montaña. Si quieres ayudar a mantenerlo — sin anuncios, sin seguimiento — echa un vistazo al merch. Camisetas, tazas, gorras, buffs. Todo ayuda a cubrir el alojamiento.",
    supportCta: "Apoyar a Cims",
    footer:
      "Recibiste este correo porque te registraste en Cims. ¿Preguntas o ideas? Responde y nos llegará.",
  },
} satisfies Record<WelcomeEmailLocale, Copy>;

export function WelcomeEmail({ firstName, locale }: Props) {
  const t = copy[locale];
  return (
    <Tailwind>
      <Html lang={locale}>
        <Head />
        <Preview>{t.preview}</Preview>
        <Body className="bg-slate-50 font-sans">
          <Container className="mx-auto my-10 max-w-xl rounded-xl bg-white p-8">
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

            <Hr className="my-6 border-slate-200" />
            <Text className="m-0 text-xs text-slate-500">{t.footer}</Text>
          </Container>
        </Body>
      </Html>
    </Tailwind>
  );
}

export default WelcomeEmail;

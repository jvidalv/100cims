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

export type ReengageSummerLocale = "en" | "ca" | "es";

type Props = {
  firstName: string | null;
  locale: ReengageSummerLocale;
  unsubscribeUrl: string;
};

const PLANS_DEEPLINK = `${SITE_URL}/deeplink?link=centcims%3A%2F%2F%2Fplans`;

const LOGO_URL = `${SITE_URL}/emails/logo-on-black.png`;

type Copy = {
  preview: string;
  greeting: (firstName: string | null) => string;
  intro: string;
  whyTitle: string;
  why1: { q: string; a: string };
  why2: { q: string; a: string };
  why3: { q: string; a: string };
  ctaTitle: string;
  ctaIntro: string;
  cta: string;
  footer: string;
};

const copy = {
  en: {
    preview: "Summer's the season for it.",
    greeting: (firstName) =>
      `${firstName ?? "Climber"}, summer's here.`,
    intro:
      "Your last summit on Cims was a while ago. Days are long, trails are dry, your boots are probably gathering dust. Here's a nudge.",
    whyTitle: "Why now",
    why1: {
      q: "Days are longer",
      a: "More daylight, more time on the ridge. Even a half-day off work fits a full peak.",
    },
    why2: {
      q: "Trails are dry",
      a: "Easier ascents, less gear, fewer surprises. Summer is the forgiving season.",
    },
    why3: {
      q: "Your friends are out there",
      a: "Open the Plans tab and see who's heading where. Jumping on someone else's plan is the easiest way back in.",
    },
    ctaTitle: "Pick a plan",
    ctaIntro:
      "Browse the plans your friends are organising — or start your own and see who joins.",
    cta: "See the plans",
    footer:
      "You're getting this because you signed up for Cims. If you'd rather not, the unsubscribe link is below.",
  },
  ca: {
    preview: "L'estiu és la temporada.",
    greeting: (firstName) =>
      `${firstName ?? "Muntanyenc"}, ja som a l'estiu.`,
    intro:
      "Fa temps que no registres cap cim a Cims. Els dies són llargs, els camins secs, les botes agafant pols. Va, una empenta.",
    whyTitle: "Per què ara",
    why1: {
      q: "Els dies són llargs",
      a: "Més hores de llum, més temps a la carena. Mig dia lliure dona per un cim sencer.",
    },
    why2: {
      q: "Els camins són secs",
      a: "Pujades més fàcils, menys material, menys sorpreses. L'estiu perdona més.",
    },
    why3: {
      q: "Els teus amics ja hi són",
      a: "Obre la pestanya Plans i mira qui va on. Apuntar-te a un pla existent és la manera més fàcil de tornar.",
    },
    ctaTitle: "Tria un pla",
    ctaIntro:
      "Mira els plans que està organitzant la gent — o engega'n un i mira qui s'hi apunta.",
    cta: "Veure els plans",
    footer:
      "Has rebut aquest correu perquè t'has registrat a Cims. Si prefereixes no rebre'n, l'enllaç de baixa és a sota.",
  },
  es: {
    preview: "El verano es la temporada.",
    greeting: (firstName) =>
      `${firstName ?? "Montañero"}, ya es verano.`,
    intro:
      "Hace tiempo que no registras ninguna cima en Cims. Los días son largos, los caminos secos, las botas cogiendo polvo. Venga, un empujón.",
    whyTitle: "Por qué ahora",
    why1: {
      q: "Los días son largos",
      a: "Más horas de luz, más tiempo en la cresta. Medio día libre da para una cima entera.",
    },
    why2: {
      q: "Los caminos están secos",
      a: "Subidas más fáciles, menos material, menos sorpresas. El verano perdona más.",
    },
    why3: {
      q: "Tus amigos ya están allí",
      a: "Abre la pestaña Planes y mira quién va dónde. Apuntarte a un plan existente es la forma más fácil de volver.",
    },
    ctaTitle: "Elige un plan",
    ctaIntro:
      "Mira los planes que está organizando la gente — o monta uno y mira quién se apunta.",
    cta: "Ver los planes",
    footer:
      "Recibes este correo porque te registraste en Cims. Si prefieres no recibirlos, el enlace para darte de baja está abajo.",
  },
} satisfies Record<ReengageSummerLocale, Copy>;

export function ReengageSummerEmail({
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
                {t.whyTitle}
              </Heading>
              {[t.why1, t.why2, t.why3].map((item, i) => (
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
                  href={PLANS_DEEPLINK}
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

export default ReengageSummerEmail;

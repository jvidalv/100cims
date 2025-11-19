import type { Metadata } from "next";
import { Bricolage_Grotesque, Geist_Mono } from "next/font/google";
import { ReactNode } from "react";
import "./globals.css";
import { getLocale, getMessages } from "next-intl/server";
import { NextIntlClientProvider } from "next-intl";

const bricolageGrotesque = Bricolage_Grotesque({
  variable: "--font-bricolage-grotesque",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Translation dictionary (Alternative: Use next-intl with `useTranslations`)
const metadataTranslations: Record<
  string,
  { title: string; description: string }
> = {
  en: {
    title: "Cims, sempre amunt - Available on iOS and Android",
    description:
      "Track your mountaineering progress across multiple challenges and summit lists.",
  },
  es: {
    title: "Cims, sempre amunt - Disponible en iOS y Android",
    description:
      "Sigue tu progreso en montañismo a través de múltiples desafíos y listas de más de 100 cumbres.",
  },
  ca: {
    title: "Cims, sempre amunt - Disponible a iOS i Android",
    description:
      "Fes el seguiment del teu progrés en muntanyisme a través de múltiples reptes i llistes de més de 100 cims.",
  },
};

type Props = {
  params: Promise<{ locale: string }>;
};

// Dynamically generate metadata based on locale
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const language = (await params).locale || "en";
  let translations = metadataTranslations[language];

  if (!translations) {
    translations = metadataTranslations["en"];
  }

  return {
    title: translations.title,
    description: translations.description,
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <html lang={locale} className="dark">
      <body
        className={`${bricolageGrotesque.variable} ${geistMono.variable} antialiased`}
      >
        <NextIntlClientProvider messages={messages}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}

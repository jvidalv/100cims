import "react-native-reanimated";
import { DefaultTheme, ThemeProvider } from "@react-navigation/native";
import { Stack } from "expo-router";
import { useColorScheme } from "nativewind";
import { Fragment, useMemo } from "react";
import { Helmet, HelmetProvider } from "react-helmet-async";
import { IntlProvider, useIntl } from "react-intl";

import { getLocale } from "@/lib/locale";
import ca from "@/translations/ca.json";
import en from "@/translations/en.json";
import es from "@/translations/es.json";

import "../global.css";

function Content() {
  const intl = useIntl();
  const title = `100cims - 
          ${intl.formatMessage({
            defaultMessage: "Available on iOS and Android",
          })}`;
  const favicon = `${window.location.origin}/favicon.png`;

  return (
    <Fragment>
      <Helmet>
        <title>{title}</title>
        <meta
          name="description"
          content={intl.formatMessage({
            defaultMessage: "Track your progress in the 100cims challenge",
          })}
        />
        <meta
          property="og:title"
          content={intl.formatMessage({
            defaultMessage: "Track your progress in the 100cims challenge",
          })}
        />
        <meta
          property="og:description"
          content={intl.formatMessage({
            defaultMessage: "Track your progress in the 100cims challenge",
          })}
        />
        <link rel="icon" href={favicon} />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,200..800&display=swap"
          rel="stylesheet"
        />
      </Helmet>
      <Stack screenOptions={{ headerShown: false }} />
    </Fragment>
  );
}

function RootProviders() {
  const { colorScheme } = useColorScheme();
  const locale = getLocale();

  const messages = useMemo(() => {
    if (locale === "en") {
      return en;
    }

    if (locale === "es") {
      return es;
    }

    if (locale === "ca") {
      return ca;
    }
  }, [locale]);

  return (
    <HelmetProvider>
      <IntlProvider messages={messages} locale={locale} defaultLocale="en">
        <ThemeProvider
          value={{
            dark: false,
            colors: {
              ...DefaultTheme.colors,
              background: "transparent",
            },
            fonts: DefaultTheme.fonts,
          }}
        >
          <Content />
        </ThemeProvider>
      </IntlProvider>
    </HelmetProvider>
  );
}

export default function Root() {
  return <RootProviders />;
}

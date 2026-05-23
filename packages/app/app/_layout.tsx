import { setDefaultOptions } from "date-fns/setDefaultOptions";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import React, {
  useEffect,
  PropsWithChildren,
  useState,
  useMemo,
} from "react";
import { IntlProvider } from "react-intl";
import { View } from "react-native";

import { QueryClientProvider } from "@/components/providers";
import { AuthProvider } from "@/components/providers/auth-provider";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { ThemedLogo } from "@/components/ui/atoms";
import { FloatingCartButton } from "@/components/ui/molecules";
import { useMountains } from "@/domains/mountain/mountain.api";
import { usePlanChatUnread } from "@/domains/plan/plan-chat.api";
import { usePlans } from "@/domains/plan/plan.api";
import { useSummitsGet } from "@/domains/summit/summit.api";
import { usePushTokenRegistration } from "@/domains/user/push.api";
import { useUserMe, useUserChallengeSummits } from "@/domains/user/user.api";
import { useLocation } from "@/hooks/use-location";
import { setApiLocation, setAuthToken } from "@/lib/api-client";
import { getJwt } from "@/lib/auth";
import { isIpadOS } from "@/lib/device";
import { getDateFnsLocale, getLocale, initLocale } from "@/lib/locale";
import ca from "@/translations/ca.json";
import en from "@/translations/en.json";
import es from "@/translations/es.json";

import "../global.css";

// Prevent the splash screen from auto-hiding before asset loading is complete.
void SplashScreen.preventAutoHideAsync();

const LoadingSkeleton = () => {
  return (
    <View className="absolute inset-0 z-50 items-center justify-center bg-background">
      <ThemedLogo
        style={{ width: 280, height: 280 }}
        resizeMode="contain"
      />
    </View>
  );
};

function Content() {
  useUserMe();
  const { isPending: isPendingMountains } = useMountains();
  const { isPending: isPendingHomepageSummits } = useSummitsGet({ limit: 8 });

  // Prefetch data in background
  usePlanChatUnread();
  useUserChallengeSummits();
  usePlans({
    limit: 3,
    status: "open",
    sort: "upcoming",
  });
  usePushTokenRegistration();

  const isDataReady = !isPendingMountains && !isPendingHomepageSummits;

  useEffect(() => {
    setDefaultOptions({ locale: getDateFnsLocale() });
  }, []);

  useEffect(() => {
    if (isDataReady) void SplashScreen.hideAsync();
  }, [isDataReady]);

  return (
    <>
      {!isDataReady && <LoadingSkeleton />}
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="challenges" />
        <Stack.Screen name="+not-found" />
        <Stack.Screen
          name="join"
          options={{ presentation: isIpadOS ? "fullScreenModal" : "modal" }}
        />
      </Stack>
      <FloatingCartButton />
    </>
  );
}

function LocationSync() {
  const { location } = useLocation();
  useEffect(() => {
    if (location?.coords) {
      setApiLocation({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });
    } else {
      setApiLocation(null);
    }
  }, [location]);
  return null;
}

function AuthLayer({ children }: PropsWithChildren) {
  const [isJwtLoaded, setIsJwtLoaded] = useState(false);
  const [jwt, setJwt] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const localStorageJwt = await getJwt();
      if (localStorageJwt) {
        setJwt(localStorageJwt);
        setAuthToken(localStorageJwt);
      }

      setIsJwtLoaded(true);
    })();
  }, []);

  if (!isJwtLoaded) {
    return null;
  }

  return (
    <AuthProvider jwt={jwt}>
      <LocationSync />
      {children}
    </AuthProvider>
  );
}

function RootProviders() {
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
    <QueryClientProvider>
      <AuthLayer>
        <IntlProvider messages={messages} locale={locale} defaultLocale="en">
          <Content />
          <StatusBar style="auto" />
        </IntlProvider>
      </AuthLayer>
    </QueryClientProvider>
  );
}

export default function Root() {
  const [localeReady, setLocaleReady] = useState(false);

  useEffect(() => {
    void initLocale().then(() => setLocaleReady(true));
  }, []);

  if (!localeReady) return null;

  return (
    <ThemeProvider>
      <RootProviders />
    </ThemeProvider>
  );
}

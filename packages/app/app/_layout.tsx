import { setDefaultOptions } from "date-fns/setDefaultOptions";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect, PropsWithChildren, useState, useMemo } from "react";
import { IntlProvider } from "react-intl";
import { Platform, View, useColorScheme } from "react-native";
import {
  initialWindowMetrics,
  SafeAreaProvider,
} from "react-native-safe-area-context";

import { QueryClientProvider } from "@/components/providers";
import { AuthProvider, useAuth } from "@/components/providers/auth-provider";
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
import { silenceMapboxNoise } from "@/lib/silence-mapbox-noise";
import ca from "@/translations/ca.json";
import en from "@/translations/en.json";
import es from "@/translations/es.json";

import "../global.css";

// Prevent the splash screen from auto-hiding before asset loading is complete.
void SplashScreen.preventAutoHideAsync();

// Drop @rnmapbox/maps' known native-lifecycle red-boxes in dev. Tightly
// scoped — never swallows our own errors. See lib/silence-mapbox-noise.ts.
silenceMapboxNoise();

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

  // Match the background-color tokens declared in ThemeProvider so the
  // RNScreen host view paints the theme background BEFORE React's first
  // paint commits — without this, every push transition shows a brief
  // white flash from iOS's `systemBackground` default during the slide-in.
  const colorScheme = useColorScheme() === "dark" ? "dark" : "light";
  const screenBackground = colorScheme === "dark" ? "#000000" : "#ffffff";

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
      {/* `freezeOnBlur: false` on Android only — react-native-screens'
          default freeze-blurred-screen optimization snapshots the outgoing
          screen as a Bitmap for the slide transition, and on Android that
          bitmap gets `.recycle()`'d before the pop animation finishes,
          crashing with `Canvas: trying to use a recycled bitmap`. Disabling
          freeze on Android sidesteps the snapshot path. iOS uses a
          different transition mechanism and is unaffected. */}
      <Stack
        screenOptions={{
          headerShown: false,
          freezeOnBlur: Platform.OS === "android" ? false : undefined,
          // Pin the per-screen host-view background to the theme so the
          // slide-in transition doesn't briefly show iOS's white system
          // background while the screen's React tree mounts.
          contentStyle: { backgroundColor: screenBackground },
        }}
      >
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="challenges" />
        {/* `mountain` owns its own Stack (mountain/_layout.tsx). Declaring it
            here pins the root Stack mount point so every push of
            /mountain/[slug] resolves to the parent Stack — which keeps
            sibling slugs as separate frames with their own NativeTabs
            instances instead of double-mounting on top of each other. */}
        <Stack.Screen name="mountain" />
        {/* No <Stack.Screen name="plans" />: plans/ contains only the (tabs)/
            group, so Expo Router flattens the route to "plans/(tabs)" and a
            "plans" declaration would not match any child — see the [Layout
            children] warning. Routing still works through inference. */}
        <Stack.Screen name="+not-found" />
        {/* /join lives at the root (not under a tab subtree) and presents
            as a modal. We tried nesting it under (tabs)/(home)/ to keep
            the bottom tab bar visible, but cross-tab `<Redirect href="/join" />`
            from gated routes (shop, mountains, plans/create, …) then has
            to cross NativeTabs subtree boundaries, which races
            react-native-screens' snapshot logic and crashes Android with
            `Canvas: trying to use a recycled bitmap`. Modal at the root
            is the boring-and-correct shape. */}
        <Stack.Screen
          name="join"
          options={{ presentation: isIpadOS ? "fullScreenModal" : "modal" }}
        />
      </Stack>
      <FloatingCartButton />
    </>
  );
}

// Single source of truth for the foreground-location permission prompt:
// fire it once per session for authenticated users. Screen-level callers
// (`useLocation()` without `prompt`) then just read the resolved location
// without ever triggering the OS dialog themselves.
function LocationSync() {
  const { isAuthenticated } = useAuth();
  const { location } = useLocation({ prompt: isAuthenticated });
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
    // initialMetrics seeds useSafeAreaInsets() with the real top/bottom values
    // from the native side at JS startup, so screens that read insets on first
    // render (e.g. /calendar's paddingTop) don't flash content under the
    // status bar / dynamic island before the provider re-measures.
    <SafeAreaProvider initialMetrics={initialWindowMetrics}>
      <ThemeProvider>
        <RootProviders />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

import { setDefaultOptions } from "date-fns/setDefaultOptions";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import React, {
  useRef,
  useEffect,
  PropsWithChildren,
  useState,
  useMemo,
} from "react";
import { IntlProvider } from "react-intl";
import { Animated, View, Image } from "react-native";
import { Easing } from "react-native-reanimated";

import { QueryClientProvider } from "@/components/providers";
import { AuthProvider } from "@/components/providers/auth-provider";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { useMountains } from "@/domains/mountain/mountain.api";
import { usePlanChatUnread } from "@/domains/plan/plan-chat.api";
import { usePlans } from "@/domains/plan/plan.api";
import { useSummitsGet } from "@/domains/summit/summit.api";
import { useUserMe, useUserChallengeSummits } from "@/domains/user/user.api";
import { setAuthToken } from "@/lib/api-client";
import { getJwt } from "@/lib/auth";
import { isIpadOS, isWeb } from "@/lib/device";
import { getDateFnsLocale, getLocale } from "@/lib/locale";
import ca from "@/translations/ca.json";
import en from "@/translations/en.json";
import es from "@/translations/es.json";

import "../global.css";

const ANIMATION_DURATION = 1000;

// Prevent the splash screen from auto-hiding before asset loading is complete.
void SplashScreen.preventAutoHideAsync();

const LoadingSkeleton = () => {
  const fadeOutOpacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(100)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeOutOpacity, {
        toValue: 1,
        duration: ANIMATION_DURATION,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: ANIMATION_DURATION,
        useNativeDriver: true,
        easing: Easing.out(Easing.ease),
      }),
    ]).start();
  }, [fadeOutOpacity, translateY]);

  return (
    <View className="absolute inset-0 z-50 items-center justify-center bg-primary">
      <Animated.Image
        source={require("@/assets/images/cims-letters.png")}
        style={[
          { width: 200, height: 200, position: "absolute" },
          {
            opacity: fadeOutOpacity,
            transform: [{ translateY }],
          },
        ]}
        resizeMode="contain"
      />
      <Image
        source={require("@/assets/images/mountain.png")}
        style={{ width: 200, height: 200 }}
      />
      <View className="mb-[-100px] h-[100px] w-full bg-primary" />
    </View>
  );
};

function Content() {
  const [showSkeleton, setShowSkeleton] = useState(true);
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

  const isDataReady = !isPendingMountains && !isPendingHomepageSummits;

  useEffect(() => {
    setDefaultOptions({ locale: getDateFnsLocale() });
  }, []);


  useEffect(() => {
    void SplashScreen.hideAsync();
  }, []);

  // Hide skeleton when data is ready (animation can still be running)
  useEffect(() => {
    if (isDataReady) {
      setShowSkeleton(false);
    }
  }, [isDataReady]);

  return (
    <>
      {showSkeleton && !isWeb && <LoadingSkeleton />}
      <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen
        name="mountain/[slug]/summit"
        options={{ presentation: isIpadOS ? "fullScreenModal" : "modal" }}
      />
      <Stack.Screen
        name="plan/[id]/complete"
        options={{ presentation: isIpadOS ? "fullScreenModal" : "modal" }}
      />
      <Stack.Screen name="+not-found" />
      <Stack.Screen
        name="join"
        options={{ presentation: isIpadOS ? "fullScreenModal" : "modal" }}
      />
    </Stack>
    </>
  );
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

  return <AuthProvider jwt={jwt}>{children}</AuthProvider>;
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
  return (
    <ThemeProvider>
      <RootProviders />
    </ThemeProvider>
  );
}

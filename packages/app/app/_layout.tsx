import { AnalyticsProvider, analytics } from "@jvidalv/react-analytics";
import { setDefaultOptions } from "date-fns/setDefaultOptions";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
// import { useColorScheme } from "nativewind";
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
import { AuthProvider, useAuth } from "@/components/providers/auth-provider";
import {
  ChallengeProvider,
  getLocalChallenge,
} from "@/components/providers/challenge-provider";
import {
  DEFAULT_CHALLENGE_ID,
  useChallengesGet,
} from "@/domains/challenge/challenge.api";
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

const ANIMATION_DURATION = 1500;

// Prevent the splash screen from auto-hiding before asset loading is complete.
void SplashScreen.preventAutoHideAsync();

const SplashAnimation = () => {
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
    <View className="flex-1 items-center justify-center bg-primary">
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
  const [fontsLoaded] = useFonts({
    regular: require("@/assets/fonts/BricolageGrotesque-Regular.ttf"),
    medium: require("@/assets/fonts/BricolageGrotesque-Medium.ttf"),
    semibold: require("@/assets/fonts/BricolageGrotesque-SemiBold.ttf"),
    bold: require("@/assets/fonts/BricolageGrotesque-Bold.ttf"),
    black: require("@/assets/fonts/BricolageGrotesque-ExtraBold.ttf"),
  });
  const [ready, setReady] = useState(false);
  const { isAuthenticated } = useAuth();
  const { isPending: isPendingMountains } = useMountains();
  const { data: user, isPending: isPendingUser } = useUserMe();
  const { isPending: isPendingHomepageSummits } = useSummitsGet({ limit: 8 });
  const { isPending: isPendingChallenges } = useChallengesGet();
  usePlanChatUnread();
  useUserChallengeSummits();
  usePlans({
    limit: 3,
    status: "open",
    sort: "upcoming",
  });

  useEffect(() => {
    setDefaultOptions({ locale: getDateFnsLocale() });
  }, []);

  useEffect(() => {
    if (isAuthenticated && user?.id) {
      analytics.identify(user.id, {
        email: user?.email,
        firstName: user?.firstName,
        lastName: user?.lastName,
        avatarUrl: user?.imageUrl,
        locale: getLocale(),
      });
    }
  }, [
    isAuthenticated,
    user?.id,
    user?.email,
    user?.firstName,
    user?.lastName,
    user?.imageUrl,
  ]);

  useEffect(() => {
    void SplashScreen.hideAsync();
  }, []);

  useEffect(() => {
    if (!ready) {
      setReady(
        fontsLoaded &&
          !isPendingMountains &&
          !isPendingHomepageSummits &&
          !isPendingChallenges &&
          (!isPendingUser || !isAuthenticated),
      );
    }
  }, [
    fontsLoaded,
    isAuthenticated,
    isPendingHomepageSummits,
    isPendingMountains,
    isPendingUser,
    isPendingChallenges,
    ready,
  ]);

  if (!ready && !isWeb) {
    return <SplashAnimation />;
  }

  return (
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
      <Stack.Screen
        name="challenges"
        options={{ presentation: isIpadOS ? "fullScreenModal" : "modal" }}
      />
    </Stack>
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

function ChallengeLayer({ children }: PropsWithChildren) {
  const [isChallengeLoaded, setIsChallengeLoaded] = useState(false);
  const [challenge, setChallenge] = useState<string>(DEFAULT_CHALLENGE_ID);

  useEffect(() => {
    (async () => {
      const localStorageChallenge = await getLocalChallenge();
      if (localStorageChallenge) {
        setChallenge(localStorageChallenge);
      }
      setIsChallengeLoaded(true);
    })();
  }, []);

  if (!isChallengeLoaded) {
    return null;
  }

  return (
    <ChallengeProvider challengeId={challenge}>{children}</ChallengeProvider>
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
        <ChallengeLayer>
          <IntlProvider messages={messages} locale={locale} defaultLocale="en">
            <Content />
            <StatusBar style="auto" />
          </IntlProvider>
        </ChallengeLayer>
      </AuthLayer>
    </QueryClientProvider>
  );
}

export default function Root() {
  return (
    <AnalyticsProvider
      config={{
        apiKey: process.env.EXPO_PUBLIC_REACT_ANALYTICS_KEY as string,
      }}
    >
      <RootProviders />
    </AnalyticsProvider>
  );
}

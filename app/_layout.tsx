import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { useFonts } from "expo-font";
import { Image } from "expo-image";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
// eslint-disable-next-line import/order
import { StatusBar } from "expo-status-bar";

import "react-native-reanimated";
import { useColorScheme } from "nativewind";
import React, {
  useRef,
  useEffect,
  PropsWithChildren,
  useState,
  useMemo,
} from "react";
import { IntlProvider } from "react-intl";
import { Animated, View } from "react-native";
import { Easing } from "react-native-reanimated";

import { QueryClientProvider } from "@/components/providers";
import {
  AuthProvider,
  overwriteJwt,
  useAuth,
} from "@/components/providers/auth-provider";
import { useMountains } from "@/domains/mountain/mountain.api";
import { useSummitsGet } from "@/domains/summit/summit.api";
import { useUserMe, useUserSummits } from "@/domains/user/user.api";
import { getJwt } from "@/lib/auth";
import { getLocale } from "@/lib/locale";
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
        source={require("@/assets/images/one-hundred.png")}
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
  const { colorScheme } = useColorScheme();
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
  const { isPending: isPendingUser } = useUserMe();
  const { isPending: isPendingHomepageSummits } = useSummitsGet({ limit: 5 });
  useUserSummits();

  useEffect(() => {
    void SplashScreen.hideAsync();
  }, []);

  useEffect(() => {
    if (!ready) {
      setReady(
        fontsLoaded &&
          !isPendingMountains &&
          !isPendingHomepageSummits &&
          (!isPendingUser || !isAuthenticated),
      );
    }
  }, [
    fontsLoaded,
    isAuthenticated,
    isPendingHomepageSummits,
    isPendingMountains,
    isPendingUser,
    ready,
  ]);

  if (!ready) {
    return <SplashAnimation />;
  }

  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen
          name="mountain/[slug]/summit"
          options={{ presentation: "modal" }}
        />
        <Stack.Screen name="+not-found" />
        <Stack.Screen name="join" options={{ presentation: "modal" }} />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}

function AuthLayer({ children }: PropsWithChildren) {
  const [isJwtLoaded, setIsJwtLoaded] = React.useState(false);

  useEffect(() => {
    (async () => {
      const jwt = await getJwt();
      if (jwt) {
        overwriteJwt(jwt);
      }
      setIsJwtLoaded(true);
    })();
  }, []);

  if (!isJwtLoaded) {
    return null;
  }

  return <AuthProvider>{children}</AuthProvider>;
}

export default function RootLayout() {
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
        </IntlProvider>
      </AuthLayer>
    </QueryClientProvider>
  );
}

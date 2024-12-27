import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import "react-native-reanimated";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { QueryClientProvider } from "@/components/providers";
import React, { useRef, useEffect } from "react";
import { Animated, View } from "react-native";
import { useMountains } from "@/domains/mountains/mountains.api";
import { Image } from "expo-image";
import { Easing } from "react-native-reanimated";
import "../global.css";
import { useFonts } from "expo-font";
import {
  AuthProvider,
  overwriteJwt,
} from "@/components/providers/auth-provider";
import { getJwt } from "@/lib/auth";

// Prevent the splash screen from auto-hiding before asset loading is complete.
void SplashScreen.preventAutoHideAsync();

const ANIMATION_DURATION = 1500;

// Set the animation options. This is optional.
SplashScreen.setOptions({
  duration: ANIMATION_DURATION,
  fade: true,
});

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
  }, []);

  return (
    <View className="flex-1 bg-primary items-center justify-center">
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
      <View className="h-[100px] -mb-[100px] w-full bg-primary" />
    </View>
  );
};

function Content() {
  const { isDark } = useColorScheme();
  const [loaded] = useFonts({
    regular: require("@/assets/fonts/BricolageGrotesque-Regular.ttf"),
    medium: require("@/assets/fonts/BricolageGrotesque-Medium.ttf"),
    semibold: require("@/assets/fonts/BricolageGrotesque-SemiBold.ttf"),
    bold: require("@/assets/fonts/BricolageGrotesque-Bold.ttf"),
    black: require("@/assets/fonts/BricolageGrotesque-ExtraBold.ttf"),
  });
  const [showApp, setShowApp] = React.useState(false);
  const [isJwtLoaded, setIsJwtLoaded] = React.useState(false);
  const { data: mountains } = useMountains();

  const ready = loaded && isJwtLoaded && mountains;

  useEffect(() => {
    (async () => {
      const jwt = await getJwt();
      if (jwt) {
        overwriteJwt(jwt);
      }
      setIsJwtLoaded(true);
    })();
  }, []);

  useEffect(() => {
    if (ready) {
      void SplashScreen.hideAsync();
      setTimeout(() => setShowApp(true), ANIMATION_DURATION);
    }
  }, [ready]);

  if (!showApp) {
    return <SplashAnimation />;
  }

  return (
    <AuthProvider>
      <ThemeProvider value={isDark ? DarkTheme : DefaultTheme}>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="mountains" />
          <Stack.Screen name="highscores" />
          <Stack.Screen name="mountain/[slug]/index" />
          <Stack.Screen
            name="mountain/[slug]/summit"
            options={{ presentation: "modal" }}
          />
          <Stack.Screen name="+not-found" />
          <Stack.Screen name="user" />
          <Stack.Screen name="join" options={{ presentation: "modal" }} />
        </Stack>
        <StatusBar style="auto" />
      </ThemeProvider>
    </AuthProvider>
  );
}

export default function RootLayout() {
  return (
    <QueryClientProvider>
      <Content />
    </QueryClientProvider>
  );
}

import { GoogleSignin } from "@react-native-google-signin/google-signin";
import * as AppleAuthentication from "expo-apple-authentication";
import { Redirect, useRouter } from "expo-router";
import { useColorScheme } from "nativewind";
import { useState } from "react";
import { FormattedMessage } from "react-intl";
import { TouchableOpacity, View, ScrollView } from "react-native";
import Svg, { Path } from "react-native-svg";

import { useAuth } from "@/components/providers/auth-provider";
import { ThemedText, ThemedLogo } from "@/components/ui/atoms";
import { AvatarGroup } from "@/components/ui/molecules";
import { useJoinMutation } from "@/domains/user/user.api";
import { isIOS } from "@/lib/device";
import { getLocale } from "@/lib/locale";
import { logError } from "@/lib/log-error";

const GoogleG = ({ size = 20 }: { size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 48 48">
    <Path
      fill="#4285F4"
      d="M45.12 24.5c0-1.56-.14-3.06-.4-4.5H24v8.51h11.84c-.51 2.75-2.06 5.08-4.39 6.64v5.52h7.11c4.16-3.83 6.56-9.47 6.56-16.17z"
    />
    <Path
      fill="#34A853"
      d="M24 46c5.94 0 10.92-1.97 14.56-5.33l-7.11-5.52c-1.97 1.32-4.49 2.1-7.45 2.1-5.73 0-10.58-3.87-12.31-9.07H4.34v5.7C7.96 41.07 15.4 46 24 46z"
    />
    <Path
      fill="#FBBC05"
      d="M11.69 28.18c-.44-1.32-.69-2.73-.69-4.18s.25-2.86.69-4.18v-5.7H4.34C2.85 17.09 2 20.45 2 24c0 3.55.85 6.91 2.34 9.88l7.35-5.7z"
    />
    <Path
      fill="#EA4335"
      d="M24 10.75c3.23 0 6.13 1.11 8.41 3.29l6.31-6.31C34.91 4.18 29.93 2 24 2 15.4 2 7.96 6.93 4.34 14.12l7.35 5.7c1.73-5.2 6.58-9.07 12.31-9.07z"
    />
  </Svg>
);

// Configure Google Sign-In
GoogleSignin.configure({
  webClientId: process.env.EXPO_PUBLIC_WEB_CLIENT_ID as string,
  iosClientId: process.env.EXPO_PUBLIC_IOS_CLIENT_ID as string,
});

const users = [
  {
    name: "Josep Vidal",
    imageUrl: "https://i.imgur.com/0oEmlkN.png",
  },
  {
    name: "Aine",
    imageUrl:
      "https://josepvidal-public-dev-bucket.s3.eu-west-3.amazonaws.com/100cims/user/avatar/84be5086-1ff7-4b2f-8a09-fc87ecfa1fb6.jpeg?date=1737923330650",
  },
  {
    name: "John Mc",
    imageUrl:
      "https://lh3.googleusercontent.com/a/ACg8ocIh8IBckLwJI6OTq8tdJ2LFS-bJvhF99zdXHqXB43KEpGVDhinh=s96-c",
  },
  {
    name: "Lucas Mora",
    imageUrl:
      "https://lh3.googleusercontent.com/a/ACg8ocJ8j1Yc7UF_aOPQzN6xjwpRenCU-7DxdVT4wwO1nGpj72F8DM3K=s96-c",
  },
  {
    name: "Sophia Reyes",
    imageUrl:
      "https://josepvidal-public-dev-bucket.s3.eu-west-3.amazonaws.com/100cims/user/avatar/cf0d127a-734e-4c25-868d-75f67c8fda58.jpeg?date=1738901350591",
  },
  {
    name: "Emma Thompson",
    imageUrl:
      "https://josepvidal-public-dev-bucket.s3.eu-west-3.amazonaws.com/100cims/user/avatar/cd2ab9b8-0956-40fa-aa8e-fd8002ae5a32.jpeg?date=1738340984294",
  },
  {
    name: "Olivia Martinez",
    imageUrl:
      "https://lh3.googleusercontent.com/a/ACg8ocJqLN7cnfKCPbe_FmL-RzZ7v1DEVO_D5wFnpRBCtp6LiwCmybUuVQ=s96-c",
  },
  {
    name: "Noah Johnson",
    imageUrl:
      "https://lh3.googleusercontent.com/a/ACg8ocIWzHlVlK8j0ECC0en2NnjTIogBdaFYjpwQ56Xf26NzJWZQi77i=s96-c",
  },
  {
    name: "Liam Carter",
    imageUrl:
      "https://lh3.googleusercontent.com/a/ACg8ocLfSF9q6epe7msrrzOFy_DWnmfeCwDWMr4a8PCbcXHTHRoMgg=s96-c",
  },
  {
    name: "Mia Gonzalez",
    imageUrl:
      "https://josepvidal-public-dev-bucket.s3.eu-west-3.amazonaws.com/100cims/user/avatar/4e9d43b7-7291-4791-9ee6-6596be0919e7.jpeg?date=1738499191853",
  },
  {
    name: "James Taylor",
    imageUrl:
      "https://josepvidal-public-dev-bucket.s3.eu-west-3.amazonaws.com/100cims/user/avatar/f3e27b86-5fd1-422f-ade2-00bd2ac67969.jpeg?date=1738597681135",
  },
];

const AppleSignIn = () => {
  const { setAuthenticated } = useAuth();
  const { colorScheme } = useColorScheme();
  const router = useRouter();
  const { mutateAsync: joinMutate } = useJoinMutation();

  const isDark = colorScheme === "dark";

  return (
    <AppleAuthentication.AppleAuthenticationButton
      buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
      buttonStyle={
        isDark
          ? AppleAuthentication.AppleAuthenticationButtonStyle.WHITE
          : AppleAuthentication.AppleAuthenticationButtonStyle.BLACK
      }
      cornerRadius={6}
      style={{
        height: 56,
      }}
      onPress={async () => {
        try {
          const credentials = await AppleAuthentication.signInAsync({
            requestedScopes: [
              AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
              AppleAuthentication.AppleAuthenticationScope.EMAIL,
            ],
          });

          if (!credentials.identityToken) {
            return;
          }

          const jwt = await joinMutate({
            provider: "apple",
            identityToken: credentials.identityToken,
            firstName: credentials?.fullName?.givenName || undefined,
            lastName: credentials?.fullName?.familyName || undefined,
            locale: getLocale(),
          });
          if (!jwt) {
            return;
          }

          setAuthenticated(jwt);
          router.dismiss();
        } catch (error) {
          logError(error, "join/email");
        }
      }}
    />
  );
};

const GoogleSignIn = () => {
  const router = useRouter();
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const { setAuthenticated } = useAuth();
  const { mutateAsync: joinMutate } = useJoinMutation();

  const handleGoogleSignIn = async () => {
    try {
      setIsAuthenticating(true);

      // Check if Google Play Services are available (Android)
      await GoogleSignin.hasPlayServices();

      // Sign in with Google
      const response = await GoogleSignin.signIn();

      // Handle cancellation
      if (response.type === "cancelled") {
        setIsAuthenticating(false);
        return;
      }

      // Get the ID token
      const idToken = response.data?.idToken;

      if (!idToken) {
        setIsAuthenticating(false);
        return;
      }

      // Call backend to authenticate
      const jwt = await joinMutate({
        provider: "google",
        identityToken: idToken,
        locale: getLocale(),
      });

      if (!jwt) {
        setIsAuthenticating(false);
        return;
      }

      setAuthenticated(jwt);
      router.dismiss();
    } catch (error) {
      logError(error, "join/oauth");
      setIsAuthenticating(false);
    }
  };

  return (
    <TouchableOpacity
      onPress={handleGoogleSignIn}
      disabled={isAuthenticating}
      activeOpacity={0.85}
      className="h-14 flex-row items-center justify-center gap-3 rounded border-2 border-border bg-background"
      style={{ opacity: isAuthenticating ? 0.7 : 1 }}
    >
      <GoogleG size={20} />
      <ThemedText className="font-medium" style={{ fontSize: 19 }}>
        <FormattedMessage defaultMessage="Sign in with Google" />
      </ThemedText>
    </TouchableOpacity>
  );
};

export default function JoinScreen() {
  const { isAuthenticated } = useAuth();
  const router = useRouter();

  if (isAuthenticated) {
    return <Redirect href="/" />;
  }

  return (
    <ScrollView
      className="bg-background"
      contentContainerClassName="flex-grow justify-center gap-10 px-4 py-12"
    >
      <View className="items-center">
        <ThemedLogo style={{ width: 200, height: 120 }} />
        <View className="mt-10 items-center gap-1">
          <ThemedText className="text-center text-4xl font-bold">
            <FormattedMessage defaultMessage="Join" />{" "}
            <ThemedText className="text-4xl font-bold text-primary">
              Cims{" "}
            </ThemedText>
            <FormattedMessage defaultMessage="today" />
          </ThemedText>
          <ThemedText className="text-center text-xl font-medium text-muted-foreground">
            <FormattedMessage defaultMessage="and be part of a thriving community" />
          </ThemedText>
          <View className="mt-2 flex-row items-center justify-center gap-2">
            <AvatarGroup items={users} limit={users.length} />
          </View>
        </View>
      </View>
      <View className="mx-auto w-full max-w-lg gap-4">
        {isIOS && <AppleSignIn />}
        <GoogleSignIn />
        <TouchableOpacity
          className="mt-4"
          onPress={() => {
            // `dismissTo("/")` instead of `router.back()` — this screen is
            // often reached via `<Redirect href="/join" />` from gated
            // routes (shop, plans/create, challenges/community, mountains,
            // etc.) where the redirect REPLACES the gated route in the
            // stack. `back()` from here can pop back to that gated route
            // and immediately re-redirect to /join, leaving the user
            // stuck. `dismissTo("/")` lands on the app root regardless of
            // entry path (the route under the modal at the time of dismiss).
            router.dismissTo("/");
          }}
        >
          <ThemedText className="text-center text-muted-foreground">
            <FormattedMessage defaultMessage="I'll join later" />
          </ThemedText>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

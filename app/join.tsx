import { analytics } from "@jvidalv/react-analytics";
import { GoogleSignin } from "@react-native-google-signin/google-signin";
import * as AppleAuthentication from "expo-apple-authentication";
import { Redirect, useRouter } from "expo-router";
import { useColorScheme } from "nativewind";
import { useEffect, useState } from "react";
import { FormattedMessage } from "react-intl";
import { TouchableOpacity, View, Text, Image, ScrollView } from "react-native";
import { twMerge } from "tailwind-merge";

import { useAuth } from "@/components/providers/auth-provider";
import { ThemedText, Button } from "@/components/ui/atoms";
import { AvatarGroup } from "@/components/ui/molecules";
import { useJoinMutation } from "@/domains/user/user.api";
import { isAndroid, isIOS } from "@/lib/device";
import { getLocale } from "@/lib/locale";

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
        height: 48,
      }}
      onPress={async () => {
        try {
          analytics.action(`click-on-apple-sign-in`);

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
          analytics.error(`Error on apple sign-in`, {
            code: (error as { code: string })?.code,
          });
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
      analytics.action(`click-on-google-sign-in`);
      setIsAuthenticating(true);

      // Check if Google Play Services are available (Android)
      await GoogleSignin.hasPlayServices();

      // Sign in with Google
      const response = await GoogleSignin.signIn();

      // Handle cancellation
      if (response.type === 'cancelled') {
        analytics.action('google-sign-in-cancelled');
        setIsAuthenticating(false);
        return;
      }

      // Get the ID token
      const idToken = response.data?.idToken;

      if (!idToken) {
        analytics.error(`Error on Google sign-in - no ID token`);
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
        analytics.error('Google sign-in - no JWT from backend');
        setIsAuthenticating(false);
        return;
      }

      setAuthenticated(jwt);
      router.dismiss();
    } catch (error) {
      analytics.error(`Error on Google sign-in`, {
        error: (error as Error).message,
        code: (error as any)?.code,
      });
      setIsAuthenticating(false);
    }
  };

  return (
    <Button
      intent="outline"
      onPress={handleGoogleSignIn}
      disabled={isAuthenticating}
    >
      <Text className="text-blue-500" style={{ fontSize: 18 }}>
        G{"  "}
      </Text>
      <FormattedMessage defaultMessage="Sign in with Google" />
    </Button>
  );
};

export default function JoinScreen() {
  const { isAuthenticated } = useAuth();
  const router = useRouter();

  const features = [
    {
      emoji: "📝",
      text: (
        <ThemedText>
          <FormattedMessage defaultMessage="The ability to" />{" "}
          <ThemedText className="font-black tracking-tighter">
            <FormattedMessage defaultMessage="register your summits" />
          </ThemedText>{" "}
          <FormattedMessage defaultMessage="and track the ones left." />
        </ThemedText>
      ),
    },
    {
      emoji: "🏆",
      text: (
        <ThemedText>
          <ThemedText className="font-black tracking-tighter">
            <FormattedMessage defaultMessage="A community ranking" />
          </ThemedText>{" "}
          <FormattedMessage defaultMessage="where you can compete with other mountain lovers." />
        </ThemedText>
      ),
    },
    {
      emoji: "💪🏼",
      text: (
        <ThemedText>
          <ThemedText className="font-black tracking-tighter">
            <FormattedMessage defaultMessage="A profile with your feats" />
          </ThemedText>{" "}
          <FormattedMessage defaultMessage="that you can share with the world." />
        </ThemedText>
      ),
    },
  ];

  if (isAuthenticated) {
    return <Redirect href="/" />;
  }

  return (
    <ScrollView
      className="bg-background"
      contentContainerClassName={twMerge(
        "gap-6 px-4 pt-6 pb-32",
        isAndroid && "pt-24",
      )}
    >
      <View className="items-center">
        <View className="items-center justify-center overflow-hidden rounded-full border-4 border-primary">
          <Image
            source={require("@/assets/images/logo-small.png")}
            style={{ width: 120, height: 120 }}
          />
        </View>
      </View>
      <View className="items-center justify-center">
        <ThemedText className="items-center justify-center text-center text-4xl font-black">
          <FormattedMessage defaultMessage="Join" />{" "}
          <ThemedText className="text-4xl font-black text-primary">
            Cims{" "}
          </ThemedText>
          <FormattedMessage defaultMessage="today" />
        </ThemedText>
        <ThemedText className="items-center justify-center text-center text-xl font-medium text-muted-foreground">
          <FormattedMessage defaultMessage="and be part of a thriving community" />
        </ThemedText>
        <View className="mb-8 mt-3 flex-row items-center justify-center gap-2">
          <AvatarGroup items={users} limit={users.length} />
        </View>
        <View className="mb-12">
          <ThemedText className="mb-2 text-left text-lg font-medium text-muted-foreground">
            <FormattedMessage defaultMessage="Also unblock..." />
          </ThemedText>
          <View className="min-w-full gap-2">
            {features.map(({ emoji, text }, index) => (
              <View key={index} className="flex-row items-start gap-2">
                <ThemedText>{emoji}</ThemedText>
                <ThemedText className="flex-1 text-lg font-medium leading-5">
                  {text}
                </ThemedText>
              </View>
            ))}
          </View>
        </View>
      </View>
      <View className="mx-auto w-full max-w-lg gap-2">
        {isIOS && <AppleSignIn />}
        <GoogleSignIn />
        <TouchableOpacity
          className="mt-4"
          onPress={() => {
            analytics.action("join-later");
            router.back();
          }}
        >
          <ThemedText className="text-center text-muted-foreground underline">
            <FormattedMessage defaultMessage="I'll join later" />
          </ThemedText>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

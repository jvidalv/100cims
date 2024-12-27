import { ThemedView, ThemedText, Button } from "@/components/ui/atoms";
import { Image } from "expo-image";
import { TouchableOpacity, View } from "react-native";
import { AvatarGroup } from "@/components/ui/molecules";
import * as AppleAuthentication from "expo-apple-authentication";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useRouter } from "expo-router";

const data = [
  {
    name: "Magda Vidal",
    imageUrl:
      "https://media.licdn.com/dms/image/v2/D4E03AQFpQWS35rdxNg/profile-displayphoto-shrink_400_400/profile-displayphoto-shrink_400_400/0/1729674280775?e=1740009600&v=beta&t=qMlgUxWbIHz2XlEZ24GhsDWz9oDFSTxXCjVjoyqnkG8",
  },
  {
    name: "Pepito Justo",
    imageUrl:
      "https://media.licdn.com/dms/image/v2/D4D03AQH9Xw8ywHmkcw/profile-displayphoto-shrink_400_400/profile-displayphoto-shrink_400_400/0/1729705481301?e=1740009600&v=beta&t=Q_dUBQpNYRdKE7UVGD9gUpIzTVRdxptlDbgUGbVg5Fk",
  },
  { name: "Lucas Mora", imageUrl: "https://picsum.photos/id/300/200" },
  { name: "Sophia Reyes", imageUrl: "https://picsum.photos/id/350/200" },
  { name: "Emma Thompson", imageUrl: "https://picsum.photos/id/400/200" },
  { name: "Olivia Martinez", imageUrl: "https://picsum.photos/id/450/200" },
  { name: "Noah Johnson", imageUrl: "https://picsum.photos/id/500/200" },
  { name: "Liam Carter", imageUrl: "https://picsum.photos/id/550/200" },
  { name: "Mia Gonzalez", imageUrl: "https://picsum.photos/id/600/200" },
  { name: "James Taylor", imageUrl: "https://picsum.photos/id/650/200" },
  { name: "William Adams", imageUrl: "https://picsum.photos/id/700/200" },
  { name: "Ava Brown", imageUrl: "https://picsum.photos/id/750/200" },
];

const features = [
  {
    emoji: "📝",
    text: (
      <ThemedText>
        The ability to{" "}
        <ThemedText className="font-black tracking-tighter">
          register your summits
        </ThemedText>{" "}
        and track your completed mountains.
      </ThemedText>
    ),
  },
  {
    emoji: "🏆",
    text: (
      <ThemedText>
        A{" "}
        <ThemedText className="font-black tracking-tighter">
          community ranking
        </ThemedText>{" "}
        where you can compete with other mountain lovers.
      </ThemedText>
    ),
  },
  {
    emoji: "💪🏼",
    text: (
      <ThemedText>
        A{" "}
        <ThemedText className="font-black tracking-tighter">
          profile with your feats
        </ThemedText>{" "}
        that you can share with the world.
      </ThemedText>
    ),
  },
];

export default function JoinScreen({}) {
  const { isDark } = useColorScheme();
  const router = useRouter();

  return (
    <ThemedView className="flex-1 gap-6 px-6 pt-6">
      <View className="items-center">
        <View
          className="items-center border-4 border-accent rounded-full justify-center overflow-hidden"
          style={{ width: 150, height: 150 }}
        >
          <Image
            source={require("@/assets/images/logo-small.png")}
            style={{ width: 150, height: 150 }}
          />
        </View>
      </View>
      <View className="items-center justify-center">
        <ThemedText className="items-center justify-center text-4xl font-black">
          Join{" "}
          <ThemedText className="text-accent font-black">100cims </ThemedText>
          today
        </ThemedText>
        <ThemedText className="items-center justify-center text-xl font-medium text-muted-foreground">
          and be part of a thriving community
        </ThemedText>
        <View className="mt-3 mb-8 gap-2 flex-row items-center justify-center">
          <AvatarGroup items={data} />
        </View>
        <View className="mb-12">
          <ThemedText className="text-lg text-left font-medium text-muted-foreground mb-2">
            Also unblock...
          </ThemedText>
          <View className="gap-2 w-[350px]">
            {features.map(({ emoji, text }, index) => (
              <View key={index} className="flex-row gap-2 items-start">
                <ThemedText>{emoji}</ThemedText>
                <ThemedText className="font-medium text-lg leading-5 flex-1">
                  {text}
                </ThemedText>
              </View>
            ))}
          </View>
        </View>
      </View>
      <View className="mt-auto justify-end pb-12 flex-1">
        <AppleAuthentication.AppleAuthenticationButton
          buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
          buttonStyle={
            isDark
              ? AppleAuthentication.AppleAuthenticationButtonStyle.WHITE
              : AppleAuthentication.AppleAuthenticationButtonStyle.BLACK
          }
          cornerRadius={12}
          style={{
            height: 44,
          }}
          onPress={async () => {
            try {
              const credential = await AppleAuthentication.signInAsync({
                requestedScopes: [
                  AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
                  AppleAuthentication.AppleAuthenticationScope.EMAIL,
                ],
              });
              // signed in
            } catch (e) {
              // if (e.code === "ERR_REQUEST_CANCELED") {
              //   // handle that the user canceled the sign-in flow
              // } else {
              //   // handle other errors
              // }
            }
          }}
        />
        <Button className="rounded-xl mt-2 bg-zinc-600">
          Sign in with Google
        </Button>
        <TouchableOpacity className="py-8" onPress={() => router.back()}>
          <ThemedText className="text-muted-foreground text-center underline">
            I will join later
          </ThemedText>
        </TouchableOpacity>
      </View>
    </ThemedView>
  );
}

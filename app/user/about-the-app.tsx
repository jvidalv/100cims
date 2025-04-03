import * as Linking from "expo-linking";
import { Link } from "expo-router";
import { FormattedMessage } from "react-intl";
import { TouchableOpacity, View, Image } from "react-native";

import { ThemedText, ThemedView } from "@/components/ui/atoms";
import { ScreenHeader } from "@/components/ui/molecules";

export default function AboutTheAppScreen() {
  return (
    <ThemedView className="flex-1">
      <ScreenHeader />
      <View className="flex-1 px-6">
        <ThemedText className="mb-4 text-4xl font-bold">
          <FormattedMessage defaultMessage="About the app" />
        </ThemedText>
        <ThemedText className="mb-2 text-muted-foreground">
          <FormattedMessage
            defaultMessage="Inspired by the FEEC “100 cims” challenge, whose main goal
          is to promote knowledge of the territory while practicing hiking."
          />
        </ThemedText>
        <TouchableOpacity
          onPress={() =>
            Linking.openURL(`https://www.feec.cat/activitats/100-cims/`)
          }
        >
          <ThemedText className="mb-6 underline">
            <FormattedMessage defaultMessage="Read more on FEEC website." />
          </ThemedText>
        </TouchableOpacity>
        <ThemedText className="mb-3 text-2xl font-semibold">
          <FormattedMessage defaultMessage="The author" />
        </ThemedText>
        <View className="mb-4 flex items-center rounded-lg border border-border p-6">
          <Image
            source={require("@/assets/images/me.jpg")}
            className="mb-4 size-32 rounded-full"
          />
          <View className="items-center">
            <ThemedText className="mb-1 text-xl font-semibold">
              Josep Vidal
            </ThemedText>
            <ThemedText className="mb-4 text-blue-500">
              <FormattedMessage defaultMessage="Product engineer" />
            </ThemedText>
            <View className="flex flex-row gap-4">
              <Link
                href={{
                  pathname: "/user/[user]",
                  params: { user: "26315621-1e82-4c30-9c58-83055b21742c" },
                }}
              >
                <ThemedText className="font-medium underline">
                  <FormattedMessage defaultMessage="Profile" />
                </ThemedText>
              </Link>
              <Link href="https://www.linkedin.com/in/josepvidalvidal/">
                <ThemedText className="font-medium underline">
                  <FormattedMessage defaultMessage="Linkedin" />
                </ThemedText>
              </Link>
              <Link href="mailto:josepvidalvidal@gmail.com">
                <ThemedText className="font-medium underline">
                  <FormattedMessage defaultMessage="Email" />
                </ThemedText>
              </Link>
            </View>
          </View>
        </View>
        <View className="relative gap-1 rounded-xl border border-border p-4">
          <View className="absolute -right-3 -top-3">
            <ThemedText>👨‍💻</ThemedText>
          </View>
          <ThemedText className="font-medium">
            <FormattedMessage defaultMessage="Do you want a good looking app?" />
          </ThemedText>
          <ThemedText className="text-muted-foreground ">
            <FormattedMessage defaultMessage="I’m open to freelance work—if you like what you see and need help with your next app idea, feel free to reach out." />
          </ThemedText>
        </View>
      </View>
    </ThemedView>
  );
}

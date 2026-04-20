import { Link } from "expo-router";
import { FormattedMessage } from "react-intl";
import { Image, ScrollView, View } from "react-native";

import { ThemedText, ThemedView } from "@/components/ui/atoms";
import { ScreenHeader } from "@/components/ui/molecules";

export default function AboutTheAppScreen() {
  return (
    <ThemedView className="flex-1">
      <ScreenHeader />
      <ScrollView
        className="flex-1"
        contentContainerClassName="px-6 pb-12"
        showsVerticalScrollIndicator={false}
      >
        <ThemedText className="mb-3 text-4xl font-bold">
          <FormattedMessage defaultMessage="About" />
        </ThemedText>
        <ThemedText className="mb-10 text-muted-foreground">
          <FormattedMessage defaultMessage="A non-profit app to help hikers discover the territory while enjoying the mountains. Made with care, shared for free." />
        </ThemedText>

        <View className="mb-10 flex-row items-center gap-4">
          <Image
            source={require("@/assets/images/me.jpg")}
            className="size-20 rounded-full"
          />
          <View className="flex-1">
            <ThemedText className="text-lg font-semibold">
              Josep Vidal
            </ThemedText>
            <ThemedText className="mb-2 text-sm text-muted-foreground">
              <FormattedMessage defaultMessage="Built and maintained by one person." />
            </ThemedText>
            <View className="flex-row gap-4">
              <Link
                href={{
                  pathname: "/user/[user]",
                  params: { user: "26315621-1e82-4c30-9c58-83055b21742c" },
                }}
              >
                <ThemedText className="text-sm font-medium text-blue-500">
                  <FormattedMessage defaultMessage="My profile" />
                </ThemedText>
              </Link>
              <Link href="https://jvidal.dev">
                <ThemedText className="text-sm font-medium text-blue-500">
                  jvidal.dev
                </ThemedText>
              </Link>
            </View>
          </View>
        </View>

        <ThemedText className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          <FormattedMessage defaultMessage="Need a good-looking app?" />
        </ThemedText>
        <View className="mb-6 rounded border border-border p-4">
          <ThemedText className="text-sm text-muted-foreground">
            <FormattedMessage defaultMessage="Available for freelance. If you like what you see, reach out." />
          </ThemedText>
          <View className="mt-3 flex-row flex-wrap gap-x-4 gap-y-2">
            <Link href="https://www.linkedin.com/in/josepvidalvidal/">
              <ThemedText className="text-sm font-medium text-blue-500">
                LinkedIn
              </ThemedText>
            </Link>
            <Link href="mailto:hello@fescims.com">
              <ThemedText className="text-sm font-medium text-blue-500">
                <FormattedMessage defaultMessage="Email" />
              </ThemedText>
            </Link>
          </View>
        </View>

        <ThemedText className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          <FormattedMessage defaultMessage="Other projects" />
        </ThemedText>
        <Link href="https://berrus.app" asChild>
          <View className="flex-row items-center gap-4 rounded border border-border p-4">
            <Image
              source={require("@/assets/images/berrus-icon.png")}
              className="size-14 rounded-xl"
            />
            <View className="flex-1">
              <ThemedText className="font-semibold">Berrus</ThemedText>
              <ThemedText className="text-sm text-muted-foreground">
                <FormattedMessage defaultMessage="Browser RPG set in post-cataclysm Catalonia." />
              </ThemedText>
            </View>
          </View>
        </Link>
      </ScrollView>
    </ThemedView>
  );
}

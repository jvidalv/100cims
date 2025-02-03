import * as Linking from "expo-linking";
import { FormattedMessage } from "react-intl";
import { TouchableOpacity, View } from "react-native";

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
            defaultMessage="In 2006, the FEEC launched the “100 cims” challenge, whose main goal
          is to promote knowledge of the territory while practicing hiking."
          />
        </ThemedText>
        <TouchableOpacity
          onPress={() =>
            Linking.openURL(`https://www.feec.cat/activitats/100-cims/`)
          }
        >
          <ThemedText className="mb-4 underline">
            <FormattedMessage defaultMessage="Read more on FEEC website." />
          </ThemedText>
        </TouchableOpacity>
        <ThemedText className="mb-2 text-muted-foreground">
          <FormattedMessage
            defaultMessage="This is a non-profit app designed to help you track your progress,
          discover new mountains, and embrace the challenge of conquering the
          100 summits."
          />
        </ThemedText>
        <ThemedText className="mb-3 text-muted-foreground">
          <FormattedMessage
            defaultMessage="Build by Josep Vidal, a software engineer
          passionate about creating impactful projects that blend technology and
          adventure."
          />
        </ThemedText>
        <View className="flex-1 flex-row flex-wrap gap-x-1">
          <ThemedText className="text-muted-foreground">
            <FormattedMessage defaultMessage="Contact Josep on" />
          </ThemedText>
          <TouchableOpacity
            onPress={() =>
              Linking.openURL("https://www.linkedin.com/in/josepvidalvidal/")
            }
          >
            <ThemedText className="font-medium underline">
              <FormattedMessage defaultMessage="Linkedin" />
            </ThemedText>
          </TouchableOpacity>
          <ThemedText className="text-muted-foreground">
            <FormattedMessage defaultMessage="or by email at" />
          </ThemedText>
          <ThemedText selectable className="font-medium underline">
            josepvidalvidal@gmail.com
          </ThemedText>
          <ThemedText>.</ThemedText>
        </View>
      </View>
    </ThemedView>
  );
}

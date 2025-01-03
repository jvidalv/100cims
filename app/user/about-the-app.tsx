import * as Linking from "expo-linking";
import { TouchableOpacity, View } from "react-native";

import { Header } from "@/components/navigation";
import { ThemedText, ThemedView } from "@/components/ui/atoms";

export default function AboutTheAppScreen() {
  return (
    <ThemedView className="flex-1">
      <Header />
      <View className="flex-1 px-6">
        <ThemedText className="mb-4 text-4xl font-bold">
          About the app
        </ThemedText>
        <ThemedText className="mb-2 text-muted-foreground">
          This is a non-profit app designed to help you track your progress,
          discover new mountains, and embrace the challenge of conquering the
          100 summits.
        </ThemedText>
        <ThemedText className="mb-3 text-muted-foreground">
          This side-project has been build by Josep Vidal, a software engineer
          passionate about creating impactful projects that blend technology and
          adventure.
        </ThemedText>
        <View className="flex-1 flex-row flex-wrap gap-x-1">
          <ThemedText className="font-medium">Contact Josep on</ThemedText>
          <TouchableOpacity
            onPress={() =>
              Linking.openURL("https://www.linkedin.com/in/josepvidalvidal/")
            }
          >
            <ThemedText className="font-medium underline">Linkedin</ThemedText>
          </TouchableOpacity>
          <ThemedText className="font-medium">or by email at</ThemedText>
          <ThemedText selectable className="font-medium underline">
            josepvidalvidal@gmail.com
          </ThemedText>
        </View>
      </View>
    </ThemedView>
  );
}

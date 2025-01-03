import * as Linking from "expo-linking";
import { TouchableOpacity, View } from "react-native";

import { Header } from "@/components/navigation";
import { ThemedText, ThemedView } from "@/components/ui/atoms";

export default function CentCimsChallengeScreen() {
  return (
    <ThemedView className="flex-1">
      <Header />
      <View className="flex-1 px-6">
        <ThemedText className="mb-4 text-4xl font-bold">
          100 cims challenge
        </ThemedText>
        <ThemedText className="mb-2 text-muted-foreground">
          In 2006, the FEEC launched the “100 cims” challenge, whose main goal
          is to promote knowledge of the territory while practicing hiking.
        </ThemedText>
        <ThemedText className="mb-4 text-muted-foreground">
          The challenge involves reaching 100 peaks from a list of 522
          representative mountains in Catalonia, Northern Catalonia, and
          Andorra. This list of peaks is the result of research conducted by
          members of the “100 Peaks” Committee and contributions from federated
          individuals who have provided input.
        </ThemedText>
        <TouchableOpacity
          onPress={() =>
            Linking.openURL(`https://www.feec.cat/activitats/100-cims/`)
          }
        >
          <ThemedText className="underline">
            Read more on FEEC website
          </ThemedText>
        </TouchableOpacity>
      </View>
    </ThemedView>
  );
}

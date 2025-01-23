import { useRouter } from "expo-router";
import { useState } from "react";
import { FormattedMessage } from "react-intl";
import { TouchableOpacity, View } from "react-native";
import { twMerge } from "tailwind-merge";

import { useChallenge } from "@/components/providers/challenge-provider";
import {
  ActivityIndicator,
  Icon,
  ThemedText,
  ThemedView,
} from "@/components/ui/atoms";
import { useChallengesGet } from "@/domains/challenge/challenge.api";
import { countryToEmoji } from "@/domains/challenge/challenge.model";
import { isAndroid } from "@/lib/device";

const colors = [
  "#BAE1FF", // Baby Blue
  "#E2C2FF", // Lavender
  "#FFFFBA", // Light Yellow
  "#BAFFC9", // Mint Green
  "#FFDFBA", // Pastel Peach
];

export default function ChallengesScreen() {
  const router = useRouter();
  const { challengeId, setChallengeId } = useChallenge();
  const { data: challenges } = useChallengesGet();
  const [isLoading, setIsLoading] = useState(false);

  const onChallengeSelect = async (id: string) => {
    try {
      setChallengeId(id);
      setIsLoading(true);
      await new Promise((resolve) => setTimeout(resolve, 1000));
      router.dismiss();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ThemedView
      className={twMerge("flex-1 gap-6 px-4 pt-6", isAndroid && "pt-24")}
    >
      <View>
        <ThemedText className="text-4xl font-black">
          <FormattedMessage defaultMessage="Challenges" />
        </ThemedText>
        <ThemedText className="text-muted-foreground">
          <FormattedMessage defaultMessage="Each challenge is constrained within a region. You can switch betweem them freely, progress is saved." />
        </ThemedText>
      </View>
      <View className="gap-2">
        {challenges?.map((challenge, index) => (
          <TouchableOpacity
            key={challenge.id}
            disabled={isLoading}
            onPress={() => onChallengeSelect(challenge.id)}
            className="flex-row items-center justify-between gap-4 rounded-xl border-2 border-border p-2"
          >
            <View className="flex-row items-center gap-4">
              <View
                className="size-12 items-center justify-center rounded-xl"
                style={{ backgroundColor: colors[index] }}
              >
                <ThemedText>{countryToEmoji(challenge.country)}</ThemedText>
              </View>
              <View>
                <ThemedText
                  className={twMerge(
                    "text-xl font-black tracking-tighter",
                    challengeId === challenge.id && "text-primary",
                  )}
                >
                  {challenge.name}
                </ThemedText>
                <View className="flex-row items-center">
                  <View className="w-20 flex-row items-center gap-1 rounded-xl">
                    <Icon name="mountain.2.fill" muted size={22} />
                    <ThemedText className="font-medium text-muted-foreground">
                      {challenge?.totalMountains}
                    </ThemedText>
                  </View>
                </View>
              </View>
            </View>
            {isLoading && challengeId === challenge.id ? (
              <ActivityIndicator className="opacity-30" />
            ) : (
              <Icon name="chevron.right" muted size={16} weight="medium" />
            )}
          </TouchableOpacity>
        ))}
      </View>
    </ThemedView>
  );
}

import { format } from "date-fns/format";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { FormattedMessage, useIntl } from "react-intl";
import { View, StyleSheet, TouchableOpacity, Image } from "react-native";

import { useChallenge } from "@/components/providers/challenge-provider";
import { Skeleton, ThemedText } from "@/components/ui/atoms";
import { AvatarGroup } from "@/components/ui/molecules";
import ParallaxScrollView from "@/components/ui/organisms/parallax-scroll-view";
import { useChallengesGet } from "@/domains/challenge/challenge.api";
import { useSummitsGet } from "@/domains/summit/summit.api";
import { getFullName } from "@/domains/user/user.utils";

export default function SummitsScreen() {
  const router = useRouter();
  const intl = useIntl();
  const { challengeId } = useChallenge();
  const { data: challenges } = useChallengesGet();
  const challenge = challenges?.find(
    (challenge) => challenge.id === challengeId,
  );
  const { data: summits, isPending: isPendingSummits } = useSummitsGet({
    limit: 100,
  });

  return (
    <ParallaxScrollView
      title={challenge?.name || "..."}
      subtitle={intl.formatMessage({ defaultMessage: "Challenge" })}
      headerClassName="flex items-center justify-center bg-primary"
      contentClassName="py-6"
      headerImage={<View className="flex-1 bg-primary" />}
      height={200}
    >
      <ThemedText className="mb-4 px-6 text-2xl font-semibold">
        <FormattedMessage defaultMessage="Last summits" />
      </ThemedText>
      <View className="flex flex-row flex-wrap">
        {isPendingSummits && (
          <>
            <Skeleton className="h-44 w-1/2 rounded-none" />
            <Skeleton className="h-44 w-1/2 rounded-none border-l border-background" />
            <Skeleton className="h-44 w-1/2 rounded-none border-t border-background" />
            <Skeleton className="h-44 w-1/2 rounded-none border-l border-t border-background" />
            <Skeleton className="h-44 w-1/2 rounded-none border-t border-background" />
            <Skeleton className="h-44 w-1/2 rounded-none border-l border-t border-background" />
            <Skeleton className="h-44 w-1/2 rounded-none border-t border-background" />
            <Skeleton className="h-44 w-1/2 rounded-none border-l border-t border-background" />
          </>
        )}
        {summits?.map(({ summitId, summitImageUrl, summitedAt, users }) => (
          <TouchableOpacity
            key={summitId}
            onPress={() =>
              router.push({
                pathname: "/user/summits/[summit]",
                params: { summit: summitId },
              })
            }
            className="relative h-44 w-1/2"
          >
            <Image
              source={{ uri: summitImageUrl }}
              style={{ height: "100%", width: "100%" }}
            />
            <View className="absolute size-full">
              <LinearGradient
                colors={["transparent", "transparent", "rgba(0,0,0,0.3)"]}
                style={StyleSheet.absoluteFill}
              />
            </View>
            <View className="absolute bottom-4 w-full flex-row items-end justify-between px-2">
              <AvatarGroup
                size="sm"
                items={users?.map((participant) => ({
                  name: getFullName(participant),
                  imageUrl: participant.imageUrl,
                }))}
              />
              <ThemedText className="font-medium text-white">
                {format(summitedAt, "dd MMM yyyy")}
              </ThemedText>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </ParallaxScrollView>
  );
}

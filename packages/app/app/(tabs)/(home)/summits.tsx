import { useRouter } from "expo-router";
import { FormattedMessage } from "react-intl";
import { View, ScrollView } from "react-native";

import { SummitCard } from "@/components/summit";
import { Skeleton, ThemedText, ThemedView } from "@/components/ui/atoms";
import {
  BLURRED_SCREEN_HEADER_HEIGHT,
  BlurredScreenHeader,
} from "@/components/ui/molecules";
import { useSummitsGet } from "@/domains/summit/summit.api";

export default function SummitsScreen() {
  const router = useRouter();
  const { data: summits, isPending: isPendingSummits } = useSummitsGet({
    limit: 100,
  });

  return (
    <ThemedView className="flex-1">
      <BlurredScreenHeader>
        <ThemedText numberOfLines={1} className="text-lg font-medium">
          <FormattedMessage defaultMessage="Latest summits" />
        </ThemedText>
      </BlurredScreenHeader>
      <ScrollView
        contentContainerStyle={{
          paddingTop: BLURRED_SCREEN_HEADER_HEIGHT,
          paddingHorizontal: 16,
          flexDirection: "row",
          flexWrap: "wrap",
        }}
      >
        {isPendingSummits && (
          <>
            <View className="w-1/2">
              <Skeleton
                className="w-full border-background mb-2"
                style={{ height: 243, borderRadius: 6 }}
              />
            </View>
            <View className="w-1/2 pl-1.5">
              <Skeleton
                className="w-full border-background mb-2"
                style={{ height: 243, borderRadius: 6 }}
              />
            </View>
            <View className="w-1/2">
              <Skeleton
                className="w-full border-background mb-2"
                style={{ height: 243, borderRadius: 6 }}
              />
            </View>
            <View className="w-1/2 pl-1.5">
              <Skeleton
                className="w-full border-background mb-2"
                style={{ height: 243, borderRadius: 6 }}
              />
            </View>
            <View className="w-1/2">
              <Skeleton
                className="w-full border-background mb-2"
                style={{ height: 243, borderRadius: 6 }}
              />
            </View>
            <View className="w-1/2 pl-1.5">
              <Skeleton
                className="w-full border-background mb-2"
                style={{ height: 243, borderRadius: 6 }}
              />
            </View>
            <View className="w-1/2">
              <Skeleton
                className="w-full border-background mb-2"
                style={{ height: 243, borderRadius: 6 }}
              />
            </View>
            <View className="w-1/2 pl-1.5">
              <Skeleton
                className="w-full border-background mb-2"
                style={{ height: 243, borderRadius: 6 }}
              />
            </View>
          </>
        )}
        {summits?.map((summit, index) => (
          <SummitCard
            key={summit.summitId}
            summit={summit}
            index={index}
            onPress={() =>
              router.push({
                pathname: "/user/summits/[summit]",
                params: { summit: summit.summitId },
              })
            }
            onParticipantPress={(userId) => router.push(`/user/${userId}`)}
          />
        ))}
      </ScrollView>
    </ThemedView>
  );
}

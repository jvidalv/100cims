import { format } from "date-fns/format";
import { useRouter } from "expo-router";
import { FormattedMessage } from "react-intl";
import { View, TouchableOpacity, Image, ScrollView } from "react-native";
import { twMerge } from "tailwind-merge";

import { Skeleton, ThemedText, ThemedView } from "@/components/ui/atoms";
import { AvatarGroup, ScreenHeader } from "@/components/ui/molecules";
import { useSummitsGet } from "@/domains/summit/summit.api";
import { getFullName } from "@/domains/user/user.utils";

export default function SummitsScreen() {
  const router = useRouter();
  const { data: summits, isPending: isPendingSummits } = useSummitsGet({
    limit: 100,
  });

  return (
    <ThemedView className="flex-1">
      <ScreenHeader />
      <ScrollView contentContainerClassName="flex flex-row flex-wrap mx-4">
        <ThemedText className="mx-1 mb-4 text-4xl font-bold">
          <FormattedMessage defaultMessage="Latest summits" />
        </ThemedText>
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
        {summits?.map(
          (
            { summitId, mountainName, summitImageUrl, summitedAt, users },
            index,
          ) => (
            <TouchableOpacity
              key={summitId}
              onPress={() =>
                router.push({
                  pathname: "/user/summits/[summit]",
                  params: { summit: summitId },
                })
              }
              className={twMerge(
                "relative w-1/2 mb-2",
                index % 2 !== 0 && "pl-1.5",
              )}
            >
              <Image
                source={{ uri: summitImageUrl }}
                className="bg-neutral-200 dark:bg-neutral-800"
                style={{
                  height: 200,
                  width: "100%",
                  borderTopRightRadius: 6,
                  borderTopLeftRadius: 6,
                }}
              />
              <View className="flex-1 overflow-ellipsis w-full flex-row items-center justify-between gap-4 border border-t-0 border-gray-200 rounded-b-lg dark:border-0 dark:bg-neutral-800 p-2">
                <View className="flex-1">
                  <View className="mb-0.5">
                    <ThemedText
                      numberOfLines={1}
                      className="text-sm font-medium overflow-ellipsis"
                    >
                      {mountainName}
                    </ThemedText>
                  </View>
                  <View className="flex-row items-center justify-between gap-2">
                    <ThemedText className="text-muted-foreground text-xs">
                      {format(summitedAt, "dd MMM yyyy")}
                    </ThemedText>
                  </View>
                </View>
                <AvatarGroup
                  size="xs"
                  items={users?.map((participant) => ({
                    name: getFullName(participant),
                    imageUrl: participant.imageUrl,
                    id: participant.id,
                  }))}
                  onPress={({ id }) => router.push(`/user/${id}`)}
                />
              </View>
            </TouchableOpacity>
          ),
        )}
      </ScrollView>
    </ThemedView>
  );
}

import { format } from "date-fns/format";
import { BlurView } from "expo-blur";
import { Link } from "expo-router";
import { useMemo } from "react";
import { ScrollView, TouchableOpacity, View } from "react-native";

import { useAuth } from "@/components/providers/auth-provider";
import { Avatar, Icon } from "@/components/ui/atoms";
import { ThemedText } from "@/components/ui/atoms/themed-text";
import { ThemedView } from "@/components/ui/atoms/themed-view";
import { BottomDrawer, MountainItemList } from "@/components/ui/molecules";
import { AvatarGroup } from "@/components/ui/molecules/avatar-group";
import { useRecommendedPeaks } from "@/domains/mountain/mountain.api";
import { useSummitsGet } from "@/domains/summit/summit.api";
import { useUserMe, useUserSummits } from "@/domains/user/user.api";
import { getFullName } from "@/domains/user/user.utils";
import { getInitials } from "@/lib/strings";

export default function IndexScreen() {
  const recommendedPeaks = useRecommendedPeaks();
  const { isAuthenticated } = useAuth();
  const { data: user } = useUserMe();
  const fullName = user ? getFullName(user) : "";

  const { data: latestSummits } = useSummitsGet({ limit: 5 });
  const { data: summits, isPending: isPendingScore } = useUserSummits();

  const totalScore = useMemo(() => {
    if (!summits || !summits.length) {
      return 0;
    }

    return summits.reduce((acc, current) => {
      acc = acc + current.score;
      return acc;
    }, 0);
  }, [summits]);

  return (
    <ThemedView>
      <BlurView className="absolute z-20 h-[7.5rem] w-full justify-end px-6 pb-2">
        <View className="flex-row items-center justify-between">
          <View />
          <Link href={isAuthenticated ? "/user" : "/join"}>
            <Avatar
              initials={isAuthenticated ? getInitials(fullName) || "👨‍🚀" : "🏔️"}
              imageUrl={user?.imageUrl}
            />
          </Link>
        </View>
      </BlurView>
      <ScrollView className="gap-10 px-6" contentContainerClassName="gap-10">
        <View className="h-24" />
        <View>
          <View className="flex-row items-end justify-between">
            <View className="flex-row items-center">
              <ThemedText className="text-2xl font-bold">Score</ThemedText>
              <BottomDrawer
                Trigger={({ setOpen }) => (
                  <TouchableOpacity
                    onPress={() => setOpen((o) => !o)}
                    className="py-1.5 pl-1.5 pr-3"
                  >
                    <Icon name="info.circle" size={20} muted />
                  </TouchableOpacity>
                )}
              >
                {() => (
                  <View>
                    <ThemedText className="mb-0 text-2xl font-semibold">
                      About the score
                    </ThemedText>
                    <ThemedText className="mb-3 text-lg leading-5 text-muted-foreground">
                      The score is based on the height of the completed peaks
                      mountains.
                    </ThemedText>
                    <ThemedText className="mb-4">
                      One mountain of 1000 meters ={" "}
                      <ThemedText className="text-primary">
                        1000 points
                      </ThemedText>
                      .
                    </ThemedText>
                    <View className="flex-row items-center gap-2 rounded-lg border border-border p-2">
                      <ThemedText>🔥</ThemedText>
                      <ThemedText>
                        <ThemedText className="font-medium text-primary">
                          Essentials{" "}
                        </ThemedText>
                        are worth x2. Summit them!
                      </ThemedText>
                    </View>
                  </View>
                )}
              </BottomDrawer>
            </View>
            <Link href="/highscores" className="-mx-2 -mb-2 p-2">
              <View className="flex-row items-center gap-1">
                <ThemedText className="text-muted-foreground">
                  Highscores
                </ThemedText>
                <Icon name="arrow.forward" size={12} weight="bold" muted />
              </View>
            </Link>
          </View>
          <View className="-mt-1 flex-row items-center gap-2">
            <ThemedText className="text-5xl font-black text-primary">
              {isPendingScore ? "..." : totalScore}
            </ThemedText>
            {!isPendingScore && (
              <View className="mt-3 flex-row items-center gap-1">
                <ThemedText className="text-xl font-bold">
                  {summits?.length}
                </ThemedText>
                <ThemedText className="mt-0.5 text-sm">peaks</ThemedText>
              </View>
            )}
          </View>
        </View>
        <View className="gap-4">
          <ThemedText className="text-2xl font-bold">Latest summits</ThemedText>
          <View className="gap-3">
            {latestSummits?.data?.message?.map(
              ({ summitId, mountainName, summitedAt, users }) => {
                return (
                  <View className="flex-row items-center" key={summitId}>
                    <View>
                      <ThemedText className="font-medium">
                        {mountainName}
                      </ThemedText>
                      <ThemedText className="text-sm text-muted-foreground">
                        {format(summitedAt, "dd MMM yyyy")}
                      </ThemedText>
                    </View>
                    <View className="ml-auto">
                      <AvatarGroup
                        size="sm"
                        items={users.map((user) => ({
                          name: getFullName(user),
                          imageUrl: user.imageUrl,
                        }))}
                      />
                    </View>
                  </View>
                );
              },
            )}
          </View>
        </View>
        <View className="gap-4">
          <View className="flex-row items-end justify-between">
            <ThemedText className="text-2xl font-bold">
              Peaks for you
            </ThemedText>
            <Link href="/mountains" className="-mx-2 -mb-2 p-2">
              <View className="flex-row items-center gap-1">
                <ThemedText className="text-muted-foreground">All</ThemedText>
                <Icon name="arrow.forward" size={12} weight="bold" muted />
              </View>
            </Link>
          </View>
          <View className="gap-4">
            {recommendedPeaks?.map(
              ({ id, name, height, slug, imageUrl, essential, location }) => (
                <MountainItemList
                  key={id}
                  name={name}
                  height={height}
                  slug={slug}
                  imageUrl={imageUrl}
                  essential={essential}
                  location={location}
                />
              ),
            )}
          </View>
        </View>
      </ScrollView>
    </ThemedView>
  );
}

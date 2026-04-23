import { FormattedMessage } from "react-intl";
import { FlatList, useWindowDimensions, View } from "react-native";

import {
  HISCORE_ROW_HEIGHT,
  HiscoreRow,
  HiscoreRowSkeleton,
} from "@/components/hiscores/hiscore-row";
import { ThemedText, ThemedView } from "@/components/ui/atoms";
import { ScreenHeader } from "@/components/ui/molecules";
import { useActiveChallenge } from "@/domains/challenge/challenge.api";
import {
  RankedHiscoreEntry,
  useHiscoresAroundMeGet,
} from "@/domains/hiscores/hiscores.api";
import { useScoreFormatter } from "@/domains/hiscores/use-score-formatter";
import { useUserMe } from "@/domains/user/user.api";

export default function HiscoresMeScreen() {
  const { data: user } = useUserMe();
  const { data: challenge } = useActiveChallenge();
  const { data, isPending } = useHiscoresAroundMeGet();
  const formatScore = useScoreFormatter();
  const { height: windowHeight } = useWindowDimensions();

  const myIndex =
    data && user ? data.items.findIndex((i) => i.userId === user.id) : -1;

  const initialScrollIndex =
    myIndex < 0
      ? undefined
      : Math.max(
          0,
          Math.min(
            myIndex - Math.floor(windowHeight / 2 / HISCORE_ROW_HEIGHT),
            Math.max(0, (data?.items.length ?? 0) - 1),
          ),
        );

  return (
    <ThemedView className="flex-1">
      <ScreenHeader>
        <FormattedMessage defaultMessage="My position" />
      </ScreenHeader>
      {isPending && <AroundMeSkeleton />}
      {!isPending && (!data || data.items.length === 0) && (
        <ThemedText className="mt-8 px-6 text-center text-muted-foreground">
          <FormattedMessage defaultMessage="You're not ranked yet. Summit a mountain to appear on the hiscores." />
        </ThemedText>
      )}
      {!isPending && data && data.items.length > 0 && (
        <FlatList<RankedHiscoreEntry>
          data={data.items}
          keyExtractor={({ userId }) => userId}
          initialScrollIndex={initialScrollIndex}
          getItemLayout={(_, index) => ({
            length: HISCORE_ROW_HEIGHT,
            offset: HISCORE_ROW_HEIGHT * index,
            index,
          })}
          ListFooterComponent={<View className="h-16" />}
          renderItem={({ item }) => (
            <HiscoreRow
              entry={item}
              rank={item.rank}
              totalMountains={challenge?.totalMountains ?? null}
              isMe={item.userId === user?.id}
              formatScore={formatScore}
            />
          )}
        />
      )}
    </ThemedView>
  );
}

function AroundMeSkeleton() {
  return (
    <View className="mt-2 gap-2 px-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <HiscoreRowSkeleton key={i} />
      ))}
    </View>
  );
}

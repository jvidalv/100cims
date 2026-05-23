import { format } from "date-fns/format";
import { Link, Redirect } from "expo-router";
import { Download } from "lucide-react-native";
import { memo, useCallback, useEffect, useMemo, useState } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  TouchableOpacity,
  View,
} from "react-native";
import { twMerge } from "tailwind-merge";

import {
  LucideIcon,
  ThemedText,
  ThemedView,
  SearchInput,
  Skeleton,
} from "@/components/ui/atoms";
import { ScreenHeader } from "@/components/ui/molecules";
import { exportUserSummitsCsv } from "@/domains/summit/summit-export";
import { useUserMe, useUserAllSummits } from "@/domains/user/user.api";
import { parseLocalDateString } from "@/lib/dates";
import { logError } from "@/lib/log-error";

type SortOption = "recent" | "height";

const keyExtractor = ({ summitId }: { summitId: string }) => summitId;

type SummitRowProps = {
  summitId: string;
  mountainName: string;
  mountainHeight: string;
  summitedAt: string;
  summitedValidated: boolean;
  score: number;
  mountainImageUrl: string | null;
  mountainEssential: boolean;
};

const SummitRow = memo(function SummitRow({
  summitId,
  mountainName,
  mountainHeight,
  summitedAt,
  summitedValidated,
  score,
  mountainImageUrl,
  mountainEssential,
}: SummitRowProps) {
  return (
    <Link
      href={{
        pathname: "/user/summits/[summit]",
        params: { summit: summitId },
      }}
      asChild
    >
      <TouchableOpacity className="mx-6 flex-row items-center gap-3">
        {mountainImageUrl ? (
          <Image
            source={{ uri: mountainImageUrl, cache: "force-cache" }}
            className="size-10 rounded bg-gray-400 dark:bg-gray-500"
          />
        ) : (
          <View className="size-10 rounded bg-gray-400 dark:bg-gray-500" />
        )}
        <View className="flex-1">
          <ThemedText className="font-medium" numberOfLines={1}>
            {mountainName}
          </ThemedText>
          <ThemedText className="text-sm text-muted-foreground">
            {format(parseLocalDateString(summitedAt), "dd MMM yyyy")} •{" "}
            {mountainHeight}m
          </ThemedText>
        </View>
        <ThemedText
          className={twMerge(
            "ml-auto font-medium",
            summitedValidated && mountainEssential
              ? "text-primary"
              : "text-muted-foreground",
          )}
        >
          +{score}
        </ThemedText>
      </TouchableOpacity>
    </Link>
  );
});

export default function UserSummitsScreen() {
  const intl = useIntl();
  const { data: me } = useUserMe();

  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [sort, setSort] = useState<SortOption>("recent");

  useEffect(() => {
    const id = setTimeout(() => setDebouncedSearch(searchInput), 300);
    return () => clearTimeout(id);
  }, [searchInput]);

  const { data, isPending, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useUserAllSummits(debouncedSearch, sort);

  const items = useMemo(
    () => data?.pages.flatMap((p) => p.items) ?? [],
    [data],
  );
  const totalSummits = data?.pages[0]?.aggregates.totalSummits ?? 0;

  const handleEndReached = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const renderItem = useCallback(
    ({ item }: { item: SummitRowProps }) => <SummitRow {...item} />,
    [],
  );

  const [isExporting, setIsExporting] = useState(false);
  const handleExport = useCallback(async () => {
    if (isExporting) return;
    setIsExporting(true);
    try {
      await exportUserSummitsCsv();
    } catch (error) {
      logError(error, "summits/export");
      Alert.alert(
        intl.formatMessage({ defaultMessage: "Couldn't export your summits" }),
      );
    } finally {
      setIsExporting(false);
    }
  }, [isExporting, intl]);

  const sortOptions = useMemo<{ value: SortOption; label: string }[]>(
    () => [
      {
        value: "recent",
        label: intl.formatMessage({ defaultMessage: "Recent first" }),
      },
      {
        value: "height",
        label: intl.formatMessage({ defaultMessage: "Highest first" }),
      },
    ],
    [intl],
  );

  if (!me) {
    return <Redirect href="/join" />;
  }

  return (
    <ThemedView className="flex-1">
      <ScreenHeader
        rightElement={
          <TouchableOpacity
            accessibilityLabel={intl.formatMessage({
              defaultMessage: "Export to CSV",
            })}
            disabled={isExporting}
            hitSlop={16}
            onPress={handleExport}
            className="py-4 pl-4 pr-6"
          >
            {isExporting ? (
              <ActivityIndicator />
            ) : (
              <LucideIcon icon={Download} size={24} />
            )}
          </TouchableOpacity>
        }
      />
      <FlatList
        data={items}
        initialNumToRender={25}
        keyboardShouldPersistTaps="handled"
        onEndReached={handleEndReached}
        onEndReachedThreshold={0.5}
        ListHeaderComponent={
          <View className="px-6 pb-4">
            <ThemedText className="mb-4 text-4xl font-bold">
              <FormattedMessage defaultMessage="My summits" />{" "}
              <ThemedText className="text-lg font-semibold text-muted-foreground">
                {totalSummits}
              </ThemedText>
            </ThemedText>
            <SearchInput onChangeText={setSearchInput} />
            <View className="mt-3 flex-row gap-2">
              {sortOptions.map((option) => {
                const selected = sort === option.value;
                return (
                  <TouchableOpacity
                    key={option.value}
                    onPress={() => setSort(option.value)}
                    className={twMerge(
                      "rounded-full border-2 px-3 py-1.5",
                      selected
                        ? "border-primary bg-primary/10"
                        : "border-border",
                    )}
                  >
                    <ThemedText
                      className={twMerge(
                        "text-sm font-medium",
                        selected ? "text-primary" : "text-muted-foreground",
                      )}
                    >
                      {option.label}
                    </ThemedText>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        }
        ListEmptyComponent={
          isPending ? (
            <View className="px-6">
              <View className="flex-row items-center justify-between">
                <View className="flex-row gap-2">
                  <Skeleton className="size-10 rounded" />
                  <View className="gap-1">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-4 w-20" />
                  </View>
                </View>
                <Skeleton className="h-4 w-20" />
              </View>
            </View>
          ) : (
            <View className="px-6">
              <ThemedText className="text-muted-foreground">
                {debouncedSearch ? (
                  <FormattedMessage
                    defaultMessage={'No summits match "{query}"'}
                    values={{ query: debouncedSearch }}
                  />
                ) : (
                  <FormattedMessage defaultMessage="You haven't summited any mountains yet." />
                )}
              </ThemedText>
            </View>
          )
        }
        ListFooterComponent={
          isFetchingNextPage ? (
            <View className="py-4">
              <ActivityIndicator />
            </View>
          ) : (
            <View className="h-32" />
          )
        }
        keyExtractor={keyExtractor}
        contentContainerClassName="gap-4 pt-2"
        renderItem={renderItem}
      />
    </ThemedView>
  );
}

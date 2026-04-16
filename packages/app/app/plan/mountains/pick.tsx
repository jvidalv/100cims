import { useRouter } from "expo-router";
import { Check, Square, SquareCheck } from "lucide-react-native";
import { useEffect, useMemo, useState } from "react";
import { FormattedMessage } from "react-intl";
import { FlatList, TouchableOpacity, View } from "react-native";

import {
  LucideIcon,
  SearchInput,
  ThemedText,
  ThemedView,
} from "@/components/ui/atoms";
import { MountainRow, ScreenHeader } from "@/components/ui/molecules";
import {
  clearMountainPickerSession,
  commitMountainPickerSession,
  type MountainPickerMountain,
  readMountainPickerSession,
  toPickerMountain,
} from "@/domains/mountain/mountain-picker-session";
import { useMountains } from "@/domains/mountain/mountain.api";
import { cleanText } from "@/lib";

export default function MountainPickerScreen() {
  const router = useRouter();
  const { data: mountainsData } = useMountains();

  // Session is read once synchronously at mount: callers always set it
  // before `router.push`. The id lets us cleanup only our own session on
  // unmount, so a later opener's session survives this screen's teardown.
  const [session] = useState(() => readMountainPickerSession());
  const title = session?.title;

  const [selected, setSelected] = useState<MountainPickerMountain[]>(
    session?.initial ?? [],
  );
  const [query, setQuery] = useState("");

  // Safety: if the user navigates here without a session (deep link, etc.),
  // bounce back so we don't get stuck on a screen that can't commit.
  useEffect(() => {
    if (!session) {
      if (router.canGoBack()) {
        router.back();
      } else {
        router.replace("/");
      }
    }
    return () => clearMountainPickerSession(session?.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selectedIds = useMemo(
    () => new Set(selected.map((m) => m.id)),
    [selected],
  );

  const listData = useMemo(() => {
    const all = mountainsData ?? [];
    const filtered = !query.trim()
      ? all
      : all.filter(({ name, location }) =>
          cleanText(`${name} ${location}`)
            .toLowerCase()
            .includes(cleanText(query).toLowerCase()),
        );
    if (selectedIds.size === 0) return filtered;
    return [...filtered].sort((a, b) => {
      const aSelected = selectedIds.has(a.id) ? 0 : 1;
      const bSelected = selectedIds.has(b.id) ? 0 : 1;
      return aSelected - bSelected;
    });
  }, [mountainsData, query, selectedIds]);

  const toggle = (mountain: MountainPickerMountain) => {
    const isSelected = selectedIds.has(mountain.id);
    const next = isSelected
      ? selected.filter((m) => m.id !== mountain.id)
      : [...selected, mountain];
    setSelected(next);
    commitMountainPickerSession(next);
  };

  return (
    <ThemedView className="flex-1">
      <ScreenHeader />
      <View className="mb-4 px-6">
        <ThemedText className="text-4xl font-bold">
          {title ?? <FormattedMessage defaultMessage="Mountains" />}
        </ThemedText>
      </View>
      <FlatList
        data={listData}
        keyExtractor={(m) => m.id}
        initialNumToRender={10}
        stickyHeaderIndices={[0]}
        keyboardShouldPersistTaps="handled"
        removeClippedSubviews
        contentContainerClassName="gap-3 px-6 pb-36"
        ListHeaderComponent={
          <ThemedView className="z-20 pb-2">
            <SearchInput onChangeText={setQuery} />
          </ThemedView>
        }
        renderItem={({ item }) => {
          const isSelected = selectedIds.has(item.id);
          return (
            <MountainRow
              onPress={() => toggle(toPickerMountain(item))}
              name={item.name}
              height={item.height}
              essential={item.essential}
              imageUrl={item.imageUrl}
              trailing={
                <LucideIcon
                  icon={isSelected ? SquareCheck : Square}
                  size={20}
                  success={isSelected}
                />
              }
            />
          );
        }}
        ListFooterComponent={
          <TouchableOpacity
            className="flex-row items-center gap-3"
            onPress={() => router.back()}
          >
            <View className="size-12 items-center justify-center rounded-full border-2 border-emerald-500/70">
              <LucideIcon icon={Check} size={22} success />
            </View>
            <ThemedText className="text-lg font-medium text-emerald-500">
              <FormattedMessage defaultMessage="Done" />
            </ThemedText>
          </TouchableOpacity>
        }
      />
    </ThemedView>
  );
}

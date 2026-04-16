import { useFocusEffect, useRouter } from "expo-router";
import {
  Check,
  ChevronRight,
  Globe,
  Plus,
  Square,
  SquareCheck,
  X,
} from "lucide-react-native";
import { useCallback, useEffect, useMemo, useState } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { FlatList, TouchableOpacity, View } from "react-native";

import {
  ActivityIndicator,
  LucideIcon,
  SearchInput,
  ThemedText,
  ThemedView,
} from "@/components/ui/atoms";
import { MountainRow, ScreenHeader } from "@/components/ui/molecules";
import { useMountainsSearch } from "@/domains/community-challenge/community-challenge.api";
import {
  clearChallengeMountainPickerSession,
  commitChallengeMountainPickerSession,
  readChallengeMountainPickerSession,
} from "@/domains/mountain/challenge-mountain-picker-session";
import {
  type MountainPickerMountain,
  toPickerMountain,
} from "@/domains/mountain/mountain-picker-session";
import { useMountains, useMyMountains } from "@/domains/mountain/mountain.api";
import { cleanText } from "@/lib";

import type { MountainData, NewMountainData } from "@/types/mountain";

export default function ChallengeMountainPickerScreen() {
  const router = useRouter();
  const intl = useIntl();
  const { data: catalog } = useMountains();
  const { data: myAuthored } = useMyMountains();

  const [session] = useState(() => readChallengeMountainPickerSession());
  const title = session?.title;

  const [selected, setSelected] = useState<MountainPickerMountain[]>(
    session?.selected ?? [],
  );
  const [newMountains, setNewMountains] = useState<NewMountainData[]>(
    session?.newMountains ?? [],
  );
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (!session) {
      if (router.canGoBack()) router.back();
      else router.replace("/");
    }
    return () => clearChallengeMountainPickerSession(session?.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Resync from session after returning from the create screen, which
  // mutates the session's newMountains via appendNewMountainToSession.
  useFocusEffect(
    useCallback(() => {
      if (!session) return;
      if (session.newMountains.length !== newMountains.length) {
        setNewMountains([...session.newMountains]);
      }
    }, [session, newMountains.length]),
  );

  const shouldUseGlobalSearch = query.trim().length > 0;
  const { data: searchData, isFetching: isSearching } = useMountainsSearch({
    query: shouldUseGlobalSearch ? query : undefined,
  });

  const selectedIds = useMemo(
    () => new Set(selected.map((m) => m.id)),
    [selected],
  );

  const myAuthoredIds = useMemo(
    () => new Set((myAuthored ?? []).map((m) => m.id)),
    [myAuthored],
  );

  const catalogList: MountainData[] = useMemo(() => {
    if (shouldUseGlobalSearch) {
      const pages = searchData?.pages ?? [];
      return pages.flatMap((p) => p.items);
    }
    return catalog ?? [];
  }, [catalog, searchData, shouldUseGlobalSearch]);

  const listData = useMemo(() => {
    const filtered = shouldUseGlobalSearch
      ? catalogList
      : catalogList.filter(({ name, location }) =>
          cleanText(`${name} ${location}`)
            .toLowerCase()
            .includes(cleanText(query).toLowerCase()),
        );
    // Hide authored mountains from the catalog section — they're surfaced
    // in the "Your mountains" header section instead.
    const withoutAuthored = filtered.filter((m) => !myAuthoredIds.has(m.id));
    if (selectedIds.size === 0) return withoutAuthored;
    return [...withoutAuthored].sort((a, b) => {
      const aSel = selectedIds.has(a.id) ? 0 : 1;
      const bSel = selectedIds.has(b.id) ? 0 : 1;
      return aSel - bSel;
    });
  }, [catalogList, myAuthoredIds, query, selectedIds, shouldUseGlobalSearch]);

  const toggleCatalog = useCallback(
    (mountain: MountainData) => {
      const picker = toPickerMountain(mountain);
      const isSelected = selectedIds.has(picker.id);
      const nextSelected = isSelected
        ? selected.filter((m) => m.id !== picker.id)
        : [...selected, picker];
      setSelected(nextSelected);
      commitChallengeMountainPickerSession({
        selected: nextSelected,
        newMountains,
      });
    },
    [newMountains, selected, selectedIds],
  );

  const removeNewMountain = (tempId: string) => {
    const next = newMountains.filter((m) => m.tempId !== tempId);
    setNewMountains(next);
    commitChallengeMountainPickerSession({
      selected,
      newMountains: next,
    });
  };

  const openCreate = () => router.push("/challenge/mountains/create");

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
        keyboardShouldPersistTaps="handled"
        removeClippedSubviews
        contentContainerClassName="gap-3 px-6 pb-36"
        ListHeaderComponent={
          <View className="gap-3">
            {(newMountains.length > 0 || (myAuthored ?? []).length > 0) && (
              <ThemedText className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                <FormattedMessage defaultMessage="Your mountains" />
              </ThemedText>
            )}
            {(myAuthored ?? []).map((m) => {
              const isSelected = selectedIds.has(m.id);
              return (
                <MountainRow
                  key={m.id}
                  name={m.name}
                  height={m.height}
                  essential={m.essential}
                  imageUrl={m.imageUrl}
                  onPress={() => toggleCatalog(m)}
                  trailing={
                    <LucideIcon
                      icon={isSelected ? SquareCheck : Square}
                      size={20}
                      success={isSelected}
                    />
                  }
                />
              );
            })}
            {newMountains.map((m) => (
              <MountainRow
                key={m.tempId}
                name={m.name}
                height={m.height}
                essential={m.essential}
                imageUrl={m.imageUri ?? null}
                onPress={() => removeNewMountain(m.tempId)}
                trailing={<LucideIcon icon={X} size={20} muted />}
              />
            ))}
            <TouchableOpacity
              className="flex-row items-center gap-3"
              onPress={openCreate}
            >
              <View className="size-12 items-center justify-center rounded border-2 border-muted-foreground/50">
                <LucideIcon icon={Plus} size={22} muted />
              </View>
              <ThemedText className="text-lg font-medium">
                {intl.formatMessage({ defaultMessage: "Add new mountain" })}
              </ThemedText>
              <LucideIcon
                icon={ChevronRight}
                size={20}
                muted
                className="ml-auto"
              />
            </TouchableOpacity>
            <View className="mt-4">
              <SearchInput onChangeText={setQuery} />
              {shouldUseGlobalSearch && (
                <View className="mt-2 flex-row items-center gap-2">
                  {isSearching ? (
                    <ActivityIndicator size="sm" />
                  ) : (
                    <LucideIcon icon={Globe} size={14} muted />
                  )}
                  <ThemedText className="text-xs text-muted-foreground">
                    <FormattedMessage defaultMessage="Searching all mountains" />
                  </ThemedText>
                </View>
              )}
            </View>
          </View>
        }
        renderItem={({ item }) => {
          const isSelected = selectedIds.has(item.id);
          return (
            <MountainRow
              onPress={() => toggleCatalog(item)}
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
            className="mt-4 flex-row items-center gap-3"
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

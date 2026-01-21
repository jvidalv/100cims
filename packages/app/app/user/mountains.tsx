import { useCallback, useState } from "react";
import { FormattedMessage } from "react-intl";
import { FlatList, View } from "react-native";

import {
  ActivityIndicator,
  Icon,
  ThemedKeyboardAvoidingView,
  ThemedText,
} from "@/components/ui/atoms";
import {
  BottomDrawer,
  MountainEditDrawer,
  MountainItemListAsTouchable,
  ScreenHeader,
} from "@/components/ui/molecules";
import { useMyMountains, useMountainUpdate } from "@/domains/mountain/mountain.api";
import { MountainWithChallengeCount } from "@/types/mountain";

export default function MyMountainsPage() {
  const { data: mountains, isLoading } = useMyMountains();
  const { mutateAsync: updateMountain, isPending: isUpdating } = useMountainUpdate();

  const [editingMountain, setEditingMountain] = useState<MountainWithChallengeCount | null>(null);

  const handleSave = useCallback(
    async (data: Parameters<typeof updateMountain>[0]) => {
      await updateMountain(data);
    },
    [updateMountain]
  );

  const renderItem = useCallback(
    ({ item }: { item: MountainWithChallengeCount }) => (
      <View className="px-6 py-2">
        <MountainItemListAsTouchable
          onPress={() => setEditingMountain(item)}
          name={item.name}
          location={item.location}
          imageUrl={item.imageUrl}
          essential={item.essential}
          latitude={item.latitude}
          longitude={item.longitude}
          slug={item.slug}
          height={item.height}
        />
        {item.challengeCount > 0 && (
          <ThemedText className="ml-[108px] -mt-1 text-xs text-muted-foreground">
            {item.challengeCount === 1 ? (
              <FormattedMessage
                defaultMessage="Used in {count} challenge"
                values={{ count: item.challengeCount }}
              />
            ) : (
              <FormattedMessage
                defaultMessage="Used in {count} challenges"
                values={{ count: item.challengeCount }}
              />
            )}
          </ThemedText>
        )}
      </View>
    ),
    []
  );

  if (isLoading) {
    return (
      <ThemedKeyboardAvoidingView className="flex-1 items-center justify-center">
        <ActivityIndicator />
      </ThemedKeyboardAvoidingView>
    );
  }

  return (
    <ThemedKeyboardAvoidingView>
      <ScreenHeader />
      <View className="px-6 pb-4">
        <ThemedText className="text-4xl font-bold">
          <FormattedMessage defaultMessage="My mountains" />{" "}
          <ThemedText className="text-lg font-semibold text-muted-foreground">
            {mountains?.length ?? 0}
          </ThemedText>
        </ThemedText>
      </View>

      {!mountains?.length ? (
        <View className="px-6">
          <View className="relative rounded-xl border-2 border-border p-4">
            <View className="absolute right-2 top-2">
              <Icon
                name="star.fill"
                color="gold"
                size={24}
                animationSpec={{ effect: { type: "bounce" } }}
              />
            </View>
            <ThemedText className="mb-1 font-semibold">
              <FormattedMessage defaultMessage="Do you know?" />
            </ThemedText>
            <ThemedText>
              <FormattedMessage defaultMessage="No mountains yet. Create mountains when adding them to a challenge." />
            </ThemedText>
          </View>
        </View>
      ) : (
        <FlatList
          data={mountains}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerClassName="pb-20"
          showsVerticalScrollIndicator={false}
        />
      )}

      <BottomDrawer
        isOpen={!!editingMountain}
        onRequestClose={() => setEditingMountain(null)}
      >
        {editingMountain && (
          <MountainEditDrawer
            mountain={editingMountain}
            onSave={handleSave}
            isSaving={isUpdating}
            onClose={() => setEditingMountain(null)}
          />
        )}
      </BottomDrawer>
    </ThemedKeyboardAvoidingView>
  );
}

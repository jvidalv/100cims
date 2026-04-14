import { useRouter, Redirect } from "expo-router";
import { useState } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import {
  Alert,
  Keyboard,
  ScrollView,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { twMerge } from "tailwind-merge";

import {
  ChallengeForm,
  ChallengeFormData,
} from "@/components/forms/challenge-form";
import { useAuth } from "@/components/providers/auth-provider";
import {
  BlurView,
  Button,
  Icon,
  ThemedText,
  ThemedView,
} from "@/components/ui/atoms";
import {
  AvatarGroup,
  BottomDrawer,
  MountainSelectionDrawer,
  ScreenHeader,
} from "@/components/ui/molecules";
import { useCommunityChallengeCreate } from "@/domains/community-challenge/community-challenge.api";
import { useMountains } from "@/domains/mountain/mountain.api";
import { useIsKeyboardVisible } from "@/hooks/use-is-keyboard-visible";
import { useMountainSelection } from "@/hooks/use-mountain-selection";
import { isAndroid } from "@/lib/device";

export default function CommunityChallengeCreatePage() {
  const router = useRouter();
  const intl = useIntl();
  const { isAuthenticated } = useAuth();
  const isKeyboardVisible = useIsKeyboardVisible();
  const { data: allMountains } = useMountains();

  const [editingMountains, setEditingMountains] = useState(false);
  const [formData, setFormData] = useState<ChallengeFormData>({
    name: "",
    country: "",
    emoji: "",
    description: "",
    isPublic: true,
  });

  const {
    selectedMountainIds,
    newMountains,
    selectedMountainsForDisplay,
    totalMountainCount,
    handleSelectionChange,
    handleAddNewMountain,
    handleRemoveNewMountain,
  } = useMountainSelection({ allMountains });

  const { mutateAsync, isPending } = useCommunityChallengeCreate();

  const handleCreate = async () => {
    if (!formData.name.trim()) {
      return Alert.alert(
        intl.formatMessage({
          defaultMessage: "Name is required",
        }),
      );
    }

    if (!formData.country.trim()) {
      return Alert.alert(
        intl.formatMessage({
          defaultMessage: "Country/Region is required",
        }),
      );
    }

    if (totalMountainCount < 1) {
      return Alert.alert(
        intl.formatMessage({
          defaultMessage: "At least one mountain is required",
        }),
      );
    }

    try {
      await mutateAsync({
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        country: formData.country.trim(),
        emoji: formData.emoji || undefined,
        isPublic: formData.isPublic,
        mountainIds:
          selectedMountainIds.length > 0 ? selectedMountainIds : undefined,
        newMountains:
          newMountains.length > 0
            ? newMountains.map((m) => ({
                name: m.name,
                location: m.location,
                height: m.height,
                latitude: m.latitude,
                longitude: m.longitude,
                essential: m.essential,
                image: m.image,
              }))
            : undefined,
      });

      router.dismiss();
    } catch {
      Alert.alert(
        intl.formatMessage({
          defaultMessage: "Something went wrong, try again later!",
        }),
      );
    }
  };

  if (!isAuthenticated) {
    return <Redirect href="/join" />;
  }

  return (
    <TouchableWithoutFeedback onPress={() => Keyboard.dismiss()}>
      <ThemedView className="flex-1">
        <ScreenHeader />
        <View className={twMerge("px-6 pb-4", isAndroid && "pt-16")}>
          <ThemedText className="text-4xl font-semibold">
            <FormattedMessage defaultMessage="New challenge" />
          </ThemedText>
        </View>
        <ScrollView
          className="flex-1"
          contentContainerClassName="pb-40 pt-4"
          keyboardShouldPersistTaps="handled"
        >
          <ChallengeForm data={formData} onChange={setFormData}>
            {/* Mountains Section */}
            <View>
              <ThemedText className="mb-2 text-lg font-medium">
                <FormattedMessage defaultMessage="Mountains" />
                <ThemedText className="text-destructive"> *</ThemedText>
              </ThemedText>
              <TouchableOpacity
                onPress={() => setEditingMountains(true)}
                className="flex-row items-center justify-between gap-4 rounded border-2 border-border px-4 py-2"
              >
                {selectedMountainsForDisplay.length > 0 ? (
                  <AvatarGroup
                    limit={6}
                    items={selectedMountainsForDisplay.map((m) => ({
                      name: m.name,
                      imageUrl: m.imageUrl,
                    }))}
                  />
                ) : (
                  <ThemedText className="text-muted-foreground">
                    <FormattedMessage defaultMessage="Add mountain" />
                  </ThemedText>
                )}
                <View className="size-10 items-center justify-center rounded bg-muted-foreground/30 shadow">
                  <Icon name="plus" weight="semibold" color="white" size={16} />
                </View>
              </TouchableOpacity>
            </View>
          </ChallengeForm>
        </ScrollView>

        <BlurView
          className={twMerge(
            "px-6 pt-1 pb-8",
            isKeyboardVisible && "opacity-0",
          )}
        >
          <View className="mb-3 flex-row items-center gap-3 rounded border border-blue-500/30 bg-blue-500/10 p-3">
            <Icon name="info.circle" size={18} color="#3b82f6" />
            <ThemedText className="flex-1 text-sm text-blue-500">
              <FormattedMessage defaultMessage="You can add or remove mountains later" />
            </ThemedText>
          </View>
          <Button isLoading={isPending} onPress={handleCreate}>
            <FormattedMessage defaultMessage="Create challenge" />
          </Button>
          <Button
            intent="ghost"
            onPress={() => router.dismiss()}
            textClassName="text-muted-foreground"
          >
            <FormattedMessage defaultMessage="Cancel" />
          </Button>
        </BlurView>

        <BottomDrawer
          isOpen={editingMountains}
          onRequestClose={() => setEditingMountains(false)}
        >
          <MountainSelectionDrawer
            selectedIds={selectedMountainIds}
            onSelectionChange={handleSelectionChange}
            allowCreate
            newMountains={newMountains}
            onAddNewMountain={handleAddNewMountain}
            onRemoveNewMountain={handleRemoveNewMountain}
          />
        </BottomDrawer>
      </ThemedView>
    </TouchableWithoutFeedback>
  );
}

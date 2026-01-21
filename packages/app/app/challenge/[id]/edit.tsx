import { useLocalSearchParams, useRouter, Redirect } from "expo-router";
import { useEffect, useState } from "react";
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
  ActivityIndicator,
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
import {
  useCommunityChallengeDelete,
  useCommunityChallengeDetail,
  useCommunityChallengeUpdate,
} from "@/domains/community-challenge/community-challenge.api";
import { isCreator } from "@/domains/community-challenge/community-challenge.model";
import { useMountains } from "@/domains/mountain/mountain.api";
import { useUserMe } from "@/domains/user/user.api";
import { useIsKeyboardVisible } from "@/hooks/use-is-keyboard-visible";
import { useMountainSelection } from "@/hooks/use-mountain-selection";
import { isAndroid } from "@/lib/device";

export default function CommunityChallengeEditPage() {
  const router = useRouter();
  const intl = useIntl();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { isAuthenticated } = useAuth();
  const { data: user } = useUserMe();
  const isKeyboardVisible = useIsKeyboardVisible();

  const [editingMountains, setEditingMountains] = useState(false);

  const { data: challenge, isLoading } = useCommunityChallengeDetail(
    { id: id! },
    { enabled: !!id }
  );
  const { data: allMountains } = useMountains();

  const [formData, setFormData] = useState<ChallengeFormData | null>(null);

  const {
    selectedMountainIds,
    newMountains,
    selectedMountainsForDisplay,
    totalMountainCount,
    handleSelectionChange,
    handleAddNewMountain,
    handleRemoveNewMountain,
    initializeFromChallenge,
  } = useMountainSelection({ allMountains });

  const { mutateAsync, isPending } = useCommunityChallengeUpdate();
  const { mutateAsync: deleteChallenge, isPending: isDeleting } =
    useCommunityChallengeDelete();

  const isOwner = isCreator(challenge?.creatorId, user?.id);

  useEffect(() => {
    if (challenge && !formData) {
      setFormData({
        name: challenge.name,
        country: challenge.country,
        emoji: challenge.emoji || "",
        description: challenge.description || "",
        isPublic: challenge.isPublic,
      });
      initializeFromChallenge(
        challenge.mountains.map((m) => m.id),
        challenge.mountains
      );
    }
  }, [challenge, formData, initializeFromChallenge]);

  const handleUpdate = async () => {
    if (!formData) return;

    if (!formData.name.trim()) {
      return Alert.alert(
        intl.formatMessage({
          defaultMessage: "Name is required",
        })
      );
    }

    if (!formData.country.trim()) {
      return Alert.alert(
        intl.formatMessage({
          defaultMessage: "Country/Region is required",
        })
      );
    }

    if (totalMountainCount < 1) {
      return Alert.alert(
        intl.formatMessage({
          defaultMessage: "At least one mountain is required",
        })
      );
    }

    try {
      await mutateAsync({
        id: id!,
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        country: formData.country.trim(),
        emoji: formData.emoji || undefined,
        isPublic: formData.isPublic,
        mountainIds: selectedMountainIds,
        newMountains: newMountains.length > 0
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
        })
      );
    }
  };

  const handleDelete = () => {
    Alert.alert(
      intl.formatMessage({ defaultMessage: "Delete challenge" }),
      intl.formatMessage({
        defaultMessage:
          "Are you sure you want to delete this challenge? This action cannot be undone.",
      }),
      [
        {
          text: intl.formatMessage({ defaultMessage: "Cancel" }),
          style: "cancel",
        },
        {
          text: intl.formatMessage({ defaultMessage: "Delete" }),
          style: "destructive",
          onPress: async () => {
            try {
              await deleteChallenge({ id: id! });
              router.back();
            } catch {
              Alert.alert(
                intl.formatMessage({
                  defaultMessage: "Failed to delete challenge",
                })
              );
            }
          },
        },
      ]
    );
  };

  if (!isAuthenticated) {
    return <Redirect href="/join" />;
  }

  if (isLoading) {
    return (
      <ThemedView className="flex-1 items-center justify-center">
        <ActivityIndicator />
      </ThemedView>
    );
  }

  if (!challenge || !isOwner || !formData) {
    return (
      <ThemedView className="flex-1 items-center justify-center">
        {!isLoading && !challenge ? (
          <ThemedText>
            <FormattedMessage defaultMessage="Not authorized" />
          </ThemedText>
        ) : (
          <ActivityIndicator />
        )}
      </ThemedView>
    );
  }

  return (
    <TouchableWithoutFeedback onPress={() => Keyboard.dismiss()}>
      <ThemedView className="flex-1">
        <ScreenHeader />
        <ScrollView
          className="flex-1"
          contentContainerClassName="pb-40"
          keyboardShouldPersistTaps="handled"
        >
          <View className={twMerge("px-6 pt-2 pb-4", isAndroid && "pt-24")}>
            <View className="flex-row items-center justify-between">
              <ThemedText className="text-muted-foreground">
                <FormattedMessage defaultMessage="Edit challenge" />
              </ThemedText>
              <TouchableOpacity
                onPress={handleDelete}
                disabled={isDeleting}
                className="p-2"
              >
                <Icon name="trash" size={18} muted />
              </TouchableOpacity>
            </View>
            <ThemedText className="text-4xl font-semibold">
              {challenge.name}
            </ThemedText>
          </View>

          <ChallengeForm data={formData} onChange={setFormData}>
            {/* Mountains Section */}
            <View>
              <ThemedText className="mb-2 text-lg font-medium">
                <FormattedMessage defaultMessage="Mountains" />
                <ThemedText className="text-destructive"> *</ThemedText>
              </ThemedText>
              <TouchableOpacity
                onPress={() => setEditingMountains(true)}
                className="flex-row items-center justify-between gap-4 rounded-xl border-2 border-border px-4 py-2"
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
                <View className="size-10 items-center justify-center rounded-xl bg-muted-foreground/30 shadow">
                  <Icon name="plus" weight="semibold" color="white" size={16} />
                </View>
              </TouchableOpacity>
            </View>
          </ChallengeForm>
        </ScrollView>

        <BlurView
          className={twMerge(
            "px-6 pt-1 pb-8",
            isKeyboardVisible && "opacity-0"
          )}
        >
          <Button isLoading={isPending} onPress={handleUpdate}>
            <FormattedMessage defaultMessage="Save changes" />
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

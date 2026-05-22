import { format } from "date-fns/format";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Camera, Check, Clock } from "lucide-react-native";
import { useState } from "react";
import { useIntl, FormattedMessage } from "react-intl";
import { Alert, ScrollView, TouchableOpacity, View, Image } from "react-native";
import { twMerge } from "tailwind-merge";

import { queryClient } from "@/components/providers/query-client-provider";
import {
  ActivityIndicator,
  Avatar,
  BlurView,
  ThemedText,
  ThemedView,
  LucideIcon,
} from "@/components/ui/atoms";
import {
  ActionRow,
  ScreenHeader,
  SummitRatingFields,
} from "@/components/ui/molecules";
import { useSummitPost } from "@/domains/mountain/mountain.api";
import { getMountainPts } from "@/domains/mountain/mountain.util";
import { stashPlanCompletionImages } from "@/domains/plan/plan-completion-cache";
import { usePlanOne, usePlanUpdate } from "@/domains/plan/plan.api";
import { parseLocalDateString, toLocalDateString } from "@/lib/dates";
import { pickAndOptimizeImage } from "@/lib/images";
import { logError } from "@/lib/log-error";
import { getInitials } from "@/lib/strings";

type SummitRating = {
  familyFriendly: number | null;
  dogFriendly: number | null;
  difficulty: number | null;
};

const EMPTY_RATING: SummitRating = {
  familyFriendly: null,
  dogFriendly: null,
  difficulty: null,
};

export default function PlanCompleteScreen() {
  const intl = useIntl();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: planData } = usePlanOne({ id });
  const { mutateAsync: updatePlan } = usePlanUpdate();
  const { mutateAsync: summitMountain } = useSummitPost(id);
  const [images, setImages] = useState<Record<string, string>>({});
  const [isHandlingImages, setIsHandlingImages] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [ratings, setRatings] = useState<Record<string, SummitRating>>({});

  const setRating = (mountainId: string, patch: Partial<SummitRating>) =>
    setRatings((prev) => ({
      ...prev,
      [mountainId]: { ...(prev[mountainId] ?? EMPTY_RATING), ...patch },
    }));

  const plan = planData;
  const mountains = plan?.mountains ?? [];
  const hasMountains = !!mountains.length;

  const handlePickImage = async (mountainId: string) => {
    try {
      setIsHandlingImages(mountainId);
      const result = await pickAndOptimizeImage();
      if (result?.optimized.base64) {
        setImages((prev) => ({ ...prev, [mountainId]: result.optimized.base64! }));
      }
    } catch (error) {
      logError(error, "plan/complete/image");
      Alert.alert(
        intl.formatMessage({
          defaultMessage: "Error, try again or use another image.",
        }),
      );
    } finally {
      setIsHandlingImages("");
    }
  };

  const handleSubmit = async () => {
    if (!plan) return;

    try {
      setIsSubmitting(true);

      if (hasMountains) {
        try {
          await Promise.all(
            mountains.map((m) => {
              const r = ratings[m.id];
              return summitMountain({
                mountainId: m.id,
                date: plan.startDate ?? toLocalDateString(new Date()),
                image: images[m.id],
                usersId: plan.users.map((u) => u.id),
                familyFriendly: r?.familyFriendly ?? null,
                dogFriendly: r?.dogFriendly ?? null,
                difficulty: r?.difficulty ?? null,
              });
            }),
          );
        } catch (err) {
          logError(err, "plan/complete/summit");
          Alert.alert(
            intl.formatMessage({ defaultMessage: "Something went wrong" }),
          );
          return;
        }
      }

      await updatePlan({
        id,
        status: "completed",
      });

      stashPlanCompletionImages(id, images);
      void queryClient.invalidateQueries();
      router.replace({
        pathname: "/plan/[id]",
        params: { id, from: "complete" },
      });
    } catch (err) {
      logError(err, "plan/complete/submit");
      Alert.alert(
        intl.formatMessage({ defaultMessage: "Something went wrong" }),
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!plan) return null;

  return (
    <ThemedView className="flex-1">
      <ScreenHeader />
      <ScrollView
        contentContainerClassName="gap-6 px-6 pb-32 pt-2"
        showsVerticalScrollIndicator={false}
      >
        <View>
          <ThemedText className="text-muted-foreground">
            <FormattedMessage defaultMessage="Complete your plan" />
          </ThemedText>
          <ThemedText className="text-2xl font-bold">{plan.title}</ThemedText>
          {!!plan.startDate && (
            <ThemedText className="mt-2 text-muted-foreground">
              {format(parseLocalDateString(plan.startDate), "d MMMM yyyy")}
            </ThemedText>
          )}
        </View>
        {!hasMountains && (
          <View className="gap-4">
            <View className="relative gap-1 rounded border border-border p-4">
              <View className="absolute -right-3 -top-3">
                <ThemedText>❤️</ThemedText>
              </View>
              <ThemedText className="font-medium">
                <FormattedMessage defaultMessage="We hope it was amazing" />
              </ThemedText>
              <ThemedText className="text-muted-foreground">
                <FormattedMessage defaultMessage="You can now create more plans and share them!" />
              </ThemedText>
            </View>
          </View>
        )}
        {hasMountains && (
          <View className="gap-10">
            {mountains.map((m) => (
              <View key={m.id} className="relative gap-3">
                <View className="flex-row items-center justify-between gap-4">
                  <View className="shrink flex-row items-center gap-2">
                    <Avatar
                      size="xs"
                      shape="square"
                      initials={getInitials(m.name)}
                      imageUrl={m.imageUrl}
                    />
                    <ThemedText
                      numberOfLines={1}
                      className="flex-1 shrink text-base font-semibold"
                    >
                      {m.name}
                    </ThemedText>
                  </View>
                  <View>
                    <ThemedText
                      className={twMerge(
                        "text-muted-foreground",
                        m.essential && "text-primary",
                        !!images[m.id] && "text-green-500",
                      )}
                    >
                      +{getMountainPts(parseFloat(m.height), m.essential)} pts
                    </ThemedText>
                  </View>
                </View>
                <TouchableOpacity
                  disabled={isHandlingImages === m.id}
                  className={twMerge(
                    "w-full items-center justify-center overflow-hidden rounded border-2 border-border bg-background",
                    mountains?.length === 1 ? "h-96" : "h-48",
                  )}
                  onPress={() => handlePickImage(m.id)}
                >
                  {images[m.id] ? (
                    <>
                      <Image
                        source={{
                          uri: `data:image/jpeg;base64,${images[m.id]}`,
                        }}
                        blurRadius={12}
                        className="absolute left-0"
                        style={{
                          width: "100%",
                          height: "100%",
                        }}
                      />
                      <Image
                        source={{
                          uri: `data:image/jpeg;base64,${images[m.id]}`,
                        }}
                        style={{
                          width: "100%",
                          height: "100%",
                          resizeMode: "contain",
                        }}
                      />
                    </>
                  ) : (
                    <View className="relative size-full items-center justify-center">
                      {m.imageUrl && (
                        <Image
                          source={{ uri: m.imageUrl }}
                          style={{
                            width: "100%",
                            height: "100%",
                            opacity: 0.4,
                          }}
                          resizeMode="cover"
                        />
                      )}
                      <View className="absolute inset-0 items-center justify-center">
                        <LucideIcon icon={Camera} size={32} />
                      </View>
                    </View>
                  )}
                  {isHandlingImages === m.id && (
                    <BlurView className="absolute size-full items-center justify-center">
                      <ActivityIndicator />
                    </BlurView>
                  )}
                </TouchableOpacity>
                <SummitRatingFields
                  familyFriendly={ratings[m.id]?.familyFriendly ?? null}
                  onFamilyFriendlyChange={(v) =>
                    setRating(m.id, { familyFriendly: v })
                  }
                  dogFriendly={ratings[m.id]?.dogFriendly ?? null}
                  onDogFriendlyChange={(v) =>
                    setRating(m.id, { dogFriendly: v })
                  }
                  difficulty={ratings[m.id]?.difficulty ?? null}
                  onDifficultyChange={(v) =>
                    setRating(m.id, { difficulty: v })
                  }
                  titleClassName="text-sm font-medium text-muted-foreground"
                  size="sm"
                />
              </View>
            ))}
          </View>
        )}
        <View className="gap-1 pt-4">
          <ActionRow
            icon={Check}
            intent="emerald"
            size="lg"
            disabled={isSubmitting}
            onPress={handleSubmit}
          >
            {isSubmitting ? (
              <ActivityIndicator size="sm" />
            ) : (
              <FormattedMessage defaultMessage="Complete plan" />
            )}
          </ActionRow>
          <ActionRow
            icon={Clock}
            intent="muted"
            size="lg"
            onPress={router.back}
          >
            <FormattedMessage defaultMessage="I'll complete it later" />
          </ActionRow>
        </View>
      </ScrollView>
    </ThemedView>
  );
}

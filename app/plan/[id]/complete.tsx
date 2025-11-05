import { format } from "date-fns/format";
import * as ImagePicker from "expo-image-picker";
import { useLocalSearchParams, useRouter } from "expo-router";
import { analytics } from "@jvidalv/react-analytics";
import { useState } from "react";
import { useIntl, FormattedMessage } from "react-intl";
import { Alert, ScrollView, TouchableOpacity, View, Image } from "react-native";
import { twMerge } from "tailwind-merge";

import { queryClient } from "@/components/providers/query-client-provider";
import {
  ActivityIndicator,
  Avatar,
  BlurView,
  Button,
  ThemedText,
  ThemedView,
  Icon,
} from "@/components/ui/atoms";
import { useSummitPost } from "@/domains/mountain/mountain.api";
import { getMountainPts } from "@/domains/mountain/mountain.util";
import { usePlanOne, usePlanUpdate } from "@/domains/plan/plan.api";
import { getImageOptimized } from "@/lib/images";

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

  const plan = planData;
  const mountains = plan?.mountains ?? [];
  const hasMountains = !!mountains.length;

  const handlePickImage = async (mountainId: string) => {
    try {
      setIsHandlingImages(mountainId);
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        base64: true,
        aspect: [4, 3],
        quality: 0.7,
      });

      if (!result.canceled && result.assets[0]) {
        const optimized = await getImageOptimized(result.assets[0]);
        const base64 = optimized.base64;
        if (!!base64) {
          setImages((prev) => ({ ...prev, [mountainId]: base64 }));
        }
      }
    } catch (error) {
      analytics.error(`Error picking image on plan`, { error });
      Alert.alert(
        intl.formatMessage({
          defaultMessage: "Error, try again or use another image.",
        }),
      );
    } finally {
      setIsHandlingImages("");
    }
  };

  const missing = mountains.find((m) => !images[m.id]);

  const handleSubmit = async () => {
    if (!plan) return;

    try {
      setIsSubmitting(true);

      if (hasMountains) {
        if (missing) {
          return Alert.alert(
            intl.formatMessage({
              defaultMessage: "Please add photo for all mountains",
            }),
          );
        }

        try {
          await Promise.all(
            mountains.map((m) =>
              summitMountain({
                mountainId: m.id,
                date: plan.startDate ?? new Date().toISOString(),
                image: images[m.id],
                usersId: plan.users.map((u) => u.id),
              }),
            ),
          );
        } catch (err) {
          analytics.error("plan-complete-submit-error", { error: err });
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

      void queryClient.invalidateQueries();
      router.dismiss();
    } catch (err) {
      analytics.error("plan-complete-unexpected-error", { error: err });
      Alert.alert(
        intl.formatMessage({ defaultMessage: "Something went wrong" }),
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!plan) return null;

  return (
    <ThemedView className="flex-1 pt-12">
      <ScrollView
        contentContainerClassName="gap-6 px-6 pb-64"
        showsVerticalScrollIndicator={false}
      >
        <View>
          <ThemedText className="mb-1 text-muted-foreground">
            <FormattedMessage defaultMessage="Complete your plan" />
          </ThemedText>
          <ThemedText className="text-3xl font-bold">{plan.title}</ThemedText>
          {!!plan.startDate && (
            <ThemedText className="text-muted-foreground">
              {format(plan.startDate, "d MMMM yyyy")}
            </ThemedText>
          )}
        </View>
        {!hasMountains && (
          <View className="gap-4">
            <View className="relative gap-1 rounded-xl border border-border p-4">
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
          <View className="gap-4">
            {mountains.map((m) => (
              <View key={m.id} className="relative gap-3">
                <View className="flex-row items-center justify-between gap-4">
                  <View className="shrink flex-row items-center gap-2">
                    <Avatar
                      size="xs"
                      initials={m.name[0]}
                      imageUrl={m.imageUrl}
                    />
                    <ThemedText
                      numberOfLines={1}
                      className="flex-1 shrink text-lg font-semibold"
                    >
                      {m.name}
                    </ThemedText>
                  </View>
                  <View>
                    <ThemedText
                      className={twMerge(
                        "text-muted-foreground",
                        !!images[m.id] && "text-green-500",
                      )}
                    >
                      {getMountainPts(parseFloat(m.height), m.essential)} pts
                    </ThemedText>
                  </View>
                </View>
                <TouchableOpacity
                  disabled={isHandlingImages === m.id}
                  className={twMerge(
                    "w-full items-center justify-center overflow-hidden rounded-xl border-2 border-border bg-background",
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
                    <Icon name="camera" size={32} muted />
                  )}
                  {isHandlingImages === m.id && (
                    <BlurView className="absolute size-full items-center justify-center">
                      <ActivityIndicator />
                    </BlurView>
                  )}
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
      <BlurView className="absolute bottom-0 left-0 w-full px-6 pb-32 pt-4">
        <View>
          <Button
            isLoading={isSubmitting}
            intent="success"
            onPress={handleSubmit}
            disabled={!!missing}
          >
            <FormattedMessage defaultMessage="Complete plan" />
          </Button>
          <TouchableOpacity className="pt-6" onPress={router.back}>
            <ThemedText className="text-center text-muted-foreground underline">
              <FormattedMessage defaultMessage="I'll complete it later" />
            </ThemedText>
          </TouchableOpacity>
        </View>
      </BlurView>
    </ThemedView>
  );
}

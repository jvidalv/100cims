import { Redirect, useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import {
  Alert,
  Image,
  Keyboard,
  ScrollView,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";

import {
  ActivityIndicator,
  Button,
  Icon,
  ThemedText,
  ThemedTextInput,
} from "@/components/ui/atoms";
import { ThemedToggleInput } from "@/components/ui/atoms/themed-toggle-input";
import { ScreenHeader } from "@/components/ui/molecules";
import {
  useMountainUpdate,
  useMyMountains,
} from "@/domains/mountain/mountain.api";
import { useImagePicker } from "@/hooks/use-image-picker";
import { validateMountainForm } from "@/lib/mountain-validation";

export default function MountainEditScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const router = useRouter();
  const intl = useIntl();

  const { data: mountains, isLoading } = useMyMountains();
  const { mutateAsync: updateMountain, isPending: isSaving } =
    useMountainUpdate();

  const mountain = mountains?.find((m) => m.slug === slug);

  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [height, setHeight] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [essential, setEssential] = useState(false);
  const {
    imageUri,
    imageBase64,
    hasChanged: hasImageChanged,
    pickImage,
    reset: resetImage,
  } = useImagePicker({ initialUri: mountain?.imageUrl });

  useEffect(() => {
    if (!mountain) return;
    setName(mountain.name);
    setLocation(mountain.location);
    setHeight(String(mountain.height));
    setLatitude(String(mountain.latitude));
    setLongitude(String(mountain.longitude));
    setEssential(mountain.essential);
    resetImage(mountain.imageUrl);
  }, [mountain, resetImage]);

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator />
      </View>
    );
  }

  if (!mountain) {
    return <Redirect href="/user/challenges" />;
  }

  const handleSave = async () => {
    const validation = validateMountainForm(
      { name, location, height, latitude, longitude },
      intl,
    );
    if (!validation.valid) {
      return Alert.alert(validation.error);
    }

    const updateData: Parameters<typeof updateMountain>[0] = {
      id: mountain.id,
    };

    if (validation.data.name !== mountain.name)
      updateData.name = validation.data.name;
    if (validation.data.location !== mountain.location)
      updateData.location = validation.data.location;
    if (validation.data.height !== Number(mountain.height))
      updateData.height = validation.data.height;
    if (validation.data.latitude !== Number(mountain.latitude))
      updateData.latitude = validation.data.latitude;
    if (validation.data.longitude !== Number(mountain.longitude))
      updateData.longitude = validation.data.longitude;
    if (essential !== mountain.essential) updateData.essential = essential;
    if (hasImageChanged && imageBase64) updateData.image = imageBase64;

    try {
      await updateMountain(updateData);
      Alert.alert(intl.formatMessage({ defaultMessage: "Mountain updated!" }));
      router.back();
    } catch {
      Alert.alert(
        intl.formatMessage({ defaultMessage: "Failed to update mountain" }),
      );
    }
  };

  return (
    <TouchableWithoutFeedback onPress={() => Keyboard.dismiss()}>
      <View className="flex-1 bg-background">
        <ScreenHeader />
        <ScrollView
          className="flex-1 px-6"
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View className="mb-4">
            <ThemedText className="text-4xl font-bold">
              <FormattedMessage defaultMessage="Edit mountain" />
            </ThemedText>
            {mountain.challengeCount > 0 && (
              <ThemedText className="mt-1 text-sm text-muted-foreground">
                {mountain.challengeCount === 1 ? (
                  <FormattedMessage
                    defaultMessage="Used in {count} challenge"
                    values={{ count: mountain.challengeCount }}
                  />
                ) : (
                  <FormattedMessage
                    defaultMessage="Used in {count} challenges"
                    values={{ count: mountain.challengeCount }}
                  />
                )}
              </ThemedText>
            )}
          </View>

          <View className="gap-4">
            <View className="flex-row items-end gap-4">
              <TouchableOpacity
                onPress={pickImage}
                className="h-[58px] w-[58px] items-center justify-center overflow-hidden rounded border-2 border-border bg-muted/30"
              >
                {imageUri ? (
                  <Image
                    source={{ uri: imageUri }}
                    className="size-full"
                    resizeMode="cover"
                  />
                ) : (
                  <Icon name="camera.fill" size={24} muted />
                )}
              </TouchableOpacity>
              <View className="flex-1">
                <ThemedTextInput
                  label={intl.formatMessage({
                    defaultMessage: "Mountain name",
                  })}
                  value={name}
                  onChangeText={setName}
                />
              </View>
            </View>

            <ThemedTextInput
              label={intl.formatMessage({ defaultMessage: "Location" })}
              value={location}
              onChangeText={setLocation}
            />

            <ThemedTextInput
              label={intl.formatMessage({ defaultMessage: "Height (meters)" })}
              value={height}
              onChangeText={setHeight}
              keyboardType="numeric"
            />

            <View className="flex-row gap-4">
              <View className="flex-1">
                <ThemedTextInput
                  label={intl.formatMessage({ defaultMessage: "Latitude" })}
                  value={latitude}
                  onChangeText={setLatitude}
                  keyboardType="numeric"
                />
              </View>
              <View className="flex-1">
                <ThemedTextInput
                  label={intl.formatMessage({ defaultMessage: "Longitude" })}
                  value={longitude}
                  onChangeText={setLongitude}
                  keyboardType="numeric"
                />
              </View>
            </View>

            <ThemedToggleInput
              label={intl.formatMessage({ defaultMessage: "Essential" })}
              checked={essential}
              onChecked={setEssential}
            />
          </View>

          <View className="mt-6 gap-2 pb-12">
            <Button isLoading={isSaving} onPress={handleSave}>
              <FormattedMessage defaultMessage="Save changes" />
            </Button>
            <Button
              intent="ghost"
              onPress={() => router.back()}
              textClassName="text-muted-foreground"
            >
              <FormattedMessage defaultMessage="Cancel" />
            </Button>
          </View>
        </ScrollView>
      </View>
    </TouchableWithoutFeedback>
  );
}

import { useState, useEffect } from "react";
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
  Button,
  Icon,
  ThemedText,
  ThemedTextInput,
} from "@/components/ui/atoms";
import { ThemedToggleInput } from "@/components/ui/atoms/themed-toggle-input";
import { useImagePicker } from "@/hooks/use-image-picker";
import { validateMountainForm } from "@/lib/mountain-validation";
import { MountainWithChallengeCount } from "@/types/mountain";

type MountainEditDrawerProps = {
  mountain: MountainWithChallengeCount;
  onSave: (data: {
    id: string;
    name?: string;
    location?: string;
    height?: number;
    latitude?: number;
    longitude?: number;
    essential?: boolean;
    image?: string;
  }) => Promise<void>;
  isSaving?: boolean;
  onClose: () => void;
};

export function MountainEditDrawer({
  mountain,
  onSave,
  isSaving = false,
  onClose,
}: MountainEditDrawerProps) {
  const intl = useIntl();

  const [name, setName] = useState(mountain.name);
  const [location, setLocation] = useState(mountain.location);
  const [height, setHeight] = useState(mountain.height);
  const [latitude, setLatitude] = useState(mountain.latitude);
  const [longitude, setLongitude] = useState(mountain.longitude);
  const [essential, setEssential] = useState(mountain.essential);
  const { imageUri, imageBase64, hasChanged: hasImageChanged, pickImage, reset: resetImage } = useImagePicker({
    initialUri: mountain.imageUrl,
  });

  // Reset form when mountain changes
  useEffect(() => {
    setName(mountain.name);
    setLocation(mountain.location);
    setHeight(mountain.height);
    setLatitude(mountain.latitude);
    setLongitude(mountain.longitude);
    setEssential(mountain.essential);
    resetImage(mountain.imageUrl);
  }, [mountain, resetImage]);

  const handleSave = async () => {
    const validation = validateMountainForm({ name, location, height, latitude, longitude }, intl);
    if (!validation.valid) {
      return Alert.alert(validation.error);
    }

    // Build update object with only changed fields
    const updateData: Parameters<typeof onSave>[0] = { id: mountain.id };

    if (validation.data.name !== mountain.name) updateData.name = validation.data.name;
    if (validation.data.location !== mountain.location) updateData.location = validation.data.location;
    if (validation.data.height !== Number(mountain.height)) updateData.height = validation.data.height;
    if (validation.data.latitude !== Number(mountain.latitude)) updateData.latitude = validation.data.latitude;
    if (validation.data.longitude !== Number(mountain.longitude)) updateData.longitude = validation.data.longitude;
    if (essential !== mountain.essential) updateData.essential = essential;
    if (hasImageChanged && imageBase64) updateData.image = imageBase64;

    try {
      await onSave(updateData);
      Alert.alert(
        intl.formatMessage({ defaultMessage: "Mountain updated!" })
      );
      onClose();
    } catch {
      Alert.alert(
        intl.formatMessage({ defaultMessage: "Failed to update mountain" })
      );
    }
  };

  return (
    <TouchableWithoutFeedback onPress={() => Keyboard.dismiss()}>
      <View className="max-h-[80vh] min-h-[80vh] bg-background p-6">
        <View className="mb-4">
          <ThemedText className="text-2xl font-semibold">
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

        <ScrollView
          className="flex-1"
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View className="gap-4">
            {/* Image picker */}
            <View className="flex-row items-end gap-4">
              <TouchableOpacity
                onPress={pickImage}
                className="h-[58px] w-[58px] items-center justify-center overflow-hidden rounded-xl border-2 border-border bg-muted/30"
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
                  label={intl.formatMessage({ defaultMessage: "Mountain name" })}
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
        </ScrollView>

        <View className="mt-4 gap-2">
          <Button isLoading={isSaving} onPress={handleSave}>
            <FormattedMessage defaultMessage="Save changes" />
          </Button>
          <Button
            intent="ghost"
            onPress={onClose}
            textClassName="text-muted-foreground"
          >
            <FormattedMessage defaultMessage="Cancel" />
          </Button>
        </View>
      </View>
    </TouchableWithoutFeedback>
  );
}

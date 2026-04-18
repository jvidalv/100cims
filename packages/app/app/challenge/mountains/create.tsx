import { useRouter } from "expo-router";
import { Camera, Plus, X } from "lucide-react-native";
import { useState } from "react";
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
  LucideIcon,
  ThemedKeyboardAvoidingView,
  ThemedTextInput,
  ThemedView,
} from "@/components/ui/atoms";
import { ThemedToggleInput } from "@/components/ui/atoms/themed-toggle-input";
import { ActionRow, ScreenHeader } from "@/components/ui/molecules";
import { appendNewMountainToSession } from "@/domains/mountain/challenge-mountain-picker-session";
import { useImagePicker } from "@/hooks/use-image-picker";
import { validateMountainForm } from "@/lib/mountain-validation";

export default function CreateMountainScreen() {
  const router = useRouter();
  const intl = useIntl();

  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [height, setHeight] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [essential, setEssential] = useState(false);
  const { imageUri, imageBase64, pickImage } = useImagePicker({
    aspect: [1, 1],
  });

  const handleSubmit = () => {
    const validation = validateMountainForm(
      { name, location, height, latitude, longitude },
      intl,
    );
    if (!validation.valid) {
      Alert.alert(validation.error);
      return;
    }
    if (!imageBase64) {
      Alert.alert(
        intl.formatMessage({ defaultMessage: "Image is required" }),
      );
      return;
    }

    const tempId = `temp_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    appendNewMountainToSession({
      tempId,
      name: validation.data.name,
      location: validation.data.location,
      height: validation.data.height,
      latitude: validation.data.latitude,
      longitude: validation.data.longitude,
      essential,
      image: imageBase64,
      imageUri: imageUri ?? undefined,
    });
    router.back();
  };

  return (
    <TouchableWithoutFeedback onPress={() => Keyboard.dismiss()}>
      <ThemedView className="flex-1">
        <ScreenHeader>
          <FormattedMessage defaultMessage="Create mountain" />
        </ScreenHeader>
        <ThemedKeyboardAvoidingView>
          <ScrollView
            className="p-6"
            keyboardShouldPersistTaps="handled"
            contentContainerClassName="gap-4 pb-24"
          >
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
                  <LucideIcon icon={Camera} size={24} muted />
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

            <View className="mt-4">
              <ActionRow
                icon={Plus}
                size="lg"
                intent="primary"
                onPress={handleSubmit}
                activeOpacity={0.85}
              >
                <FormattedMessage defaultMessage="Add mountain" />
              </ActionRow>
              <ActionRow
                icon={X}
                size="lg"
                onPress={() => router.back()}
                activeOpacity={0.85}
              >
                <FormattedMessage defaultMessage="Cancel" />
              </ActionRow>
            </View>
          </ScrollView>
        </ThemedKeyboardAvoidingView>
      </ThemedView>
    </TouchableWithoutFeedback>
  );
}

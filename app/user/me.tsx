import * as ImagePicker from "expo-image-picker";
import React, { useState } from "react";
import { ScrollView, TouchableOpacity, View } from "react-native";

import { Header } from "@/components/navigation";
import {
  ThemedText,
  Icon,
  ThemedKeyboardAvoidingView,
  ThemedTextInput,
  Avatar,
} from "@/components/ui/atoms";
import { useUserMe } from "@/domains/user/user.api";
import { useApiWithAuth } from "@/hooks/use-api-with-auth";
import { debounce } from "@/lib/debounce";
import { getImageOptimized } from "@/lib/images";

export default function UserMeScreen() {
  const api = useApiWithAuth();
  const { data: me, refetch } = useUserMe();
  const [image, setImage] = useState<string | null>(null);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      base64: true,
      aspect: [4, 3],
      quality: 0,
    });

    if (!result.canceled) {
      const image = result.assets[0];
      const imageOptimized = await getImageOptimized(image, {
        compress: 0.7,
        resizeBy: 4,
      });
      setImage(imageOptimized.uri);
      if (imageOptimized.base64) {
        await api.protected.user.me.post({ image: imageOptimized.base64 });
        void refetch();
      }
    }
  };

  const onChangeFirstName = debounce(async (firstName: string) => {
    await api.protected.user.me.post({
      firstName,
    });

    void refetch();
  }, 500);

  const onChangeLastName = debounce(async (lastName: string) => {
    await api.protected.user.me.post({
      lastName,
    });

    void refetch();
  }, 500);

  if (!me) {
    return null;
  }

  return (
    <ThemedKeyboardAvoidingView>
      <Header />
      <ScrollView className="flex-1 px-6">
        <ThemedText className="mb-4 text-4xl font-bold">Me</ThemedText>
        <View className="gap-6">
          <View className="relative items-center justify-center">
            <TouchableOpacity onPress={pickImage}>
              <Avatar
                size="xl"
                className="size-32"
                imageUrl={image ? image : me?.imageUrl}
              />
            </TouchableOpacity>
            {!image && !me?.imageUrl && (
              <View className="pointer-events-none absolute size-full items-center justify-center">
                <Icon
                  name="camera"
                  size={30}
                  color="white"
                  weight="bold"
                  animationSpec={{ effect: { type: "bounce" } }}
                />
              </View>
            )}
          </View>
          <ThemedTextInput disabled label="Email" value={me?.email} />
          <ThemedTextInput
            label="First name"
            value={me?.firstName}
            onChangeText={onChangeFirstName}
          />
          <ThemedTextInput
            label="Last name"
            value={me?.lastName}
            onChangeText={onChangeLastName}
          />
        </View>
      </ScrollView>
    </ThemedKeyboardAvoidingView>
  );
}

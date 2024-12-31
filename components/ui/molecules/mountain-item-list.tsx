import { Image } from "expo-image";
import { Link } from "expo-router";
import { TouchableOpacity, View } from "react-native";

import { ThemedText } from "@/components/ui/atoms";

export const MountainItemList = ({
  slug,
  name,
  location,
  height,
  imageUrl,
  essential,
}: {
  slug: string;
  name: string;
  location: string;
  height: string;
  essential: boolean;
  imageUrl: string | null;
}) => {
  return (
    <Link
      href={{
        pathname: "/mountain/[slug]",
        params: { slug },
      }}
      asChild
    >
      <TouchableOpacity delayPressIn={40} className="flex-row gap-4">
        <Image
          source={imageUrl}
          style={{ width: 100, height: 100, borderRadius: 16 }}
          contentFit="cover"
          contentPosition="center"
          placeholder={{ blurhash: `L~I64nWEWXaz_NWEWWazbvWBaxfQ` }}
        />
        <View className="flex-1 justify-center">
          <View className="gap-1">
            <ThemedText className="text-lg font-semibold tracking-tight">
              {name}
            </ThemedText>
            <ThemedText className="-mt-1  font-medium text-muted-foreground">
              {location}
            </ThemedText>
          </View>
          <View className="mt-2">
            <ThemedText className="font-semibold">
              {height}m
              {essential && (
                <ThemedText className="text-muted-foreground">
                  ,{" "}
                  <ThemedText className="font-semibold text-primary">
                    essential
                  </ThemedText>
                </ThemedText>
              )}
            </ThemedText>
          </View>
        </View>
      </TouchableOpacity>
    </Link>
  );
};

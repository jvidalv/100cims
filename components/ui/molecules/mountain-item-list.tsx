import { TouchableOpacity, View } from "react-native";
import { Image } from "expo-image";
import { ThemedText } from "@/components/ui/atoms";
import { Link } from "expo-router";

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
      <TouchableOpacity delayPressIn={30} className="flex-row h-32 gap-4">
        <Image
          source={imageUrl}
          style={{ flex: 0.5, borderRadius: 16 }}
          contentFit="cover"
          contentPosition="center"
          placeholder={{ blurhash: `L~I64nWEWXaz_NWEWWazbvWBaxfQ` }}
        />
        <View className="flex-1 justify-center">
          <View className="gap-1">
            <ThemedText className="text-xl font-bold tracking-tight leading-6">
              {name}
            </ThemedText>
            <ThemedText className="text-muted-foreground  font-medium -mt-1">
              {location}
            </ThemedText>
          </View>
          <View className="mt-2">
            <ThemedText className="font-semibold">
              {height}m
              {essential && (
                <ThemedText className="text-muted-foreground">
                  ,{" "}
                  <ThemedText className="text-primary font-semibold">
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

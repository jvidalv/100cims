import { Link } from "expo-router";
import { TouchableOpacity, View } from "react-native";
import { twMerge } from "tailwind-merge";

import { ThemedText } from "@/components/ui/atoms";
import { Image } from "@/components/ui/atoms/image";

interface MountainRowMinimalProps {
  slug: string;
  name: string;
  height: string;
  imageUrl: string | null;
  essential: boolean;
  distance?: number | string | null;
  isSummited?: boolean;
}

export function MountainRowMinimal({
  slug,
  name,
  height,
  imageUrl,
  essential,
  distance,
  isSummited,
}: MountainRowMinimalProps) {
  const distanceLabel =
    distance !== undefined && distance !== null ? `${distance} km` : null;
  return (
    <Link
      href={{ pathname: "/mountain/[slug]", params: { slug } }}
      asChild
    >
      <TouchableOpacity className="flex-row items-center gap-3">
        {imageUrl ? (
          <Image
            source={{ uri: imageUrl, cache: "force-cache" }}
            className="size-10 rounded bg-gray-400 dark:bg-gray-500"
          />
        ) : (
          <View className="size-10 rounded bg-gray-400 dark:bg-gray-500" />
        )}
        <View className="flex-1">
          <ThemedText
            className={twMerge(
              "font-medium",
              isSummited && "text-emerald-500",
            )}
            numberOfLines={1}
          >
            {name}
          </ThemedText>
          <ThemedText className="text-sm text-muted-foreground">
            {distanceLabel && `${distanceLabel} • `}
            <ThemedText
              className={twMerge(
                "text-sm",
                essential
                  ? "text-primary font-semibold"
                  : "text-muted-foreground",
              )}
            >
              {height}m
            </ThemedText>
          </ThemedText>
        </View>
      </TouchableOpacity>
    </Link>
  );
}

import { Link, useRouter, useSegments } from "expo-router";
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
  const router = useRouter();
  const segments = useSegments();
  // When this row is rendered from inside another mountain's detail page
  // (Nearby summits, route's Summits list), a plain push leaves the
  // previous mountain's NativeTabs alive in the native view hierarchy. Its
  // route node remembers the OLD slug for `useLocalSearchParams`, so tab
  // taps (Details, Routes, …) route to the previous mountain — the user
  // sees a "tabs nested in tabs" feel. Pop the current mountain stack
  // frame first, then push the new one on a deferred tick so React
  // Navigation's pop animation can finish releasing the old route node
  // before the new push registers.
  const isInsideMountainSubtree = segments[0] === "mountain";

  const handleNavigate = () => {
    if (!isInsideMountainSubtree) {
      router.push({ pathname: "/mountain/[slug]", params: { slug } });
      return;
    }
    router.back();
    // Defer to the next tick so the pop is committed before the push, otherwise
    // React Navigation collapses both operations into a single replace and we
    // re-enter the original dual-mount bug.
    setTimeout(() => {
      router.push({ pathname: "/mountain/[slug]", params: { slug } });
    }, 0);
  };

  // When we're navigating from a list outside `/mountain/...`, defer to
  // <Link> so deep-link previews, long-press menus, and accessibility
  // semantics keep working. Inside `/mountain/...` we have to hand-control
  // navigation (pop-then-push) so we render a plain TouchableOpacity.
  if (isInsideMountainSubtree) {
    return (
      <TouchableOpacity
        onPress={handleNavigate}
        className="flex-row items-center gap-3"
      >
        <Row
          name={name}
          height={height}
          imageUrl={imageUrl}
          essential={essential}
          isSummited={isSummited}
          distanceLabel={distanceLabel}
        />
      </TouchableOpacity>
    );
  }

  return (
    <Link
      href={{ pathname: "/mountain/[slug]", params: { slug } }}
      asChild
    >
      <TouchableOpacity className="flex-row items-center gap-3">
        <Row
          name={name}
          height={height}
          imageUrl={imageUrl}
          essential={essential}
          isSummited={isSummited}
          distanceLabel={distanceLabel}
        />
      </TouchableOpacity>
    </Link>
  );
}

interface RowProps {
  name: string;
  height: string;
  imageUrl: string | null;
  essential: boolean;
  isSummited?: boolean;
  distanceLabel: string | null;
}

function Row({
  name,
  height,
  imageUrl,
  essential,
  isSummited,
  distanceLabel,
}: RowProps) {
  return (
    <>
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
          className={twMerge("font-medium", isSummited && "text-emerald-500")}
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
    </>
  );
}

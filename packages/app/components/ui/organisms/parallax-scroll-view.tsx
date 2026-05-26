import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { ChevronLeft } from "lucide-react-native";
import { PropsWithChildren, ReactElement, ReactNode, useRef } from "react";
import {
  NativeScrollEvent,
  NativeSyntheticEvent,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, {
  interpolate,
  SharedValue,
  useAnimatedRef,
  useAnimatedStyle,
  useScrollOffset,
  withTiming,
} from "react-native-reanimated";
import { twMerge } from "tailwind-merge";

import { BlurView, ThemedText } from "@/components/ui/atoms";
import { LucideIcon } from "@/components/ui/atoms/lucide-icon";
import { ThemedView } from "@/components/ui/atoms/themed-view";
import { BLURRED_SCREEN_HEADER_HEIGHT } from "@/components/ui/molecules/blurred-screen-header";
import { hasDynamicIsland, isAndroid } from "@/lib/device";

const DEFAULT_BLURRED_HEADER_CLASSNAME = "font-medium text-lg max-w-56";

type Props = PropsWithChildren<{
  headerImage?: ReactElement;
  contentClassName?: string;
  headerClassName: string;
  title: string;
  subtitle?: string;
  height?: number;
  parallaxRightElement?: ReactElement;
  parallaxHeaderTitleClassName?: string;
  headerRightElement?: ReactElement;
  headerCenterElement?: ({
    title,
  }: {
    title: string;
    defaultTitleClassName: string;
  }) => ReactElement;
  /**
   * Fires once when the user approaches the bottom (within
   * `onEndReachedThreshold` of remaining content). Used by the public user
   * profile to drive infinite-scrolling summits — see
   * `app/user/[user]/index.tsx`. Re-arms when the user scrolls back up out
   * of the threshold, so a fresh page-load can trigger the next fire.
   */
  onEndReached?: () => void;
  /** Fraction of viewport-from-bottom that counts as "the end". Default 0.5. */
  onEndReachedThreshold?: number;
}>;

export default function ParallaxScrollView({
  children,
  headerImage,
  headerClassName,
  title,
  subtitle,
  parallaxRightElement,
  headerCenterElement,
  headerRightElement,
  parallaxHeaderTitleClassName,
  contentClassName,
  height = 300,
  onEndReached,
  onEndReachedThreshold = 0.5,
}: Props) {
  const router = useRouter();
  const scrollRef = useAnimatedRef<Animated.ScrollView>();
  const scrollOffset = useScrollOffset(scrollRef);
  // Latches when we've fired `onEndReached` for the current visit to the
  // bottom — prevents the callback from firing on every scroll event
  // afterwards. Resets when the user scrolls back up out of the threshold,
  // and gets cleared by a fresh page-load growing `contentSize` (the
  // threshold moves down again).
  const endReachedFiredRef = useRef(false);

  const handleScroll = onEndReached
    ? (event: NativeSyntheticEvent<NativeScrollEvent>) => {
        const { contentOffset, layoutMeasurement, contentSize } =
          event.nativeEvent;
        const distanceFromEnd =
          contentSize.height - (contentOffset.y + layoutMeasurement.height);
        const threshold = layoutMeasurement.height * onEndReachedThreshold;
        if (distanceFromEnd <= threshold) {
          if (!endReachedFiredRef.current) {
            endReachedFiredRef.current = true;
            onEndReached();
          }
        } else {
          endReachedFiredRef.current = false;
        }
      }
    : undefined;

  const parallaxFloatingElementsStyle = useAnimatedStyle(() => {
    if (scrollOffset.value < height - 100) {
      return {
        opacity: withTiming(1, { duration: 300 }),
      };
    }
    return {
      opacity: withTiming(0, { duration: 200 }),
    };
  });

  const headerElementsStyle = useAnimatedStyle(() => {
    if (scrollOffset.value > height - 110) {
      return {
        opacity: withTiming(1, { duration: 300 }),
      };
    }
    return {
      opacity: withTiming(0, { duration: 200 }),
    };
  });

  return (
    <ThemedView className="relative flex-1">
      <Animated.ScrollView
        ref={scrollRef}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        onScroll={handleScroll}
      >
        <AnimatedHeaderBackground
          headerClassName={headerClassName}
          headerImage={headerImage}
          scrollOffset={scrollOffset}
          height={height}
        />
        <Animated.View
          style={[parallaxFloatingElementsStyle, { height }]}
          className="absolute w-full items-start justify-end px-6 pb-4"
        >
          <LinearGradient
            colors={["transparent", "transparent", "rgba(0,0,0,0.4)"]}
            style={StyleSheet.absoluteFill}
          />
          {!!subtitle && (
            <ThemedText className="text-xl font-bold text-white/80">
              {subtitle}
            </ThemedText>
          )}
          <View className="flex-row items-end justify-between">
            <ThemedText
              numberOfLines={3}
              className={twMerge(
                "-mb-1 flex-1 items-end text-4xl font-bold text-white",
                parallaxHeaderTitleClassName,
              )}
            >
              {title}
            </ThemedText>
            {parallaxRightElement}
          </View>
        </Animated.View>
        <ThemedView className={twMerge("flex-1", contentClassName)}>
          {children}
        </ThemedView>
      </Animated.ScrollView>
      <Animated.View
        style={parallaxFloatingElementsStyle}
        className={twMerge(
          "absolute top-14 pl-5 pr-6",
          hasDynamicIsland && "top-[4.5rem]",
        )}
      >
        <TouchableOpacity
          onPress={router.back}
          hitSlop={16}
          className="size-11 items-center justify-center overflow-hidden rounded-full"
        >
          <BlurView
            className="items-center justify-center"
            style={StyleSheet.absoluteFill}
          >
            <LucideIcon
              size={28}
              color={isAndroid ? undefined : "white"}
              icon={ChevronLeft}
            />
          </BlurView>
        </TouchableOpacity>
      </Animated.View>
      <Animated.View
        // Height comes from BLURRED_SCREEN_HEADER_HEIGHT so the collapsed
        // parallax header stays the exact same size as the standalone
        // BlurredScreenHeader used on Summit / Comments — single source of
        // truth for the band height across all three tabs.
        style={[headerElementsStyle, { height: BLURRED_SCREEN_HEADER_HEIGHT }]}
        className="absolute top-0 w-full flex-1"
      >
        <Header title={title} rightElement={headerRightElement}>
          {headerCenterElement ? (
            headerCenterElement({
              title,
              defaultTitleClassName: DEFAULT_BLURRED_HEADER_CLASSNAME,
            })
          ) : (
            <ThemedText
              numberOfLines={1}
              className={DEFAULT_BLURRED_HEADER_CLASSNAME}
            >
              {title}
            </ThemedText>
          )}
        </Header>
      </Animated.View>
    </ThemedView>
  );
}

const AnimatedHeaderBackground = ({
  headerImage,
  headerClassName,
  scrollOffset,
  height,
}: {
  height: number;
  headerImage?: ReactElement;
  headerClassName: string;
  scrollOffset: SharedValue<number>;
}) => {
  const headerAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          translateY: interpolate(
            scrollOffset.value,
            [-height, 0, height],
            [-height / 2, 0, height * 0.75],
          ),
        },
        {
          scale: interpolate(
            scrollOffset.value,
            [-height, 0, height],
            [2, 1, 1],
          ),
        },
      ],
    };
  });

  return (
    <Animated.View
      className={twMerge("overflow-hidden", headerClassName)}
      style={[headerAnimatedStyle, { height }]}
    >
      {headerImage}
    </Animated.View>
  );
};

const Header = ({
  children,
  rightElement,
}: PropsWithChildren<{
  title?: string;
  rightElement?: ReactNode;
}>) => {
  const router = useRouter();

  return (
    <BlurView className="flex-1">
      <View className="mt-auto flex-row items-center justify-between">
        <TouchableOpacity
          onPress={router.back}
          hitSlop={16}
          className="-mt-3 w-1/5 py-4 pl-6 pr-4"
        >
          <LucideIcon size={28} icon={ChevronLeft} />
        </TouchableOpacity>
        <View className="mx-auto pb-3 text-center">{children}</View>
        <View className="w-1/5">{rightElement}</View>
      </View>
    </BlurView>
  );
};


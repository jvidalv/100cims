import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { PropsWithChildren, ReactElement, useEffect, useState } from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import Animated, {
  interpolate,
  SharedValue,
  useAnimatedRef,
  useAnimatedStyle,
  useScrollViewOffset,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { twMerge } from "tailwind-merge";

import { ThemedKeyboardAvoidingView, ThemedText } from "@/components/ui/atoms";
import { Icon } from "@/components/ui/atoms/icon";
import { ThemedView } from "@/components/ui/atoms/themed-view";

const HEADER_HEIGHT = 300;
const DEFAULT_BLURRED_HEADER_CLASSNAME = "font-medium text-lg";

type Props = PropsWithChildren<{
  headerImage: ReactElement;
  contentClassName?: string;
  headerClassName: string;
  title: string;
  blurredTopHeaderElement?: ({
    title,
  }: {
    title: string;
    defaultTitleClassName: string;
  }) => ReactElement;
}>;

export default function ParallaxScrollView({
  children,
  headerImage,
  headerClassName,
  title,
  blurredTopHeaderElement,
  contentClassName,
}: Props) {
  const [scrollPosition, setScrollPosition] = useState(0);
  const handleScroll = (event: any) => {
    setScrollPosition(event.nativeEvent.contentOffset.y);
  };
  const scrollRef = useAnimatedRef<Animated.ScrollView>();
  const scrollOffset = useScrollViewOffset(scrollRef);
  const showBlurredTopHeader = scrollPosition > 200;

  return (
    <ThemedKeyboardAvoidingView>
      <ThemedView className="relative flex-1 pb-8">
        <Animated.ScrollView
          ref={scrollRef}
          onScroll={handleScroll}
          scrollEventThrottle={16}
        >
          <AnimatedHeaderBackground
            headerClassName={headerClassName}
            headerImage={headerImage}
            scrollOffset={scrollOffset}
          />
          <HeaderTitleElement title={title} show={!showBlurredTopHeader} />
          <ThemedView className={twMerge("flex-1", contentClassName)}>
            {children}
          </ThemedView>
        </Animated.ScrollView>
        <HeaderTopElement show={!showBlurredTopHeader} />
        <BlurredTopHeader title={title} show={showBlurredTopHeader}>
          {blurredTopHeaderElement ? (
            blurredTopHeaderElement({
              title,
              defaultTitleClassName: DEFAULT_BLURRED_HEADER_CLASSNAME,
            })
          ) : (
            <ThemedText className={DEFAULT_BLURRED_HEADER_CLASSNAME}>
              {title}
            </ThemedText>
          )}
        </BlurredTopHeader>
      </ThemedView>
    </ThemedKeyboardAvoidingView>
  );
}

const AnimatedHeaderBackground = ({
  headerImage,
  headerClassName,
  scrollOffset,
}: {
  headerImage: ReactElement;
  headerClassName: string;
  scrollOffset: SharedValue<number>;
}) => {
  const headerAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          translateY: interpolate(
            scrollOffset.value,
            [-HEADER_HEIGHT, 0, HEADER_HEIGHT],
            [-HEADER_HEIGHT / 2, 0, HEADER_HEIGHT * 0.75],
          ),
        },
        {
          scale: interpolate(
            scrollOffset.value,
            [-HEADER_HEIGHT, 0, HEADER_HEIGHT],
            [2, 1, 1],
          ),
        },
      ],
    };
  });

  return (
    <Animated.View
      className={twMerge("h-[300px] overflow-hidden", headerClassName)}
      style={headerAnimatedStyle}
    >
      {headerImage}
    </Animated.View>
  );
};

const HeaderTopElement = ({ show }: { show: boolean }) => {
  const router = useRouter();
  const opacity = useSharedValue(1); // Start with opacity 0

  useEffect(() => {
    if (show) {
      opacity.value = withTiming(1, { duration: 200 });
    } else {
      opacity.value = withTiming(0, { duration: 300 });
    }
  }, [opacity, show]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={animatedStyle} className="absolute top-16 px-6">
      <TouchableOpacity
        onPress={router.back}
        className="-mx-2 size-8 items-center justify-center overflow-hidden rounded-full"
      >
        <BlurView
          className="items-center justify-center"
          style={StyleSheet.absoluteFill}
        >
          <Icon size={16} color="white" weight="semibold" name="chevron.left" />
        </BlurView>
      </TouchableOpacity>
    </Animated.View>
  );
};

const HeaderTitleElement = ({
  title,
  show,
}: {
  title: string;
  show: boolean;
}) => {
  const opacity = useSharedValue(1); // Start with opacity 0

  useEffect(() => {
    if (show) {
      opacity.value = withTiming(1, { duration: 200 });
    } else {
      opacity.value = withTiming(0, { duration: 300 });
    }
  }, [opacity, show]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={animatedStyle}
      className="absolute h-[300px] w-full items-start justify-end px-6 pb-4"
    >
      <LinearGradient
        colors={["transparent", "transparent", "rgba(0,0,0,0.4)"]}
        style={StyleSheet.absoluteFill}
      />

      <ThemedText className="text-4xl font-bold text-white">{title}</ThemedText>
    </Animated.View>
  );
};

const BlurredTopHeader = ({
  show,
  children,
}: PropsWithChildren<{
  title?: string;
  show: boolean;
}>) => {
  const router = useRouter();
  const opacity = useSharedValue(0); // Start with opacity 0

  useEffect(() => {
    if (show) {
      opacity.value = withTiming(1, { duration: 300 });
    } else {
      opacity.value = withTiming(0, { duration: 200 });
    }
  }, [opacity, show]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={animatedStyle}
      className="absolute top-0 h-24 w-full flex-1"
    >
      <BlurView className="flex-1">
        <View className="mt-auto flex-row items-center justify-between px-6 pb-2">
          <TouchableOpacity onPress={router.back} className="-mx-4 px-4">
            <Icon size={16} name="chevron.left" />
          </TouchableOpacity>
          {children}
          <TouchableOpacity>
            <Icon size={18} name="square.and.arrow.up" />
          </TouchableOpacity>
        </View>
      </BlurView>
    </Animated.View>
  );
};

import { LinearGradient } from "expo-linear-gradient";
import { useEffect } from "react";
import { FormattedMessage } from "react-intl";
import { Text, TouchableOpacity, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withSpring,
} from "react-native-reanimated";

import { ThemedText } from "@/components/ui/atoms";
import { Colors } from "@/constants/colors";

interface MerchUpsellCardProps {
  onPress: () => void;
}

export function MerchUpsellCard({ onPress }: MerchUpsellCardProps) {
  const translateY = useSharedValue(0);
  const rotate = useSharedValue(0);

  useEffect(() => {
    // Single bounce cycle: ~600ms, repeat 5 times = ~3 seconds
    const bounce = () => {
      translateY.value = withSequence(
        withSpring(-10, { damping: 8, stiffness: 400 }),
        withSpring(0, { damping: 8, stiffness: 400 }),
        withDelay(100, withSpring(-10, { damping: 8, stiffness: 400 })),
        withSpring(0, { damping: 8, stiffness: 400 }),
        withDelay(100, withSpring(-10, { damping: 8, stiffness: 400 })),
        withSpring(0, { damping: 8, stiffness: 400 }),
        withDelay(100, withSpring(-8, { damping: 8, stiffness: 400 })),
        withSpring(0, { damping: 8, stiffness: 400 }),
        withDelay(100, withSpring(-5, { damping: 8, stiffness: 400 })),
        withSpring(0, { damping: 10, stiffness: 400 })
      );
      rotate.value = withSequence(
        withSpring(-5, { damping: 8, stiffness: 400 }),
        withSpring(5, { damping: 8, stiffness: 400 }),
        withSpring(-5, { damping: 8, stiffness: 400 }),
        withSpring(5, { damping: 8, stiffness: 400 }),
        withSpring(-5, { damping: 8, stiffness: 400 }),
        withSpring(5, { damping: 8, stiffness: 400 }),
        withSpring(-3, { damping: 8, stiffness: 400 }),
        withSpring(3, { damping: 8, stiffness: 400 }),
        withSpring(-2, { damping: 8, stiffness: 400 }),
        withSpring(0, { damping: 10, stiffness: 400 })
      );
    };
    bounce();
  }, [translateY, rotate]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: translateY.value },
      { rotate: `${rotate.value}deg` },
    ],
  }));

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.85}>
      <LinearGradient
        colors={[Colors.light.primary, Colors.light.accent]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ borderRadius: 16, padding: 3 }}
      >
        <View
          className="flex-row items-center gap-3 bg-background p-4"
          style={{ borderRadius: 13 }}
        >
          <View className="size-14 items-center justify-center">
            <Animated.View style={animatedStyle}>
              <Text style={{ fontSize: 36 }}>👕</Text>
            </Animated.View>
          </View>
          <View className="flex-1 gap-0.5">
            <ThemedText className="text-base font-bold text-primary">
              <FormattedMessage defaultMessage="Support Cims" />
            </ThemedText>
            <ThemedText className="text-sm text-muted-foreground">
              <FormattedMessage defaultMessage="Get some merch and support the app!" />
            </ThemedText>
          </View>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
}

import { useRouter } from "expo-router";
import { PropsWithChildren, ReactNode } from "react";
import { TouchableOpacity, View } from "react-native";
import { twMerge } from "tailwind-merge";

import { ThemedText, ThemedView } from "@/components/ui/atoms";
import { Icon } from "@/components/ui/atoms/icon";
import { hasDynamicIsland, isAndroid } from "@/lib/device";

export const ScreenHeader = ({
  children,
  rightElement,
}: PropsWithChildren<{ rightElement?: ReactNode }>) => {
  const router = useRouter();

  return (
    <ThemedView
      className={twMerge(
        "h-24 w-full justify-end pt-2",
        hasDynamicIsland && "h-32",
      )}
    >
      <View className="flex-row items-center justify-between">
        <TouchableOpacity
          onPress={router.back}
          hitSlop={16}
          className="w-1/4 py-4 pl-6 pr-4"
        >
          <Icon
            size={isAndroid ? 24 : 16}
            name="chevron.left"
            weight="semibold"
          />
        </TouchableOpacity>
        <ThemedText
          className="w-2/4 shrink text-center font-medium"
          numberOfLines={1}
        >
          {children}
        </ThemedText>
        <View className="w-1/4 items-end">{rightElement}</View>
      </View>
    </ThemedView>
  );
};

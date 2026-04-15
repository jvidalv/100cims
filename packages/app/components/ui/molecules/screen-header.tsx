import { useRouter } from "expo-router";
import { ChevronLeft } from "lucide-react-native";
import { PropsWithChildren, ReactNode } from "react";
import { TouchableOpacity, View } from "react-native";
import { twMerge } from "tailwind-merge";

import { ThemedText, ThemedView } from "@/components/ui/atoms";
import { LucideIcon } from "@/components/ui/atoms/lucide-icon";
import { hasDynamicIsland } from "@/lib/device";

export const ScreenHeader = ({
  children,
  rightElement,
}: PropsWithChildren<{ rightElement?: ReactNode }>) => {
  const router = useRouter();

  return (
    <ThemedView
      className={twMerge(
        "h-28 w-full justify-end pt-4",
        hasDynamicIsland && "h-36",
      )}
    >
      <View className="flex-row items-center justify-between">
        <TouchableOpacity
          onPress={router.back}
          hitSlop={16}
          className="w-1/4 py-4 pl-6 pr-4"
        >
          <LucideIcon size={28} icon={ChevronLeft} />
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

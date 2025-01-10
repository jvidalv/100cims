import { useRouter } from "expo-router";
import { TouchableOpacity } from "react-native";
import { twMerge } from "tailwind-merge";

import { ThemedView } from "@/components/ui/atoms";
import { Icon } from "@/components/ui/atoms/icon";
import { hasDynamicIsland, isAndroid } from "@/lib/device";

export const ScreenHeader = () => {
  const router = useRouter();
  return (
    <ThemedView
      className={twMerge(
        "h-[5.5rem] w-full justify-end",
        hasDynamicIsland && "h-24",
      )}
    >
      <TouchableOpacity onPress={router.back} className="-ml-2 w-fit py-3 pl-8">
        <Icon
          size={isAndroid ? 24 : 16}
          name="chevron.left"
          weight="semibold"
        />
      </TouchableOpacity>
    </ThemedView>
  );
};

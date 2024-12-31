import { useRouter } from "expo-router";
import { TouchableOpacity } from "react-native";

import { ThemedView } from "@/components/ui/atoms";
import { Icon } from "@/components/ui/atoms/icon";
import { useColorScheme } from "@/hooks/use-color-scheme";

export const Header = () => {
  const { isDark } = useColorScheme();
  const router = useRouter();

  return (
    <ThemedView className="fixed top-0 h-24 w-full justify-end px-6 pb-3">
      <TouchableOpacity onPress={router.back} className="-ml-2 px-2 py-0.5">
        <Icon
          size={16}
          color={isDark ? "white" : "black"}
          name="chevron.left"
          weight="semibold"
        />
      </TouchableOpacity>
    </ThemedView>
  );
};

import { ThemedView } from "@/components/ui/atoms";
import { Icon } from "@/components/ui/atoms/icon";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useRouter } from "expo-router";
import { TouchableOpacity } from "react-native";

export const Header = () => {
  const { isDark } = useColorScheme();
  const router = useRouter();

  return (
    <ThemedView className="fixed top-0 w-full h-24 justify-end px-6 pb-3">
      <TouchableOpacity onPress={router.back} className="px-2 -ml-2 py-0.5">
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

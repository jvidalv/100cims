import { useColorScheme as useRNColorScheme } from "react-native";

export const useColorScheme = () => {
  const scheme = useRNColorScheme();

  return {
    scheme,
    isDark: scheme === "dark",
  };
};

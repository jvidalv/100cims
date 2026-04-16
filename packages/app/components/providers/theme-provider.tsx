import { VariableContextProvider } from "nativewind";
import { PropsWithChildren } from "react";
import { useColorScheme } from "react-native";

import { Colors } from "@/constants/colors";

const themes = {
  brand: {
    light: {
      "--color-primary": Colors.light.primary,
      "--color-accent": Colors.light.accent,
      "--color-background": "#ffffff",
      "--color-foreground": "#050505",
      "--color-muted-foreground": "#505050",
      "--color-link": "#2563eb",
      "--color-border": "#e5e7eb",
    },
    dark: {
      "--color-primary": Colors.dark.primary,
      "--color-accent": Colors.dark.accent,
      "--color-background": "#000000",
      "--color-foreground": "#ecedee",
      "--color-muted-foreground": "#bebebe",
      "--color-link": "#3b82f6",
      "--color-border": "#1c1c1e",
    },
  },
} as const;

export function ThemeProvider({
  name = "brand",
  children,
}: PropsWithChildren<{ name?: keyof typeof themes }>) {
  const colorScheme = useColorScheme() === "dark" ? "dark" : "light";
  return (
    <VariableContextProvider value={themes[name][colorScheme]}>
      {children}
    </VariableContextProvider>
  );
}

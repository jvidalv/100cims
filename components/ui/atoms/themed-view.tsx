import { View, type ViewProps } from "react-native";
import { twMerge } from "tailwind-merge";

export function ThemedView({ className, ...props }: ViewProps) {
  return <View className={twMerge("bg-background", className)} {...props} />;
}

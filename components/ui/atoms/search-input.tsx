import { TextInput, View } from "react-native";
import { Icon } from "@/components/ui/atoms/icon";
import { useMemo, useState } from "react";
import { getFontFamily } from "@/lib/font-family";
import { twMerge } from "tailwind-merge";
import { Colors } from "@/constants/colors";

const inputClassName =
  "border-2 border-border rounded-xl py-4 pl-12 text-foreground";

export const SearchInput = ({
  onChangeText,
  className,
}: {
  className?: string;
  onChangeText: (text: string) => void;
}) => {
  const [focused, setFocused] = useState(false);
  const fontFamily = useMemo(() => {
    return getFontFamily(inputClassName);
  }, []);

  return (
    <View className={twMerge("relative", className)}>
      <View className="absolute h-full items-center justify-center left-4">
        <Icon
          name="magnifyingglass"
          size={20}
          weight="semibold"
          color={focused ? Colors.dark.accent : undefined}
          animationSpec={focused ? { effect: { type: "bounce" } } : undefined}
        />
      </View>
      <TextInput
        onFocus={() => {
          setFocused(true);
        }}
        onBlur={() => {
          setFocused(false);
        }}
        style={{ fontFamily }}
        onChangeText={onChangeText}
        placeholder="Search..."
        className={twMerge(inputClassName, focused && "border-accent")}
      />
    </View>
  );
};

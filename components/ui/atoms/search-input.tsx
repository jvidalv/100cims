import { useColorScheme } from "nativewind";
import { useMemo, useState } from "react";
import { useIntl } from "react-intl";
import { TextInput, View } from "react-native";
import { twMerge } from "tailwind-merge";

import { Icon } from "@/components/ui/atoms/icon";
import { isAndroid } from "@/lib/device";
import { getFontFamily } from "@/lib/fonts";

const inputClassName =
  "border-2 border-border rounded-xl py-4 pl-12 text-foreground";

export const SearchInput = ({
  onChangeText,
  className,
  autoFocus,
  onBlur,
}: {
  className?: string;
  autoFocus?: boolean;
  onChangeText: (text: string) => void;
  onBlur?: () => void;
}) => {
  const { colorScheme } = useColorScheme();
  const intl = useIntl();

  const [focused, setFocused] = useState(false);
  const fontFamily = useMemo(() => {
    return getFontFamily(inputClassName);
  }, []);

  return (
    <View className={twMerge("relative", className)}>
      <View className="absolute left-4 h-full items-center justify-center">
        <Icon
          name="magnifyingglass"
          size={20}
          weight="semibold"
          color={focused ? "#3b82f6" : undefined}
          animationSpec={focused ? { effect: { type: "bounce" } } : undefined}
        />
      </View>
      <TextInput
        autoFocus={autoFocus}
        onFocus={() => {
          setFocused(true);
        }}
        onBlur={() => {
          setFocused(false);
          onBlur?.();
        }}
        style={{ fontFamily, fontSize: 16 }}
        onChangeText={onChangeText}
        placeholder={intl.formatMessage({ defaultMessage: "Search..." })}
        placeholderTextColor={
          isAndroid && colorScheme === "dark" ? "gray" : undefined
        }
        autoCapitalize="none"
        autoCorrect={false}
        className={twMerge(inputClassName, focused && "border-blue-500")}
      />
    </View>
  );
};

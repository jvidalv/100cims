import { useColorScheme } from "nativewind";
import { useState } from "react";
import { useIntl } from "react-intl";
import { BlurEvent, FocusEvent, TextInput, View } from "react-native";
import { twMerge } from "tailwind-merge";

import { Icon } from "@/components/ui/atoms/icon";
import { isAndroid } from "@/lib/device";

const inputClassName =
  "border-2 border-border rounded py-4 pl-12 text-foreground";

export const SearchInput = ({
  onChangeText,
  className,
  autoFocus,
  onBlur,
  onFocus,
}: {
  className?: string;
  autoFocus?: boolean;
  onChangeText: (text: string) => void;
  onBlur?: (e: BlurEvent) => void;
  onFocus?: (e: FocusEvent) => void;
}) => {
  const { colorScheme } = useColorScheme();
  const intl = useIntl();

  const [focused, setFocused] = useState(false);

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
        onFocus={(e) => {
          setFocused(true);
          onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocused(false);
          onBlur?.(e);
        }}
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

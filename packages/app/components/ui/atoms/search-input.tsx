import { Search } from "lucide-react-native";
import { useColorScheme } from "nativewind";
import { useState } from "react";
import { useIntl } from "react-intl";
import { BlurEvent, FocusEvent, TextInput, View } from "react-native";
import { twMerge } from "tailwind-merge";

import { LucideIcon } from "@/components/ui/atoms/lucide-icon";
import { isAndroid } from "@/lib/device";

const inputClassName =
  "border-2 border-border rounded py-4 pl-12 text-foreground";

export const SearchInput = ({
  onChangeText,
  className,
  autoFocus,
  onBlur,
  onFocus,
  placeholder,
}: {
  className?: string;
  autoFocus?: boolean;
  onChangeText: (text: string) => void;
  onBlur?: (e: BlurEvent) => void;
  onFocus?: (e: FocusEvent) => void;
  placeholder?: string;
}) => {
  const { colorScheme } = useColorScheme();
  const intl = useIntl();

  const [focused, setFocused] = useState(false);

  return (
    <View className={twMerge("relative", className)}>
      <View className="absolute left-4 h-full items-center justify-center">
        <LucideIcon
          icon={Search}
          size={20}
          color={focused ? "#3b82f6" : undefined}
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
        placeholder={
          placeholder ?? intl.formatMessage({ defaultMessage: "Search..." })
        }
        placeholderTextColor={
          isAndroid && colorScheme === "dark" ? "gray" : undefined
        }
        autoCapitalize="none"
        autoCorrect={false}
        style={{ fontSize: 16 }}
        className={twMerge(inputClassName, focused && "border-blue-500")}
      />
    </View>
  );
};

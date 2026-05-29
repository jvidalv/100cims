import { Search, X } from "lucide-react-native";
import { useColorScheme } from "nativewind";
import { useRef, useState } from "react";
import { useIntl } from "react-intl";
import {
  BlurEvent,
  FocusEvent,
  Pressable,
  TextInput,
  View,
} from "react-native";
import { twMerge } from "tailwind-merge";

import { LucideIcon } from "@/components/ui/atoms/lucide-icon";
import { isAndroid } from "@/lib/device";

// pr-12 leaves room for the floating clear button on the right when there's
// text in the field — mirrors pl-12 on the left for the search icon.
const inputClassName =
  "border-2 border-border rounded py-4 pl-12 pr-12 text-foreground";

export const SearchInput = ({
  onChangeText,
  className,
  inputClassName: inputClassNameOverride,
  autoFocus,
  onBlur,
  onFocus,
  placeholder,
}: {
  className?: string;
  /** Extra classes appended to the inner TextInput. Use for backgrounds or
   *  other input-level styling — the wrapper `className` only positions the
   *  search icon and so backgrounds on it don't paint behind the field. */
  inputClassName?: string;
  autoFocus?: boolean;
  onChangeText: (text: string) => void;
  onBlur?: (e: BlurEvent) => void;
  onFocus?: (e: FocusEvent) => void;
  placeholder?: string;
}) => {
  const { colorScheme } = useColorScheme();
  const intl = useIntl();
  const inputRef = useRef<TextInput>(null);

  const [focused, setFocused] = useState(false);
  // Track whether the input has text so the clear button can show/hide. Kept
  // internal — callers stay uncontrolled and just listen via `onChangeText`.
  const [hasText, setHasText] = useState(false);

  const handleClear = () => {
    inputRef.current?.clear();
    setHasText(false);
    onChangeText("");
  };

  return (
    <View className={twMerge("relative", className)}>
      <TextInput
        ref={inputRef}
        autoFocus={autoFocus}
        onFocus={(e) => {
          setFocused(true);
          onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocused(false);
          onBlur?.(e);
        }}
        onChangeText={(text) => {
          setHasText(text.length > 0);
          onChangeText(text);
        }}
        placeholder={
          placeholder ?? intl.formatMessage({ defaultMessage: "Search..." })
        }
        placeholderTextColor={
          isAndroid && colorScheme === "dark" ? "gray" : undefined
        }
        autoCapitalize="none"
        autoCorrect={false}
        style={{ fontSize: 16 }}
        className={twMerge(
          inputClassName,
          focused && "border-blue-500",
          inputClassNameOverride,
        )}
      />
      {/* Icon rendered AFTER the TextInput so its absolute positioning paints
          on top of a backgrounded input — earlier the icon was a prior sibling
          and a solid `bg-*` on the input covered it. */}
      <View
        pointerEvents="none"
        className="absolute left-4 h-full items-center justify-center"
      >
        <LucideIcon
          icon={Search}
          size={20}
          color={focused ? "#3b82f6" : undefined}
        />
      </View>
      {hasText && (
        <Pressable
          onPress={handleClear}
          hitSlop={12}
          accessibilityLabel={intl.formatMessage({
            defaultMessage: "Clear search",
          })}
          className="absolute right-4 h-full items-center justify-center"
        >
          <LucideIcon icon={X} size={18} muted />
        </Pressable>
      )}
    </View>
  );
};

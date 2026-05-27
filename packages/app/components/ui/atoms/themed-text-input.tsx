import { FC, useEffect, useRef, useState } from "react";
import {
  TextInput,
  View,
  Animated,
  KeyboardTypeOptions,
  TextInputProps,
} from "react-native";
import { ReturnKeyType } from "react-native/Libraries/Components/TextInput/TextInput";
import { twMerge } from "tailwind-merge";

import { isAndroid } from "@/lib/device";

// Android's TextInput baseline sits lower than iOS's due to
// `includeFontPadding`, so a label positioned at the same `top` as iOS reads
// lower than the visible placeholder text. Nudge the resting position up on
// Android to recenter against the placeholder.
const LABEL_RESTING_TOP = isAndroid ? 13 : 19;

type InputProps = {
  label?: string;
  value?: string | null;
  defaultValue?: string | null;
  disabled?: boolean;
  multiline?: boolean;
  autoFocus?: boolean;
  className?: string;
  inputClassName?: string;
  maxLength?: number;
  onFocus?: () => void;
  onBlur?: () => void;
  returnKeyType?: ReturnKeyType;
  keyboardType?: KeyboardTypeOptions;
  placeholder?: string;
  autoCapitalize?: TextInputProps["autoCapitalize"];
  autoComplete?: TextInputProps["autoComplete"];
  textContentType?: TextInputProps["textContentType"];
  onChangeText?: (text: string) => void;
  /** When non-empty, the border turns red and the message renders below
   *  the input. The caller is responsible for clearing it (e.g. on change). */
  error?: string | null;
};

export const ThemedTextInput: FC<InputProps> = ({
  label,
  value,
  defaultValue,
  disabled,
  onChangeText,
  className,
  inputClassName,
  maxLength,
  multiline,
  autoFocus,
  returnKeyType,
  keyboardType,
  placeholder,
  autoCapitalize,
  autoComplete,
  textContentType,
  onBlur,
  onFocus,
  error,
}) => {
  const [internalValue, setInternalValue] = useState(value || defaultValue);
  const [isFocused, setIsFocused] = useState(false);
  const labelPosition = useRef(
    new Animated.Value(internalValue ? 1 : 0),
  ).current;

  useEffect(() => {
    const animation = Animated.timing(labelPosition, {
      toValue: isFocused || internalValue ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    });
    animation.start();
    // Stop the tween + detach listeners on unmount. Without this, if the
    // input unmounts mid-animation (filter toggle, screen swap, NativeTabs
    // mount/unmount cycle), the next animation frame fires `__callListeners`
    // on the now-freed AnimatedValue and crashes with
    // `undefined is not a function` from AnimatedNode.js.
    return () => {
      animation.stop();
      labelPosition.stopAnimation();
      labelPosition.removeAllListeners();
    };
  }, [value, isFocused, labelPosition, defaultValue, internalValue]);

  const style = {
    top: labelPosition.interpolate({
      inputRange: [0, 1],
      outputRange: [LABEL_RESTING_TOP, -9],
    }),
    fontSize: labelPosition.interpolate({
      inputRange: [0, 1],
      outputRange: [16, 14],
    }),
  };

  return (
    <View className={twMerge("relative w-full h-fit", className)}>
      {!!label && (
        <Animated.View
          style={[{ top: style.top }]}
          className="pointer-events-none absolute left-4 z-10 -mx-1 bg-background px-1"
        >
          <Animated.Text
            style={[{ fontSize: style.fontSize }]}
            className="text-muted-foreground"
          >
            {label}
          </Animated.Text>
        </Animated.View>
      )}
      <TextInput
        editable={!disabled}
        multiline={multiline}
        autoFocus={autoFocus}
        maxLength={maxLength}
        keyboardType={keyboardType}
        returnKeyType={returnKeyType}
        placeholder={placeholder}
        autoCapitalize={autoCapitalize}
        autoComplete={autoComplete}
        textContentType={textContentType}
        className={twMerge(
          "w-full border-2 border-border rounded flex py-5 px-4 text-foreground focus:border-blue-500",
          disabled && "bg-gray-50 dark:bg-neutral-900 text-foreground/60",
          error && "border-red-500 focus:border-red-500",
          inputClassName,
        )}
        style={{ fontSize: 16 }}
        value={!value ? undefined : value}
        defaultValue={!defaultValue ? undefined : defaultValue}
        onChangeText={(text) => {
          setInternalValue(text);
          onChangeText?.(text);
        }}
        onFocus={() => {
          setIsFocused(true);
          onFocus?.();
        }}
        onBlur={() => {
          setIsFocused(false);
          onBlur?.();
        }}
      />
      {!!error && (
        <Animated.Text className="mt-1 px-1 text-xs text-red-500">
          {error}
        </Animated.Text>
      )}
    </View>
  );
};

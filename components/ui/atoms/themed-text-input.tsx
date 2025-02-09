import { FC, useEffect, useRef, useState } from "react";
import { TextInput, View, Animated, KeyboardTypeOptions } from "react-native";
import { twMerge } from "tailwind-merge";

type InputProps = {
  label?: string;
  value?: string | null;
  defaultValue?: string | null;
  disabled?: boolean;
  multiline?: boolean;
  autoFocus?: boolean;
  className?: string;
  inputClassName?: string;
  onFocus?: () => void;
  onBlur?: () => void;
  keyboardType?: KeyboardTypeOptions;
  onChangeText?: (text: string) => void;
};

export const ThemedTextInput: FC<InputProps> = ({
  label,
  value,
  defaultValue,
  disabled,
  onChangeText,
  className,
  inputClassName,
  multiline,
  autoFocus,
  keyboardType,
  onBlur,
  onFocus,
}) => {
  const [internalValue, setInternalValue] = useState(value || defaultValue);
  const [isFocused, setIsFocused] = useState(false);
  const labelPosition = useRef(
    new Animated.Value(internalValue ? 1 : 0),
  ).current;

  useEffect(() => {
    Animated.timing(labelPosition, {
      toValue: isFocused || internalValue ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [value, isFocused, labelPosition, defaultValue, internalValue]);

  const style = {
    top: labelPosition.interpolate({
      inputRange: [0, 1],
      outputRange: [19, -9],
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
          className="absolute left-4 z-10 -mx-1 bg-background px-1"
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
        keyboardType={keyboardType}
        className={twMerge(
          "w-full border-2 border-border rounded-xl flex py-5 px-4 text-foreground focus:border-blue-500",
          disabled && "bg-gray-50 dark:bg-neutral-900 text-foreground/60",
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
    </View>
  );
};

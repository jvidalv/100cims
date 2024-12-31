import React, { useState } from "react";
import { TextInput, View, Animated, Platform } from "react-native";
import { twMerge } from "tailwind-merge";

import { ThemedText } from "@/components/ui/atoms/themed-text";

type InputProps = {
  label: string;
  value?: string | null;
  disabled?: boolean;
  className?: string;
  onChangeText?: (text: string) => void;
};

export const ThemedTextInput: React.FC<InputProps> = ({
  label,
  value,
  disabled,
  onChangeText,
  className,
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [internalValue, setInternalValue] = useState(value);
  const isWeb = Platform.OS === "web";
  const labelPosition = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    if (isWeb) return;

    Animated.timing(labelPosition, {
      toValue: isFocused || !!internalValue ? 1 : 0, // Animate up when focused or value exists
      duration: 200,
      useNativeDriver: false, // For layout animations, `false` is necessary
    }).start();
  }, [isWeb, internalValue, isFocused, labelPosition, value]);

  const style = {
    top: labelPosition.interpolate({
      inputRange: [0, 1],
      outputRange: [19, -8],
    }),
    fontSize: labelPosition.interpolate({
      inputRange: [0, 1],
      outputRange: [16, 12],
    }),
  };

  return (
    <View className={twMerge("relative w-full h-fit", className)}>
      {isWeb ? (
        <ThemedText
          className={twMerge(
            "transition-all pointer-events-none absolute left-4 top-5 text-muted-foreground/50",
            (isFocused || internalValue) &&
              "text-muted-foreground top-[10px] text-xs",
          )}
        >
          {label}
        </ThemedText>
      ) : (
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
        className={twMerge(
          "w-full border-2 border-border rounded-xl flex py-5 px-4 text-foreground focus:border-blue-500",
          disabled && "bg-gray-50 dark:bg-neutral-900 text-foreground/60",
        )}
        style={{ fontSize: 16 }}
        defaultValue={!value ? undefined : value}
        onChangeText={(text) => {
          setInternalValue(text);
          onChangeText?.(text);
        }}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
      />
    </View>
  );
};

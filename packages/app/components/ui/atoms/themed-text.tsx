import React, { forwardRef } from "react";
import { Text, type TextProps } from "react-native";
import { twMerge } from "tailwind-merge";

const getFontSize = (className?: string) => {
  if (className?.includes("text-5xl")) return 40;
  if (className?.includes("text-4xl")) return 32;
  if (className?.includes("text-3xl")) return 28;
  if (className?.includes("text-2xl")) return 24;
  if (className?.includes("text-xl")) return 20;
  if (className?.includes("text-lg")) return 18;
  if (className?.includes("text-sm")) return 14;
  if (className?.includes("text-xs")) return 12;
  return 16;
};

export const ThemedText = forwardRef<Text, TextProps>(
  ({ className, style, ...props }, ref) => {
    return (
      <Text
        ref={ref}
        style={[{ fontSize: getFontSize(className) }, style]}
        selectable
        className={twMerge(
          "text-foreground",
          className
            ?.replace(/text-(5xl|4xl|3xl|2xl|xl|lg|base|sm|xs)/g, "")
            .trim(),
        )}
        {...props}
      />
    );
  },
);

ThemedText.displayName = "ThemedText";

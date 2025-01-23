import React, { forwardRef, useMemo } from "react";
import { Text, type TextProps } from "react-native";
import { twMerge } from "tailwind-merge";
import { tv, type VariantProps } from "tailwind-variants";

import { getFontFamily, getFontSize } from "@/lib/fonts";

export const textVariants = tv({
  base: "text-foreground",
});

export type TextVariantsProps = VariantProps<typeof textVariants>;

export const ThemedText = forwardRef<Text, TextProps & TextVariantsProps>(
  ({ className, style, ...props }, ref) => {
    const fontFamily = useMemo(() => {
      return getFontFamily(className);
    }, [className]);

    const fontSize = useMemo(() => {
      return getFontSize(className);
    }, [className]);

    return (
      <Text
        ref={ref}
        style={[{ fontFamily, fontSize }, style]}
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

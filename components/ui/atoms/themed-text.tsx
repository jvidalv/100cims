import { useMemo } from "react";
import { Text, type TextProps } from "react-native";
import { twMerge } from "tailwind-merge";
import { tv, type VariantProps } from "tailwind-variants";

import { getFontFamily, getFontSize } from "@/lib/fonts";

export const textVariants = tv({
  base: "text-foreground",
});

export type TextVariantsProps = VariantProps<typeof textVariants>;

export function ThemedText({
  className,
  style,
  ...props
}: TextProps & TextVariantsProps) {
  const fontFamily = useMemo(() => {
    return getFontFamily(className);
  }, [className]);

  const fontSize = useMemo(() => {
    return getFontSize(className);
  }, [className]);

  return (
    <Text
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
}

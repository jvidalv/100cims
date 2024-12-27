import { Text, type TextProps } from "react-native";

import { tv, type VariantProps } from "tailwind-variants";
import clsx from "clsx";
import { useMemo } from "react";
import { twMerge } from "tailwind-merge";
import { getFontFamily } from "@/lib/font-family";

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

  return (
    <Text
      style={[style, { fontFamily }]}
      className={twMerge("text-foreground", className)}
      {...props}
    />
  );
}

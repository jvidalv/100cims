import React, { FC, useState } from "react";
import { StyleProp, View, ViewStyle, Image } from "react-native";
import { twMerge } from "tailwind-merge";
import { tv } from "tailwind-variants";

import { ThemedText } from "@/components/ui/atoms/themed-text";

export type AvatarSize = "xs" | "sm" | "md" | "lg" | "xl";

interface AvatarProps {
  initials?: string;
  imageUrl?: string | null;
  className?: string;
  style?: StyleProp<ViewStyle>;
  size?: AvatarSize;
}

const avatarStyles = tv({
  base: "relative flex items-center justify-center overflow-hidden rounded-full",
  variants: {
    size: {
      xs: "size-8",
      sm: "size-10",
      md: "size-12",
      lg: "size-16",
      xl: "size-20",
    },
  },
  defaultVariants: {
    size: "md",
  },
});

export const Avatar: FC<AvatarProps> = ({
  initials,
  imageUrl,
  size = "md",
  className,
  style,
}) => {
  const [isImageError, setIsImageError] = useState(false);
  const [isImageLoading, setIsImageLoading] = useState(false);

  return (
    <View
      style={style}
      className={twMerge(
        avatarStyles({ size }),
        (!imageUrl || isImageError) && "bg-gray-400 ",
        className,
      )}
    >
      <ThemedText
        className={twMerge(
          "text-white font-bold",
          size === "xs" && "text-xs",
          size === "sm" && "text-sm",
          size === "md" && "text-base",
          size === "lg" && "text-lg",
          size === "xl" && "text-xl",
        )}
      >
        {initials?.toUpperCase()}
      </ThemedText>
      {imageUrl && !isImageError && (
        <View
          className={twMerge(
            "absolute size-full",
            isImageLoading && "opacity-0",
          )}
        >
          <Image
            source={{ uri: imageUrl }}
            className={twMerge("size-full flex-1 rounded-full")}
            onLoadEnd={() => setIsImageLoading(false)}
            onError={() => setIsImageError(true)}
          />
        </View>
      )}
    </View>
  );
};

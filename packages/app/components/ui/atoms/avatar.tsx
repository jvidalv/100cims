import { FC, useState } from "react";
import { StyleProp, View, ViewStyle } from "react-native";
import { twMerge } from "tailwind-merge";
import { tv } from "tailwind-variants";

import { Image } from "@/components/ui/atoms/image";
import { ThemedText } from "@/components/ui/atoms/themed-text";

export type AvatarSize = "xs" | "sm" | "md" | "lg" | "xl";
export type AvatarShape = "circle" | "square";

interface AvatarProps {
  initials?: string;
  imageUrl?: string | null;
  className?: string;
  style?: StyleProp<ViewStyle>;
  size?: AvatarSize;
  shape?: AvatarShape;
}

const avatarStyles = tv({
  base: "relative flex items-center justify-center overflow-hidden",
  variants: {
    size: {
      xs: "size-8",
      sm: "size-10",
      md: "size-12",
      lg: "size-16",
      xl: "size-20",
    },
    shape: {
      circle: "rounded-full",
      square: "rounded",
    },
  },
  defaultVariants: {
    size: "md",
    shape: "circle",
  },
});

export const Avatar: FC<AvatarProps> = ({
  initials,
  imageUrl,
  size = "md",
  shape = "circle",
  className,
  style,
}) => {
  const [isImageError, setIsImageError] = useState(false);
  const [isImageLoading, setIsImageLoading] = useState(!!imageUrl);

  return (
    <View
      style={style}
      className={twMerge(
        avatarStyles({ size, shape }),
        (!imageUrl || isImageError || isImageLoading) &&
          "bg-gray-400 dark:bg-gray-500",
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
            source={{ uri: imageUrl, cache: "force-cache" }}
            className={twMerge(
              "size-full flex-1",
              shape === "circle" ? "rounded-full" : "rounded",
            )}
            onLoadEnd={() => setIsImageLoading(false)}
            onError={() => setIsImageError(true)}
          />
        </View>
      )}
    </View>
  );
};

import React, { FC, useState } from "react";
import { StyleProp, View, ViewStyle } from "react-native";
import { Image } from "expo-image";
import { tv } from "tailwind-variants";
import clsx from "clsx";
import { ThemedText } from "@/components/ui/atoms/themed-text";
import { twMerge } from "tailwind-merge";

export type AvatarSize = "sm" | "md" | "lg" | "xl";

interface AvatarProps {
  name?: string;
  emoji?: string;
  imageUrl?: string;
  className?: string;
  style?: StyleProp<ViewStyle>;
  size?: AvatarSize;
}

const avatarStyles = tv({
  base: "rounded-full bg-gray-400 flex justify-center items-center overflow-hidden",
  variants: {
    size: {
      sm: "w-10 h-10",
      md: "w-12 h-12",
      lg: "w-16 h-16",
      xl: "w-20 h-20",
    },
  },
  defaultVariants: {
    size: "md",
  },
});

export const Avatar: FC<AvatarProps> = ({
  name,
  emoji,
  imageUrl,
  size = "md",
  className,
  style,
}) => {
  const [imageError, setImageError] = useState(false);

  const getInitials = (name?: string): string => {
    if (emoji) return emoji;
    if (!name) return "??";
    const words = name.split(" ");
    const initials = words
      .slice(0, 2)
      .map((word) => word[0])
      .join("");
    return initials.toUpperCase();
  };

  return (
    <View
      style={style}
      className={twMerge(
        avatarStyles({ size }),
        imageUrl && !imageError && "bg-background",
        className,
      )}
    >
      {imageUrl && !imageError ? (
        <Image
          source={imageUrl}
          placeholder={{ blurhash: `L~I64nWEWXaz_NWEWWazbvWBaxfQ` }}
          style={{
            flex: 1,
            width: "100%",
            height: "100%",
            borderRadius: "50%",
          }}
          onError={() => setImageError(true)}
        />
      ) : (
        <ThemedText
          className={clsx(
            "text-white font-bold",
            size === "sm" && "text-sm",
            size === "md" && "text-base",
            size === "lg" && "text-lg",
            size === "xl" && "text-xl",
          )}
        >
          {getInitials(name)}
        </ThemedText>
      )}
    </View>
  );
};

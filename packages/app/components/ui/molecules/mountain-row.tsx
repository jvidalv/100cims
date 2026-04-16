import { Camera } from "lucide-react-native";
import { forwardRef, ReactNode } from "react";
import { FormattedMessage } from "react-intl";
import { Image, TouchableOpacity, TouchableOpacityProps, View } from "react-native";
import { twMerge } from "tailwind-merge";

import { LucideIcon, ThemedText } from "@/components/ui/atoms";

type Props = {
  name: string;
  height?: string | number | null;
  essential?: boolean;
  imageUrl: string | null;
  trailing?: ReactNode;
} & TouchableOpacityProps;

export const MountainRow = forwardRef<View, Props>(
  (
    { name, height, essential, imageUrl, trailing, className, ...props },
    ref,
  ) => {
    return (
      <TouchableOpacity
        ref={ref}
        className={twMerge("flex-row items-center gap-3", className)}
        {...props}
      >
        {imageUrl ? (
          <Image
            source={{ uri: imageUrl, cache: "force-cache" }}
            className="size-12 rounded bg-neutral-300 dark:bg-neutral-800"
          />
        ) : (
          <View className="size-12 items-center justify-center rounded bg-neutral-300 dark:bg-neutral-800">
            <LucideIcon icon={Camera} color="white" muted size={18} />
          </View>
        )}
        <View className="flex-1">
          <ThemedText className="text-lg font-medium" numberOfLines={1}>
            {name}
          </ThemedText>
          {(height || essential) && (
            <ThemedText className="text-sm text-muted-foreground" numberOfLines={1}>
              {height ? `${height}m` : null}
              {height && essential ? " · " : null}
              {essential ? (
                <ThemedText className="text-sm font-semibold text-primary">
                  <FormattedMessage defaultMessage="essential" />
                </ThemedText>
              ) : null}
            </ThemedText>
          )}
        </View>
        {trailing && <View className="ml-auto">{trailing}</View>}
      </TouchableOpacity>
    );
  },
);

MountainRow.displayName = "MountainRow";

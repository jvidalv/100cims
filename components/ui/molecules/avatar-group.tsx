import { TouchableOpacity, View } from "react-native";
import { twMerge } from "tailwind-merge";

import { Avatar, AvatarSize } from "@/components/ui/atoms";
import { getInitials } from "@/lib/strings";

export const AvatarGroup = ({
  size = "md",
  limit = 4,
  items,
  avatarClassName,
  onPress,
}: {
  size?: AvatarSize;
  limit?: number;
  items: { name: string; imageUrl?: string | null }[];
  avatarClassName?: string;
  onPress?: (item: {
    name: string;
    imageUrl?: string | null;
    id?: string;
  }) => void;
}) => {
  const itemsMinusLimit = items?.length - limit;
  const isMoreItemsThanTheLimit = itemsMinusLimit > 0;
  const itemsSliced = items?.slice(0, limit);

  return (
    <View className="flex-row flex-wrap">
      {itemsSliced?.map((item, index) => (
        <TouchableOpacity
          key={index}
          style={{
            zIndex: 1000 - index,
            marginLeft: index ? -16 : 0,
          }}
          disabled={!onPress}
          onPress={() => onPress?.(item)}
        >
          <Avatar
            size={size}
            imageUrl={item.imageUrl}
            initials={getInitials(item.name)}
            className={twMerge("border border-background", avatarClassName)}
          />
        </TouchableOpacity>
      ))}
      {isMoreItemsThanTheLimit && (
        <Avatar
          size={size}
          initials={`+${itemsMinusLimit}`}
          className={twMerge("border border-background", avatarClassName)}
          style={{
            zIndex: 1000 - itemsSliced.length,
            marginLeft: itemsSliced.length ? -8 : 0,
          }}
        />
      )}
    </View>
  );
};

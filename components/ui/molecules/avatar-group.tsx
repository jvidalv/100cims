import { View } from "react-native";

import { Avatar, AvatarSize } from "@/components/ui/atoms";
import { getInitials } from "@/lib/strings";

export const AvatarGroup = ({
  size = "md",
  limit = 4,
  items,
}: {
  size?: AvatarSize;
  limit?: number;
  items: { name: string; imageUrl?: string | null }[];
}) => {
  const itemsMinusLimit = items?.length - limit;
  const isMoreItemsThanTheLimit = itemsMinusLimit > 0;
  const itemsSliced = items?.slice(0, limit);

  return (
    <View className="flex-row flex-wrap">
      {itemsSliced?.map((item, index) => (
        <Avatar
          key={item.name}
          size={size}
          imageUrl={item.imageUrl}
          initials={getInitials(item.name)}
          className="border-2 border-background"
          style={{
            zIndex: 1000 - index,
            marginLeft: index ? -16 : 0,
          }}
        />
      ))}
      {isMoreItemsThanTheLimit && (
        <Avatar
          size={size}
          initials={`+${itemsMinusLimit}`}
          className="border-2 border-background"
          style={{
            zIndex: 1000 - itemsSliced.length,
            marginLeft: itemsSliced.length ? -8 : 0,
          }}
        />
      )}
    </View>
  );
};

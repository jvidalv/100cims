import { View } from "react-native";

import { Avatar, AvatarSize } from "@/components/ui/atoms";
import { getInitials } from "@/lib/strings";

export const AvatarGroup = ({
  size = "md",
  items,
}: {
  size?: AvatarSize;
  items: { name: string; imageUrl?: string | null }[];
}) => {
  return (
    <View className="flex-row flex-wrap">
      {items.map((item, index) => (
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
    </View>
  );
};

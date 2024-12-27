import { Avatar, AvatarSize } from "@/components/ui/atoms";
import { View } from "react-native";

export const AvatarGroup = ({
  size = "md",
  items,
}: {
  size?: AvatarSize;
  items: { name: string; imageUrl?: string }[];
}) => {
  return (
    <View className="flex-wrap flex-row">
      {items.map((item, index) => (
        <Avatar
          key={item.name}
          size={size}
          imageUrl={item.imageUrl}
          name={item.name}
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

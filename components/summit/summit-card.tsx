import { format } from "date-fns/format";
import { Image, TouchableOpacity, View } from "react-native";
import { twMerge } from "tailwind-merge";

import { ThemedText } from "@/components/ui/atoms";
import { AvatarGroup } from "@/components/ui/molecules";
import { getFullName } from "@/domains/user/user.utils";

type SummitCardProps = {
  summit: {
    summitId: string;
    mountainName: string;
    summitImageUrl?: string;
    summitedImageUrl?: string;
    summitedAt: string;
    users?: {
      id: string;
      firstName: string | null;
      lastName: string | null;
      imageUrl: string | null;
    }[];
    participants?: {
      userId: string;
      firstName: string | null;
      lastName: string | null;
      imageUrl: string | null;
    }[];
  };
  index: number;
  onPress: () => void;
  onParticipantPress?: (userId: string) => void;
};

export function SummitCard({
  summit,
  index,
  onPress,
  onParticipantPress,
}: SummitCardProps) {
  const imageUrl = summit.summitImageUrl || summit.summitedImageUrl;

  // Normalize participants - handle both 'users' and 'participants' formats
  const participants =
    summit.users ||
    summit.participants?.map((p) => ({
      id: p.userId,
      firstName: p.firstName,
      lastName: p.lastName,
      imageUrl: p.imageUrl,
    })) ||
    [];

  return (
    <TouchableOpacity
      onPress={onPress}
      className={twMerge("relative w-1/2 mb-2", index % 2 !== 0 && "pl-1.5")}
    >
      <Image
        source={{ uri: imageUrl }}
        className="bg-neutral-200 dark:bg-neutral-800"
        style={{
          height: 200,
          width: "100%",
          borderTopRightRadius: 6,
          borderTopLeftRadius: 6,
        }}
      />
      <View className="flex-1 overflow-ellipsis w-full flex-row items-center justify-between gap-4 border border-t-0 border-gray-200 rounded-b-lg dark:border-0 dark:bg-neutral-800 p-2">
        <View className="flex-1">
          <View className="mb-0.5">
            <ThemedText
              numberOfLines={1}
              className="text-sm font-medium overflow-ellipsis"
            >
              {summit.mountainName}
            </ThemedText>
          </View>
          <View className="flex-row items-center justify-between gap-2">
            <ThemedText className="text-muted-foreground text-xs">
              {format(summit.summitedAt, "dd MMM yyyy")}
            </ThemedText>
          </View>
        </View>
        <AvatarGroup
          size="xs"
          items={participants.map((participant) => ({
            name: getFullName(participant),
            imageUrl: participant.imageUrl,
            id: participant.id,
          }))}
          onPress={
            onParticipantPress ? ({ id }) => onParticipantPress(id) : undefined
          }
        />
      </View>
    </TouchableOpacity>
  );
}

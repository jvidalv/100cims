import { useRouter } from "expo-router";
import { ChevronRight, Pencil } from "lucide-react-native";
import { useIntl } from "react-intl";
import { TouchableOpacity, View } from "react-native";

import { LucideIcon, ThemedText } from "@/components/ui/atoms";
import { MountainRow } from "@/components/ui/molecules/mountain-row";
import {
  openMountainPickerSession,
  type MountainPickerMountain,
} from "@/domains/mountain/mountain-picker-session";

type Props = {
  selected: MountainPickerMountain[];
  onChange: (mountains: MountainPickerMountain[]) => void;
};

export const MountainList = ({ selected, onChange }: Props) => {
  const intl = useIntl();
  const router = useRouter();

  const openPicker = () => {
    openMountainPickerSession({
      initial: selected,
      title: intl.formatMessage({ defaultMessage: "Edit mountains" }),
      onResult: onChange,
    });
    router.push("/plan/mountains/pick");
  };

  return (
    <View className="gap-3">
      {selected.map((m) => (
        <MountainRow
          key={m.id}
          name={m.name}
          height={m.height}
          essential={m.essential}
          imageUrl={m.imageUrl}
        />
      ))}
      <TouchableOpacity
        className="flex-row items-center gap-3"
        onPress={openPicker}
      >
        <View className="size-12 items-center justify-center rounded border-2 border-muted-foreground/50">
          <LucideIcon icon={Pencil} size={20} muted />
        </View>
        <ThemedText className="text-lg font-medium">
          {intl.formatMessage({ defaultMessage: "Edit mountains" })}
        </ThemedText>
        <View className="ml-auto">
          <LucideIcon icon={ChevronRight} size={20} muted />
        </View>
      </TouchableOpacity>
    </View>
  );
};

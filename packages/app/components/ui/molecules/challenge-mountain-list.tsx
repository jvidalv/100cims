import { useRouter } from "expo-router";
import { ChevronRight, Pencil } from "lucide-react-native";
import { FormattedMessage, useIntl } from "react-intl";
import { TouchableOpacity, View } from "react-native";

import { LucideIcon, ThemedText } from "@/components/ui/atoms";
import { MountainRow } from "@/components/ui/molecules/mountain-row";
import { openChallengeMountainPickerSession } from "@/domains/mountain/challenge-mountain-picker-session";
import { type MountainPickerMountain } from "@/domains/mountain/mountain-picker-session";

import type { NewMountainData } from "@/types/mountain";

type Props = {
  selected: MountainPickerMountain[];
  newMountains: NewMountainData[];
  onChange: (result: {
    selected: MountainPickerMountain[];
    newMountains: NewMountainData[];
  }) => void;
};

export const ChallengeMountainList = ({
  selected,
  newMountains,
  onChange,
}: Props) => {
  const intl = useIntl();
  const router = useRouter();

  const openPicker = () => {
    openChallengeMountainPickerSession({
      selected,
      newMountains,
      title: intl.formatMessage({ defaultMessage: "Edit mountains" }),
      onResult: onChange,
    });
    router.push("/challenge/mountains/pick");
  };

  return (
    <View className="gap-3">
      {newMountains.length > 0 && (
        <>
          <ThemedText className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            <FormattedMessage defaultMessage="Your mountains" />
          </ThemedText>
          {newMountains.map((m) => (
            <MountainRow
              key={m.tempId}
              name={m.name}
              height={m.height}
              essential={m.essential}
              imageUrl={m.imageUri ?? null}
            />
          ))}
        </>
      )}
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
        <LucideIcon icon={ChevronRight} size={20} muted className="ml-auto" />
      </TouchableOpacity>
    </View>
  );
};

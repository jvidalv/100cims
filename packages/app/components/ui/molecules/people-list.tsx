import { useRouter } from "expo-router";
import { ChevronRight, Pencil } from "lucide-react-native";
import { useIntl } from "react-intl";
import { TouchableOpacity, View } from "react-native";

import { ActivityIndicator, LucideIcon, ThemedText } from "@/components/ui/atoms";
import { PersonRow } from "@/components/ui/molecules/person-row";
import {
  openPeoplePickerSession,
  type PeoplePickerUser,
} from "@/domains/user/people-picker-session";
import { useUserPeople } from "@/domains/user/user.api";

type Props = {
  selected: PeoplePickerUser[];
  onChange: (users: PeoplePickerUser[]) => void;
  /** Defaults to 10. */
  maxSelected?: number;
  /** Defaults to false — the first selected user is locked (typically "me"). */
  firstSelectedRemovable?: boolean;
  /**
   * When true, the flat `selected` list is split into "in-people" and
   * "other participants" before opening the picker. Use on flows (plans)
   * where participants may include users not in the caller's people list.
   * Summit flows leave this false — their pickers only ever surface your
   * people.
   */
  splitNonPeople?: boolean;
};

/**
 * Vertical list of selected people + an "Edit people" row that routes to
 * the full-page picker. Used by the summit + plan edit forms.
 */
export const PeopleList = ({
  selected,
  onChange,
  maxSelected = 10,
  firstSelectedRemovable = false,
  splitNonPeople = false,
}: Props) => {
  const intl = useIntl();
  const router = useRouter();
  const { data: myPeople, isSuccess: peopleLoaded } = useUserPeople();

  // Disabling edit until people load avoids the edge case where the picker
  // would receive a mis-bucketed initial set (everyone as toggleable, no
  // extras). Only matters on very slow cold loads.
  const editDisabled = splitNonPeople && !peopleLoaded;

  const openPicker = () => {
    let initial = selected;
    let extras: PeoplePickerUser[] | undefined;

    if (splitNonPeople && myPeople) {
      const peopleIds = new Set(myPeople.map((p) => p.userId));
      initial = selected.filter(
        (u, i) => i === 0 || peopleIds.has(u.id),
      );
      extras = selected.filter(
        (u, i) => i !== 0 && !peopleIds.has(u.id),
      );
    }

    openPeoplePickerSession({
      initial,
      extras,
      firstSelectedRemovable,
      maxSelected,
      title: intl.formatMessage({ defaultMessage: "Edit people" }),
      onResult: onChange,
    });
    router.push("/user/people/pick");
  };

  return (
    <View className="gap-3">
      {selected.map((u) => (
        <PersonRow
          key={u.id}
          displayName={u.fullName}
          person={{
            firstName: null,
            lastName: null,
            imageUrl: u.imageUrl ?? null,
          }}
        />
      ))}
      <TouchableOpacity
        className="flex-row items-center gap-3"
        disabled={editDisabled}
        onPress={openPicker}
      >
        <View className="size-12 items-center justify-center rounded-full border-2 border-border">
          {editDisabled ? (
            <ActivityIndicator size="sm" />
          ) : (
            <LucideIcon icon={Pencil} size={20} muted />
          )}
        </View>
        <ThemedText className="text-lg font-medium">
          {intl.formatMessage({ defaultMessage: "Edit people" })}
        </ThemedText>
        <View className="ml-auto">
          <LucideIcon icon={ChevronRight} size={20} muted />
        </View>
      </TouchableOpacity>
    </View>
  );
};

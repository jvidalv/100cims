import { useLocalSearchParams, useRouter } from "expo-router";
import { Plus } from "lucide-react-native";
import { useEffect, useMemo, useState } from "react";
import { useIntl, FormattedMessage } from "react-intl";
import {
  Alert,
  View,
  ScrollView,
  TouchableOpacity,
  Keyboard,
  TouchableWithoutFeedback,
} from "react-native";


import {
  Button,
  LucideIcon,
  ThemedKeyboardAvoidingView,
  ThemedText,
  ThemedDateInput,
  ThemedTextInput,
} from "@/components/ui/atoms";
import {
  AvatarGroup,
  BottomDrawer,
  MountainSelectionDrawer,
  PeopleList,
  ScreenHeader,
} from "@/components/ui/molecules";
import { useMountains } from "@/domains/mountain/mountain.api";
import {
  usePlanDelete,
  usePlanOne,
  usePlanUpdate,
} from "@/domains/plan/plan.api";
import { type PeoplePickerUser } from "@/domains/user/people-picker-cache";
import { getFullName } from "@/domains/user/user.utils";

export default function PlanEditPage() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: planData } = usePlanOne({ id });
  const { data: mountainsData } = useMountains();
  const { mutateAsync: updatePlan, isPending: isPendingUpdate } =
    usePlanUpdate();
  const { mutateAsync: deletePlan } = usePlanDelete();

  const intl = useIntl();
  const router = useRouter();

  const plan = planData;
  const allMountains = useMemo(() => mountainsData ?? [], [mountainsData]);

  const [title, setTitle] = useState(plan?.title);
  const [description, setDescription] = useState(
    plan?.description || undefined,
  );
  const [date, setDate] = useState<Date | null>(
    plan?.startDate ? new Date(plan?.startDate) : null,
  );
  const [editingMountains, setEditingMountains] = useState(false);
  const [mountainIds, setMountainIds] = useState<string[]>([]);
  const [users, setUsers] = useState<PeoplePickerUser[]>([]);

  useEffect(() => {
    if (plan) {
      setTitle(plan.title);
      setDescription(plan.description ?? undefined);
      setDate(plan.startDate ? new Date(plan.startDate) : null);
      setMountainIds(plan.mountains?.map((m) => m.id) ?? []);

      // Ensure the creator is always first. PeopleList locks index 0, and
      // PeopleList's split treats index 0 as "keep in the toggleable bucket
      // no matter what" so the creator never lands in the non-people extras.
      const mapped: PeoplePickerUser[] = (plan.users ?? []).map((u) => ({
        id: u.id,
        fullName: getFullName(u),
        imageUrl: u.imageUrl,
      }));
      const creator = mapped.find((u) => u.id === plan.creatorId);
      const rest = mapped.filter((u) => u.id !== plan.creatorId);
      setUsers(creator ? [creator, ...rest] : mapped);
    }
  }, [plan]);

  const selectedMountains = useMemo(() => {
    return allMountains.filter((m) => mountainIds.includes(m.id));
  }, [mountainIds, allMountains]);

  const handleUpdate = async () => {
    if (!title?.trim()) {
      return Alert.alert(
        intl.formatMessage({ defaultMessage: "Title is required" }),
      );
    }

    const response = await updatePlan({
      id,
      title,
      description,
      startDate: date ? date.toISOString() : undefined,
      mountainIds,
      userIds: users.map((u) => u.id),
    });

    if (response.success) router.dismiss();
    else
      Alert.alert(
        intl.formatMessage({ defaultMessage: "Something went wrong" }),
      );
  };

  const handleDelete = () => {
    Alert.alert(
      intl.formatMessage({ defaultMessage: "Delete plan?" }),
      intl.formatMessage({ defaultMessage: "This cannot be undone." }),
      [
        {
          text: intl.formatMessage({ defaultMessage: "Cancel" }),
          style: "cancel",
        },
        {
          text: intl.formatMessage({ defaultMessage: "Delete" }),
          style: "destructive",
          onPress: async () => {
            await deletePlan({ id });
            router.dismissTo("/plans");
          },
        },
      ],
    );
  };

  const handleCancel = () => {
    Alert.alert(
      intl.formatMessage({ defaultMessage: "Cancel this plan?" }),
      intl.formatMessage({ defaultMessage: "Participants will be notified." }),
      [
        {
          text: intl.formatMessage({ defaultMessage: "Keep" }),
          style: "cancel",
        },
        {
          text: intl.formatMessage({ defaultMessage: "Cancel plan" }),
          style: "destructive",
          onPress: async () => {
            await updatePlan({
              id,
              status: "canceled",
            });
            router.dismiss();
          },
        },
      ],
    );
  };

  if (!plan) return null;

  return (
    <TouchableWithoutFeedback onPress={() => Keyboard.dismiss()}>
      <View className="flex-1">
        <ScreenHeader>
          <FormattedMessage defaultMessage="Updating plan" />
        </ScreenHeader>
        <ThemedKeyboardAvoidingView>
          <ScrollView
            className="p-6"
            keyboardShouldPersistTaps="handled"
            contentContainerClassName="gap-4 pb-24"
          >
            <ThemedTextInput
              label={intl.formatMessage({ defaultMessage: "Activity title" })}
              value={title}
              onChangeText={setTitle}
            />
            <ThemedTextInput
              label={intl.formatMessage({ defaultMessage: "Extra info" })}
              multiline
              value={description}
              onChangeText={setDescription}
            />
            <ThemedDateInput
              value={date}
              onDateValid={(date) => setDate(date)}
              noPastDates
            />

            <View className="mb-2">
              <ThemedText className="mb-2 text-lg font-medium">
                <FormattedMessage defaultMessage="Mountains" />
              </ThemedText>
              <TouchableOpacity
                onPress={() => setEditingMountains(true)}
                className="flex-row items-center justify-between gap-4 rounded border-2 border-border px-4 py-2"
              >
                {!!selectedMountains?.length ? (
                  <AvatarGroup
                    limit={6}
                    items={selectedMountains.map((m) => ({
                      name: m.name,
                      imageUrl: m.imageUrl,
                    }))}
                  />
                ) : (
                  <View className="h-8" />
                )}
                <View className="size-10 items-center justify-center rounded bg-muted-foreground/30 shadow">
                  <LucideIcon icon={Plus} color="white" size={16} />
                </View>
              </TouchableOpacity>
            </View>

            <View className="mb-2 gap-3">
              <ThemedText className="text-lg font-medium">
                <FormattedMessage defaultMessage="Participants" />
              </ThemedText>
              <PeopleList
                selected={users}
                onChange={setUsers}
                firstSelectedRemovable={false}
                splitNonPeople
              />
            </View>
            <Button
              className="mt-6"
              intent="success"
              onPress={handleUpdate}
              isLoading={isPendingUpdate}
            >
              <FormattedMessage defaultMessage="Update" />
            </Button>
            <Button intent="outline" onPress={() => router.dismiss()}>
              <FormattedMessage defaultMessage="Close" />
            </Button>
            <View className="flex-row items-center justify-center">
              <TouchableOpacity onPress={handleCancel} className="px-2 py-4">
                <ThemedText className="text-muted-foreground">
                  <FormattedMessage defaultMessage="Cancel" />
                </ThemedText>
              </TouchableOpacity>
              <ThemedText className="text-muted-foreground/50">
                <FormattedMessage defaultMessage="or" />
              </ThemedText>
              <TouchableOpacity onPress={handleDelete} className="px-2 py-4">
                <ThemedText className="text-muted-foreground">
                  <FormattedMessage defaultMessage="Delete" />
                </ThemedText>
              </TouchableOpacity>
            </View>
          </ScrollView>
          <BottomDrawer
            isOpen={editingMountains}
            onRequestClose={() => setEditingMountains(false)}
          >
            <MountainSelectionDrawer
              selectedIds={mountainIds}
              onSelectionChange={setMountainIds}
            />
          </BottomDrawer>
        </ThemedKeyboardAvoidingView>
      </View>
    </TouchableWithoutFeedback>
  );
}


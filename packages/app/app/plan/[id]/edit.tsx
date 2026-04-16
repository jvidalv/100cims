import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { useIntl, FormattedMessage } from "react-intl";
import {
  Alert,
  View,
  ScrollView,
  Keyboard,
  TouchableWithoutFeedback,
} from "react-native";
import { Ban, Check, Trash2, X } from "lucide-react-native";


import {
  ActivityIndicator,
  ThemedKeyboardAvoidingView,
  ThemedText,
  ThemedDateInput,
  ThemedTextInput,
} from "@/components/ui/atoms";
import {
  ActionRow,
  MountainList,
  PeopleList,
  ScreenHeader,
} from "@/components/ui/molecules";
import {
  type MountainPickerMountain,
  toPickerMountain,
} from "@/domains/mountain/mountain-picker-session";
import { useMountains } from "@/domains/mountain/mountain.api";
import {
  usePlanDelete,
  usePlanOne,
  usePlanUpdate,
} from "@/domains/plan/plan.api";
import { type PeoplePickerUser } from "@/domains/user/people-picker-session";
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
  const [mountains, setMountains] = useState<MountainPickerMountain[]>([]);
  const [users, setUsers] = useState<PeoplePickerUser[]>([]);

  useEffect(() => {
    if (plan) {
      setTitle(plan.title);
      setDescription(plan.description ?? undefined);
      setDate(plan.startDate ? new Date(plan.startDate) : null);

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

  // Seed mountains once both the plan and the catalog are available. The
  // catalog has `staleTime: 10h`, so re-runs after initial seed are rare — a
  // `seeded` guard prevents a late refetch from wiping user edits.
  const [seededMountains, setSeededMountains] = useState(false);
  useEffect(() => {
    if (seededMountains || !plan || allMountains.length === 0) return;
    const planMountainIds = new Set(plan.mountains?.map((m) => m.id) ?? []);
    setMountains(
      allMountains.filter((m) => planMountainIds.has(m.id)).map(toPickerMountain),
    );
    setSeededMountains(true);
  }, [plan, allMountains, seededMountains]);

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
      mountainIds: mountains.map((m) => m.id),
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
              inputClassName="h-[120px]"
            />
            <ThemedDateInput
              value={date}
              onDateValid={(date) => setDate(date)}
              noPastDates
            />

            <View className="mb-2 gap-3">
              <ThemedText className="text-lg font-medium">
                <FormattedMessage defaultMessage="Mountains" />
              </ThemedText>
              <MountainList selected={mountains} onChange={setMountains} />
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
            <View className="mt-6">
              <ActionRow
                icon={Check}
                size="lg"
                intent="emerald"
                onPress={handleUpdate}
                disabled={isPendingUpdate}
                iconOverride={
                  isPendingUpdate ? <ActivityIndicator /> : undefined
                }
              >
                <FormattedMessage defaultMessage="Update" />
              </ActionRow>
              <ActionRow
                icon={X}
                size="lg"
                onPress={() => router.dismiss()}
              >
                <FormattedMessage defaultMessage="Close" />
              </ActionRow>
              <ActionRow
                icon={Ban}
                size="lg"
                intent="danger"
                onPress={handleCancel}
              >
                <FormattedMessage defaultMessage="Cancel" />
              </ActionRow>
              <ActionRow
                icon={Trash2}
                size="lg"
                intent="danger"
                onPress={handleDelete}
              >
                <FormattedMessage defaultMessage="Delete" />
              </ActionRow>
            </View>
          </ScrollView>
        </ThemedKeyboardAvoidingView>
      </View>
    </TouchableWithoutFeedback>
  );
}


import { nextSunday } from "date-fns/nextSunday";
import { useGlobalSearchParams, useRouter } from "expo-router";
import { Check, Trash2, X } from "lucide-react-native";
import { useEffect, useMemo, useState } from "react";
import { useIntl, FormattedMessage } from "react-intl";
import {
  Alert,
  View,
  ScrollView,
  Keyboard,
  TouchableWithoutFeedback,
} from "react-native";


import {
  ActivityIndicator,
  ThemedKeyboardAvoidingView,
  ThemedText,
  ThemedDateInput,
  ThemedSwitch,
  ThemedTextInput,
  ThemedTimeInput,
} from "@/components/ui/atoms";
import { ThemedCheckbox } from "@/components/ui/atoms/themed-checkbox";
import {
  ActionRow,
  MountainList,
  PeopleList,
  PlanTypeChips,
  ScreenHeader,
} from "@/components/ui/molecules";
import {
  type MountainPickerMountain,
  toPickerMountain,
} from "@/domains/mountain/mountain-picker-session";
import { useMountains } from "@/domains/mountain/mountain.api";
import {
  type PlanType,
  usePlanDelete,
  usePlanOne,
  usePlanUpdate,
} from "@/domains/plan/plan.api";
import { type PeoplePickerUser } from "@/domains/user/people-picker-session";
import { getFullName } from "@/domains/user/user.utils";
import { parseLocalDateString, toLocalDateString } from "@/lib/dates";

const PLAN_TYPES: readonly PlanType[] = ["hike", "trail", "bike"];
const toPlanType = (value: string | null | undefined): PlanType | null => {
  if (!value) return null;
  return PLAN_TYPES.find((t) => t === value) ?? null;
};

export default function PlanEditPage() {
  // useGlobalSearchParams (not useLocal-) — inside a NativeTabs eagerly-mounted
  // child of [id], useLocalSearchParams doesn't bind the parent dynamic.
  const { id } = useGlobalSearchParams<{ id: string }>();
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
    plan?.startDate ? parseLocalDateString(plan.startDate) : null,
  );
  const [startTime, setStartTime] = useState<string | null>(
    plan?.startTime ?? null,
  );
  const [type, setType] = useState<PlanType>(toPlanType(plan?.type) ?? "hike");
  const [mountains, setMountains] = useState<MountainPickerMountain[]>([]);
  const [users, setUsers] = useState<PeoplePickerUser[]>([]);
  const [isPrivate, setIsPrivate] = useState(plan?.isPrivate ?? false);

  useEffect(() => {
    if (plan) {
      setTitle(plan.title);
      setDescription(plan.description ?? undefined);
      setDate(plan.startDate ? parseLocalDateString(plan.startDate) : null);
      setStartTime(plan.startTime ?? null);
      setType(toPlanType(plan.type) ?? "hike");
      setIsPrivate(plan.isPrivate ?? false);

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
      startDate: date ? toLocalDateString(date) : undefined,
      startTime: date ? startTime : null,
      type,
      mountainIds: seededMountains ? mountains.map((m) => m.id) : undefined,
      userIds: users.map((u) => u.id),
      isPrivate,
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
      intl.formatMessage({
        defaultMessage: "Participants will be notified. This cannot be undone.",
      }),
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

  if (!plan) return null;

  return (
    <TouchableWithoutFeedback onPress={() => Keyboard.dismiss()}>
      <View className="flex-1">
        <ScreenHeader>
          <FormattedMessage defaultMessage="Updating plan" />
        </ScreenHeader>
        <ThemedKeyboardAvoidingView>
          <ScrollView
            keyboardShouldPersistTaps="handled"
            contentContainerClassName="gap-6 px-6 pt-6 pb-24"
          >
            <View className="gap-4">
              <ThemedText className="text-lg font-medium">
                <FormattedMessage defaultMessage="Information" />
              </ThemedText>
              <ThemedTextInput
                label={intl.formatMessage({ defaultMessage: "Activity title" })}
                value={title}
                onChangeText={setTitle}
              />
              <PlanTypeChips value={type} onChange={setType} />
              <ThemedTextInput
                label={intl.formatMessage({ defaultMessage: "Extra info" })}
                multiline
                value={description}
                onChangeText={setDescription}
                inputClassName="h-[120px]"
              />
              <ThemedSwitch
                label={intl.formatMessage({ defaultMessage: "Private plan" })}
                description={intl.formatMessage({
                  defaultMessage: "Only invited members can see it",
                })}
                checked={isPrivate}
                onChecked={setIsPrivate}
              />
            </View>
            <View className="gap-4">
              <ThemedText className="text-lg font-medium">
                <FormattedMessage defaultMessage="Date" />
              </ThemedText>
              <ThemedDateInput
                value={date}
                onDateValid={(date) => setDate(date)}
                noPastDates
              />
              <ThemedCheckbox
                checked={!date}
                onChecked={(checked) => {
                  if (checked) {
                    setDate(null);
                    setStartTime(null);
                  } else {
                    setDate(nextSunday(new Date()));
                  }
                }}
                label={intl.formatMessage({
                  defaultMessage: "I don't know exactly when.",
                })}
              />
              {date && (
                <ThemedTimeInput value={startTime} onChange={setStartTime} />
              )}
            </View>

            <View className="gap-4">
              <ThemedText className="text-lg font-medium">
                <FormattedMessage defaultMessage="Mountains" />
              </ThemedText>
              <MountainList selected={mountains} onChange={setMountains} />
            </View>

            <View className="gap-4">
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


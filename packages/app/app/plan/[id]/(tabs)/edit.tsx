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
  Pressable,
  Switch,
  TouchableWithoutFeedback,
} from "react-native";


import {
  ActivityIndicator,
  ThemedKeyboardAvoidingView,
  ThemedText,
  ThemedDateInput,
  ThemedTextInput,
  ThemedTimeInput,
} from "@/components/ui/atoms";
import { ThemedCheckbox } from "@/components/ui/atoms/themed-checkbox";
import {
  ActionRow,
  MountainList,
  PeopleList,
  PlanCoverPicker,
  PlanTypeChips,
  ScreenHeader,
} from "@/components/ui/molecules";
import { Colors } from "@/constants/colors";
import {
  type MountainPickerMountain,
  toPickerMountain,
} from "@/domains/mountain/mountain-picker-session";
import { useMountains } from "@/domains/mountain/mountain.api";
import {
  invalidUrlMessage,
  isInvalidUrlError,
  isValidStravaUrl,
  isValidWhatsappGroupUrl,
  isValidWikilocUrl,
} from "@/domains/plan/plan-link-urls";
import {
  type PlanType,
  usePlanDelete,
  usePlanOne,
  usePlanUpdate,
} from "@/domains/plan/plan.api";
import { type PeoplePickerUser } from "@/domains/user/people-picker-session";
import { getFullName } from "@/domains/user/user.utils";
import { parseLocalDateString, toLocalDateString } from "@/lib/dates";
import { IMAGE_TO_BIG } from "@/lib/error-codes";

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
  const [whatsappGroupUrl, setWhatsappGroupUrl] = useState(
    plan?.whatsappGroupUrl ?? "",
  );
  const [wikilocUrl, setWikilocUrl] = useState(plan?.wikilocUrl ?? "");
  const [stravaUrl, setStravaUrl] = useState(plan?.stravaUrl ?? "");
  // `imagePreview` shows what's currently on the row (URL for existing,
  // local URI for a freshly-picked image). `imageBase64` is set only when
  // the user picked something new — null/undefined means "leave alone";
  // setting `imagePreview` to null without a base64 means "clear".
  const [imagePreview, setImagePreview] = useState<string | null>(
    plan?.imageUrl ?? null,
  );
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  // Distinguish "user cleared the existing image" (need to send null on
  // submit) from "no change yet" (omit from body).
  const [imageCleared, setImageCleared] = useState(false);

  useEffect(() => {
    if (plan) {
      setTitle(plan.title);
      setDescription(plan.description ?? undefined);
      setDate(plan.startDate ? parseLocalDateString(plan.startDate) : null);
      setStartTime(plan.startTime ?? null);
      setType(toPlanType(plan.type) ?? "hike");
      setIsPrivate(plan.isPrivate ?? false);
      setWhatsappGroupUrl(plan.whatsappGroupUrl ?? "");
      setWikilocUrl(plan.wikilocUrl ?? "");
      setStravaUrl(plan.stravaUrl ?? "");
      setImagePreview(plan.imageUrl ?? null);
      setImageBase64(null);
      setImageCleared(false);

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

    if (!isValidWhatsappGroupUrl(whatsappGroupUrl)) {
      return Alert.alert(
        intl.formatMessage({
          defaultMessage:
            "The WhatsApp group link doesn't look right. Must point to chat.whatsapp.com or wa.me.",
        }),
      );
    }
    if (!isValidWikilocUrl(wikilocUrl)) {
      return Alert.alert(
        intl.formatMessage({
          defaultMessage:
            "The Wikiloc link doesn't look right. Must point to wikiloc.com.",
        }),
      );
    }
    if (!isValidStravaUrl(stravaUrl)) {
      return Alert.alert(
        intl.formatMessage({
          defaultMessage:
            "The Strava link doesn't look right. Must point to strava.com.",
        }),
      );
    }

    // Submit the image only on actual user intent: a fresh pick sends the
    // base64; an explicit clear sends null; otherwise omit and the server
    // leaves the column alone.
    const imageUrlForBody: string | null | undefined = imageBase64
      ? imageBase64
      : imageCleared
        ? null
        : undefined;

    let response;
    try {
      response = await updatePlan({
        id,
        title,
        description,
        startDate: date ? toLocalDateString(date) : undefined,
        startTime: date ? startTime : null,
        type,
        mountainIds: seededMountains ? mountains.map((m) => m.id) : undefined,
        userIds: users.map((u) => u.id),
        isPrivate,
        whatsappGroupUrl: whatsappGroupUrl || null,
        wikilocUrl: wikilocUrl || null,
        stravaUrl: stravaUrl || null,
        imageUrl: imageUrlForBody,
      });
    } catch (e) {
      if (isInvalidUrlError(e)) {
        return Alert.alert(invalidUrlMessage(e.field, intl));
      }
      if (
        e &&
        typeof e === "object" &&
        (e as { error?: string }).error === IMAGE_TO_BIG
      ) {
        return Alert.alert(
          intl.formatMessage({ defaultMessage: "Image too big." }),
        );
      }
      return Alert.alert(
        intl.formatMessage({ defaultMessage: "Something went wrong" }),
      );
    }

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
              <PlanCoverPicker
                imagePreview={imagePreview}
                onPicked={(preview, base64) => {
                  setImagePreview(preview);
                  setImageBase64(base64);
                  setImageCleared(false);
                }}
                onCleared={() => {
                  setImagePreview(null);
                  setImageBase64(null);
                  setImageCleared(true);
                }}
                mountains={mountains.map((m) => ({ imageUrl: m.imageUrl }))}
                title={title ?? ""}
              />
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
              <Pressable
                onPress={() => setIsPrivate(!isPrivate)}
                className="flex-row items-center justify-between"
              >
                <ThemedText className="text-lg text-foreground">
                  <FormattedMessage defaultMessage="Private" />
                </ThemedText>
                <Switch
                  value={isPrivate}
                  onValueChange={setIsPrivate}
                  trackColor={{ true: Colors.light.primary }}
                />
              </Pressable>
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
                <FormattedMessage defaultMessage="Links" />
              </ThemedText>
              <ThemedTextInput
                label={intl.formatMessage({
                  defaultMessage: "WhatsApp group",
                })}
                value={whatsappGroupUrl}
                onChangeText={setWhatsappGroupUrl}
                autoCapitalize="none"
                keyboardType="url"
                error={
                  isValidWhatsappGroupUrl(whatsappGroupUrl)
                    ? undefined
                    : intl.formatMessage({
                        defaultMessage: "Doesn't look like a valid link.",
                      })
                }
              />
              <ThemedTextInput
                label={intl.formatMessage({ defaultMessage: "Wikiloc trail" })}
                value={wikilocUrl}
                onChangeText={setWikilocUrl}
                autoCapitalize="none"
                keyboardType="url"
                error={
                  isValidWikilocUrl(wikilocUrl)
                    ? undefined
                    : intl.formatMessage({
                        defaultMessage: "Doesn't look like a valid link.",
                      })
                }
              />
              <ThemedTextInput
                label={intl.formatMessage({ defaultMessage: "Strava" })}
                value={stravaUrl}
                onChangeText={setStravaUrl}
                autoCapitalize="none"
                keyboardType="url"
                error={
                  isValidStravaUrl(stravaUrl)
                    ? undefined
                    : intl.formatMessage({
                        defaultMessage: "Doesn't look like a valid link.",
                      })
                }
              />
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


import { nextSunday } from "date-fns/nextSunday";
import { useRouter, Redirect } from "expo-router";
import { Check, Heart, Lock, MessageCircle, Users } from "lucide-react-native";
import { memo, useCallback, useEffect, useMemo, useState } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import {
  Alert,
  FlatList,
  Keyboard,
  ScrollView,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { twMerge } from "tailwind-merge";

import { useAuth } from "@/components/providers/auth-provider";
import {
  BlurView,
  Button,
  LucideIcon,
  SearchInput,
  ThemedText,
  ThemedTextInput,
  ThemedToggleInput,
  ThemedView,
} from "@/components/ui/atoms";
import { ThemedCheckbox } from "@/components/ui/atoms/themed-checkbox";
import { ThemedDateInput } from "@/components/ui/atoms/themed-date-input";
import { ThemedTimeInput } from "@/components/ui/atoms/themed-time-input";
import {
  BlurredScreenHeader,
  BLURRED_SCREEN_HEADER_HEIGHT,
  PeopleList,
  PlanTypeChips,
} from "@/components/ui/molecules";
import { MountainItemListAsTouchable } from "@/components/ui/molecules/mountain-item-list";
import { useMountains } from "@/domains/mountain/mountain.api";
import {
  type PlanType,
  useMarkPlansAsVisited,
  usePlanCreate,
} from "@/domains/plan/plan.api";
import { type PeoplePickerUser } from "@/domains/user/people-picker-session";
import { useUserMe } from "@/domains/user/user.api";
import { getFullName } from "@/domains/user/user.utils";
import { useIsKeyboardVisible } from "@/hooks/use-is-keyboard-visible";
import { cleanText } from "@/lib";
import { toLocalDateString } from "@/lib/dates";
import { getLocale } from "@/lib/locale";

const StartStep = () => {
  return (
    <View className="flex-1" style={{ paddingTop: BLURRED_SCREEN_HEADER_HEIGHT + 16 }}>
      <View className="gap-2">
        <View className="gap-1 rounded border border-border p-4">
          <View className="flex-row items-center gap-2">
            <LucideIcon icon={Heart} size={16} primary />
            <ThemedText className="font-medium">
              <FormattedMessage defaultMessage="Not mandatory" />
            </ThemedText>
          </View>
          <ThemedText className="text-muted-foreground ">
            <FormattedMessage defaultMessage="Plans can be deleted later without any obligation." />
          </ThemedText>
        </View>
        <View className="gap-1 rounded border border-border p-4">
          <View className="flex-row items-center gap-2">
            <LucideIcon icon={Users} size={16} primary />
            <ThemedText className="font-medium">
              <FormattedMessage defaultMessage="You have total control over it" />
            </ThemedText>
          </View>
          <ThemedText className="text-muted-foreground ">
            <FormattedMessage defaultMessage="You decide who comes, don't worry about removing users that joined if you feel like it." />
          </ThemedText>
        </View>
        <View className="gap-1 rounded border border-border p-4">
          <View className="flex-row items-center gap-2">
            <LucideIcon icon={MessageCircle} size={16} primary />
            <ThemedText className="font-medium">
              <FormattedMessage defaultMessage="Chat within plans" />
            </ThemedText>
          </View>
          <ThemedText className="text-muted-foreground">
            <FormattedMessage defaultMessage="Plans have an internal chat, but we recommend that you all share your phone number once ready." />
          </ThemedText>
        </View>
        <View className="gap-1 rounded border border-border p-4">
          <View className="flex-row items-center gap-2">
            <LucideIcon icon={Lock} size={16} primary />
            <ThemedText className="font-medium">
              <FormattedMessage defaultMessage="Keep it private if you want" />
            </ThemedText>
          </View>
          <ThemedText className="text-muted-foreground">
            <FormattedMessage defaultMessage="Plans can now be private — only the people you invite will see them." />
          </ThemedText>
        </View>
      </View>
    </View>
  );
};

const MountainsStep = memo(
  ({
    value,
    onMountainsChange,
  }: {
    value: string[];
    onMountainsChange: (mountains: string[]) => void;
  }) => {
    const { data } = useMountains();
    const [query, setQuery] = useState("");

    const queriedMountains = useMemo(() => {
      const mountains = data;

      if (!mountains) return [];

      const filtered = !query
        ? mountains
        : mountains.filter(({ name, location }) =>
            cleanText(`${name} ${location}`)
              .toLowerCase()
              .includes(cleanText(query).toLowerCase()),
          );

      return filtered.sort((a, b) => {
        const aSelected = value.includes(a.id) ? 0 : 1;
        const bSelected = value.includes(b.id) ? 0 : 1;
        return aSelected - bSelected;
      });
    }, [query, data, value]);

    return (
      <View className="flex-1">
        <FlatList
          data={queriedMountains}
          initialNumToRender={10}
          stickyHeaderIndices={[0]}
          scrollEventThrottle={16}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{
            paddingTop: BLURRED_SCREEN_HEADER_HEIGHT + 16,
          }}
          getItemLayout={(_, index) => ({
            length: 100,
            offset: 100 * index,
            index,
          })}
          ListHeaderComponent={
            <ThemedView className="z-20 pb-2">
              <SearchInput
                onChangeText={(text) => {
                  setQuery(text);
                }}
              />
            </ThemedView>
          }
          ListFooterComponent={<View className="h-32" />}
          keyExtractor={({ id }) => id}
          renderItem={({
            item: { id, name, slug, essential, location, height, imageUrl },
          }) => {
            const isSelected = value.includes(id);

            return (
              <View className="relative py-2">
                <MountainItemListAsTouchable
                  onPress={() => {
                    const updated = isSelected
                      ? value.filter((v) => v !== id)
                      : [...value, id];
                    onMountainsChange(updated);
                  }}
                  name={name}
                  location={location}
                  imageUrl={imageUrl}
                  essential={essential}
                  slug={slug}
                  height={height}
                />
                {isSelected && (
                  <View
                    className="pointer-events-none absolute left-0 top-2 items-center justify-center overflow-hidden"
                    style={{ width: 100, height: 100, borderRadius: 6 }}
                  >
                    <View className="absolute size-full bg-blue-500 opacity-50" />
                    <LucideIcon icon={Check} size={32} color="white" />
                  </View>
                )}
              </View>
            );
          }}
        />
      </View>
    );
  },
);

MountainsStep.displayName = "MountainsStep";

const nextSundayDate = nextSunday(new Date());

type DetailsValues = {
  title: string;
  description?: string;
  date?: Date | null;
  startTime?: string | null;
  type: PlanType;
  isPrivate: boolean;
};

const DetailsStep = ({
  values,
  onDetailsChange,
}: {
  values: DetailsValues;
  onDetailsChange: (values: DetailsValues) => void;
}) => {
  const intl = useIntl();
  return (
    <ScrollView
      className="flex-1"
      contentContainerStyle={{
        gap: 24,
        paddingBottom: 32,
        paddingTop: BLURRED_SCREEN_HEADER_HEIGHT + 16,
      }}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <ThemedTextInput
        label="Your activity"
        value={values.title}
        onChangeText={(title) => onDetailsChange({ ...values, title })}
      />
      <ThemedTextInput
        label="Extra information about your plan"
        multiline
        value={values.description}
        inputClassName="h-[140px]"
        onChangeText={(description) =>
          onDetailsChange({ ...values, description })
        }
      />
      <PlanTypeChips
        value={values.type}
        onChange={(type) => onDetailsChange({ ...values, type })}
      />
      <ThemedToggleInput
        label={intl.formatMessage({ defaultMessage: "Private plan" })}
        checked={values.isPrivate}
        onChecked={(isPrivate) => onDetailsChange({ ...values, isPrivate })}
      />
      <View className="gap-4">
        <ThemedDateInput
          value={values.date}
          onDateValid={(date) => onDetailsChange({ ...values, date })}
          noPastDates
        />
        <ThemedCheckbox
          checked={!values.date}
          onChecked={(checked) => {
            if (checked) {
              onDetailsChange({ ...values, date: null, startTime: null });
            } else {
              onDetailsChange({ ...values, date: nextSundayDate });
            }
          }}
          label={intl.formatMessage({
            defaultMessage: "I don't know exactly when.",
          })}
        />
        {values.date && (
          <ThemedTimeInput
            value={values.startTime}
            onChange={(startTime) => onDetailsChange({ ...values, startTime })}
          />
        )}
      </View>
    </ScrollView>
  );
};

const PeopleStep = ({
  value,
  onPeopleChange,
}: {
  value: PeoplePickerUser[];
  onPeopleChange: (users: PeoplePickerUser[]) => void;
}) => {
  return (
    <View
      className="flex-1"
      style={{ paddingTop: BLURRED_SCREEN_HEADER_HEIGHT + 16 }}
    >
      <PeopleList
        selected={value}
        onChange={onPeopleChange}
        firstSelectedRemovable={false}
      />
    </View>
  );
};

const buildTitleFromMountains = (
  mountainsIds: string[],
  allMountains: { id: string; name: string; height: string }[],
): string => {
  const locale = getLocale();
  const selected = allMountains.filter((m) => mountainsIds.includes(m.id));

  if (!selected.length) return "";

  const sorted = selected.sort(
    (a, b) => parseInt(b.height) - parseInt(a.height),
  );
  const top = sorted[0].name;
  const count = selected.length - 1;

  if (selected.length === 2 && sorted[1].name.length <= 15) {
    const second = sorted[1].name;
    if (locale === "ca") return `Pujada al ${top} i ${second}`;
    if (locale === "es") return `Subida al ${top} y ${second}`;
    return `Summit ${top} and ${second}`;
  }

  if (count === 0) {
    if (locale === "ca") return `Pujada al ${top}`;
    if (locale === "es") return `Subida al ${top}`;
    return `Summit ${top}`;
  }

  if (locale === "ca") return `Pujada al ${top} i ${count} més`;
  if (locale === "es") return `Subida al ${top} y ${count} más`;
  return `Summit ${top} and ${count} more`;
};

type Step = "mountains" | "details" | "people" | "start";

const stepOrder = ["start", "mountains", "details", "people"] as const;

export default function PlanCreatePage() {
  const router = useRouter();
  const intl = useIntl();
  const { isAuthenticated } = useAuth();
  const [step, setStep] = useState<Step>(stepOrder[0]);

  const [date, setDate] = useState<Date | null | undefined>(nextSundayDate);
  const [startTime, setStartTime] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [mountains, setMountains] = useState<string[]>([]);
  const [type, setType] = useState<PlanType>("hike");
  const [isPrivate, setIsPrivate] = useState(false);
  const [users, setUsers] = useState<PeoplePickerUser[]>([]);

  const { data: me } = useUserMe();

  useEffect(() => {
    if (!me) return;
    setUsers((current) => {
      if (current.some((u) => u.id === me.id)) return current;
      const meUser: PeoplePickerUser = {
        id: me.id,
        fullName: getFullName(me),
        imageUrl: me.imageUrl,
      };
      return [meUser, ...current];
    });
  }, [me]);

  const { mutateAsync, isPending } = usePlanCreate();
  const { mutateAsync: markAsVisited } = useMarkPlansAsVisited();

  const stepTitles: Record<Step, string> = {
    mountains: intl.formatMessage({ defaultMessage: "Any mountains?" }),
    details: intl.formatMessage({ defaultMessage: "What are you doing?" }),
    people: intl.formatMessage({ defaultMessage: "Who's coming?" }),
    start: intl.formatMessage({ defaultMessage: "Before starting" }),
  };

  const isKeyboardVisible = useIsKeyboardVisible();

  const isStepMountains = step === "mountains";
  const isStepDetails = step === "details";
  const isStepPeople = step === "people";
  const isStepStart = step === "start";

  const { data } = useMountains();

  const handleOnMountainsChange = useCallback(
    (mountainsIds: string[]) => {
      setMountains(mountainsIds);

      if (!data) return;

      const title = buildTitleFromMountains(mountainsIds, data);
      setTitle(title);
    },
    [data],
  );

  useEffect(() => {
    return () => {
      setStep(stepOrder[0]);
    };
  }, []);

  const handleOnDetailsChange = ({
    title,
    description,
    date,
    startTime,
    type,
    isPrivate,
  }: DetailsValues) => {
    setTitle(title);
    setDescription(description || "");
    setDate(date);
    setStartTime(startTime ?? null);
    setType(type);
    setIsPrivate(isPrivate);
  };

  const currentStepIndex = stepOrder.indexOf(step);

  const handleOnContinue = async () => {
    if (isStepDetails && !title) {
      return Alert.alert(
        intl.formatMessage({
          defaultMessage: "Required information missing!",
        }),
      );
    }

    if (currentStepIndex === stepOrder.length - 1) {
      const response = await mutateAsync({
        title,
        description,
        startDate: date ? toLocalDateString(date) : undefined,
        startTime: date && startTime ? startTime : undefined,
        type,
        mountainIds: mountains,
        userIds: users.map((u) => u.id),
        isPrivate,
      });

      void markAsVisited();

      const planId = response?.id;
      if (planId) {
        // This screen is now a NativeTab, not a pushed screen, so dismiss()
        // would no-op. Navigate to the new plan's detail page and push it on
        // top of the tab stack (back-gesture returns to the Plans tab).
        return router.push({
          pathname: "/plan/[id]",
          params: {
            id: planId,
          },
        });
      } else {
        return Alert.alert(
          intl.formatMessage({
            defaultMessage: "Something went wrong, try again later!",
          }),
        );
      }
    } else {
      const nextStep = stepOrder[currentStepIndex + 1];
      setStep(nextStep);
    }
  };

  const handleOnBack = () => {
    // From the first step, "back" leaves the create flow → return to the
    // Plans tab. From any other step, back walks the wizard.
    if (currentStepIndex === -1 || currentStepIndex === 0) {
      router.replace("/plans");
    } else {
      setStep(stepOrder[currentStepIndex - 1]);
    }
  };

  const ContinueText = () => {
    if (isStepMountains) {
      if (!mountains?.length) {
        return <FormattedMessage defaultMessage="I'm not doing a summit" />;
      }

      return (
        <FormattedMessage
          defaultMessage="Continue with {count}"
          values={{ count: mountains?.length }}
        />
      );
    }

    if (isStepStart) {
      return <FormattedMessage defaultMessage="Lets do it" />;
    }

    if (isStepDetails) {
      return <FormattedMessage defaultMessage="Continue" />;
    }

    return <FormattedMessage defaultMessage="Create plan" />;
  };

  if (!isAuthenticated) {
    return <Redirect href="/join" />;
  }

  return (
    <TouchableWithoutFeedback onPress={() => Keyboard.dismiss()}>
      <ThemedView className="flex-1">
        <BlurredScreenHeader>{stepTitles[step]}</BlurredScreenHeader>
        <View className="flex-1 px-6 pb-4">
          {/*
            Steps own their internal scrollers; each one pads its scrollable
            content with BLURRED_SCREEN_HEADER_HEIGHT + 16 so the first item
            sits below the absolute blurred header without shrinking the
            scroller itself. Wrapper has no paddingTop so MountainsStep's
            sticky search header anchors at the visual top correctly.
          */}
          {isStepStart && <StartStep />}
          {isStepMountains && (
            <MountainsStep
              onMountainsChange={handleOnMountainsChange}
              value={mountains}
            />
          )}
          {isStepDetails && (
            <DetailsStep
              onDetailsChange={handleOnDetailsChange}
              values={{
                title,
                description,
                date,
                startTime,
                type,
                isPrivate,
              }}
            />
          )}
          {isStepPeople && (
            <PeopleStep value={users} onPeopleChange={setUsers} />
          )}
        </View>
        <BlurView
          className={twMerge(
            "px-6 pt-1 pb-8",
            isKeyboardVisible && "opacity-0",
          )}
        >
          <Button isLoading={isPending} onPress={handleOnContinue}>
            <ContinueText />
          </Button>
          <Button
            intent="ghost"
            onPress={handleOnBack}
            textClassName="text-muted-foreground"
          >
            <FormattedMessage defaultMessage="Back" />
          </Button>
        </BlurView>
      </ThemedView>
    </TouchableWithoutFeedback>
  );
}


import { format } from "date-fns/format";
import { nextSunday } from "date-fns/nextSunday";
import { useRouter, Redirect } from "expo-router";
import { analytics } from "expofast-analytics";
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import {
  Alert,
  FlatList,
  Keyboard,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import Animated, {
  useSharedValue,
  withTiming,
  runOnJS,
  useAnimatedStyle,
} from "react-native-reanimated";
import { twMerge } from "tailwind-merge";

import { useAuth } from "@/components/providers/auth-provider";
import { useChallenge } from "@/components/providers/challenge-provider";
import {
  BlurView,
  Button,
  Icon,
  SearchInput,
  ThemedText,
  ThemedTextInput,
  ThemedView,
} from "@/components/ui/atoms";
import { ThemedCheckbox } from "@/components/ui/atoms/themed-checkbox";
import { ThemedDateInput } from "@/components/ui/atoms/themed-date-input";
import { ScreenHeader } from "@/components/ui/molecules";
import { MountainItemListAsTouchable } from "@/components/ui/molecules/mountain-item-list";
import { useMountains } from "@/domains/mountain/mountain.api";
import { useMarkPlansAsVisited, usePlanCreate } from "@/domains/plan/plan.api";
import { useIsKeyboardVisible } from "@/hooks/use-is-keyboard-visible";
import { cleanText } from "@/lib";
import { isAndroid } from "@/lib/device";
import { getDateFnsLocale, getLocale } from "@/lib/locale";

const StartStep = () => {
  return (
    <View className="flex-1">
      <ThemedText className="mb-3 text-lg font-medium">
        <FormattedMessage defaultMessage="For you to know" />
      </ThemedText>
      <View className="gap-2">
        <View className="relative gap-1 rounded-xl border border-border p-4">
          <View className="absolute -right-3 -top-3">
            <ThemedText>❤️</ThemedText>
          </View>
          <ThemedText className="font-medium">
            <FormattedMessage defaultMessage="Not mandatory" />
          </ThemedText>
          <ThemedText className="text-muted-foreground ">
            <FormattedMessage defaultMessage="Plans can be deleted later without any obligation." />
          </ThemedText>
        </View>
        <View className="relative gap-1 rounded-xl border border-border p-4">
          <View className="absolute -right-3 -top-3">
            <ThemedText>👯</ThemedText>
          </View>
          <ThemedText className="font-medium">
            <FormattedMessage defaultMessage="You have total control over it" />
          </ThemedText>
          <ThemedText className="text-muted-foreground ">
            <FormattedMessage defaultMessage="You decide who comes, don't worry about removing users that joined if you feel like it." />
          </ThemedText>
        </View>
        <View className="relative gap-1 rounded-xl border border-border p-4">
          <View className="absolute -right-3 -top-3">
            <ThemedText>💬</ThemedText>
          </View>
          <ThemedText className="font-medium">
            <FormattedMessage defaultMessage="Chat within plans" />
          </ThemedText>
          <ThemedText className="text-muted-foreground">
            <FormattedMessage defaultMessage="Plans have an internal chat, but we recommend that you all share your phone number once ready." />
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
      const mountains = data?.data?.message;

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
    }, [query, data?.data?.message, value]);

    return (
      <View>
        <FlatList
          data={queriedMountains}
          initialNumToRender={10}
          stickyHeaderIndices={[0]}
          scrollEventThrottle={16}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
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
                    style={{ width: 100, height: 100, borderRadius: 12 }}
                  >
                    <View className="absolute size-full bg-blue-500 opacity-50" />
                    <Icon
                      name="checkmark"
                      size={32}
                      color="white"
                      animationSpec={{ effect: { type: "bounce" } }}
                    />
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

const formatFullDate = (date: Date) => {
  return format(date, "EEEE d, MMMM yyyy", {
    locale: getDateFnsLocale(),
  });
};

const DetailsStep = ({
  values,
  onDetailsChange,
}: {
  values: {
    title: string;
    description?: string;
    date?: Date | null;
  };
  onDetailsChange: (values: {
    title: string;
    description?: string;
    date?: Date | null;
  }) => void;
}) => {
  const intl = useIntl();
  return (
    <View className="flex-1">
      <ThemedTextInput
        label="Your activity"
        value={values.title}
        onChangeText={(title) => onDetailsChange({ ...values, title })}
      />
      <ThemedText className="mb-4 mt-1 text-xs text-muted-foreground/80">
        *Required
      </ThemedText>
      <ThemedTextInput
        label="Extra information about your plan"
        multiline
        value={values.description}
        inputClassName="h-[140px]"
        onChangeText={(description) =>
          onDetailsChange({ ...values, description })
        }
      />
      <ThemedText className="mb-4 mt-1 text-xs text-muted-foreground/80">
        <FormattedMessage defaultMessage="*You can modify this and all the other fields later" />
      </ThemedText>
      <ThemedDateInput
        value={values.date}
        onDateValid={(date) => onDetailsChange({ ...values, date })}
      />
      <ThemedText className="mb-2 mt-1 text-xs text-muted-foreground/80">
        {values?.date ? (
          <FormattedMessage
            defaultMessage="*Suggested date: {date}"
            values={{ date: formatFullDate(values?.date) }}
          />
        ) : (
          <FormattedMessage defaultMessage="*You can decide later" />
        )}
      </ThemedText>
      <ThemedCheckbox
        checked={!values.date}
        onChecked={(checked) => {
          if (checked) {
            onDetailsChange({ ...values, date: null });
          } else {
            onDetailsChange({ ...values, date: nextSundayDate });
          }
        }}
        label={intl.formatMessage({
          defaultMessage: "I don't know exactly when.",
        })}
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

type Step = "mountains" | "details" | "start";

const stepOrder = ["start", "mountains", "details"] as const;

export default function PlanCreatePage() {
  const router = useRouter();
  const intl = useIntl();
  const { challengeId } = useChallenge();
  const { isAuthenticated } = useAuth();
  const [step, setStep] = useState<Step>(stepOrder[0]);

  const [date, setDate] = useState<Date | null | undefined>(nextSundayDate);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [mountains, setMountains] = useState<string[]>([]);

  const { mutateAsync, isPending } = usePlanCreate();
  const { mutateAsync: markAsVisited } = useMarkPlansAsVisited();

  const stepTitles: Record<Step, string> = {
    mountains: intl.formatMessage({ defaultMessage: "Any mountains?" }),
    details: intl.formatMessage({ defaultMessage: "What are you doing?" }),
    start: intl.formatMessage({ defaultMessage: "Before starting" }),
  };

  const isKeyboardVisible = useIsKeyboardVisible();

  const isStepMountains = step === "mountains";
  const isStepDetails = step === "details";
  const isStepStart = step === "start";

  const { data } = useMountains();

  const handleOnMountainsChange = useCallback(
    (mountainsIds: string[]) => {
      setMountains(mountainsIds);

      if (!data?.data?.message) return;

      const title = buildTitleFromMountains(mountainsIds, data.data.message);
      setTitle(title);
    },
    [data?.data?.message],
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
  }: {
    title: string;
    description?: string;
    date?: Date | null;
  }) => {
    setTitle(title);
    setDescription(description || "");
    setDate(date);
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
        startDate: date ? date.toISOString() : undefined,
        mountainIds: mountains,
        challengeId,
      });

      void markAsVisited();

      const planId = response?.data?.message?.id;
      if (planId) {
        router.dismiss();
        analytics.action(`plan-created`);
        return router.push({
          pathname: "/plan/[id]",
          params: {
            id: planId,
          },
        });
      } else {
        analytics.error(`plan-error`);
        return Alert.alert(
          intl.formatMessage({
            defaultMessage: "Something went wrong, try again later!",
          }),
        );
      }
    } else {
      const nextStep = stepOrder[currentStepIndex + 1];
      analytics.action(`plan-step-${nextStep}`);
      setStep(nextStep);
    }
  };

  const handleOnBack = () => {
    if (currentStepIndex === -1 || currentStepIndex === 0) router.dismiss();
    else setStep(stepOrder[currentStepIndex - 1]);
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

    return <FormattedMessage defaultMessage="Create plan" />;
  };

  if (!isAuthenticated) {
    return <Redirect href="/join" />;
  }

  return (
    <TouchableWithoutFeedback onPress={() => Keyboard.dismiss()}>
      <ThemedView className="flex-1">
        <ScreenHeader />
        <View className={twMerge("px-6 pt-2 pb-4", isAndroid && "pt-24")}>
          <ThemedText className="mb-1 text-muted-foreground">
            <FormattedMessage defaultMessage="Creating a plan" />
          </ThemedText>
          <View className="relative mb-2 h-11 justify-center overflow-hidden">
            <AnimatedTitle title={stepTitles[step]} />
          </View>
        </View>
        <View className="flex-1 px-6 pb-4">
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
              }}
            />
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

const AnimatedTitle = ({ title }: { title: string }) => {
  const [renderedTitle, setRenderedTitle] = useState(title);
  const [showPrevLocal, setShowPrevLocal] = useState(false);
  const previousTitle = useRef(title);

  const prevOpacity = useSharedValue(0);
  const prevTranslate = useSharedValue(-20);
  const currOpacity = useSharedValue(1);
  const currTranslate = useSharedValue(0);

  useEffect(() => {
    if (title !== renderedTitle) {
      previousTitle.current = renderedTitle;
      runOnJS(setShowPrevLocal)(true);

      prevOpacity.value = 1;
      prevTranslate.value = 0;
      currOpacity.value = 0;
      currTranslate.value = 20;

      prevOpacity.value = withTiming(0, { duration: 200 });
      prevTranslate.value = withTiming(-20, { duration: 200 });

      currOpacity.value = withTiming(1, { duration: 200 });
      currTranslate.value = withTiming(0, { duration: 200 }, () => {
        runOnJS(setRenderedTitle)(title);
        runOnJS(setShowPrevLocal)(false);
      });
    }
  }, [
    title,
    renderedTitle,
    prevOpacity,
    prevTranslate,
    currOpacity,
    currTranslate,
  ]);

  const prevStyle = useAnimatedStyle(() => ({
    opacity: prevOpacity.value,
    transform: [{ translateX: prevTranslate.value }],
    position: "absolute",
  }));

  const currStyle = useAnimatedStyle(() => ({
    opacity: currOpacity.value,
    transform: [{ translateX: currTranslate.value }],
    position: "absolute",
  }));

  return (
    <>
      {showPrevLocal && (
        <Animated.Text
          style={prevStyle}
          className="text-4xl font-semibold text-foreground"
        >
          {previousTitle.current}
        </Animated.Text>
      )}
      <Animated.Text
        style={currStyle}
        className="text-4xl font-semibold text-foreground"
      >
        {title}
      </Animated.Text>
    </>
  );
};

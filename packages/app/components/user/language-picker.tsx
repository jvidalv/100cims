import React, { useState } from "react";
import { FormattedMessage } from "react-intl";
import { ActivityIndicator, TouchableOpacity, View } from "react-native";
import { twMerge } from "tailwind-merge";

import { ThemedText } from "@/components/ui/atoms";
import { useUpdateUserMeMutation } from "@/domains/user/user.api";
import { type Locale, getLocale, setLocale } from "@/lib/locale";
import { logError } from "@/lib/log-error";

const CA_RED = "#DA121A";
const CA_YELLOW = "#FCDD09";
const ES_RED = "#AA151B";
const ES_YELLOW = "#F1BF00";
const UK_BLUE = "#012169";
const UK_RED = "#C8102E";

const SenyeraFlag = () => (
  <View className="size-full overflow-hidden">
    {Array.from({ length: 9 }).map((_, i) => (
      <View
        key={i}
        className="flex-1"
        style={{ backgroundColor: i % 2 === 0 ? CA_YELLOW : CA_RED }}
      />
    ))}
  </View>
);

const SpanishFlag = () => (
  <View className="size-full overflow-hidden">
    <View className="flex-1" style={{ backgroundColor: ES_RED }} />
    <View className="flex-[2]" style={{ backgroundColor: ES_YELLOW }} />
    <View className="flex-1" style={{ backgroundColor: ES_RED }} />
  </View>
);

const UKFlag = () => (
  <View
    className="size-full items-center justify-center"
    style={{ backgroundColor: UK_BLUE }}
  >
    <View className="absolute h-[20%] w-full" style={{ backgroundColor: "white" }} />
    <View className="absolute h-full w-[20%]" style={{ backgroundColor: "white" }} />
    <View className="absolute h-[10%] w-full" style={{ backgroundColor: UK_RED }} />
    <View className="absolute h-full w-[10%]" style={{ backgroundColor: UK_RED }} />
  </View>
);

const OPTIONS = [
  { value: "en", label: "English", Flag: UKFlag },
  { value: "ca", label: "Català", Flag: SenyeraFlag },
  { value: "es", label: "Español", Flag: SpanishFlag },
] satisfies { value: Locale; label: string; Flag: () => React.ReactNode }[];

export const LanguagePicker = () => {
  const current = getLocale();
  const [pending, setPending] = useState<Locale | null>(null);
  const { mutateAsync: updateUserMe } = useUpdateUserMeMutation();

  const onSelect = async (value: Locale) => {
    if (value === current || pending !== null) return;
    setPending(value);
    try {
      await updateUserMe({ locale: value });
    } catch (error) {
      logError(error);
    }
    try {
      await setLocale(value);
    } catch (error) {
      logError(error);
      setPending(null);
    }
  };

  return (
    <View className="gap-3">
      <ThemedText className="font-medium">
        <FormattedMessage defaultMessage="Language" />
      </ThemedText>
      <View className="flex-row gap-3">
        {OPTIONS.map(({ value, label, Flag }) => {
          const selected = value === current;
          const isPending = pending === value;
          return (
            <TouchableOpacity
              key={value}
              onPress={() => onSelect(value)}
              disabled={pending !== null}
              className="items-center gap-1"
            >
              <View
                className={twMerge(
                  "size-16 items-center justify-center rounded-full border-2",
                  selected ? "border-primary bg-primary/10" : "border-border",
                )}
              >
                {isPending ? (
                  <ActivityIndicator />
                ) : (
                  <View className="size-8 overflow-hidden rounded">
                    <Flag />
                  </View>
                )}
              </View>
              <ThemedText
                className={twMerge(
                  "text-xs",
                  selected
                    ? "font-semibold text-primary"
                    : "text-muted-foreground",
                )}
              >
                {label}
              </ThemedText>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

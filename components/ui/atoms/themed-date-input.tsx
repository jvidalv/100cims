import DateTimePicker from "@react-native-community/datetimepicker";
import { isValid } from "date-fns/isValid";
import { useEffect, useMemo, useState } from "react";
import { FormattedMessage } from "react-intl";
import { Platform, Pressable, View } from "react-native";
import { twMerge } from "tailwind-merge";

import { Button } from "@/components/ui/atoms/button";
import { Icon } from "@/components/ui/atoms/icon";
import { ThemedText } from "@/components/ui/atoms/themed-text";
import { BottomDrawer } from "@/components/ui/molecules/bottom-drawer";

type Props = {
  value?: Date | null | false;
  onDateValid: (date: Date) => void;
  onDateError?: () => void;
  className?: string;
  autoFocus?: boolean;
  noFutureDates?: boolean;
  noPastDates?: boolean;
};

export const ThemedDateInput = ({
  value,
  onDateValid,
  onDateError,
  className,
  autoFocus,
  noFutureDates,
  noPastDates,
}: Props) => {
  const [showPicker, setShowPicker] = useState(false);
  const [day, setDay] = useState("");
  const [month, setMonth] = useState("");
  const [year, setYear] = useState("");

  const resetInputs = () => {
    setDay("");
    setMonth("");
    setYear("");
  };

  useEffect(() => {
    if (!value) {
      resetInputs();
      return;
    }

    const d = String(value.getDate());
    const m = String(value.getMonth() + 1);
    const y = String(value.getFullYear());

    setDay(d);
    setMonth(m);
    setYear(y);
  }, [value]);

  const isComplete = day && month && year;
  const d = parseInt(day);
  const m = parseInt(month) - 1;
  const y = parseInt(year);

  const parsedDate = useMemo(() => {
    if (!isComplete) return null;
    const date = new Date(y, m, d);

    return isValid(date) &&
      date.getDate() === d &&
      date.getMonth() === m &&
      date.getFullYear() === y
      ? date
      : null;
  }, [d, isComplete, m, y]);

  const Separator = () => (
    <ThemedText
      className={twMerge(
        "text-muted-foreground",
        isComplete && !parsedDate && "text-red-500",
      )}
    >
      /
    </ThemedText>
  );

  const handleDateChange = (event: { type: string }, selectedDate?: Date) => {
    if (event.type === "set" && selectedDate) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const inputDate = new Date(selectedDate);
      inputDate.setHours(0, 0, 0, 0);

      let isValid = true;
      if (noFutureDates && inputDate > today) isValid = false;
      if (noPastDates && inputDate < today) isValid = false;

      if (isValid) {
        onDateValid(selectedDate);
      } else {
        onDateError?.();
      }
    } else if (event.type === "dismissed") {
      setShowPicker(false);
    }
  };

  return (
    <>
      <Pressable
        onPress={() => setShowPicker(true)}
        className={twMerge(
          "border-2 border-border justify-center rounded-xl py-3 pl-10 relative",
          isComplete && !parsedDate && "border-red-500",
          className,
        )}
      >
        <View className="absolute left-4 h-full items-center justify-center">
          <Icon name="calendar" size={20} muted />
        </View>
        <View className="flex-row items-center py-2">
          <ThemedText
            className={twMerge(
              "text-foreground font-medium w-12 text-right pr-4",
              !day && "text-muted-foreground",
            )}
          >
            {day || "dd"}
          </ThemedText>
          <Separator />
          <ThemedText
            className={twMerge(
              "text-foreground font-medium w-12 text-center px-1",
              !month && "text-muted-foreground",
            )}
          >
            {month || "mm"}
          </ThemedText>
          <Separator />
          <ThemedText
            className={twMerge(
              "text-foreground font-medium pl-4 flex-1",
              !year && "text-muted-foreground",
            )}
          >
            {year || "yyyy"}
          </ThemedText>
        </View>
      </Pressable>
      {Platform.OS === "ios" ? (
        <BottomDrawer
          isOpen={showPicker}
          onRequestClose={() => setShowPicker(false)}
        >
          <DateTimePicker
            value={value || new Date()}
            mode="date"
            display="spinner"
            onChange={handleDateChange}
            minimumDate={noPastDates ? new Date() : undefined}
            maximumDate={noFutureDates ? new Date() : undefined}
          />
          <Button
            intent="success"
            className="mx-4 mb-8"
            onPress={() => setShowPicker(false)}
          >
            <FormattedMessage defaultMessage="Done" />
          </Button>
        </BottomDrawer>
      ) : (
        showPicker && (
          <DateTimePicker
            value={value || new Date()}
            mode="date"
            display="default"
            onChange={(event, selectedDate) => {
              // Android needs immediate close before processing
              if (Platform.OS === "android") {
                setShowPicker(false);
              }
              handleDateChange(event, selectedDate);
            }}
            minimumDate={noPastDates ? new Date() : undefined}
            maximumDate={noFutureDates ? new Date() : undefined}
          />
        )
      )}
    </>
  );
};

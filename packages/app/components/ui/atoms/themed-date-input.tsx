import DateTimePicker from "@react-native-community/datetimepicker";
import { format } from "date-fns/format";
import { isValid } from "date-fns/isValid";
import { Calendar } from "lucide-react-native";
import { useEffect, useMemo, useState } from "react";
import { FormattedMessage } from "react-intl";
import { Platform, Pressable, View } from "react-native";
import { twMerge } from "tailwind-merge";

import { Button } from "@/components/ui/atoms/button";
import { LucideIcon } from "@/components/ui/atoms/lucide-icon";
import { ThemedText } from "@/components/ui/atoms/themed-text";
import { BottomDrawer } from "@/components/ui/molecules/bottom-drawer";
import { getDateFnsLocale, getLocale } from "@/lib/locale";

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
  const [pickerDraft, setPickerDraft] = useState<Date | null>(null);
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

  const commitDate = (selectedDate: Date) => {
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
  };

  // Two distinct flows wired below:
  //  - iOS spinner inside our BottomDrawer: every wheel tick fires
  //    `onValueChange`; we stash a draft and commit on the Done button.
  //  - Android default modal: a single confirm/cancel — `onValueChange`
  //    fires on Done (commit + close), `onDismiss` fires on Cancel.
  const handleIosValueChange = (_event: unknown, selectedDate: Date) => {
    setPickerDraft(selectedDate);
  };
  const handleAndroidValueChange = (_event: unknown, selectedDate: Date) => {
    setShowPicker(false);
    commitDate(selectedDate);
  };
  const handleAndroidDismiss = () => {
    setShowPicker(false);
  };

  const handleIosDone = () => {
    const selected = pickerDraft ?? (value || new Date());
    commitDate(selected);
    setPickerDraft(null);
    setShowPicker(false);
  };

  return (
    <>
      <Pressable
        onPress={() => setShowPicker(true)}
        className={twMerge(
          "border-2 border-border justify-center rounded py-3 pl-12 relative",
          isComplete && !parsedDate && "border-red-500",
          className,
        )}
      >
        <View className="absolute left-4 h-full items-center justify-center">
          <LucideIcon icon={Calendar} size={20} muted />
        </View>
        <View className="py-2">
          {parsedDate ? (
            <ThemedText className="font-medium">
              {format(
                parsedDate,
                getLocale() === "en" ? "d MMMM yyyy" : "d 'de' MMMM yyyy",
                { locale: getDateFnsLocale() },
              )}
            </ThemedText>
          ) : (
            <ThemedText
              className={twMerge(
                "font-medium text-muted-foreground",
                isComplete && !parsedDate && "text-red-500",
              )}
            >
              <FormattedMessage defaultMessage="Select a date" />
            </ThemedText>
          )}
        </View>
      </Pressable>
      {Platform.OS === "ios" ? (
        <BottomDrawer
          isOpen={showPicker}
          onRequestClose={() => {
            setPickerDraft(null);
            setShowPicker(false);
          }}
        >
          <DateTimePicker
            value={pickerDraft ?? (value || new Date())}
            mode="date"
            display="spinner"
            onValueChange={handleIosValueChange}
            minimumDate={noPastDates ? new Date() : undefined}
            maximumDate={noFutureDates ? new Date() : undefined}
          />
          <Button
            intent="success"
            className="mx-4 mb-8"
            onPress={handleIosDone}
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
            onValueChange={handleAndroidValueChange}
            onDismiss={handleAndroidDismiss}
            minimumDate={noPastDates ? new Date() : undefined}
            maximumDate={noFutureDates ? new Date() : undefined}
          />
        )
      )}
    </>
  );
};

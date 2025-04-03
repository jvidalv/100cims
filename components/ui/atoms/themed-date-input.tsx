import { isValid } from "date-fns/isValid";
import { useEffect, useMemo, useRef, useState } from "react";
import { Pressable, TextInput, TextInputProps, View } from "react-native";
import { twMerge } from "tailwind-merge";

import { Icon } from "@/components/ui/atoms/icon";
import { ThemedText } from "@/components/ui/atoms/themed-text";
import { getFontFamily } from "@/lib/fonts";

type Props = {
  value?: Date | null | false;
  onDateValid: (date: Date) => void;
  onDateError?: () => void;
  className?: string;
  autoFocus?: boolean;
};

const inputClassName = "text-foreground font-medium";
const fontFamily = getFontFamily(inputClassName);

export const ThemedDateInput = ({
  value,
  onDateValid,
  onDateError,
  className,
  autoFocus,
}: Props) => {
  const dayRef = useRef<TextInput>(null);
  const monthRef = useRef<TextInput>(null);
  const yearRef = useRef<TextInput>(null);

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

  const inputSharedProps: TextInputProps = {
    returnKeyType: "done",
    style: { fontFamily, fontSize: 16 },
    keyboardType: "numeric",
  };

  const handleInput = (nextDay = day, nextMonth = month, nextYear = year) => {
    const d = parseInt(nextDay);
    const m = parseInt(nextMonth) - 1;
    const y = parseInt(nextYear);

    const isComplete =
      nextDay.length > 0 && nextMonth.length > 0 && nextYear.length > 0;

    if (!isComplete) return;

    const date = new Date(y, m, d);

    const valid =
      isValid(date) &&
      date.getDate() === d &&
      date.getMonth() === m &&
      date.getFullYear() === y;

    if (valid) {
      onDateValid(date);
    } else {
      onDateError?.();
    }
  };

  const handleChange = (type: "day" | "month" | "year", val: string) => {
    if (type === "day") {
      setDay(val);
      handleInput(val, month, year);
    } else if (type === "month") {
      setMonth(val);
      handleInput(day, val, year);
    } else {
      setYear(val);
      handleInput(day, month, val);
    }
  };

  const isFocused =
    dayRef.current?.isFocused() ||
    monthRef.current?.isFocused() ||
    yearRef.current?.isFocused();

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

  const iconColor = isFocused
    ? parsedDate || !isComplete
      ? "#3b82f6"
      : "#ef4444"
    : undefined;

  const Separator = () => (
    <ThemedText
      className={twMerge(
        "text-border",
        isFocused && "text-blue-500",
        isComplete && !parsedDate && "text-red-500",
        isComplete && parsedDate && isFocused && "text-blue-500",
      )}
    >
      /
    </ThemedText>
  );

  return (
    <Pressable
      onPress={() => {
        if (!day) dayRef.current?.focus();
        else if (!month) monthRef.current?.focus();
        else yearRef.current?.focus();
      }}
      className={twMerge(
        "border-2 border-border justify-center rounded-xl py-3 pl-10 relative",
        isFocused && "border-blue-500",
        isComplete && !parsedDate && "border-red-500",
        isComplete && parsedDate && isFocused && "border-blue-500",
        className,
      )}
    >
      <View className="absolute left-4 h-full items-center justify-center">
        <Icon name="calendar" size={20} muted={!isFocused} color={iconColor} />
      </View>
      <View className="flex-row items-center py-2">
        <TextInput
          ref={dayRef}
          onChangeText={(val) => handleChange("day", val)}
          placeholder="dd"
          className={twMerge(inputClassName, "w-12 text-right pr-4")}
          value={day}
          maxLength={2}
          autoFocus={autoFocus}
          {...inputSharedProps}
        />
        <Separator />
        <TextInput
          ref={monthRef}
          onChangeText={(val) => handleChange("month", val)}
          placeholder="mm"
          className={twMerge(inputClassName, "w-12 text-center px-1")}
          value={month}
          maxLength={2}
          {...inputSharedProps}
        />
        <Separator />
        <TextInput
          ref={yearRef}
          onChangeText={(val) => handleChange("year", val)}
          placeholder="yyyy"
          className={twMerge(inputClassName, "pl-4 flex-1 w-full")}
          value={year}
          maxLength={4}
          {...inputSharedProps}
        />
      </View>
    </Pressable>
  );
};

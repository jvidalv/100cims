import { isValid } from "date-fns/isValid";
import { useEffect, useMemo, useRef, useState } from "react";
import { Pressable, TextInput, TextInputProps, View } from "react-native";
import { twMerge } from "tailwind-merge";

import { Icon } from "@/components/ui/atoms/icon";
import { ThemedText } from "@/components/ui/atoms/themed-text";
import { getFontFamily } from "@/lib/fonts";

type Props = {
  value?: Date;
  onDateValid: (date: Date) => void;
  onDateError?: () => void;
  className?: string;
};

const inputClassName = "text-foreground font-medium";
const fontFamily = getFontFamily(inputClassName);

export const DateInput = ({
  value,
  onDateValid,
  onDateError,
  className,
}: Props) => {
  const dayRef = useRef<TextInput>(null);
  const monthRef = useRef<TextInput>(null);
  const yearRef = useRef<TextInput>(null);

  const valueDay = value?.getDate()?.toString();
  const valueMonth = value?.getMonth()
    ? (value.getMonth() + 1)?.toString()
    : undefined;
  const valueYear = value?.getFullYear()?.toString();

  const [day, setDay] = useState<string | undefined>(
    valueDay?.length === 1 ? `0${valueDay}` : valueDay,
  );
  const [month, setMonth] = useState<string | undefined>(
    valueMonth?.length === 1 ? `0${valueMonth}` : valueMonth,
  );
  const [year, setYear] = useState<string | undefined>(valueYear);

  const inputSharedProps: TextInputProps = {
    onFocus: () => setLastFocusChange(Date.now()),
    onBlur: () => setLastFocusChange(Date.now()),
    returnKeyType: "done",
    style: { fontFamily, fontSize: 16 },
    keyboardType: "numeric",
  };

  // *Ref.current.isFocused() is not reactive, so we create a side effect on focus/blur
  const [, setLastFocusChange] = useState<number>(Date.now());

  const isDayFocused = dayRef.current?.isFocused();
  const isMonthFocused = monthRef.current?.isFocused();
  const isYearFocused = yearRef.current?.isFocused();

  const isFocused = isDayFocused || isMonthFocused || isYearFocused;

  const [animateIcon, setAnimateIcon] = useState(false);

  const isDateComplete =
    `${day}${month}${year}`.length === 8 ||
    (year && year?.length < 4 && !isFocused);

  const dayAsInt = day ? parseInt(day) : null;
  const monthAsInt = month ? parseInt(month) - 1 : null;
  const yearAsInt = year ? parseInt(year) : null;

  const date = useMemo(() => {
    if (!isDateComplete) {
      return null;
    }

    if (
      dayAsInt === null ||
      monthAsInt === null ||
      yearAsInt === null ||
      monthAsInt > 11 ||
      monthAsInt < 0 ||
      dayAsInt < 1 ||
      dayAsInt > 31 ||
      yearAsInt < 0
    ) {
      return null;
    }

    return new Date(yearAsInt, monthAsInt, dayAsInt);
  }, [dayAsInt, isDateComplete, monthAsInt, yearAsInt]);

  const isDateValid = useMemo(() => {
    if (!date) {
      return false;
    }

    return (
      isValid(date) &&
      date.getFullYear() === yearAsInt &&
      date.getMonth() === monthAsInt &&
      date.getDate() === dayAsInt
    );
  }, [date, dayAsInt, monthAsInt, yearAsInt]);

  useEffect(() => {
    if (isFocused && !isDayFocused && day?.length === 1) {
      setDay(`0${day}`);
    }
  }, [day, isFocused, isMonthFocused, isYearFocused, isDayFocused]);

  useEffect(() => {
    if (isFocused && !isMonthFocused && month?.length === 1) {
      setMonth(`0${month}`);
    }
  }, [month, isFocused, isDayFocused, isYearFocused, isMonthFocused]);

  useEffect(() => {
    if (date && isDateValid) {
      onDateValid?.(date);
    }
  }, [date, isDateValid, onDateValid]);

  useEffect(() => {
    if (!isDateValid && isDateComplete) {
      onDateError?.();
    }
  }, [isDateComplete, isDateValid, onDateError]);

  useEffect(() => {
    if (isFocused) {
      setAnimateIcon(true);
      setTimeout(() => setAnimateIcon(false), 1000);
    }
  }, [isFocused]);

  const iconColor = useMemo(() => {
    if (isDateComplete && isDateValid && isFocused) {
      return "#22c55e";
    }

    if (isDateComplete && !isDateValid) {
      return "#ef4444";
    }

    if (isFocused) {
      return "#3b82f6";
    }

    return undefined;
  }, [isDateComplete, isDateValid, isFocused]);

  const Separator = () => (
    <ThemedText
      className={twMerge(
        "text-border",
        isFocused && "text-blue-500",
        isDateComplete && !isDateValid && "text-red-500",
        isDateComplete && isDateValid && isFocused && "text-green-500",
      )}
    >
      /
    </ThemedText>
  );

  return (
    <Pressable
      onPress={() => {
        if (!day) {
          dayRef.current?.focus();
        } else if (!month) {
          monthRef.current?.focus();
        } else {
          yearRef.current?.focus();
        }
      }}
      className={twMerge(
        "border-2 border-border justify-center rounded-xl py-2 pl-10 relative",
        isFocused && "border-blue-500",
        isDateComplete && !isDateValid && "border-red-500",
        isDateComplete && isDateValid && isFocused && "border-green-500",
        className,
      )}
    >
      <View className="absolute left-4 h-full items-center justify-center">
        <Icon
          name="calendar"
          size={20}
          muted={!isFocused}
          color={iconColor}
          animationSpec={
            animateIcon && isFocused
              ? { effect: { type: "bounce" } }
              : undefined
          }
        />
      </View>
      <View className="flex-row items-center">
        <TextInput
          ref={dayRef}
          onChangeText={setDay}
          placeholder="dd"
          className={twMerge(inputClassName, "py-2 pl-4 pr-2")}
          value={day}
          maxLength={2}
          {...inputSharedProps}
        />
        <Separator />
        <TextInput
          ref={monthRef}
          value={month}
          onChangeText={setMonth}
          placeholder="mm"
          className={twMerge(inputClassName, "py-2 px-2")}
          maxLength={2}
          {...inputSharedProps}
        />
        <Separator />
        <TextInput
          ref={yearRef}
          maxLength={4}
          value={year}
          onChangeText={setYear}
          placeholder="yyyy"
          className={twMerge(inputClassName, "py-2 pl-2 flex-1 w-full")}
          {...inputSharedProps}
        />
      </View>
    </Pressable>
  );
};

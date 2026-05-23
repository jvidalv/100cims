import DateTimePicker from "@react-native-community/datetimepicker";
import { Clock, X } from "lucide-react-native";
import { useState } from "react";
import { FormattedMessage } from "react-intl";
import { Platform, Pressable, View } from "react-native";
import { twMerge } from "tailwind-merge";

import { Button } from "@/components/ui/atoms/button";
import { LucideIcon } from "@/components/ui/atoms/lucide-icon";
import { ThemedText } from "@/components/ui/atoms/themed-text";
import { BottomDrawer } from "@/components/ui/molecules/bottom-drawer";

type Props = {
  value?: string | null;
  onChange: (time: string | null) => void;
  className?: string;
  clearable?: boolean;
};

const pad = (n: number) => String(n).padStart(2, "0");
const formatHM = (d: Date) => `${pad(d.getHours())}:${pad(d.getMinutes())}`;

const parseHM = (value: string | null | undefined): Date => {
  if (!value) {
    const d = new Date();
    d.setHours(9, 0, 0, 0);
    return d;
  }
  const [h, m] = value.split(":").map((p) => parseInt(p, 10));
  const d = new Date();
  d.setHours(
    Number.isFinite(h) ? h : 0,
    Number.isFinite(m) ? m : 0,
    0,
    0,
  );
  return d;
};

export const ThemedTimeInput = ({
  value,
  onChange,
  className,
  clearable = true,
}: Props) => {
  const [showPicker, setShowPicker] = useState(false);
  const [pickerDraft, setPickerDraft] = useState<Date | null>(null);

  const handleChange = (event: { type: string }, selected?: Date) => {
    if (event.type === "set" && selected) {
      if (Platform.OS === "ios") {
        setPickerDraft(selected);
      } else {
        onChange(formatHM(selected));
      }
    } else if (event.type === "dismissed") {
      setShowPicker(false);
    }
  };

  const handleIosDone = () => {
    const selected = pickerDraft ?? parseHM(value);
    onChange(formatHM(selected));
    setPickerDraft(null);
    setShowPicker(false);
  };

  return (
    <>
      <View className={twMerge("flex-row items-center gap-2", className)}>
        <Pressable
          onPress={() => setShowPicker(true)}
          className="flex-1 border-2 border-border justify-center rounded py-3 pl-12 relative"
        >
          <View className="absolute left-4 h-full items-center justify-center">
            <LucideIcon icon={Clock} size={20} muted />
          </View>
          <View className="py-2">
            {value ? (
              <ThemedText className="font-medium">{value}</ThemedText>
            ) : (
              <ThemedText className="font-medium text-muted-foreground">
                <FormattedMessage defaultMessage="Select a time" />
              </ThemedText>
            )}
          </View>
        </Pressable>
        {clearable && value && (
          <Pressable
            onPress={() => onChange(null)}
            className="size-10 items-center justify-center rounded border-2 border-border"
            hitSlop={8}
          >
            <LucideIcon icon={X} size={18} muted />
          </Pressable>
        )}
      </View>
      {Platform.OS === "ios" ? (
        <BottomDrawer
          isOpen={showPicker}
          onRequestClose={() => {
            setPickerDraft(null);
            setShowPicker(false);
          }}
        >
          <DateTimePicker
            value={pickerDraft ?? parseHM(value)}
            mode="time"
            display="spinner"
            onChange={handleChange}
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
            value={parseHM(value)}
            mode="time"
            display="default"
            onChange={(event, selected) => {
              if (Platform.OS === "android") {
                setShowPicker(false);
              }
              handleChange(event, selected);
            }}
          />
        )
      )}
    </>
  );
};

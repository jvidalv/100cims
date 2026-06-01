import { useColorScheme } from "nativewind";
import { useState } from "react";
import { Platform, Pressable, Switch, View } from "react-native";
import { twMerge } from "tailwind-merge";

import { ThemedText } from "@/components/ui/atoms/themed-text";
import { ThemedView } from "@/components/ui/atoms/themed-view";
import { Colors } from "@/constants/colors";

type Props = {
  /** Caption that floats in the top-left corner like the rest of our form
   *  inputs. Optional — leave empty for a label-less row. */
  label?: string;
  /** Right-aligned secondary text (e.g. "On" / "Off") rendered next to the
   *  switch. Optional — many forms only want the label + the control. */
  description?: string;
  checked?: boolean;
  defaultChecked?: boolean;
  onChecked?: (checked: boolean) => void;
  disabled?: boolean;
  className?: string;
};

/**
 * Thin themed wrapper around the platform `Switch`. Matches the visual
 * rhythm of `ThemedTextInput` / `ThemedToggleInput` (border card + floating
 * label) so a form mixing them reads as one unit. Use this in place of
 * `ThemedToggleInput` when the choice is a true on/off binary (vs. a real
 * pair of labelled options like Yes/No).
 *
 * Controlled or uncontrolled — pass `checked` for controlled, `defaultChecked`
 * for self-managed state. Mirrors `ThemedCheckbox`'s API on purpose.
 */
export const ThemedSwitch = ({
  label,
  description,
  checked,
  defaultChecked,
  onChecked,
  disabled,
  className,
}: Props) => {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";

  const isControlled = checked !== undefined;
  const [internalChecked, setInternalChecked] = useState(
    defaultChecked ?? false,
  );
  const value = isControlled ? checked : internalChecked;

  const handleChange = (next: boolean) => {
    if (!isControlled) setInternalChecked(next);
    onChecked?.(next);
  };

  // iOS paints `trackColor.true` directly; Android also uses `thumbColor`
  // for the knob when on. Brand pink for "on" in both themes. "Off" track
  // tracks the theme: light grey in light mode, near-black in dark — the
  // hardcoded light value reads as a bright bar on a black background.
  const trackColor = {
    false: isDark ? "#3f3f46" : "#d4d4d8",
    true: Colors.light.primary,
  };
  const thumbColor =
    Platform.OS === "android" && value ? "#ffffff" : undefined;

  return (
    <Pressable
      disabled={disabled}
      onPress={() => handleChange(!value)}
      className={twMerge(
        "flex-row items-center justify-between gap-3 rounded border-2 border-border px-4 py-3",
        disabled && "opacity-50",
        className,
      )}
    >
      {!!label && (
        <ThemedView className="absolute -top-3 left-4 z-10 -mx-1 bg-background px-1">
          <ThemedText
            className="text-muted-foreground"
            style={{ fontSize: 14, lineHeight: 15 }}
          >
            {label}
          </ThemedText>
        </ThemedView>
      )}
      {description ? (
        <ThemedText className="flex-1 text-foreground">
          {description}
        </ThemedText>
      ) : (
        <View className="flex-1" />
      )}
      <Switch
        value={value}
        onValueChange={handleChange}
        disabled={disabled}
        trackColor={trackColor}
        thumbColor={thumbColor}
        ios_backgroundColor={trackColor.false}
      />
    </Pressable>
  );
};

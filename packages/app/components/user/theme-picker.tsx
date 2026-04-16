import { Moon, Sun } from "lucide-react-native";
import { FormattedMessage, useIntl } from "react-intl";
import { Appearance, TouchableOpacity, View, useColorScheme } from "react-native";
import { twMerge } from "tailwind-merge";

import { LucideIcon, ThemedText } from "@/components/ui/atoms";

type ThemeOption = "light" | "dark";

export const ThemePicker = () => {
  const intl = useIntl();
  const colorScheme = useColorScheme();
  const current: ThemeOption = colorScheme === "dark" ? "dark" : "light";

  const options: { value: ThemeOption; icon: typeof Sun; label: string }[] = [
    {
      value: "light",
      icon: Sun,
      label: intl.formatMessage({ defaultMessage: "Light" }),
    },
    {
      value: "dark",
      icon: Moon,
      label: intl.formatMessage({ defaultMessage: "Dark" }),
    },
  ];

  return (
    <View className="gap-3">
      <ThemedText className="font-medium">
        <FormattedMessage defaultMessage="Theme" />
      </ThemedText>
      <View className="flex-row gap-3">
        {options.map(({ value, icon, label }) => {
          const selected = value === current;
          return (
            <TouchableOpacity
              key={value}
              onPress={() => Appearance.setColorScheme(value)}
              className="items-center gap-1"
            >
              <View
                className={twMerge(
                  "size-16 items-center justify-center rounded-full border-2",
                  selected
                    ? "border-primary bg-primary/10"
                    : "border-border",
                )}
              >
                <LucideIcon
                  icon={icon}
                  size={28}
                  muted={!selected}
                />
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

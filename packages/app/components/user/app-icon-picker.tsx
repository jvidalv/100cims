import { getAppIcon, setAppIcon } from "@howincodes/expo-dynamic-app-icon";
import { Lock } from "lucide-react-native";
import { useEffect, useState } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { Alert, Image, Platform, TouchableOpacity, View } from "react-native";
import { twMerge } from "tailwind-merge";

import { LucideIcon, ThemedText } from "@/components/ui/atoms";
import {
  APP_ICONS,
  AppIconId,
  isAppIconId,
  Unlockable,
  UNLOCKABLES,
} from "@/domains/app-icon/app-icon";
import { useUserMe } from "@/domains/user/user.api";

export const AppIconPicker = () => {
  const intl = useIntl();
  const { data: me } = useUserMe();
  const [current, setCurrent] = useState<AppIconId>(null);

  useEffect(() => {
    void (async () => {
      const active = await getAppIcon();
      const normalized = active === "DEFAULT" ? null : active;
      if (isAppIconId(normalized)) setCurrent(normalized);
    })();
  }, []);

  if (Platform.OS === "web") return null;

  const unlocked = new Set<Unlockable>(
    (me?.unlockables ?? []).filter((u): u is Unlockable =>
      (UNLOCKABLES as readonly string[]).includes(u),
    ),
  );

  const isIconLocked = (requires: Unlockable | null) =>
    requires !== null && !unlocked.has(requires);

  const labels: Record<(typeof APP_ICONS)[number]["labelKey"], string> = {
    default: intl.formatMessage({ defaultMessage: "Default" }),
    light: intl.formatMessage({ defaultMessage: "Light" }),
    vell: intl.formatMessage({ defaultMessage: "Vell" }),
    merch: intl.formatMessage({ defaultMessage: "Or" }),
    share: intl.formatMessage({ defaultMessage: "Genteta" }),
    forcat: intl.formatMessage({ defaultMessage: "Forcat" }),
    picat: intl.formatMessage({ defaultMessage: "Picat" }),
  };

  const lockedMessages: Record<Unlockable, string> = {
    merch: intl.formatMessage({
      defaultMessage: "Buy any item from the Cims shop.",
    }),
    share: intl.formatMessage({
      defaultMessage: "Share Cims with a friend.",
    }),
    forcat: intl.formatMessage({
      defaultMessage: "Summit Pedraforca.",
    }),
    picat: intl.formatMessage({
      defaultMessage: "Summit Pica d'Estats.",
    }),
  };

  const handleLockedPress = (requires: Unlockable) => {
    Alert.alert(
      intl.formatMessage({ defaultMessage: "Icon locked" }),
      lockedMessages[requires],
    );
  };

  const handleSelect = async (
    id: AppIconId,
    requires: Unlockable | null,
  ) => {
    if (requires !== null && !unlocked.has(requires)) {
      handleLockedPress(requires);
      return;
    }
    if (id === current) return;
    const result = await setAppIcon(id);
    if (result !== false) setCurrent(id);
  };

  return (
    <View className="gap-3">
      <ThemedText className="font-medium">
        <FormattedMessage defaultMessage="App icon" />
      </ThemedText>
      <View className="flex-row flex-wrap gap-3">
        {APP_ICONS.map((icon) => {
          const selected = icon.id === current;
          const locked = isIconLocked(icon.requires);
          return (
            <TouchableOpacity
              key={icon.id ?? "default"}
              onPress={() => handleSelect(icon.id, icon.requires)}
              className="items-center gap-1"
            >
              <View
                className={twMerge(
                  "rounded-2xl border-2 p-1",
                  selected ? "border-primary" : "border-transparent",
                )}
              >
                <View className="relative">
                  <Image
                    source={icon.preview}
                    className={twMerge(
                      "size-16 rounded-xl border border-border",
                      locked && "opacity-40",
                    )}
                  />
                  {locked && (
                    <View className="absolute -right-1 -top-1">
                      <LucideIcon icon={Lock} size={16} muted />
                    </View>
                  )}
                </View>
              </View>
              <ThemedText
                className={twMerge(
                  "text-xs",
                  selected
                    ? "font-semibold text-primary"
                    : "text-muted-foreground",
                )}
              >
                {labels[icon.labelKey]}
              </ThemedText>
            </TouchableOpacity>
          );
        })}
      </View>
      {Platform.OS === "android" && (
        <ThemedText className="text-xs text-muted-foreground">
          <FormattedMessage defaultMessage="On Android, the icon may briefly disappear from your launcher while switching." />
        </ThemedText>
      )}
    </View>
  );
};

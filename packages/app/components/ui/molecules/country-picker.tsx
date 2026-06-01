import { ChevronDown, Search, X } from "lucide-react-native";
import { useMemo, useState } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import {
  Modal,
  ScrollView,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { LucideIcon, ThemedText } from "@/components/ui/atoms";
import { cleanText } from "@/lib";
import {
  COUNTRIES,
  type CountryCode,
  formatCountryLabel,
  getCountryName,
} from "@/lib/countries";
import { getLocale } from "@/lib/locale";

type Props = {
  label: string;
  value: CountryCode | null;
  onChange: (code: CountryCode) => void;
};

// Country picker — trigger reads as a labeled "text input" matching
// ThemedTextInput's floated-label notch, taps open a native RN Modal
// with a searchable scroll list. Modal uses the OS's full-screen
// presentation (formSheet on iOS, fade on Android), giving a more
// "native select" feel than a bottom drawer would.
export const CountryPicker = ({ label, value, onChange }: Props) => {
  const intl = useIntl();
  const insets = useSafeAreaInsets();
  const locale = getLocale();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const selectedLabel = formatCountryLabel(value, locale);

  const filtered = useMemo(() => {
    const q = cleanText(query.trim()).toLowerCase();
    if (!q) return COUNTRIES;
    return COUNTRIES.filter((c) => {
      const name = getCountryName(c, locale);
      return (
        cleanText(name).toLowerCase().includes(q) ||
        c.code.toLowerCase().includes(q)
      );
    });
  }, [query, locale]);

  return (
    <>
      <View className="relative w-full">
        {/* Match ThemedTextInput's floated-label notch: label sits on the
            top border with a `bg-background px-1 -mx-1` mask so the
            border line is cut behind it. The picker always has a value
            (defaults to "ES"), so the label is permanently in the
            floated position — no animation needed. */}
        <View className="pointer-events-none absolute left-4 -top-2.5 z-10 -mx-1 bg-background px-1">
          <ThemedText className="text-sm text-muted-foreground">
            {label}
          </ThemedText>
        </View>
        <TouchableOpacity
          onPress={() => setOpen(true)}
          activeOpacity={0.7}
          className="w-full flex-row items-center justify-between rounded border-2 border-border px-4 py-5"
        >
          <ThemedText className="text-base">
            {selectedLabel ?? ""}
          </ThemedText>
          <LucideIcon icon={ChevronDown} size={20} muted />
        </TouchableOpacity>
      </View>

      {/* `presentationStyle="formSheet"` gives the native iOS sheet
          (swipe-down to dismiss); Android falls back to a full-screen
          modal with the fade animation. `animationType="slide"` on iOS
          gives the standard sheet slide-up. */}
      <Modal
        visible={open}
        animationType="slide"
        presentationStyle="formSheet"
        onRequestClose={() => {
          setOpen(false);
          setQuery("");
        }}
      >
        <View
          className="flex-1 bg-background"
          style={{ paddingTop: insets.top }}
        >
          <View className="flex-row items-center justify-between border-b border-border px-4 py-3">
            <ThemedText className="text-lg font-semibold">
              <FormattedMessage defaultMessage="Pick a country" />
            </ThemedText>
            <TouchableOpacity
              onPress={() => {
                setOpen(false);
                setQuery("");
              }}
              hitSlop={12}
            >
              <LucideIcon icon={X} size={22} />
            </TouchableOpacity>
          </View>
          <View className="px-4 pt-3">
            <View className="flex-row items-center gap-2 rounded border-2 border-border px-3 py-2">
              <LucideIcon icon={Search} size={18} muted />
              <TextInput
                value={query}
                onChangeText={setQuery}
                placeholder={intl.formatMessage({
                  defaultMessage: "Search country",
                })}
                className="flex-1 text-base text-foreground"
                autoCorrect={false}
                autoCapitalize="none"
              />
            </View>
          </View>
          <ScrollView
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            className="flex-1"
            contentContainerStyle={{
              paddingHorizontal: 16,
              paddingBottom: insets.bottom + 16,
            }}
          >
            {filtered.map((c) => {
              const isSelected = c.code === value;
              return (
                <TouchableOpacity
                  key={c.code}
                  onPress={() => {
                    onChange(c.code);
                    setQuery("");
                    setOpen(false);
                  }}
                  activeOpacity={0.7}
                  className="flex-row items-center gap-3 border-b border-border py-3"
                >
                  <ThemedText className="text-2xl">{c.emoji}</ThemedText>
                  <ThemedText
                    className={
                      isSelected
                        ? "flex-1 text-base font-semibold text-primary"
                        : "flex-1 text-base"
                    }
                  >
                    {getCountryName(c, locale)}
                  </ThemedText>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      </Modal>
    </>
  );
};

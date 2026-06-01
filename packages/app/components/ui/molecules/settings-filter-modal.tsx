import { Check, Trash2, X, type LucideIcon } from "lucide-react-native";
import { useState } from "react";
import { useIntl } from "react-intl";
import {
  Modal,
  Pressable,
  ScrollView,
  TouchableOpacity,
  View,
} from "react-native";
import { twMerge } from "tailwind-merge";

import {
  LucideIcon as LucideIconView,
  ThemedText,
  ThemedView,
} from "@/components/ui/atoms";
import { ActionRow } from "@/components/ui/molecules/action-row";

// Types live here now (formerly in `filterable-list-header.tsx`, which was
// removed as dead code). `Filter` is kept too for the few callers that
// render their own chip rows alongside the modal — same shape as before.
export interface Filter<T extends string = string> {
  type: T;
  name: string;
  onSelectDeselect?: T[];
  showDot?: boolean;
  icon?: LucideIcon;
}

export interface SettingsOption<T extends string = string> {
  type: T;
  name: string;
  icon?: LucideIcon;
  dotColor?: string;
  disabled?: boolean;
}

export interface SettingsGroup<T extends string = string> {
  title: string;
  options: SettingsOption<T>[];
  multiSelect?: boolean;
  icon?: LucideIcon;
}

interface Props<S extends string> {
  visible: boolean;
  onClose: () => void;
  groups: SettingsGroup<S>[];
  selected: S[];
  onChange: (selected: S[]) => void;
}

/**
 * Bottom-sheet style filter modal. Extracted from `FilterableListHeader` so
 * screens that build a custom header (e.g. the floating map header) can drive
 * the same modal without re-implementing the toggle + apply/clear flow.
 * Every dismissal path (X, backdrop, Android back, Apply) commits the
 * pending selection; the modal never silently discards changes.
 */
export function SettingsFilterModal<S extends string>({
  visible,
  onClose,
  groups,
  selected,
  onChange,
}: Props<S>) {
  // The pending-state body is split into a child so that mounting it with
  // `key={String(visible)}` resets the local `pending` each time the modal
  // opens — no effect needed.
  return (
    <SettingsFilterModalInner
      key={String(visible)}
      visible={visible}
      onClose={onClose}
      groups={groups}
      selected={selected}
      onChange={onChange}
    />
  );
}

function SettingsFilterModalInner<S extends string>({
  visible,
  onClose,
  groups,
  selected,
  onChange,
}: Props<S>) {
  const intl = useIntl();
  const [pending, setPending] = useState<S[]>(selected);

  const handleToggle = (type: S) => {
    const isSelected = pending.includes(type);
    if (isSelected) {
      setPending(pending.filter((s) => s !== type));
      return;
    }
    const group = groups.find((g) => g.options.some((o) => o.type === type));
    if (group && !group.multiSelect) {
      const others = group.options.map((o) => o.type).filter((t) => t !== type);
      setPending([...pending.filter((s) => !others.includes(s)), type]);
    } else {
      setPending([...pending, type]);
    }
  };

  const closeAndApply = () => {
    onChange(pending);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={closeAndApply}
    >
      <View className="flex-1 bg-black/50">
        <Pressable className="flex-1" onPress={closeAndApply} />
        <View className="h-[90%]">
          <ThemedView className="flex-1 rounded-t-3xl">
            <View className="flex-row items-center justify-between px-6 pb-4 pt-6">
              <ThemedText className="text-2xl font-bold">
                {intl.formatMessage({ defaultMessage: "Filters" })}
              </ThemedText>
              <TouchableOpacity onPress={closeAndApply}>
                <LucideIconView icon={X} size={24} />
              </TouchableOpacity>
            </View>

            <ScrollView
              contentContainerClassName="px-6 pb-4"
              showsVerticalScrollIndicator={false}
            >
              {groups.map((group) => (
                <View key={group.title} className="mb-4">
                  <View className="mb-2 flex-row items-center gap-1.5">
                    {group.icon && (
                      <LucideIconView icon={group.icon} size={14} muted />
                    )}
                    <ThemedText className="text-sm font-semibold text-muted-foreground">
                      {group.title}
                    </ThemedText>
                  </View>
                  <View className="flex-row flex-wrap gap-2">
                    {group.options.map((option) => {
                      const isSelected = pending.includes(option.type);
                      const isDisabled = option.disabled ?? false;
                      return (
                        <Pressable
                          key={option.type}
                          disabled={isDisabled}
                          onPress={() => handleToggle(option.type)}
                          className={twMerge(
                            "flex-row items-center gap-1.5 rounded px-3 py-2",
                            isSelected ? "bg-primary" : "bg-border",
                            isDisabled && "opacity-50",
                          )}
                        >
                          {option.dotColor && (
                            <View
                              className="size-3 rounded-full"
                              style={{ backgroundColor: option.dotColor }}
                            />
                          )}
                          {option.icon && (
                            <LucideIconView
                              icon={option.icon}
                              size={16}
                              color={isSelected ? "white" : undefined}
                            />
                          )}
                          <ThemedText
                            className={twMerge(
                              "font-medium",
                              isSelected && "text-white",
                            )}
                          >
                            {option.name}
                          </ThemedText>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>
              ))}
            </ScrollView>

            <View className="gap-1 border-t border-border px-6 pb-10 pt-3">
              <ActionRow
                icon={Check}
                intent="emerald"
                size="lg"
                onPress={closeAndApply}
              >
                {intl.formatMessage({ defaultMessage: "Apply filters" })}
              </ActionRow>
              <ActionRow
                icon={Trash2}
                intent="danger"
                size="lg"
                disabled={pending.length === 0}
                onPress={() => setPending([])}
                className={twMerge(pending.length === 0 && "opacity-50")}
              >
                {intl.formatMessage({ defaultMessage: "Clear filters" })}
              </ActionRow>
            </View>
          </ThemedView>
        </View>
      </View>
    </Modal>
  );
}

import { SlidersHorizontal, X, type LucideIcon } from "lucide-react-native";
import { ReactNode, useState } from "react";
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
  ThemedView,
  ThemedText,
  SearchInput,
  LucideIcon as LucideIconView,
} from "@/components/ui/atoms";

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
}

interface FilterableListHeaderProps<
  T extends string = string,
  S extends string = string,
> {
  title: string | ReactNode;
  count?: number;
  showCount?: boolean;
  showSearch?: boolean;
  onSearchChange?: (text: string) => void;
  onSearchFocus?: () => void;
  filters?: Filter<T>[];
  filtersSelected?: T[];
  onFiltersChange?: (selected: T[]) => void;
  settingsGroups?: SettingsGroup<S>[];
  settingsSelected?: S[];
  onSettingsChange?: (selected: S[]) => void;
  className?: string;
}

export function FilterableListHeader<
  T extends string = string,
  S extends string = string,
>({
  title,
  count,
  showCount = true,
  showSearch = true,
  onSearchChange,
  onSearchFocus,
  filters = [],
  filtersSelected = [],
  onFiltersChange,
  settingsGroups = [],
  settingsSelected = [],
  onSettingsChange,
  className,
}: FilterableListHeaderProps<T, S>) {
  const intl = useIntl();
  const [showSettings, setShowSettings] = useState(false);

  const handleSettingToggle = (settingType: S) => {
    if (!onSettingsChange) return;

    const isSelected = settingsSelected.includes(settingType);
    if (isSelected) {
      onSettingsChange(settingsSelected.filter((s) => s !== settingType));
    } else {
      // Find the group this setting belongs to and deselect others in the same group
      const group = settingsGroups.find((g) =>
        g.options.some((o) => o.type === settingType),
      );
      if (group) {
        const otherOptionsInGroup = group.options
          .map((o) => o.type)
          .filter((t) => t !== settingType);
        const newSettings = settingsSelected.filter(
          (s) => !otherOptionsInGroup.includes(s),
        );
        onSettingsChange([...newSettings, settingType]);
      } else {
        onSettingsChange([...settingsSelected, settingType]);
      }
    }
  };

  const handleFilterPress = (filterType: T, onSelectDeselect?: T[]) => {
    if (!onFiltersChange) return;

    const isSelected = filtersSelected.includes(filterType);

    if (isSelected) {
      // Deselect the filter
      onFiltersChange(filtersSelected.filter((t) => t !== filterType));
    } else {
      // Select the filter and deselect mutually exclusive ones
      const newFilters = onSelectDeselect
        ? filtersSelected.filter((f) => !onSelectDeselect.includes(f))
        : filtersSelected;
      onFiltersChange([...newFilters, filterType]);
    }
  };

  return (
    <ThemedView className={twMerge("pb-2", className)}>
      {/* Title with optional count */}
      <ThemedText className="mx-6 mb-2 text-4xl font-bold">
        {title}{" "}
        {showCount && count !== undefined && (
          <ThemedText className="text-lg font-semibold text-muted-foreground">
            {count}
          </ThemedText>
        )}
      </ThemedText>

      {/* Search Input */}
      {showSearch && onSearchChange && (
        <SearchInput
          className="mx-6 mb-2"
          onChangeText={onSearchChange}
          onFocus={onSearchFocus}
        />
      )}

      {/* Settings Modal */}
      <Modal
        visible={showSettings}
        transparent
        animationType="fade"
        onRequestClose={() => setShowSettings(false)}
      >
        <Pressable
          className="flex-1 bg-black/50"
          onPress={() => setShowSettings(false)}
        >
          <View className="flex-1 justify-end">
            <Pressable onPress={(e) => e.stopPropagation()}>
              <ThemedView className="rounded-t-3xl px-6 pb-10 pt-6">
                <View className="mb-4 flex-row items-center justify-between">
                  <ThemedText className="text-2xl font-bold">
                    {intl.formatMessage({ defaultMessage: "Filters" })}
                  </ThemedText>
                  <TouchableOpacity onPress={() => setShowSettings(false)}>
                    <LucideIconView icon={X} size={24} />
                  </TouchableOpacity>
                </View>

                {settingsGroups.map((group) => (
                  <View key={group.title} className="mb-4">
                    <ThemedText className="mb-2 text-sm font-semibold text-muted-foreground">
                      {group.title}
                    </ThemedText>
                    <View className="flex-row flex-wrap gap-2">
                      {group.options.map((option) => {
                        const isSelected = settingsSelected.includes(
                          option.type,
                        );
                        const isDisabled = option.disabled ?? false;
                        return (
                          <Pressable
                            key={option.type}
                            disabled={isDisabled}
                            onPress={() => handleSettingToggle(option.type)}
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

                <Pressable
                  disabled={settingsSelected.length === 0}
                  onPress={() => {
                    onSettingsChange?.([]);
                    setShowSettings(false);
                  }}
                  className={twMerge(
                    "mt-2 items-center rounded bg-border py-3",
                    settingsSelected.length === 0 && "opacity-50",
                  )}
                >
                  <ThemedText className="font-medium">
                    {intl.formatMessage({
                      defaultMessage: "Clear all filters",
                    })}
                  </ThemedText>
                </Pressable>
              </ThemedView>
            </Pressable>
          </View>
        </Pressable>
      </Modal>

      {/* Filter Chips */}
      {(filters.length > 0 || settingsGroups.length > 0) && (
        <ScrollView
          keyboardShouldPersistTaps="handled"
          showsHorizontalScrollIndicator={false}
          contentContainerClassName="pl-6 pr-4"
          horizontal
        >
          {filters.map(({ type, name, onSelectDeselect, showDot, icon }) => {
            const isSelected = filtersSelected.includes(type);
            return (
              <Pressable
                className={twMerge(
                  "rounded flex-row gap-1 items-center py-2 px-2.5 mr-1 disabled:opacity-50",
                  isSelected ? "bg-primary" : "bg-border",
                )}
                onPress={() => handleFilterPress(type, onSelectDeselect)}
                key={String(type)}
              >
                {showDot && (
                  <View
                    className={twMerge(
                      "bg-primary rounded-full size-3",
                      isSelected && "bg-white",
                    )}
                  />
                )}
                {icon && (
                  <LucideIconView
                    icon={icon}
                    size={16}
                    color={isSelected ? "white" : undefined}
                  />
                )}
                <ThemedText
                  className={twMerge(
                    "font-medium text-foreground",
                    isSelected && "text-white",
                  )}
                >
                  {name}
                </ThemedText>
              </Pressable>
            );
          })}

          {/* Settings Button as Pill */}
          {settingsGroups.length > 0 && (
            <Pressable
              onPress={() => setShowSettings(true)}
              className={twMerge(
                "rounded flex-row gap-1 items-center py-2 px-2.5 mr-1",
                settingsSelected.length > 0 ? "bg-primary" : "bg-border",
              )}
            >
              <LucideIconView
                icon={SlidersHorizontal}
                size={16}
                color={settingsSelected.length > 0 ? "white" : undefined}
              />
              <ThemedText
                className={twMerge(
                  "font-medium text-foreground",
                  settingsSelected.length > 0 && "text-white",
                )}
              >
                {intl.formatMessage({ defaultMessage: "Filters" })}
              </ThemedText>
              {settingsSelected.length > 0 && (
                <View className="ml-0.5 size-5 items-center justify-center rounded-full bg-white">
                  <ThemedText className="text-xs font-bold text-primary">
                    {settingsSelected.length}
                  </ThemedText>
                </View>
              )}
            </Pressable>
          )}
        </ScrollView>
      )}
    </ThemedView>
  );
}

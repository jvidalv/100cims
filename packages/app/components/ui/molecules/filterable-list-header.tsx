import {
  Check,
  CircleDot,
  SlidersHorizontal,
  Trash2,
  X,
  type LucideIcon,
} from "lucide-react-native";
import { ReactNode, useEffect, useState } from "react";
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
import { ActionRow } from "@/components/ui/molecules/action-row";

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

interface FilterableListHeaderProps<
  T extends string = string,
  S extends string = string,
> {
  /** Big heading on top. Omit when the screen renders its own header
   *  (e.g. via BlurredScreenHeader) and only wants the search + chips. */
  title?: string | ReactNode;
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
  // Optional element rendered inside the horizontal chip row, before the chips.
  // Good spot for an action button that should sit next to the filter chips.
  leadingElement?: ReactNode;
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
  leadingElement,
  className,
}: FilterableListHeaderProps<T, S>) {
  const intl = useIntl();
  const [showSettings, setShowSettings] = useState(false);
  const [pending, setPending] = useState<S[]>(settingsSelected);

  useEffect(() => {
    if (showSettings) setPending(settingsSelected);
  }, [showSettings, settingsSelected]);

  const handleSettingToggle = (settingType: S) => {
    const isSelected = pending.includes(settingType);
    if (isSelected) {
      setPending(pending.filter((s) => s !== settingType));
      return;
    }
    const group = settingsGroups.find((g) =>
      g.options.some((o) => o.type === settingType),
    );
    if (group && !group.multiSelect) {
      const otherOptionsInGroup = group.options
        .map((o) => o.type)
        .filter((t) => t !== settingType);
      const next = pending.filter((s) => !otherOptionsInGroup.includes(s));
      setPending([...next, settingType]);
    } else {
      setPending([...pending, settingType]);
    }
  };

  // Every way of dismissing the modal (X, backdrop tap, Android back, the
  // Apply button) commits the pending selection — closing never discards it.
  const closeAndApply = () => {
    onSettingsChange?.(pending);
    setShowSettings(false);
  };

  const handleClear = () => {
    setPending([]);
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
      {title !== undefined && (
        <ThemedText className="mx-6 mb-2 text-4xl font-bold">
          {title}{" "}
          {showCount && count !== undefined && (
            <ThemedText className="text-lg font-semibold text-muted-foreground">
              {count}
            </ThemedText>
          )}
        </ThemedText>
      )}

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
                  {settingsGroups.map((group) => (
                    <View key={group.title} className="mb-4">
                      <View className="mb-2 flex-row items-center gap-1.5">
                        {group.icon && (
                          <LucideIconView
                            icon={group.icon}
                            size={14}
                            muted
                          />
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
                    onPress={handleClear}
                    className={twMerge(
                      pending.length === 0 && "opacity-50",
                    )}
                  >
                    {intl.formatMessage({ defaultMessage: "Clear filters" })}
                  </ActionRow>
                </View>
              </ThemedView>
          </View>
        </View>
      </Modal>

      {/* Filter Chips */}
      {(filters.length > 0 ||
        settingsGroups.length > 0 ||
        leadingElement) && (
        <ScrollView
          keyboardShouldPersistTaps="handled"
          showsHorizontalScrollIndicator={false}
          contentContainerClassName="pl-6 pr-4 items-center gap-2"
          horizontal
        >
          {leadingElement}
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
                  <LucideIconView
                    icon={CircleDot}
                    size={16}
                    color={isSelected ? "white" : undefined}
                    primary={!isSelected}
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

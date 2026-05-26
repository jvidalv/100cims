import {
  CircleDot,
  SlidersHorizontal,
  type LucideIcon,
} from "lucide-react-native";
import { ReactNode, useState } from "react";
import { useIntl } from "react-intl";
import { Pressable, ScrollView, View } from "react-native";
import { twMerge } from "tailwind-merge";

import {
  LucideIcon as LucideIconView,
  SearchInput,
  ThemedText,
  ThemedView,
} from "@/components/ui/atoms";
import { SettingsFilterModal } from "@/components/ui/molecules/settings-filter-modal";

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

      <SettingsFilterModal
        visible={showSettings}
        onClose={() => setShowSettings(false)}
        groups={settingsGroups}
        selected={settingsSelected}
        onChange={(next) => onSettingsChange?.(next)}
      />

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

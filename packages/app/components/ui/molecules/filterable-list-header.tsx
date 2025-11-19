import { analytics } from "@jvidalv/react-analytics";
import { ReactNode } from "react";
import { Pressable, ScrollView, View } from "react-native";
import { twMerge } from "tailwind-merge";

import {
  ThemedView,
  ThemedText,
  SearchInput,
  Icon,
} from "@/components/ui/atoms";

export interface Filter<T extends string = string> {
  type: T;
  name: string;
  onSelectDeselect?: T[];
  showDot?: boolean;
  icon?: string;
}

interface FilterableListHeaderProps<T extends string = string> {
  title: string | ReactNode;
  count?: number;
  showCount?: boolean;
  showSearch?: boolean;
  onSearchChange?: (text: string) => void;
  onSearchFocus?: () => void;
  filters?: Filter<T>[];
  filtersSelected?: T[];
  onFiltersChange?: (selected: T[]) => void;
  className?: string;
}

export function FilterableListHeader<T extends string = string>({
  title,
  count,
  showCount = true,
  showSearch = true,
  onSearchChange,
  onSearchFocus,
  filters = [],
  filtersSelected = [],
  onFiltersChange,
  className,
}: FilterableListHeaderProps<T>) {
  const handleFilterPress = (filterType: T, onSelectDeselect?: T[]) => {
    if (!onFiltersChange) return;

    const isSelected = filtersSelected.includes(filterType);

    if (isSelected) {
      // Deselect the filter
      onFiltersChange(filtersSelected.filter((t) => t !== filterType));
    } else {
      analytics.action(`mountain-filter-${filterType}`);
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

      {/* Filter Chips */}
      {filters.length > 0 && (
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
                  "rounded-lg flex-row gap-1 items-center py-2 px-2.5 mr-1 disabled:opacity-50",
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
                  <Icon
                    name={icon as any}
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
        </ScrollView>
      )}
    </ThemedView>
  );
}

import { Bike, Footprints, SportShoe } from "lucide-react-native";
import { useIntl } from "react-intl";
import { TouchableOpacity, View } from "react-native";
import { twMerge } from "tailwind-merge";

import { LucideIcon, ThemedText } from "@/components/ui/atoms";

import type { PlanType } from "@/domains/plan/plan.api";

const OPTIONS: { value: PlanType; icon: typeof Bike }[] = [
  { value: "hike", icon: Footprints },
  { value: "trail", icon: SportShoe },
  { value: "bike", icon: Bike },
];

type Props = {
  value: PlanType;
  onChange: (type: PlanType) => void;
};

export const PlanTypeChips = ({ value, onChange }: Props) => {
  const intl = useIntl();
  const labels: Record<PlanType, string> = {
    hike: intl.formatMessage({ defaultMessage: "Hike" }),
    trail: intl.formatMessage({ defaultMessage: "Trail" }),
    bike: intl.formatMessage({ defaultMessage: "Bike" }),
  };

  return (
    <View className="flex-row gap-2">
      {OPTIONS.map(({ value: optionValue, icon }) => {
        const selected = value === optionValue;
        return (
          <TouchableOpacity
            key={optionValue}
            onPress={() => onChange(optionValue)}
            className={twMerge(
              "flex-1 flex-row items-center justify-center gap-2 rounded border-2 border-border py-3",
              selected && "border-primary bg-primary/10",
            )}
          >
            <LucideIcon
              icon={icon}
              size={18}
              primary={selected}
              muted={!selected}
            />
            <ThemedText
              className={twMerge(
                "font-medium",
                selected ? "text-primary" : "text-muted-foreground",
              )}
            >
              {labels[optionValue]}
            </ThemedText>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

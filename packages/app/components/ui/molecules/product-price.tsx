import { View } from "react-native";
import { twMerge } from "tailwind-merge";

import { ThemedText } from "@/components/ui/atoms";

type Props = {
  price: number;
  discountedPrice: number | null;
  className?: string;
  strikethroughClassName?: string;
};

export const ProductPrice = ({
  price,
  discountedPrice,
  className,
  strikethroughClassName,
}: Props) => (
  <View className="flex-row items-baseline gap-2">
    {discountedPrice != null && (
      <ThemedText
        className={twMerge(
          "text-muted-foreground/50 line-through",
          strikethroughClassName,
        )}
      >
        {price}€
      </ThemedText>
    )}
    <ThemedText className={className}>
      {discountedPrice ?? price}€
    </ThemedText>
  </View>
);

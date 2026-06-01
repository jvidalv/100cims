import { useRouter } from "expo-router";
import { ShoppingCart } from "lucide-react-native";
import { useIntl } from "react-intl";
import { TouchableOpacity, View } from "react-native";

import { LucideIcon, ThemedText } from "@/components/ui/atoms";
import { useCartCount } from "@/domains/merch/cart";

// Header-right cart affordance. Renders the cart icon with a small count
// pill; taps through to /shop/cart. Callers control whether to render it —
// the cart screen itself simply doesn't pass it as a `rightElement`.
export const CartHeaderButton = () => {
  const router = useRouter();
  const intl = useIntl();
  const count = useCartCount();

  return (
    <TouchableOpacity
      onPress={() => router.push("/shop/cart")}
      hitSlop={16}
      accessibilityRole="button"
      accessibilityLabel={intl.formatMessage({ defaultMessage: "Open cart" })}
    >
      <View>
        <LucideIcon icon={ShoppingCart} size={26} primary />
        {count > 0 && (
          <View className="absolute -right-2 -top-1 min-w-5 items-center justify-center rounded-full bg-primary px-1">
            <ThemedText className="text-xs font-bold text-white">
              {count}
            </ThemedText>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

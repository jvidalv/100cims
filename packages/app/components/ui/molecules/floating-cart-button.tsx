import { useRouter, useSegments } from "expo-router";
import { ShoppingCart } from "lucide-react-native";
import { useEffect, useState } from "react";
import { TouchableOpacity, View } from "react-native";

import { useAuth } from "@/components/providers/auth-provider";
import { LucideIcon, ThemedText } from "@/components/ui/atoms";
import { loadCart, subscribeCart, type CartItem } from "@/domains/merch/cart";

export function FloatingCartButton() {
  const router = useRouter();
  const segments = useSegments();
  const { isAuthenticated } = useAuth();
  const [cart, setCart] = useState<CartItem[]>([]);

  useEffect(() => {
    void loadCart().then(setCart);
    return subscribeCart(setCart);
  }, []);

  const count = cart.reduce((sum, item) => sum + item.qty, 0);
  const isShopRoute = segments[0] === "shop";

  if (!isAuthenticated || count === 0 || isShopRoute) return null;

  return (
    <TouchableOpacity
      onPress={() => router.push("/shop/cart")}
      activeOpacity={0.85}
      className="absolute bottom-8 right-6 size-14 items-center justify-center rounded border-2 border-border bg-background shadow-lg"
      style={{
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 6,
      }}
    >
      <LucideIcon icon={ShoppingCart} size={22} />
      <View className="absolute -right-1.5 -top-1.5 min-w-5 items-center justify-center rounded-full border-2 border-background bg-primary px-1">
        <ThemedText className="text-[11px] font-bold text-white">
          {count}
        </ThemedText>
      </View>
    </TouchableOpacity>
  );
}

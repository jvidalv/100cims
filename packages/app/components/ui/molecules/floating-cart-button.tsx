import { useRouter, useSegments } from "expo-router";
import { ShoppingCart } from "lucide-react-native";
import { useEffect, useState } from "react";
import { TouchableOpacity } from "react-native";

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

  const count = cart.length;
  const isCartRoute = segments[0] === "shop" && segments[1] === "cart";

  if (!isAuthenticated || count === 0 || isCartRoute) return null;

  return (
    <TouchableOpacity
      onPress={() => router.push("/shop/cart")}
      activeOpacity={0.85}
      className="absolute bottom-8 right-6 h-14 flex-row items-center justify-center gap-1.5 rounded border-2 border-border bg-background px-4 shadow-lg"
      style={{
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 6,
      }}
    >
      <LucideIcon icon={ShoppingCart} size={22} />
      <ThemedText className="text-base font-bold text-primary">
        {count}
      </ThemedText>
    </TouchableOpacity>
  );
}

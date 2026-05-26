import { useRouter, useSegments } from "expo-router";
import { ShoppingCart } from "lucide-react-native";
import { useEffect, useState } from "react";
import { Platform, TouchableOpacity } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAuth } from "@/components/providers/auth-provider";
import { LucideIcon, ThemedText } from "@/components/ui/atoms";
import { loadCart, subscribeCart, type CartItem } from "@/domains/merch/cart";

// Approximate NativeTabs bar heights. iOS UITabBar is 49pt; Android Material
// bottom nav is ~56dp. This component renders at the app root (outside any
// NativeTabs subtree), so `useSafeAreaInsets().bottom` here returns only
// the home-bar / gesture-area inset and we have to add the tab bar height
// manually. (Inside a NativeTabs child, `.bottom` would already include it
// — see app SKILL.md.)
const NATIVE_TAB_BAR_HEIGHT = Platform.OS === "ios" ? 49 : 56;

export function FloatingCartButton() {
  const router = useRouter();
  const segments = useSegments();
  const { isAuthenticated } = useAuth();
  const insets = useSafeAreaInsets();
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
      className="absolute right-6 h-14 flex-row items-center justify-center gap-1.5 rounded border-2 border-border bg-background px-4 shadow-lg"
      style={{
        bottom: insets.bottom + NATIVE_TAB_BAR_HEIGHT + 12,
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

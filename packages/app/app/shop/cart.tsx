import { Redirect, useFocusEffect, useRouter } from "expo-router";
import {
  BadgeCheck,
  Minus,
  Plus,
  ShoppingBag,
} from "lucide-react-native";
import { useCallback, useMemo, useState } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { Alert, Image, ScrollView, TouchableOpacity, View } from "react-native";

import { useAuth } from "@/components/providers/auth-provider";
import {
  ActivityIndicator,
  Button,
  LucideIcon,
  ThemedText,
} from "@/components/ui/atoms";
import { ScreenHeader } from "@/components/ui/molecules";
import {
  clearCart,
  loadCart,
  updateQty,
  type CartItem,
} from "@/domains/merch/cart";
import { useMerch } from "@/domains/merch/merch.api";
import {
  useSubmitSuggestionMutation,
  useUserMe,
} from "@/domains/user/user.api";

export default function ShopCartScreen() {
  const intl = useIntl();
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const { data: merch } = useMerch();
  const { data: me } = useUserMe();
  const { mutateAsync: submitSuggestion, isPending } =
    useSubmitSuggestionMutation();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isSubmitted, setIsSubmitted] = useState(false);

  useFocusEffect(
    useCallback(() => {
      void loadCart().then(setCart);
    }, []),
  );

  const merchBySlug = useMemo(() => {
    const map = new Map<string, NonNullable<typeof merch>[number]>();
    for (const product of merch ?? []) map.set(product.slug, product);
    return map;
  }, [merch]);

  const lines = useMemo(() => {
    if (!merch) return [];
    return cart
      .map((item) => {
        const product = merchBySlug.get(item.slug);
        return product ? { ...item, product } : null;
      })
      .filter((l): l is NonNullable<typeof l> => l !== null);
  }, [cart, merch, merchBySlug]);

  const total = lines.reduce(
    (sum, line) => sum + line.product.price * line.qty,
    0,
  );

  if (!isAuthenticated) {
    return <Redirect href="/join" />;
  }

  const onIncrement = async (item: CartItem) => {
    setCart(
      await updateQty(
        { slug: item.slug, size: item.size, color: item.color },
        item.qty + 1,
      ),
    );
  };

  const onDecrement = async (item: CartItem) => {
    setCart(
      await updateQty(
        { slug: item.slug, size: item.size, color: item.color },
        item.qty - 1,
      ),
    );
  };

  const onSubmit = async () => {
    if (lines.length === 0) return;
    const itemLines = lines
      .map((l) => {
        const color = l.color ? ` · ${l.color}` : "";
        const size = l.size ? ` · ${l.size}` : "";
        const qty = l.qty > 1 ? ` × ${l.qty}` : "";
        return `- ${l.product.name}${color}${size}${qty} (${l.product.price}€)`;
      })
      .join("\n");
    const message =
      `[MERCH ORDER]\n` +
      `From: ${me?.email ?? "unknown"}\n` +
      `Total: ${total}€\n\n` +
      `Items:\n${itemLines}`;

    try {
      await submitSuggestion({ suggestion: message });
      await clearCart();
      setCart([]);
      setIsSubmitted(true);
    } catch {
      Alert.alert(
        intl.formatMessage({ defaultMessage: "Something went wrong" }),
      );
    }
  };

  return (
    <View className="flex-1 bg-background">
      <ScreenHeader>
        <FormattedMessage defaultMessage="Your cart" />
      </ScreenHeader>

      {isSubmitted ? (
        <View className="flex-1 items-center justify-center gap-4 px-6">
          <View className="size-16 items-center justify-center rounded-full bg-emerald-500/15">
            <LucideIcon icon={BadgeCheck} size={32} color="#10b981" />
          </View>
          <ThemedText className="text-center text-xl font-semibold">
            <FormattedMessage defaultMessage="Order sent!" />
          </ThemedText>
          <ThemedText className="text-center text-muted-foreground">
            <FormattedMessage defaultMessage="Thanks for supporting Cims. We will contact you soon." />
          </ThemedText>
          <Button onPress={() => router.replace("/shop")}>
            <FormattedMessage defaultMessage="Back to shop" />
          </Button>
        </View>
      ) : !merch && cart.length > 0 ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator />
        </View>
      ) : lines.length === 0 ? (
        <View className="flex-1 items-center justify-center gap-4 px-6">
          <View className="size-16 items-center justify-center rounded-full bg-border">
            <LucideIcon icon={ShoppingBag} size={28} muted />
          </View>
          <ThemedText className="text-center text-muted-foreground">
            <FormattedMessage defaultMessage="Your cart is empty." />
          </ThemedText>
          <Button onPress={() => router.replace("/shop")}>
            <FormattedMessage defaultMessage="Browse the shop" />
          </Button>
        </View>
      ) : (
        <>
          <ScrollView
            className="flex-1"
            contentContainerClassName="px-6 pb-40 pt-4 gap-3"
            showsVerticalScrollIndicator={false}
          >
            {lines.map((line) => {
              const variant = line.color
                ? line.product.variants.find((v) => v.color === line.color)
                : null;
              const thumb =
                variant?.imageUrls[0] ?? line.product.imageUrls[0];
              const capitalizedColor = line.color
                ? line.color[0].toUpperCase() + line.color.slice(1)
                : null;
              return (
              <View
                key={`${line.slug}-${line.size ?? "_"}-${line.color ?? "_"}`}
                className="flex-row items-center gap-3 rounded border-2 border-border p-2"
              >
                {thumb ? (
                  <Image
                    source={{
                      uri: thumb,
                      cache: "force-cache",
                    }}
                    className="size-20 rounded bg-border"
                    resizeMode="cover"
                  />
                ) : (
                  <View className="size-20 items-center justify-center rounded bg-border">
                    <LucideIcon icon={ShoppingBag} size={24} muted />
                  </View>
                )}
                <View className="flex-1 gap-1">
                  <ThemedText className="font-semibold" numberOfLines={1}>
                    {line.product.name}
                  </ThemedText>
                  {capitalizedColor && (
                    <ThemedText className="text-xs text-muted-foreground">
                      <FormattedMessage
                        defaultMessage="Color: {color}"
                        values={{ color: capitalizedColor }}
                      />
                    </ThemedText>
                  )}
                  {line.size && (
                    <ThemedText className="text-xs text-muted-foreground">
                      <FormattedMessage
                        defaultMessage="Size: {size}"
                        values={{ size: line.size }}
                      />
                    </ThemedText>
                  )}
                  <ThemedText className="text-sm font-medium">
                    {line.product.price * line.qty}€
                  </ThemedText>
                </View>
                <View className="flex-row items-center gap-2 rounded border border-border">
                  <TouchableOpacity
                    onPress={() => onDecrement(line)}
                    className="px-3 py-2"
                  >
                    <LucideIcon icon={Minus} size={20} />
                  </TouchableOpacity>
                  <ThemedText className="min-w-5 text-center text-base font-semibold">
                    {line.qty}
                  </ThemedText>
                  <TouchableOpacity
                    onPress={() => onIncrement(line)}
                    className="px-3 py-2"
                  >
                    <LucideIcon icon={Plus} size={20} />
                  </TouchableOpacity>
                </View>
              </View>
              );
            })}
          </ScrollView>

          <View className="absolute bottom-0 left-0 right-0 border-t border-border bg-background px-6 pb-10 pt-4">
            <View className="mb-3 flex-row items-center justify-between">
              <ThemedText className="text-lg font-semibold">
                <FormattedMessage defaultMessage="Total" />
              </ThemedText>
              <ThemedText className="text-2xl font-bold">{total}€</ThemedText>
            </View>
            <Button onPress={onSubmit} isLoading={isPending}>
              <FormattedMessage defaultMessage="Send order" />
            </Button>
            <ThemedText className="mt-2 text-center text-xs text-muted-foreground">
              <FormattedMessage
                defaultMessage="We'll reach you at {email} to arrange payment + shipping."
                values={{ email: me?.email ?? "—" }}
              />
            </ThemedText>
          </View>
        </>
      )}
    </View>
  );
}

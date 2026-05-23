import { Redirect, useFocusEffect, useRouter } from "expo-router";
import {
  BadgeCheck,
  Minus,
  Plus,
  Send,
  ShoppingBag,
  Sparkles,
  Store,
  Tag,
  X,
} from "lucide-react-native";
import { useCallback, useMemo, useState } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { Alert, Image, ScrollView, TouchableOpacity, View } from "react-native";
import Animated, {
  FadeIn,
  FadeInDown,
  ZoomIn,
} from "react-native-reanimated";

import { useAuth } from "@/components/providers/auth-provider";
import {
  ActivityIndicator,
  Button,
  LucideIcon,
  ThemedText,
  ThemedTextInput,
} from "@/components/ui/atoms";
import {
  ActionRow,
  PhoneNumberPromptDialog,
  ProductPrice,
  ScreenHeader,
} from "@/components/ui/molecules";
import { Colors } from "@/constants/colors";
import {
  clearCart,
  loadCart,
  updateQty,
  type CartItem,
} from "@/domains/merch/cart";
import { useMerch } from "@/domains/merch/merch.api";
import {
  useSubmitSuggestionMutation,
  useUnlockableUnlock,
  useUpdateUserMeMutation,
  useUserMe,
} from "@/domains/user/user.api";

const APPLE_RELAY_DOMAIN = "@privaterelay.appleid.com";
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const isAppleRelayEmail = (email: string | null | undefined) =>
  !!email && email.toLowerCase().endsWith(APPLE_RELAY_DOMAIN);

export default function ShopCartScreen() {
  const intl = useIntl();
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const { data: merch } = useMerch();
  const { data: me } = useUserMe();
  const { mutateAsync: submitSuggestion, isPending } =
    useSubmitSuggestionMutation();
  const { mutate: unlock } = useUnlockableUnlock();
  const { mutateAsync: updateUserMe, isPending: isSavingPhone } =
    useUpdateUserMeMutation();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [contactEmailOverride, setContactEmailOverride] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isPhonePromptOpen, setIsPhonePromptOpen] = useState(false);
  const [couponCode, setCouponCode] = useState("");
  const [couponOpen, setCouponOpen] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);

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
    (sum, line) =>
      sum + (line.product.discountedPrice ?? line.product.price) * line.qty,
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
        const unit = l.product.discountedPrice ?? l.product.price;
        return `- ${l.product.name}${color}${size}${qty} (${unit}€)`;
      })
      .join("\n");
    const trimmedOverride = contactEmailOverride.trim();
    const validOverride =
      trimmedOverride && EMAIL_RE.test(trimmedOverride) ? trimmedOverride : null;
    const relayEmail = me?.email ?? "unknown";
    const effectiveEmail = validOverride ?? relayEmail;
    const hiddenLine =
      validOverride && isAppleRelayEmail(me?.email)
        ? `Apple hidden email: ${relayEmail}\n`
        : "";
    const couponLine = appliedCoupon ? `Coupon: ${appliedCoupon}\n` : "";
    const message =
      `[MERCH ORDER]\n` +
      `From: ${effectiveEmail}\n` +
      hiddenLine +
      couponLine +
      `Total: ${total}€\n\n` +
      `Items:\n${itemLines}`;

    try {
      await submitSuggestion({ suggestion: message });
      unlock("merch");
      await clearCart();
      setCart([]);
      setAppliedCoupon(null);
      setCouponCode("");
      setCouponOpen(false);
      setIsSubmitted(true);
      // Only ask when we don't already have a phone on file — we re-ask on
      // every order since having a number attached to a concrete purchase is
      // high-value for support, unlike push which you only want once.
      if (!me?.phoneNumber) setIsPhonePromptOpen(true);
    } catch {
      Alert.alert(
        intl.formatMessage({ defaultMessage: "Something went wrong" }),
      );
    }
  };

  const handleSavePhone = async (phoneNumber: string) => {
    try {
      await updateUserMe({ phoneNumber });
      setIsPhonePromptOpen(false);
    } catch {
      setIsPhonePromptOpen(false);
    }
  };

  return (
    <View className="flex-1 bg-background">
      <ScreenHeader>
        <FormattedMessage defaultMessage="Your cart" />
      </ScreenHeader>

      {isSubmitted ? (
        <View className="flex-1 items-center justify-center gap-6 px-8">
          <Animated.View
            entering={ZoomIn.springify().damping(12)}
            className="relative size-32 items-center justify-center"
          >
            <Animated.View
              entering={FadeIn.delay(150).duration(400)}
              className="absolute inset-0 rounded-full bg-emerald-500/5"
            />
            <Animated.View
              entering={FadeIn.delay(250).duration(400)}
              className="absolute inset-3 rounded-full bg-emerald-500/10"
            />
            <Animated.View
              entering={FadeIn.delay(350).duration(400)}
              className="absolute inset-6 rounded-full bg-emerald-500/20"
            />
            <LucideIcon icon={BadgeCheck} size={48} color="#10b981" />
            <Animated.View
              entering={FadeIn.delay(500).duration(300)}
              className="absolute -right-1 -top-1"
            >
              <LucideIcon icon={Sparkles} size={20} color="#10b981" />
            </Animated.View>
          </Animated.View>

          <Animated.View
            entering={FadeInDown.delay(200).duration(400)}
            className="gap-2"
          >
            <ThemedText className="text-center text-2xl font-bold">
              <FormattedMessage defaultMessage="Order sent!" />
            </ThemedText>
            <ThemedText className="text-center text-muted-foreground">
              <FormattedMessage defaultMessage="Thanks for supporting Cims. We will contact you soon." />
            </ThemedText>
          </Animated.View>

          <Animated.View
            entering={FadeInDown.delay(400).duration(400)}
            className="w-full max-w-sm gap-1 rounded border-2 border-border bg-muted/30 p-4"
          >
            <ActionRow
              icon={Store}
              intent="primary"
              size="lg"
              onPress={() => router.replace("/shop")}
            >
              <FormattedMessage defaultMessage="Back to shop" />
            </ActionRow>
            <ActionRow
              icon={ShoppingBag}
              size="lg"
              onPress={() => router.replace("/")}
            >
              <FormattedMessage defaultMessage="Go home" />
            </ActionRow>
          </Animated.View>
        </View>
      ) : !merch && cart.length > 0 ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator />
        </View>
      ) : lines.length === 0 ? (
        <View className="flex-1 items-center justify-center gap-6 px-8">
          <View className="size-28 items-center justify-center rounded-3xl border-2 border-primary bg-primary/10">
            <LucideIcon
              icon={ShoppingBag}
              size={52}
              color={Colors.light.primary}
            />
          </View>
          <View className="gap-2">
            <ThemedText className="text-center text-2xl font-bold">
              <FormattedMessage defaultMessage="Your cart is empty." />
            </ThemedText>
            <ThemedText className="text-center text-muted-foreground">
              <FormattedMessage defaultMessage="Pick up some merch and support the app." />
            </ThemedText>
          </View>
          <Button
            onPress={() => router.replace("/shop")}
            className="w-full"
          >
            <FormattedMessage defaultMessage="Browse the shop" />
          </Button>
        </View>
      ) : (
        <>
          <ScrollView
            className="flex-1"
            contentContainerClassName="px-6 pb-32 pt-4 gap-3"
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
                  <ThemedText
                    className="text-lg font-semibold"
                    numberOfLines={1}
                  >
                    {line.product.name}
                  </ThemedText>
                  {capitalizedColor && (
                    <ThemedText className="text-sm text-muted-foreground">
                      <FormattedMessage
                        defaultMessage="Color: {color}"
                        values={{ color: capitalizedColor }}
                      />
                    </ThemedText>
                  )}
                  {line.size && (
                    <ThemedText className="text-sm text-muted-foreground">
                      <FormattedMessage
                        defaultMessage="Size: {size}"
                        values={{ size: line.size }}
                      />
                    </ThemedText>
                  )}
                  <ProductPrice
                    price={line.product.price}
                    discountedPrice={line.product.discountedPrice}
                    className="text-base font-semibold"
                  />
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

            {isAppleRelayEmail(me?.email) && (
              <View className="mt-4 gap-2 rounded border-2 border-border bg-muted/30 p-4">
                <ThemedText className="text-xs text-muted-foreground">
                  <FormattedMessage defaultMessage="Your Apple email hides your address. Give us a real one so we can reach you." />
                </ThemedText>
                <ThemedTextInput
                  label={intl.formatMessage({
                    defaultMessage: "Contact email",
                  })}
                  value={contactEmailOverride}
                  onChangeText={setContactEmailOverride}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                  textContentType="emailAddress"
                  placeholder="you@example.com"
                  maxLength={200}
                />
              </View>
            )}

            {appliedCoupon ? (
              <View className="mt-4 flex-row items-center gap-3 rounded border-2 border-emerald-500/40 bg-emerald-500/10 p-3">
                <LucideIcon icon={Tag} size={18} color="#10b981" />
                <ThemedText className="flex-1 font-mono text-sm font-semibold text-emerald-700 dark:text-emerald-400">
                  {appliedCoupon}
                </ThemedText>
                <TouchableOpacity
                  onPress={() => {
                    setAppliedCoupon(null);
                    setCouponCode("");
                  }}
                  activeOpacity={0.7}
                  hitSlop={8}
                >
                  <LucideIcon icon={X} size={18} muted />
                </TouchableOpacity>
              </View>
            ) : couponOpen ? (
              <View className="mt-4 flex-row items-end gap-2">
                <View className="flex-1">
                  <ThemedTextInput
                    label={intl.formatMessage({
                      defaultMessage: "Coupon code",
                    })}
                    value={couponCode}
                    onChangeText={(v) => setCouponCode(v.toUpperCase())}
                    autoCapitalize="characters"
                    placeholder="SUMMER25"
                    maxLength={40}
                  />
                </View>
                <Button
                  onPress={() => {
                    const trimmed = couponCode.trim();
                    if (trimmed.length >= 2) setAppliedCoupon(trimmed);
                  }}
                  disabled={couponCode.trim().length < 2}
                >
                  <FormattedMessage defaultMessage="Apply" />
                </Button>
              </View>
            ) : (
              <TouchableOpacity
                onPress={() => setCouponOpen(true)}
                activeOpacity={0.7}
                className="mt-4 flex-row items-center gap-2"
              >
                <LucideIcon icon={Tag} size={16} muted />
                <ThemedText className="text-sm text-muted-foreground underline">
                  <FormattedMessage defaultMessage="Have a coupon code?" />
                </ThemedText>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              onPress={onSubmit}
              disabled={isPending}
              activeOpacity={0.85}
              className="mt-2 flex-row items-center gap-3 py-2"
            >
              <View className="size-12 items-center justify-center rounded-full bg-primary/15">
                {isPending ? (
                  <ActivityIndicator />
                ) : (
                  <LucideIcon
                    icon={Send}
                    size={20}
                    color={Colors.light.primary}
                  />
                )}
              </View>
              <View className="flex-1 gap-0.5">
                <ThemedText className="text-base font-semibold text-primary">
                  <FormattedMessage defaultMessage="Send order" />
                </ThemedText>
                <ThemedText className="text-xs text-muted-foreground">
                  {(() => {
                    const trimmed = contactEmailOverride.trim();
                    const valid =
                      trimmed && EMAIL_RE.test(trimmed) ? trimmed : null;
                    return (
                      <FormattedMessage
                        defaultMessage="We'll reach you at {email}."
                        values={{ email: valid ?? me?.email ?? "—" }}
                      />
                    );
                  })()}
                </ThemedText>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => router.push("/shop")}
              activeOpacity={0.85}
              className="flex-row items-center gap-3 py-2"
            >
              <View className="size-12 items-center justify-center rounded-full bg-border">
                <LucideIcon icon={Store} size={20} muted />
              </View>
              <View className="flex-1 gap-0.5">
                <ThemedText className="text-base font-semibold">
                  <FormattedMessage defaultMessage="Keep shopping" />
                </ThemedText>
                <ThemedText className="text-xs text-muted-foreground">
                  <FormattedMessage defaultMessage="Add more merch before sending." />
                </ThemedText>
              </View>
            </TouchableOpacity>
          </ScrollView>

          <View className="absolute bottom-0 left-0 right-0 border-t border-border bg-background px-6 pb-10 pt-4">
            <View className="flex-row items-center justify-between">
              <ThemedText className="text-lg font-semibold">
                <FormattedMessage defaultMessage="Total" />
              </ThemedText>
              <ThemedText className="text-2xl font-bold">{total}€</ThemedText>
            </View>
          </View>
        </>
      )}
      <PhoneNumberPromptDialog
        isOpen={isPhonePromptOpen}
        onClose={() => setIsPhonePromptOpen(false)}
        onSave={handleSavePhone}
        isSaving={isSavingPhone}
      />
    </View>
  );
}

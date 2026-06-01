import { Redirect, useFocusEffect, useRouter } from "expo-router";
import {
  BadgeCheck,
  Minus,
  Plus,
  Send,
  ShoppingBag,
  Sparkles,
  Store,
} from "lucide-react-native";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { Alert, ScrollView, TouchableOpacity, View } from "react-native";
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
import { Image } from "@/components/ui/atoms/image";
import {
  ActionRow,
  CountryPicker,
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
import { useCouponLookup } from "@/domains/merch/coupon.api";
import { useMerch } from "@/domains/merch/merch.api";
import {
  useSubmitSuggestionMutation,
  useUnlockableUnlock,
  useUpdateUserMeMutation,
  useUserMe,
} from "@/domains/user/user.api";
import { formatCountryLabel } from "@/lib/countries";
import { getLocale } from "@/lib/locale";

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
  const { mutateAsync: updateUserMe } = useUpdateUserMeMutation();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [contactEmailOverride, setContactEmailOverride] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  // Coupon is a single freeform input that rides along in the order
  // message — no "apply" button or applied-state UI. Admin reads the
  // code from the plain string just like the address lines.
  const [couponCode, setCouponCode] = useState("");

  // Shipping/contact fields — replace the old post-submit phone modal with
  // an inline form so admin gets everything in one shot. Prefilled from
  // `/me` so returning buyers don't retype. Country defaults to "ES" when
  // the user has none on file; the picker stores ISO 3166-1 alpha-2
  // codes and renders the localized name + flag at render time.
  const [shippingStreet, setShippingStreet] = useState("");
  const [shippingCity, setShippingCity] = useState("");
  const [shippingPostalCode, setShippingPostalCode] = useState("");
  const [shippingCountry, setShippingCountry] = useState("ES");
  const [phoneNumber, setPhoneNumber] = useState("");
  // Hydrate the form ONCE from server data. Subsequent /me refetches
  // (e.g. the invalidation that updateUserMe fires on success) would
  // otherwise clobber whatever the user is typing.
  const hydratedRef = useRef(false);
  useEffect(() => {
    if (!me || hydratedRef.current) return;
    hydratedRef.current = true;
    setShippingStreet(me.shippingStreet ?? "");
    setShippingCity(me.shippingCity ?? "");
    setShippingPostalCode(me.shippingPostalCode ?? "");
    setShippingCountry(me.shippingCountry ?? "ES");
    setPhoneNumber(me.phoneNumber ?? "");
  }, [me]);

  const addressComplete =
    shippingStreet.trim().length > 0 &&
    shippingCity.trim().length > 0 &&
    shippingPostalCode.trim().length > 0 &&
    shippingCountry.trim().length > 0 &&
    phoneNumber.trim().length > 0;

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

  // Debounce the coupon code before firing the lookup — the user types,
  // we wait 350ms of quiet, then ask the server whether it unlocks a
  // discount. The hook itself has a 2-char minimum so 1-char typing
  // doesn't round-trip.
  const [debouncedCoupon, setDebouncedCoupon] = useState("");
  useEffect(() => {
    const id = setTimeout(() => setDebouncedCoupon(couponCode), 350);
    return () => clearTimeout(id);
  }, [couponCode]);
  const couponLookup = useCouponLookup(debouncedCoupon);
  // Coerce `discountValue` to a real number — the generated OpenAPI
  // type unions `string | number` because `t.Integer()` produces an
  // `integer` schema that openapi-typescript widens. Treat anything
  // non-numeric as "no discount".
  const appliedCoupon = (() => {
    if (couponLookup.data?.valid !== true) return null;
    const value = Number(couponLookup.data.discountValue);
    if (!Number.isFinite(value) || value <= 0) return null;
    return {
      code: couponLookup.data.code,
      discountType: couponLookup.data.discountType,
      discountValue: value,
    };
  })();

  // Snap to 2 decimals so `25 * 0.85 = 21.25` doesn't render as
  // `21.249999…`. Percentage discounts can produce fractional cents;
  // fixed-€ discounts won't but the same formatter handles both.
  const round2 = (n: number) => Math.round(n * 100) / 100;
  const discountAmount = appliedCoupon
    ? appliedCoupon.discountType === "percentage"
      ? round2((total * appliedCoupon.discountValue) / 100)
      : Math.min(total, appliedCoupon.discountValue)
    : 0;
  const finalTotal = Math.max(0, round2(total - discountAmount));

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
    if (lines.length === 0 || !addressComplete) return;
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
    const trimmedCoupon = couponCode.trim();
    // Include both the raw code the user typed AND the resolved
    // discount when the server confirmed it. Admin can cross-check the
    // applied amount without re-running the lookup.
    const couponLine = trimmedCoupon
      ? appliedCoupon
        ? `Coupon: ${appliedCoupon.code} (${
            appliedCoupon.discountType === "percentage"
              ? `-${appliedCoupon.discountValue}%`
              : `-${appliedCoupon.discountValue}€`
          }, -${discountAmount}€)\n`
        : `Coupon: ${trimmedCoupon} (not validated)\n`
      : "";
    const trimmedPhone = phoneNumber.trim();
    const phoneLine = trimmedPhone ? `Phone: ${trimmedPhone}\n` : "";
    // Render the country as "🇪🇸 España (ES)" so admin gets both a
    // human-readable name (in the buyer's locale) and the canonical ISO
    // code for label printing, with the picker emoji for a quick scan.
    const countryLine =
      formatCountryLabel(shippingCountry, getLocale()) ?? shippingCountry;
    const shippingBlock =
      `\nShipping:\n` +
      `  ${shippingStreet.trim()}\n` +
      `  ${shippingPostalCode.trim()} ${shippingCity.trim()}\n` +
      `  ${countryLine} (${shippingCountry})\n`;
    const message =
      `[MERCH ORDER]\n` +
      `From: ${effectiveEmail}\n` +
      hiddenLine +
      phoneLine +
      couponLine +
      (appliedCoupon
        ? `Subtotal: ${total}€\nTotal: ${finalTotal}€\n`
        : `Total: ${total}€\n`) +
      shippingBlock +
      `\nItems:\n${itemLines}`;

    try {
      // Send the order first — that's the user's actual goal. Persist
      // the address/phone afterward as a non-blocking save so a transient
      // PATCH /me failure doesn't bury the successful order behind a
      // generic error. Old API versions ignore unknown body keys; new
      // ones store them.
      await submitSuggestion({ suggestion: message });
      void updateUserMe({
        shippingStreet: shippingStreet.trim(),
        shippingCity: shippingCity.trim(),
        shippingPostalCode: shippingPostalCode.trim(),
        shippingCountry: shippingCountry.trim(),
        phoneNumber: trimmedPhone,
      }).catch(() => {
        // Best-effort save; the order already went through.
      });
      unlock("merch");
      await clearCart();
      setCart([]);
      setCouponCode("");
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

            <View className="mt-4 gap-3.5">
              <ThemedText className="mb-2 text-base font-semibold">
                <FormattedMessage defaultMessage="Shipping address" />
              </ThemedText>
              <ThemedTextInput
                label={intl.formatMessage({ defaultMessage: "Street" })}
                value={shippingStreet}
                onChangeText={setShippingStreet}
                autoComplete="street-address"
                textContentType="streetAddressLine1"
                maxLength={200}
              />
              <ThemedTextInput
                label={intl.formatMessage({ defaultMessage: "City" })}
                value={shippingCity}
                onChangeText={setShippingCity}
                autoComplete="postal-address-locality"
                textContentType="addressCity"
                maxLength={120}
              />
              <ThemedTextInput
                label={intl.formatMessage({ defaultMessage: "Postal code" })}
                value={shippingPostalCode}
                onChangeText={setShippingPostalCode}
                autoComplete="postal-code"
                textContentType="postalCode"
                keyboardType="number-pad"
                maxLength={20}
              />
              <CountryPicker
                label={intl.formatMessage({ defaultMessage: "Country" })}
                value={shippingCountry}
                onChange={setShippingCountry}
              />
              <ThemedTextInput
                label={intl.formatMessage({ defaultMessage: "Phone" })}
                value={phoneNumber}
                onChangeText={setPhoneNumber}
                autoComplete="tel"
                textContentType="telephoneNumber"
                keyboardType="phone-pad"
                maxLength={40}
              />
              <ThemedTextInput
                label={intl.formatMessage({
                  defaultMessage: "Coupon code (optional)",
                })}
                value={couponCode}
                onChangeText={(v) => setCouponCode(v.toUpperCase())}
                autoCapitalize="characters"
                maxLength={40}
              />
            </View>

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

            <View className="mt-4 gap-1">
              <View className="flex-row items-baseline justify-between">
                <ThemedText className="text-base font-semibold">
                  <FormattedMessage defaultMessage="Total" />
                </ThemedText>
                <View className="flex-row items-baseline gap-2">
                  {appliedCoupon && (
                    <ThemedText className="text-base text-muted-foreground line-through">
                      {total}€
                    </ThemedText>
                  )}
                  <ThemedText className="text-2xl font-bold">
                    {finalTotal}€
                  </ThemedText>
                </View>
              </View>
              {appliedCoupon && (
                <ThemedText className="text-right text-xs text-emerald-700 dark:text-emerald-400">
                  <FormattedMessage
                    defaultMessage="Coupon {code} applied — saved {amount}€"
                    values={{
                      code: appliedCoupon.code,
                      amount: discountAmount,
                    }}
                  />
                </ThemedText>
              )}
              {!appliedCoupon && couponLookup.isPending && (
                <ThemedText className="text-right text-xs text-muted-foreground">
                  <FormattedMessage defaultMessage="Checking coupon…" />
                </ThemedText>
              )}
              {!appliedCoupon &&
                !couponLookup.isPending &&
                debouncedCoupon.trim().length >= 2 &&
                couponLookup.data?.valid === false && (
                  <ThemedText className="text-right text-xs text-red-500">
                    <FormattedMessage defaultMessage="Invalid coupon code." />
                  </ThemedText>
                )}
            </View>

            <TouchableOpacity
              onPress={onSubmit}
              disabled={isPending || !addressComplete}
              activeOpacity={0.85}
              className="mt-2 flex-row items-center gap-3 py-2"
              style={{ opacity: !addressComplete || isPending ? 0.5 : 1 }}
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
                  {!addressComplete ? (
                    <FormattedMessage defaultMessage="Fill in your address to send the order." />
                  ) : (
                    (() => {
                      const trimmed = contactEmailOverride.trim();
                      const valid =
                        trimmed && EMAIL_RE.test(trimmed) ? trimmed : null;
                      return (
                        <FormattedMessage
                          defaultMessage="We'll reach you at {email}."
                          values={{ email: valid ?? me?.email ?? "—" }}
                        />
                      );
                    })()
                  )}
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
            <View className="flex-row items-baseline justify-between">
              <ThemedText className="text-lg font-semibold">
                <FormattedMessage defaultMessage="Total" />
              </ThemedText>
              <View className="flex-row items-baseline gap-2">
                {appliedCoupon && (
                  <ThemedText className="text-base text-muted-foreground line-through">
                    {total}€
                  </ThemedText>
                )}
                <ThemedText className="text-2xl font-bold">
                  {finalTotal}€
                </ThemedText>
              </View>
            </View>
          </View>
        </>
      )}
    </View>
  );
}

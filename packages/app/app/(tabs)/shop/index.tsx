import { Link, Redirect } from "expo-router";
import {
  ArrowDownAZ,
  ArrowUpAZ,
  Heart,
  ShoppingBag,
  Sparkles,
  type LucideIcon as LucideIconType,
} from "lucide-react-native";
import { useEffect, useMemo, useState } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { ScrollView, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { twMerge } from "tailwind-merge";

import { useAuth } from "@/components/providers/auth-provider";
import {
  LucideIcon,
  NewBadge,
  SearchInput,
  Skeleton,
  ThemedText,
  ThemedView,
} from "@/components/ui/atoms";
import { Image } from "@/components/ui/atoms/image";
import { CartHeaderButton, ProductPrice } from "@/components/ui/molecules";
import { Colors } from "@/constants/colors";
import { useMerch } from "@/domains/merch/merch.api";
import { useIsProductNew } from "@/domains/merch/seen";
import { cleanText } from "@/lib";

import type { paths } from "@/types/api";

type MerchEntry =
  paths["/api/public/merch/"]["get"]["responses"][200]["content"]["application/json"]["message"][number];

const COLOR_HEX: Record<string, string> = {
  black: "#000000",
  white: "#FFFFFF",
  gray: "#9CA3AF",
  grey: "#9CA3AF",
  red: "#DC2626",
  blue: "#2563EB",
  navy: "#1E3A8A",
  green: "#16A34A",
  yellow: "#EAB308",
  orange: "#EA580C",
  pink: "#EC4899",
  purple: "#9333EA",
  brown: "#78350F",
  beige: "#E7D8B1",
};

const resolveSwatchColor = (token: string) =>
  COLOR_HEX[token.toLowerCase()] ?? token;

type Sort = "featured" | "price-asc" | "price-desc";

export default function ShopScreen() {
  const intl = useIntl();
  const { isAuthenticated } = useAuth();
  const { data: merch, isPending } = useMerch();
  const insets = useSafeAreaInsets();

  // Search + sort state mirrors the challenges page (see
  // `components/challenge/challenge-list.tsx`). Immediate input drives the
  // TextInput; `debouncedSearch` (300ms) drives the filter so each
  // keystroke doesn't re-sort the grid.
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [sort, setSort] = useState<Sort>("featured");

  useEffect(() => {
    const id = setTimeout(() => setDebouncedSearch(searchInput), 300);
    return () => clearTimeout(id);
  }, [searchInput]);

  // Memoize the empty-fallback so `useMerch()` returning `undefined` (during
  // loading) doesn't hand the filter useMemo a fresh `[]` every render.
  // Once `merch` resolves, identity is stable.
  const products = useMemo(() => merch ?? [], [merch]);

  // Client-side filter + sort. Catalog is small enough (< 50 items today)
  // that this is cheaper than another network request. `cleanText` strips
  // accents so a query "camiseta" matches "Camiseta" (it does NOT strip
  // hyphens or punctuation — "tshirt" will not match "T-Shirt").
  const visibleProducts = useMemo(() => {
    const q = cleanText(debouncedSearch.trim()).toLowerCase();
    const filtered = q
      ? products.filter((p) =>
          cleanText(p.name).toLowerCase().includes(q),
        )
      : products;
    if (sort === "featured") return filtered;
    const priceOf = (p: (typeof products)[number]) =>
      p.discountedPrice ?? p.price;
    const dir = sort === "price-asc" ? 1 : -1;
    return [...filtered].sort((a, b) => (priceOf(a) - priceOf(b)) * dir);
  }, [products, debouncedSearch, sort]);

  const sortOptions: {
    value: Sort;
    label: string;
    icon: LucideIconType;
  }[] = useMemo(
    () => [
      {
        value: "featured",
        label: intl.formatMessage({ defaultMessage: "Featured" }),
        icon: Sparkles,
      },
      {
        value: "price-asc",
        label: intl.formatMessage({ defaultMessage: "Price ↑" }),
        icon: ArrowUpAZ,
      },
      {
        value: "price-desc",
        label: intl.formatMessage({ defaultMessage: "Price ↓" }),
        icon: ArrowDownAZ,
      },
    ],
    [intl],
  );

  if (!isAuthenticated) {
    return <Redirect href="/join" />;
  }

  return (
    <ThemedView className="flex-1">
      {/* Sticky bar above the scroll: title + search + sort pills. Lives
          outside the ScrollView so it stays visible as the user browses
          the grid. Safe-area top padding sits here (not on the scroll
          container) — see SKILL.md for the className+style merge caveat. */}
      <View
        className="gap-3 bg-background px-6 pb-3"
        style={{ paddingTop: insets.top + 16 }}
      >
        {/* Matches the CalendarMonth header style — `text-4xl font-bold` —
            so top-level tab screens share a consistent header treatment.
            See `components/calendar/calendar-month.tsx:59`. */}
        <View className="flex-row items-center justify-between">
          <ThemedText className="text-4xl font-bold">
            <FormattedMessage defaultMessage="Shop" />
          </ThemedText>
          <CartHeaderButton />
        </View>
        <SearchInput onChangeText={setSearchInput} />
        {/* flex-wrap guards narrow phones in Spanish/Catalan, where three
            pills + gaps exceed the available width and would otherwise
            clip the trailing pill off-screen. */}
        <View className="flex-row flex-wrap gap-2">
          {sortOptions.map((option) => {
            const selected = sort === option.value;
            return (
              <TouchableOpacity
                key={option.value}
                onPress={() => setSort(option.value)}
                className={twMerge(
                  "flex-row items-center gap-1.5 rounded-full border-2 px-3 py-1.5",
                  selected
                    ? "border-primary bg-primary/10"
                    : "border-border",
                )}
              >
                <LucideIcon
                  icon={option.icon}
                  size={14}
                  muted={!selected}
                  primary={selected}
                />
                <ThemedText
                  className={twMerge(
                    "text-sm font-medium",
                    selected ? "text-primary" : "text-muted-foreground",
                  )}
                >
                  {option.label}
                </ThemedText>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
      <ScrollView
        className="flex-1"
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        // `insets.bottom` already includes the NativeTabs tab bar height
        // on this NativeTabs child (see app SKILL.md), so we only add a
        // visual buffer — no manual tab-bar constant needed here.
        contentContainerStyle={{
          paddingHorizontal: 24,
          paddingTop: 8,
          paddingBottom: insets.bottom + 24,
        }}
      >
        <View className="mb-6 flex-row items-center gap-4 rounded border-2 border-primary bg-primary/10 p-4">
          <View className="size-12 items-center justify-center rounded-full bg-primary/20">
            <LucideIcon icon={Heart} size={22} color={Colors.light.primary} />
          </View>
          <View className="flex-1 gap-1">
            <ThemedText className="text-base font-bold text-primary">
              <FormattedMessage defaultMessage="Support the app" />
            </ThemedText>
            <ThemedText className="text-sm text-muted-foreground">
              <FormattedMessage defaultMessage="Cims costs around 50€ a month to run. Pick up some merch to help keep it free." />
            </ThemedText>
          </View>
        </View>

        <View className="flex-row flex-wrap">
          {isPending &&
            [0, 1, 2, 3].map((i) => (
              <View
                key={i}
                className={`w-1/2 pb-6 ${i % 2 === 0 ? "pr-1.5" : "pl-1.5"}`}
              >
                <View className="gap-2">
                  <Skeleton
                    className="w-full rounded"
                    style={{ aspectRatio: 1, height: undefined }}
                  />
                  <Skeleton className="h-5 w-3/4 rounded-md" />
                  <Skeleton className="h-5 w-20 rounded-md" />
                </View>
              </View>
            ))}
          {!isPending && visibleProducts.length === 0 && (
            <View className="w-full items-center py-8">
              <ThemedText className="text-center text-muted-foreground">
                {debouncedSearch ? (
                  <FormattedMessage defaultMessage="No products match your search." />
                ) : (
                  <FormattedMessage defaultMessage="No products available." />
                )}
              </ThemedText>
            </View>
          )}
          {visibleProducts.map((product, index) => (
            <View
              key={product.slug}
              className={`w-1/2 pb-6 ${index % 2 === 0 ? "pr-1.5" : "pl-1.5"}`}
            >
              <Link
                href={{
                  pathname: "/shop/[slug]",
                  params: { slug: product.slug },
                }}
                asChild
              >
                <TouchableOpacity activeOpacity={0.85} className="gap-2">
                  {product.imageUrls[0] ? (
                    <Image
                      source={{ uri: product.imageUrls[0], cache: "force-cache" }}
                      className="aspect-square w-full rounded bg-border"
                      resizeMode="cover"
                    />
                  ) : (
                    <View className="aspect-square w-full items-center justify-center rounded bg-border">
                      <LucideIcon icon={ShoppingBag} size={36} muted />
                    </View>
                  )}
                  <View className="gap-1">
                    <ProductNameRow product={product} />
                    {product.variants.length > 1 && (
                      <View className="mt-0.5 flex-row gap-1.5">
                        {product.variants.map((v) => (
                          <View
                            key={v.color}
                            className="size-4 rounded-full border border-foreground/40"
                            style={{
                              backgroundColor: resolveSwatchColor(v.color),
                            }}
                          />
                        ))}
                      </View>
                    )}
                    <ProductPrice
                      price={product.price}
                      discountedPrice={product.discountedPrice}
                      className="text-base font-medium text-muted-foreground"
                      strikethroughClassName="text-base"
                    />
                  </View>
                </TouchableOpacity>
              </Link>
            </View>
          ))}
        </View>
      </ScrollView>
    </ThemedView>
  );
}

// Per-product wrapper so `useIsProductNew` (which subscribes to the seen
// store) runs in a stable component per slug rather than inside the
// `.map()` body of ShopScreen. The hook must not be called in a loop.
function ProductNameRow({ product }: { product: MerchEntry }) {
  const isNew = useIsProductNew(product.slug, product.createdAt);
  return (
    <View className="flex-row items-center gap-1.5">
      <ThemedText
        className="shrink text-base font-semibold"
        numberOfLines={1}
      >
        {product.name}
      </ThemedText>
      {isNew && <NewBadge />}
    </View>
  );
}

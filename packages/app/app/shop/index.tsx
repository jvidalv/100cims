import { Link, Redirect } from "expo-router";
import { Heart, ShoppingBag } from "lucide-react-native";
import { FormattedMessage, useIntl } from "react-intl";
import { Image, TouchableOpacity, View } from "react-native";

import { useAuth } from "@/components/providers/auth-provider";
import { LucideIcon, Skeleton, ThemedText } from "@/components/ui/atoms";
import { ProductPrice } from "@/components/ui/molecules";
import ParallaxScrollView from "@/components/ui/organisms/parallax-scroll-view";
import { Colors } from "@/constants/colors";
import { useMerch } from "@/domains/merch/merch.api";

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

export default function ShopScreen() {
  const intl = useIntl();
  const { isAuthenticated } = useAuth();
  const { data: merch, isPending } = useMerch();

  if (!isAuthenticated) {
    return <Redirect href="/join" />;
  }

  const products = merch ?? [];

  return (
    <ParallaxScrollView
      title={intl.formatMessage({ defaultMessage: "Shop" })}
      headerClassName="bg-border"
      contentClassName="px-6 pb-10"
      headerImage={
        <Image
          source={require("@/assets/images/shop-header.jpg")}
          className="size-full"
          resizeMode="cover"
        />
      }
    >
      <View className="mb-6 mt-6 flex-row items-center gap-4 rounded border-2 border-primary bg-primary/10 p-4">
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
        {products.map((product, index) => (
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
                  <ThemedText
                    className="text-base font-semibold"
                    numberOfLines={1}
                  >
                    {product.name}
                  </ThemedText>
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
    </ParallaxScrollView>
  );
}

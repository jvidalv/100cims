import { Link, Redirect } from "expo-router";
import { Heart, ShoppingBag } from "lucide-react-native";
import { FormattedMessage, useIntl } from "react-intl";
import { Image, TouchableOpacity, View } from "react-native";


import { useAuth } from "@/components/providers/auth-provider";
import { LucideIcon, ThemedText } from "@/components/ui/atoms";
import ParallaxScrollView from "@/components/ui/organisms/parallax-scroll-view";
import { Colors } from "@/constants/colors";
import { useMerch } from "@/domains/merch/merch.api";

export default function ShopScreen() {
  const intl = useIntl();
  const { isAuthenticated } = useAuth();
  const { data: merch } = useMerch();

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

      <View className="gap-4">
        {products.map((product) => (
          <Link
            key={product.slug}
            href={{
              pathname: "/shop/[slug]",
              params: { slug: product.slug },
            }}
            asChild
          >
            <TouchableOpacity
              activeOpacity={0.85}
              className="flex-row items-center gap-4 rounded border-2 border-border p-3"
            >
              {product.imageUrls[0] ? (
                <Image
                  source={{ uri: product.imageUrls[0], cache: "force-cache" }}
                  className="size-36 rounded bg-border"
                  resizeMode="cover"
                />
              ) : (
                <View className="size-36 items-center justify-center rounded bg-border">
                  <LucideIcon icon={ShoppingBag} size={36} muted />
                </View>
              )}
              <View className="flex-1 gap-1">
                <ThemedText
                  className="text-lg font-semibold"
                  numberOfLines={1}
                >
                  {product.name}
                </ThemedText>
                <ThemedText className="text-lg font-medium text-muted-foreground">
                  {product.price}€
                </ThemedText>
              </View>
            </TouchableOpacity>
          </Link>
        ))}
      </View>
    </ParallaxScrollView>
  );
}

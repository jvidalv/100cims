import { Redirect, useLocalSearchParams, useRouter } from "expo-router";
import { ShoppingBag } from "lucide-react-native";
import { useEffect, useState } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import {
  Alert,
  Image,
  Pressable,
  ScrollView,
  TouchableOpacity,
  View,
} from "react-native";
import { twMerge } from "tailwind-merge";

import { useAuth } from "@/components/providers/auth-provider";
import { LucideIcon, Skeleton, ThemedText } from "@/components/ui/atoms";
import {
  ActionRow,
  ImagePreviewModal,
  ProductPrice,
  ScreenHeader,
  useImagePreview,
} from "@/components/ui/molecules";
import { addToCart, type CartSize } from "@/domains/merch/cart";
import { useMerch } from "@/domains/merch/merch.api";
import { useUserMe } from "@/domains/user/user.api";
import { reportCartAddToDiscord } from "@/lib/report-cart-add";

// Fallback list used only when a merch row is flagged `hasSize=true` but the
// backend hasn't set `sizes` yet — matches the set the app shipped with.
const FALLBACK_SIZES: CartSize[] = ["S", "M", "L", "XL"];

const capitalize = (s: string) =>
  s.length > 0 ? s[0].toUpperCase() + s.slice(1) : s;

export default function ShopProductScreen() {
  const router = useRouter();
  const intl = useIntl();
  const { isAuthenticated } = useAuth();
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const { data: merch, isPending } = useMerch();
  const { data: me } = useUserMe();
  const [selectedSize, setSelectedSize] = useState<CartSize | null>(null);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const { previewImage, isPreviewOpen, openPreview, closePreview } =
    useImagePreview();

  useEffect(() => {
    setActiveImageIndex(0);
  }, [selectedColor]);

  const product = merch?.find((p) => p.slug === slug);
  const firstVariantColor = product?.variants[0]?.color ?? null;

  useEffect(() => {
    if (firstVariantColor && selectedColor === null) {
      setSelectedColor(firstVariantColor);
    }
  }, [firstVariantColor, selectedColor]);

  if (!isAuthenticated) {
    return <Redirect href="/join" />;
  }

  if (!product) {
    if (isPending) {
      return (
        <View className="flex-1 bg-background">
          <ScreenHeader />
          <ScrollView
            className="flex-1"
            contentContainerClassName="pb-10"
            showsVerticalScrollIndicator={false}
          >
            <Skeleton
              className="w-full rounded-none"
              style={{ aspectRatio: 1, height: undefined }}
            />
            <View className="gap-4 px-6 pt-4">
              <Skeleton className="h-9 w-3/4 rounded-md" />
              <View className="gap-2">
                <Skeleton className="h-4 w-full rounded-md" />
                <Skeleton className="h-4 w-5/6 rounded-md" />
                <Skeleton className="h-4 w-2/3 rounded-md" />
              </View>
              <View className="gap-3">
                <Skeleton className="h-6 w-32 rounded-md" />
                <View className="flex-row gap-3">
                  {[0, 1, 2].map((i) => (
                    <Skeleton key={i} className="size-16 rounded" />
                  ))}
                </View>
              </View>
              <View className="gap-2">
                <Skeleton className="h-6 w-28 rounded-md" />
                <View className="flex-row gap-2">
                  {[0, 1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-12 flex-1 rounded" />
                  ))}
                </View>
              </View>
              <View className="gap-2">
                <Skeleton className="h-6 w-16 rounded-md" />
                <Skeleton className="h-9 w-32 rounded-md" />
              </View>
              <View className="flex-row items-center gap-2">
                <Skeleton className="size-12 rounded-full" />
                <Skeleton className="h-6 w-28 rounded-md" />
              </View>
            </View>
          </ScrollView>
        </View>
      );
    }
    return (
      <View className="flex-1 bg-background">
        <ScreenHeader>
          <FormattedMessage defaultMessage="Product" />
        </ScreenHeader>
        <View className="flex-1 items-center justify-center">
          <ThemedText className="text-muted-foreground">
            <FormattedMessage defaultMessage="Product not found" />
          </ThemedText>
        </View>
      </View>
    );
  }

  const needsSize = product.hasSize;
  const needsColor = product.variants.length > 1;
  const missingSize = needsSize && !selectedSize;
  const missingColor = needsColor && !selectedColor;
  const sizes =
    product.sizes && product.sizes.length > 0 ? product.sizes : FALLBACK_SIZES;

  const activeVariant = selectedColor
    ? (product.variants.find((v) => v.color === selectedColor) ?? null)
    : null;
  const galleryImages =
    activeVariant?.imageUrls.length
      ? activeVariant.imageUrls
      : product.imageUrls;

  const onAddToCart = async () => {
    if (missingSize || missingColor) {
      const message =
        missingSize && missingColor
          ? intl.formatMessage({
              defaultMessage: "Please pick a color and size before adding to cart.",
            })
          : missingSize
            ? intl.formatMessage({
                defaultMessage: "Please pick a size before adding to cart.",
              })
            : intl.formatMessage({
                defaultMessage: "Please pick a color before adding to cart.",
              });
      Alert.alert(
        intl.formatMessage({ defaultMessage: "Selection required" }),
        message,
      );
      return;
    }
    const nextCart = await addToCart({
      slug: product.slug,
      size: selectedSize ?? undefined,
      color: selectedColor ?? undefined,
    });
    void reportCartAddToDiscord({
      productName: product.name,
      price: product.price,
      discountedPrice: product.discountedPrice,
      color: selectedColor,
      size: selectedSize,
      userEmail: me?.email,
      cartSize: nextCart.reduce((sum, line) => sum + line.qty, 0),
    });
    router.push("/shop/cart");
  };

  return (
    <View className="flex-1 bg-background">
      <ScreenHeader>{product.name}</ScreenHeader>
      <ScrollView
        className="flex-1"
        contentContainerClassName="pb-10"
        showsVerticalScrollIndicator={false}
      >
        {galleryImages.length > 0 ? (
          <Pressable
            onPress={() =>
              openPreview({ uri: galleryImages[activeImageIndex] })
            }
          >
            <Image
              source={{
                uri: galleryImages[activeImageIndex],
                cache: "force-cache",
              }}
              className="aspect-square w-full bg-border"
              resizeMode="cover"
            />
          </Pressable>
        ) : (
          <View className="aspect-square w-full items-center justify-center bg-border">
            <LucideIcon icon={ShoppingBag} size={48} muted />
          </View>
        )}

        {!needsColor && galleryImages.length > 1 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerClassName="gap-2 px-6 py-3"
          >
            {galleryImages.map((url, idx) => (
              <TouchableOpacity
                key={url}
                onPress={() => setActiveImageIndex(idx)}
                className={twMerge(
                  "size-16 overflow-hidden rounded border-2",
                  idx === activeImageIndex
                    ? "border-foreground"
                    : "border-border",
                )}
              >
                <Image
                  source={{ uri: url, cache: "force-cache" }}
                  className="size-full bg-border"
                  resizeMode="cover"
                />
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        <View className="gap-4 px-6 pt-4">
          <ThemedText className="text-3xl font-bold">
            {product.name}
          </ThemedText>

          {product.description && (
            <ThemedText className="text-base text-muted-foreground">
              {product.description}
            </ThemedText>
          )}

          {needsColor && (
            <View className="gap-3">
              <ThemedText className="text-lg font-semibold">
                <FormattedMessage defaultMessage="Select color" />
              </ThemedText>
              <View className="flex-row flex-wrap gap-3">
                {product.variants.map((v) => {
                  const thumb = v.imageUrls[0];
                  const isSelected = selectedColor === v.color;
                  return (
                    <TouchableOpacity
                      key={v.color}
                      onPress={() => setSelectedColor(v.color)}
                      className={twMerge(
                        "items-center gap-1",
                      )}
                    >
                      {thumb ? (
                        <Image
                          source={{ uri: thumb, cache: "force-cache" }}
                          className={twMerge(
                            "size-16 rounded border-2 bg-border",
                            isSelected ? "border-primary" : "border-border",
                          )}
                          resizeMode="cover"
                        />
                      ) : (
                        <View
                          className={twMerge(
                            "size-16 items-center justify-center rounded border-2 bg-border",
                            isSelected ? "border-primary" : "border-border",
                          )}
                        >
                          <ThemedText className="text-xs font-semibold">
                            {capitalize(v.color)}
                          </ThemedText>
                        </View>
                      )}
                      <ThemedText
                        className={twMerge(
                          "text-xs font-medium text-muted-foreground",
                          isSelected && "text-primary",
                        )}
                      >
                        {capitalize(v.color)}
                      </ThemedText>
                    </TouchableOpacity>
                  );
                })}
              </View>
              {galleryImages.length > 1 && (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerClassName="gap-2"
                >
                  {galleryImages.map((url, idx) => (
                    <TouchableOpacity
                      key={url}
                      onPress={() => setActiveImageIndex(idx)}
                      className={twMerge(
                        "size-16 overflow-hidden rounded border-2",
                        idx === activeImageIndex
                          ? "border-foreground"
                          : "border-border",
                      )}
                    >
                      <Image
                        source={{ uri: url, cache: "force-cache" }}
                        className="size-full bg-border"
                        resizeMode="cover"
                      />
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              )}
            </View>
          )}

          {needsSize && (
            <View className="gap-2">
              <ThemedText className="text-lg font-semibold">
                <FormattedMessage defaultMessage="Select size" />
              </ThemedText>
              <View className="flex-row flex-wrap gap-2">
                {sizes.map((size) => (
                  <TouchableOpacity
                    key={size}
                    onPress={() => setSelectedSize(size)}
                    className={twMerge(
                      "min-w-16 items-center rounded border-2 border-border px-4 py-3",
                      selectedSize === size && "border-primary bg-primary/10",
                    )}
                  >
                    <ThemedText
                      className={twMerge(
                        "font-semibold",
                        selectedSize === size && "text-primary",
                      )}
                    >
                      {size}
                    </ThemedText>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          <View className="gap-2">
            <ThemedText className="text-lg font-semibold">
              <FormattedMessage defaultMessage="Price" />
            </ThemedText>
            <ProductPrice
              price={product.price}
              discountedPrice={product.discountedPrice}
              className="text-3xl font-bold"
              strikethroughClassName="text-2xl"
            />
          </View>

          <ActionRow
            icon={ShoppingBag}
            intent="emerald"
            size="lg"
            onPress={onAddToCart}
          >
            <FormattedMessage defaultMessage="Add to cart" />
          </ActionRow>
        </View>
      </ScrollView>

      <ImagePreviewModal
        visible={isPreviewOpen}
        imageSource={previewImage}
        onClose={closePreview}
      />
    </View>
  );
}

import { Redirect, useLocalSearchParams, useRouter } from "expo-router";
import { ShoppingBag } from "lucide-react-native";
import { useEffect, useState } from "react";
import { FormattedMessage } from "react-intl";
import {
  Image,
  Pressable,
  ScrollView,
  TouchableOpacity,
  View,
} from "react-native";
import { twMerge } from "tailwind-merge";

import { useAuth } from "@/components/providers/auth-provider";
import { Button, LucideIcon, ThemedText } from "@/components/ui/atoms";
import {
  ImagePreviewModal,
  ScreenHeader,
  useImagePreview,
} from "@/components/ui/molecules";
import { addToCart, type CartSize } from "@/domains/merch/cart";
import { useMerch } from "@/domains/merch/merch.api";

const SIZES: CartSize[] = ["S", "M", "L", "XL"];

const capitalize = (s: string) =>
  s.length > 0 ? s[0].toUpperCase() + s.slice(1) : s;

export default function ShopProductScreen() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const { data: merch } = useMerch();
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
  const canAdd =
    (!needsSize || !!selectedSize) && (!needsColor || !!selectedColor);

  const activeVariant = selectedColor
    ? (product.variants.find((v) => v.color === selectedColor) ?? null)
    : null;
  const galleryImages =
    activeVariant?.imageUrls.length
      ? activeVariant.imageUrls
      : product.imageUrls;

  const onAddToCart = async () => {
    await addToCart({
      slug: product.slug,
      size: selectedSize ?? undefined,
      color: selectedColor ?? undefined,
    });
    router.push("/shop/cart");
  };

  return (
    <View className="flex-1 bg-background">
      <ScreenHeader>{product.name}</ScreenHeader>
      <ScrollView
        className="flex-1"
        contentContainerClassName="pb-48"
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

        {galleryImages.length > 1 && (
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
                    ? "border-primary"
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
            <View className="gap-2">
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
            </View>
          )}

          {needsSize && (
            <View className="gap-2">
              <ThemedText className="text-lg font-semibold">
                <FormattedMessage defaultMessage="Select size" />
              </ThemedText>
              <View className="flex-row gap-2">
                {SIZES.map((size) => (
                  <TouchableOpacity
                    key={size}
                    onPress={() => setSelectedSize(size)}
                    className={twMerge(
                      "flex-1 items-center rounded border-2 border-border py-3",
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
            <ThemedText className="text-3xl font-bold">
              {product.price}€
            </ThemedText>
          </View>
        </View>
      </ScrollView>

      <View className="absolute bottom-0 left-0 right-0 border-t border-border bg-background px-6 pb-10 pt-4">
        <Button onPress={onAddToCart} disabled={!canAdd}>
          <FormattedMessage defaultMessage="Add to cart" />
        </Button>
      </View>

      <ImagePreviewModal
        visible={isPreviewOpen}
        imageSource={previewImage}
        onClose={closePreview}
      />
    </View>
  );
}

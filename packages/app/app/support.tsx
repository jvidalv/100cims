import AsyncStorage from "@react-native-async-storage/async-storage";
import { Redirect } from "expo-router";
import { useEffect, useState } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { View, TouchableOpacity, Image, Pressable } from "react-native";
import { twMerge } from "tailwind-merge";

import { useAuth } from "@/components/providers/auth-provider";
import { Button, Icon, ThemedText } from "@/components/ui/atoms";
import { ImagePreviewModal, useImagePreview } from "@/components/ui/molecules";
import ParallaxScrollView from "@/components/ui/organisms/parallax-scroll-view";
import { MERCH_PRODUCTS, VALID_PRODUCT_IDS, type ProductId } from "@/constants/merch";
import { useSubmitSuggestionMutation } from "@/domains/user/user.api";

const PURCHASES_KEY = "merch-purchases";

type Size = "S" | "M" | "L" | "XL";

export default function SupportScreen() {
  const intl = useIntl();
  const { isAuthenticated } = useAuth();
  const { mutateAsync: submitSuggestion, isPending } = useSubmitSuggestionMutation();
  const [selectedProduct, setSelectedProduct] = useState<ProductId | null>(null);
  const [selectedSize, setSelectedSize] = useState<Size | null>(null);
  const [purchasedProducts, setPurchasedProducts] = useState<Set<ProductId>>(new Set());
  const [isSubmitted, setIsSubmitted] = useState(false);
  const { previewImage, isPreviewOpen, openPreview, closePreview } = useImagePreview();

  useEffect(() => {
    const loadPurchases = async () => {
      const stored = await AsyncStorage.getItem(PURCHASES_KEY);
      if (stored) {
        const parsed: unknown = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          const validIds = parsed.filter((id): id is ProductId => VALID_PRODUCT_IDS.includes(id));
          setPurchasedProducts(new Set(validIds));
        }
      }
    };
    void loadPurchases();
  }, []);

  if (!isAuthenticated) {
    return <Redirect href="/join" />;
  }

  const productNames: Record<ProductId, string> = {
    "white-shirt": intl.formatMessage({ defaultMessage: "White T-Shirt" }),
    "black-shirt": intl.formatMessage({ defaultMessage: "Black T-Shirt" }),
    "black-mug": intl.formatMessage({ defaultMessage: "Black Mug" }),
    "black-cap": intl.formatMessage({ defaultMessage: "Black Cap" }),
    "black-buff": intl.formatMessage({ defaultMessage: "Black Buff" }),
  };

  const products = MERCH_PRODUCTS.map((product) => ({
    ...product,
    name: productNames[product.id],
  }));

  const sizes: Size[] = ["S", "M", "L", "XL"];

  const selectedProductData = products.find((p) => p.id === selectedProduct);
  const needsSize = selectedProductData?.hasSize ?? false;

  const isFormValid = selectedProduct && (!needsSize || selectedSize);

  const handleSubmit = async () => {
    if (!isFormValid || !selectedProduct) return;

    try {
      setIsSubmitted(false);

      // Submit via suggestion API
      const productName = products.find((p) => p.id === selectedProduct)?.name;
      const sizeInfo = selectedSize ? ` (Size: ${selectedSize})` : "";
      await submitSuggestion({
        suggestion: `[MERCH REQUEST] ${productName}${sizeInfo}`,
      });

      // Save purchase to AsyncStorage
      const newPurchases = new Set(purchasedProducts);
      newPurchases.add(selectedProduct);
      setPurchasedProducts(newPurchases);
      await AsyncStorage.setItem(PURCHASES_KEY, JSON.stringify([...newPurchases]));

      setIsSubmitted(true);

      // Reset form
      setSelectedProduct(null);
      setSelectedSize(null);
    } catch {
      // Handle error silently
    }
  };

  return (
    <ParallaxScrollView
      title={intl.formatMessage({ defaultMessage: "Support Cims" })}
      headerClassName="bg-border"
      contentClassName="px-6 pb-10"
      headerImage={
        <Image
          source={require("@/assets/images/merch/white-shirt-1.jpeg")}
          className="size-full"
          resizeMode="cover"
        />
      }
    >
      <ThemedText className="mb-4 mt-6 text-muted-foreground">
        <FormattedMessage defaultMessage="Get some merch and support the app!" />
      </ThemedText>

      {/* Monthly costs info */}
      <View className="mb-6 flex-row items-center gap-3 rounded-xl bg-amber-500/10 p-4">
        <Icon name="info.circle.fill" size={24} color="#f59e0b" />
        <ThemedText className="flex-1 text-sm">
          <FormattedMessage defaultMessage="Monthly costs of maintaining Cims: 50€. Your support helps keep the app running!" />
        </ThemedText>
      </View>

      {/* Product Selection */}
      <ThemedText className="mb-2 text-lg font-semibold">
        <FormattedMessage defaultMessage="Select product" />
      </ThemedText>
      <View className="mb-6 gap-2">
        {products.map((product) => (
          <TouchableOpacity
            key={product.id}
            onPress={() => {
              setSelectedProduct(product.id);
              if (!product.hasSize) setSelectedSize(null);
            }}
            className={twMerge(
              "flex-row items-center gap-3 rounded-xl border-2 border-border p-2",
              selectedProduct === product.id && "border-primary bg-primary/10",
              purchasedProducts.has(product.id) && "border-emerald-500",
            )}
          >
            {product.images.length > 0 ? (
              <Pressable
                className="relative"
                onPress={() => openPreview(product.images[0])}
              >
                <Image
                  source={product.images[0]}
                  className="size-16 rounded-lg bg-border"
                  resizeMode="cover"
                />
                {product.images.length > 1 && (
                  <Pressable
                    className="absolute -bottom-2 -right-2"
                    onPress={(e) => {
                      e.stopPropagation();
                      openPreview(product.images[1]);
                    }}
                  >
                    <Image
                      source={product.images[1]}
                      className="size-8 rounded border-2 border-background bg-border"
                      resizeMode="cover"
                    />
                  </Pressable>
                )}
              </Pressable>
            ) : (
              <View className="size-16 items-center justify-center rounded-lg bg-border">
                <Icon name="bag" size={24} muted />
              </View>
            )}
            <ThemedText className="flex-1 font-medium">{product.name}</ThemedText>
            <ThemedText className="font-medium text-muted-foreground">{product.price}€</ThemedText>
          </TouchableOpacity>
        ))}
      </View>

      {/* Size Selection */}
      {selectedProduct && needsSize && (
        <>
          <ThemedText className="mb-2 text-lg font-semibold">
            <FormattedMessage defaultMessage="Select size" />
          </ThemedText>
          <View className="mb-6 flex-row gap-2">
            {sizes.map((size) => (
              <TouchableOpacity
                key={size}
                onPress={() => setSelectedSize(size)}
                className={twMerge(
                  "flex-1 items-center rounded-xl border-2 border-border py-3",
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
        </>
      )}

      {/* Submit Button */}
      {isFormValid && (
        <Button onPress={handleSubmit} isLoading={isPending}>
          <FormattedMessage defaultMessage="Send request" />
        </Button>
      )}

      {/* Success Message */}
      {isSubmitted && (
        <View className="mt-4 flex-row items-center gap-3 rounded-xl bg-emerald-500/10 p-4">
          <Icon name="checkmark.seal.fill" size={24} color="#10b981" />
          <ThemedText className="flex-1 text-sm text-emerald-600 dark:text-emerald-400">
            <FormattedMessage defaultMessage="Thanks for supporting Cims! We will contact you soon." />
          </ThemedText>
        </View>
      )}

      <ImagePreviewModal
        visible={isPreviewOpen}
        imageSource={previewImage}
        onClose={closePreview}
      />
    </ParallaxScrollView>
  );
}

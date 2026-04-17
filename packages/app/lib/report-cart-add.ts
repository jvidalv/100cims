import * as Application from "expo-application";
import { Platform } from "react-native";

const REQUEST_TIMEOUT_MS = 3000;

type ReportCartAddParams = {
  productName: string;
  price: number;
  discountedPrice: number | null;
  color?: string | null;
  size?: string | null;
  userEmail?: string | null;
  cartSize: number;
};

export async function reportCartAddToDiscord(
  params: ReportCartAddParams,
): Promise<boolean> {
  const url = process.env.EXPO_PUBLIC_DISCORD_CONTACT_WEBHOOK;
  if (!url) return false;

  const unit = params.discountedPrice ?? params.price;
  const priceField =
    params.discountedPrice != null
      ? `~~${params.price}€~~ **${unit}€**`
      : `**${unit}€**`;

  const fields: { name: string; value: string; inline?: boolean }[] = [
    { name: "Product", value: params.productName, inline: true },
    { name: "Price", value: priceField, inline: true },
    { name: "Cart size", value: String(params.cartSize), inline: true },
  ];
  if (params.color) {
    fields.push({ name: "Color", value: params.color, inline: true });
  }
  if (params.size) {
    fields.push({ name: "Size", value: params.size, inline: true });
  }
  if (params.userEmail) {
    fields.push({ name: "User", value: params.userEmail, inline: true });
  }
  fields.push({
    name: "App",
    value: `${Application.nativeApplicationVersion ?? "?"} · ${Platform.OS}`,
    inline: true,
  });

  const embed = {
    title: "🛒 Item added to cart",
    color: 0x10b981,
    fields,
    timestamp: new Date().toISOString(),
  };

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ embeds: [embed] }),
      signal: controller.signal,
    });
    return res.ok;
  } catch {
    return false;
  } finally {
    clearTimeout(timeout);
  }
}

import AsyncStorage from "@react-native-async-storage/async-storage";

import type { paths } from "@/types/api";

type MerchEntry =
  paths["/api/public/merch/"]["get"]["responses"][200]["content"]["application/json"]["message"][number];

export type MerchSlug = MerchEntry["slug"];
// Sizes come from the server now (merch.sizes). Kept as a plain string so
// new canonical sizes (XS, 2XL, 3XL…) flow through without an app release.
export type CartSize = string;

export type CartItem = {
  slug: MerchSlug;
  size?: CartSize;
  color?: string;
  qty: number;
};

const CART_KEY = "merch-cart";

const subscribers = new Set<(items: CartItem[]) => void>();
const emit = (items: CartItem[]): void => {
  for (const listener of subscribers) listener(items);
};

export const subscribeCart = (
  listener: (items: CartItem[]) => void,
): (() => void) => {
  subscribers.add(listener);
  return () => {
    subscribers.delete(listener);
  };
};

const isCartSize = (value: unknown): value is CartSize =>
  value === "S" || value === "M" || value === "L" || value === "XL";

const sanitize = (raw: unknown): CartItem[] => {
  if (!Array.isArray(raw)) return [];
  const out: CartItem[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const obj = item as Record<string, unknown>;
    if (typeof obj.slug !== "string") continue;
    const qty = typeof obj.qty === "number" && obj.qty > 0 ? obj.qty : 1;
    const size = isCartSize(obj.size) ? obj.size : undefined;
    const color = typeof obj.color === "string" ? obj.color : undefined;
    out.push({ slug: obj.slug, qty, size, color });
  }
  return out;
};

export const loadCart = async (): Promise<CartItem[]> => {
  const raw = await AsyncStorage.getItem(CART_KEY);
  if (!raw) return [];
  try {
    return sanitize(JSON.parse(raw));
  } catch {
    return [];
  }
};

export const saveCart = async (items: CartItem[]): Promise<void> => {
  await AsyncStorage.setItem(CART_KEY, JSON.stringify(items));
  emit(items);
};

export const clearCart = async (): Promise<void> => {
  await AsyncStorage.removeItem(CART_KEY);
  emit([]);
};

const sameLine = (
  a: CartItem,
  b: { slug: MerchSlug; size?: CartSize; color?: string },
) => a.slug === b.slug && a.size === b.size && a.color === b.color;

export const addToCart = async (line: {
  slug: MerchSlug;
  size?: CartSize;
  color?: string;
}): Promise<CartItem[]> => {
  const items = await loadCart();
  const idx = items.findIndex((i) => sameLine(i, line));
  const next =
    idx >= 0
      ? items.map((i, n) => (n === idx ? { ...i, qty: i.qty + 1 } : i))
      : [...items, { ...line, qty: 1 }];
  await saveCart(next);
  return next;
};

export const updateQty = async (
  line: { slug: MerchSlug; size?: CartSize; color?: string },
  qty: number,
): Promise<CartItem[]> => {
  const items = await loadCart();
  const next =
    qty <= 0
      ? items.filter((i) => !sameLine(i, line))
      : items.map((i) => (sameLine(i, line) ? { ...i, qty } : i));
  await saveCart(next);
  return next;
};

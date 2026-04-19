// Canonical size list. Mirrored by the CHECK constraint on merch.sizes
// (see schema.ts → merchTable). Keep the two in lockstep when adding sizes.
export const MERCH_SIZES = ["XS", "S", "M", "L", "XL", "2XL", "3XL"] as const;

export type MerchSize = (typeof MERCH_SIZES)[number];

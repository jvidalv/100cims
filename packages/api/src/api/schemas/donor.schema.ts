import { t } from "elysia";

/**
 * Schema for a single donor with aggregated donations
 */
export const DonorWithTotalSchema = t.Object({
  userId: t.String(),
  userImageUrl: t.Nullable(t.String()),
  userFirstName: t.Nullable(t.String()),
  userLastName: t.Nullable(t.String()),
  totalDonation: t.String(),
});

/**
 * Schema for array of donors
 */
export const DonorsArraySchema = t.Array(DonorWithTotalSchema);

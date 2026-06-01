import { useQuery } from "@tanstack/react-query";

import { useAuth } from "@/components/providers/auth-provider";
import apiClient from "@/lib/api-client";

import type { paths } from "@/types/api";

type CouponLookupResult =
  paths["/api/protected/shop/coupon-lookup"]["get"]["responses"][200]["content"]["application/json"]["message"];

// Looks up a coupon by its code via the protected /shop/coupon-lookup
// endpoint. The server returns `{ valid: false }` for any "no discount"
// case (unknown code, inactive, max-uses, already-redeemed when
// onePerUser); a `true` payload carries the canonical code casing plus
// the discount details so the cart can compute a preview.
//
// Gated on a minimum length so the user doesn't fan out a request per
// keystroke. `staleTime: 60s` keeps repeated typing of the same code
// cheap during a single cart session.
export const useCouponLookup = (
  code: string,
): { data: CouponLookupResult | undefined; isPending: boolean } => {
  const { isAuthenticated } = useAuth();
  const trimmed = code.trim();
  const query = useQuery({
    queryKey: ["coupon", "lookup", trimmed.toUpperCase()],
    enabled: () => isAuthenticated && trimmed.length >= 2,
    queryFn: async () => {
      const { data, error } = await apiClient.GET(
        "/api/protected/shop/coupon-lookup",
        { params: { query: { code: trimmed } } },
      );
      if (error) throw error;
      return data.message;
    },
    staleTime: 60_000,
  });
  return { data: query.data, isPending: query.isFetching };
};

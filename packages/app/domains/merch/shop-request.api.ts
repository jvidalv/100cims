import { useMutation, useQuery } from "@tanstack/react-query";

import { useAuth } from "@/components/providers/auth-provider";
import apiClient from "@/lib/api-client";

// Server-owned shop config (Bizum phone, future knobs). Lives on the
// backend so we can update it without shipping a new app — buyer just
// reopens the cart and sees the new number on the next request.
// Cached aggressively because the value is stable across a session.
export const useShopConfig = () => {
  const { isAuthenticated } = useAuth();
  return useQuery({
    queryKey: ["shop", "config"],
    enabled: isAuthenticated,
    queryFn: async () => {
      const { data, error } = await apiClient.GET(
        "/api/protected/shop/config",
      );
      if (error) throw error;
      return data.message;
    },
    staleTime: 1000 * 60 * 60, // 1h
  });
};

// Buyer-side: upload a Bizum payment screenshot for an order they just
// placed. The server validates ownership (only the original buyer can
// attach), persists the public S3 URL, and bumps the request status
// from `requested` to `contacted`.
export const useUploadShopRequestPaymentMutation = () => {
  return useMutation({
    mutationKey: ["shop-request", "payment"],
    mutationFn: async ({
      shopRequestId,
      image,
    }: {
      shopRequestId: string;
      image: string;
    }) => {
      const { data, error } = await apiClient.POST(
        "/api/protected/shop/shop-requests/{id}/payment",
        {
          params: { path: { id: shopRequestId } },
          body: { image },
        },
      );
      if (error) throw error;
      return data;
    },
  });
};

import { useInfiniteQuery, useQuery } from "@tanstack/react-query";

import { useAuth } from "@/components/providers/auth-provider";
import apiClient from "@/lib/api-client";
import { hiscoresKeys } from "@/lib/query-keys";
import type { paths } from "@/types/api";

const PAGE_SIZE = 50;

type HiscoresAllMessage =
  paths["/api/public/hiscores/all"]["get"]["responses"][200]["content"]["application/json"]["message"];

type HiscoresAroundMeMessage =
  paths["/api/public/hiscores/around-me"]["get"]["responses"][200]["content"]["application/json"]["message"];

// The /all endpoint historically returned a bare array; the paginated envelope
// was added later. openapi-typescript expresses the union; pick the envelope
// branch for the (entry-type) extraction used by the rest of the app.
type HiscoresPaginated = Exclude<HiscoresAllMessage, readonly unknown[]>;
export type HiscoreEntry = HiscoresPaginated["items"][number];
export type RankedHiscoreEntry = HiscoresAroundMeMessage["items"][number];

export const useHiscoresGet = () => {
  return useInfiniteQuery({
    queryKey: hiscoresKeys.list(),
    initialPageParam: 1,
    queryFn: async ({ pageParam }) => {
      const { data, error } = await apiClient.GET("/api/public/hiscores/all", {
        params: { query: { page: pageParam, limit: PAGE_SIZE } },
      });
      if (error) throw error;
      // The endpoint returns a bare array when no `page` param is passed and
      // a paginated envelope when one is. We always pass `page`, but the
      // schema still carries the union.
      if (Array.isArray(data.message)) {
        throw new Error("hiscores endpoint returned non-paginated response");
      }
      return data.message;
    },
    getNextPageParam: (lastPage) => {
      if (lastPage.pagination.hasMore) {
        return lastPage.pagination.page + 1;
      }
      return undefined;
    },
  });
};

export const useHiscoresAroundMeGet = () => {
  const { isAuthenticated } = useAuth();
  return useQuery({
    queryKey: hiscoresKeys.aroundMe(),
    enabled: isAuthenticated,
    queryFn: async () => {
      const { data, error } = await apiClient.GET(
        "/api/public/hiscores/around-me",
        {},
      );
      if (error) throw error;
      return data.message;
    },
  });
};

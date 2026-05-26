import { useInfiniteQuery, useMutation, useQuery } from "@tanstack/react-query";
import { useEffect } from "react";

import { queryClient } from "@/components/providers/query-client-provider";
import { useAuth } from "@/components/providers/auth-provider";
import apiClient from "@/lib/api-client";
import { userKeys, challengeKeys, mountainKeys } from "@/lib/query-keys";

export const UNAUTHORIZED = "Unauthorized";

export const useUserMe = () => {
  const { isAuthenticated, logout } = useAuth();

  const props = useQuery({
    queryKey: userKeys.me(),
    enabled: () => isAuthenticated,
    queryFn: async () => {
      if (!isAuthenticated) return null;
      const { data, error, response } = await apiClient.GET(
        "/api/protected/user/me",
      );

      if (response.status === 401) {
        throw new Error(UNAUTHORIZED);
      }

      if (error) throw error;
      return data.message;
    },
  });

  useEffect(() => {
    if (props.error?.message === UNAUTHORIZED) {
      logout();
    }
  }, [logout, props.error]);

  return props;
};

export const useIsAdmin = (): boolean => {
  const { data } = useUserMe();
  return data?.admin ?? false;
};

export const useUsers = ({
  query,
  mode,
}: {
  query?: string;
  mode?: "picker" | "search";
}) => {
  const { isAuthenticated } = useAuth();

  const args = useQuery({
    queryKey: [...userKeys.search(query || ""), mode ?? "picker"] as const,
    enabled: () => isAuthenticated && !!query,
    queryFn: async () => {
      if (!isAuthenticated || !query) return null;
      const { data, error } = await apiClient.GET("/api/protected/user/all", {
        params: { query: { q: query, ...(mode ? { mode } : {}) } },
      });
      if (error) throw error;
      return data.message;
    },
  });

  return args;
};

export const useUserChallengeSummits = () => {
  const { isAuthenticated } = useAuth();

  const props = useQuery({
    queryKey: userKeys.summits(),
    enabled: () => isAuthenticated,
    queryFn: async () => {
      if (!isAuthenticated) return null;
      const { data, error } = await apiClient.GET(
        "/api/protected/user/summits",
      );
      if (error) throw error;
      return data.message;
    },
  });

  return props;
};

export const useUserAllSummits = (
  search: string = "",
  sort: "recent" | "height" = "recent",
) => {
  const { isAuthenticated } = useAuth();

  return useInfiniteQuery({
    queryKey: userKeys.summitsAll(search, sort),
    enabled: () => isAuthenticated,
    initialPageParam: 1,
    queryFn: async ({ pageParam }) => {
      const { data, error } = await apiClient.GET(
        "/api/protected/user/summits/all",
        {
          params: {
            query: {
              page: pageParam,
              sort,
              ...(search.length > 0 ? { q: search } : {}),
            },
          },
        },
      );
      if (error) throw error;
      return data.message;
    },
    getNextPageParam: (last) =>
      last.pagination.hasMore ? last.pagination.page + 1 : undefined,
  });
};

export const useUserOneGet = ({
  userId,
}: {
  userId: string | undefined;
}) => {
  const props = useQuery({
    queryKey: userKeys.one(userId ?? ""),
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await apiClient.GET("/api/public/user/one", {
        params: { query: { userId: userId ?? "" } },
      });
      if (error) throw error;
      return data.message;
    },
  });

  return props;
};

export const useAnyUserSummits = ({
  userId,
  enabled = true,
}: {
  userId: string;
  enabled?: boolean;
}) => {
  const props = useQuery({
    queryKey: userKeys.summitsById(userId),
    enabled,
    queryFn: async () => {
      const { data, error } = await apiClient.GET("/api/public/user/summits", {
        params: { query: { userId } },
      });
      if (error) throw error;
      return data.message;
    },
  });

  return props;
};

/**
 * Paginated variant of `useAnyUserSummits` — fetches another user's summits
 * 24 at a time. Used by the public profile (`/user/[user]`) to avoid
 * loading 500+ cards up front. The legacy `useAnyUserSummits` stays for
 * any caller still on the old non-paginated endpoint.
 */
export const useAnyUserAllSummits = ({
  userId,
}: {
  userId: string | undefined;
}) =>
  useInfiniteQuery({
    queryKey: userKeys.summitsByIdAll(userId ?? ""),
    enabled: !!userId,
    initialPageParam: 1,
    queryFn: async ({ pageParam }) => {
      const { data, error } = await apiClient.GET(
        "/api/public/user/summits/all",
        { params: { query: { userId: userId ?? "", page: pageParam } } },
      );
      if (error) throw error;
      return data.message;
    },
    getNextPageParam: (last) =>
      last.pagination.hasMore ? last.pagination.page + 1 : undefined,
  });

export const useUserProfile = ({
  userId,
}: {
  userId: string | undefined;
}) => {
  const props = useQuery({
    queryKey: userKeys.profile(userId ?? ""),
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await apiClient.GET(
        "/api/public/user/user-profile",
        { params: { query: { userId: userId ?? "" } } },
      );
      if (error) throw error;
      return data.message;
    },
  });

  return props;
};

export const useUserPeople = () => {
  const { isAuthenticated } = useAuth();
  return useQuery({
    queryKey: userKeys.people(),
    enabled: () => isAuthenticated,
    queryFn: async () => {
      const { data, error } = await apiClient.GET(
        "/api/protected/user/people",
      );
      if (error) throw error;
      return data.message;
    },
  });
};

type PersonListItem = {
  userId: string;
  firstName: string | null;
  lastName: string | null;
  imageUrl: string | null;
  connectedAt: string;
  sharedSummitCount: number;
};

export const useAddUserPerson = () => {
  return useMutation({
    mutationFn: async (personUserId: string) => {
      const { data, error } = await apiClient.POST(
        "/api/protected/user/people",
        { body: { personUserId } },
      );
      if (error) throw error;
      return data;
    },
    onMutate: async (personUserId) => {
      await queryClient.cancelQueries({ queryKey: userKeys.people() });
      const prev = queryClient.getQueryData<PersonListItem[]>(
        userKeys.people(),
      );
      if (prev) {
        queryClient.setQueryData<PersonListItem[]>(userKeys.people(), [
          {
            userId: personUserId,
            firstName: null,
            lastName: null,
            imageUrl: null,
            connectedAt: new Date().toISOString(),
            sharedSummitCount: 0,
          },
          ...prev.filter((p) => p.userId !== personUserId),
        ]);
      }
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) {
        queryClient.setQueryData(userKeys.people(), ctx.prev);
      }
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: userKeys.people() });
    },
  });
};

export const useRemoveUserPerson = () => {
  return useMutation({
    mutationFn: async (personUserId: string) => {
      const { data, error } = await apiClient.DELETE(
        "/api/protected/user/people/{personUserId}",
        { params: { path: { personUserId } } },
      );
      if (error) throw error;
      return data;
    },
    onMutate: async (personUserId) => {
      await queryClient.cancelQueries({ queryKey: userKeys.people() });
      const prev = queryClient.getQueryData<PersonListItem[]>(
        userKeys.people(),
      );
      if (prev) {
        queryClient.setQueryData<PersonListItem[]>(
          userKeys.people(),
          prev.filter((p) => p.userId !== personUserId),
        );
      }
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) {
        queryClient.setQueryData(userKeys.people(), ctx.prev);
      }
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: userKeys.people() });
    },
  });
};

export const useUserChallenges = ({
  userId,
  enabled = true,
}: {
  userId: string;
  enabled?: boolean;
}) => {
  const props = useQuery({
    queryKey: userKeys.challenges(userId),
    enabled: enabled && userId.length > 0,
    queryFn: async () => {
      const { data, error } = await apiClient.GET(
        "/api/public/user/challenges",
        { params: { query: { userId } } },
      );
      if (error) throw error;
      return data.message;
    },
  });

  return props;
};

export const useJoinMutation = () => {
  return useMutation({
    mutationKey: ["user", "join"],
    mutationFn: async (input: {
      provider: "apple" | "google";
      identityToken: string;
      locale?: string;
      firstName?: string;
      lastName?: string;
    }) => {
      const { data, error } = await apiClient.POST("/api/public/join", {
        body: input,
      });
      if (error) throw error;
      return data.message;
    },
  });
};

export const useUpdateUserMeMutation = () => {
  return useMutation({
    mutationKey: ["user", "update", "me"],
    mutationFn: async (input: {
      firstName?: string;
      lastName?: string;
      imageUrl?: string;
      locale?: string;
      town?: string;
      phoneNumber?: string;
      visibleOnHiscores?: boolean;
      visibleOnPeopleSearch?: boolean;
      activeChallengeId?: string;
    }) => {
      if (Object.values(input).every((v) => v === undefined)) {
        return { success: true } as const;
      }
      const { data, error } = await apiClient.POST("/api/protected/user/me", {
        body: input,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      void queryClient.invalidateQueries({ queryKey: userKeys.me() });
      // If activeChallengeId was updated, invalidate all challenge-dependent queries
      if (variables.activeChallengeId) {
        void queryClient.invalidateQueries({ queryKey: challengeKeys.active() });
        void queryClient.invalidateQueries({ queryKey: userKeys.summits() });
        void queryClient.invalidateQueries({ queryKey: mountainKeys.all });
      }
    },
  });
};

export const useDeleteAccountMutation = () => {
  return useMutation({
    mutationKey: ["user", "delete", "account"],
    mutationFn: async () => {
      const { data, error } = await apiClient.GET("/api/protected/user/delete");
      if (error) throw error;
      return data;
    },
  });
};

export const useUnlockableUnlock = () => {
  return useMutation({
    mutationFn: async (key: "merch" | "share" | "forcat" | "picat") => {
      const { data, error } = await apiClient.POST(
        "/api/protected/user/unlockables",
        { body: { key } },
      );
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: userKeys.me() });
    },
  });
};

export const useSubmitSuggestionMutation = () => {
  return useMutation({
    mutationKey: ["user", "suggestion"],
    mutationFn: async (input: { suggestion: string }) => {
      const { data, error } = await apiClient.POST(
        "/api/protected/user/suggestion",
        {
          body: input,
        },
      );
      if (error) throw error;
      return data;
    },
  });
};


import { useMutation, useQuery } from "@tanstack/react-query";
import { useEffect } from "react";

import { queryClient } from "@/components/providers/query-client-provider";
import { useAuth } from "@/components/providers/auth-provider";
import { useChallenge } from "@/components/providers/challenge-provider";
import apiClient from "@/lib/api-client";

export const USER_ME_QUERY_KEY = ["me"];
export const USER_SUMMITS_KEY = (challengeId?: string) => [
  "user",
  "summits",
  "all",
  challengeId,
];

export const USER_ANY_SUMMITS_KEY = (userId: string) => [
  "user",
  "summits",
  "all",
  userId,
];

export const USER_ONE_GET_KEY = (userId: string) => ["user", "one", userId];

export const useUserMe = () => {
  const { isAuthenticated, logout } = useAuth();

  const props = useQuery({
    queryKey: USER_ME_QUERY_KEY,
    enabled: () => isAuthenticated,
    queryFn: async () => {
      if (!isAuthenticated) return null;
      const { data, error, response } = await apiClient.GET(
        "/api/protected/user/me",
      );

      // Check for 401 unauthorized
      if (response.status === 401) {
        throw new Error("Unauthorized");
      }

      if (error) throw error;
      return data.message;
    },
  });

  useEffect(() => {
    if (props.error) {
      logout();
    }
  }, [logout, props.error]);

  return props;
};

export const useUsers = ({ query }: { query?: string }) => {
  const { isAuthenticated } = useAuth();

  const args = useQuery({
    queryKey: ["users", "all", query],
    enabled: () => isAuthenticated && !!query,
    queryFn: async () => {
      if (!isAuthenticated || !query) return null;
      const { data, error } = await apiClient.GET("/api/protected/user/all", {
        params: { query: { q: query } },
      });
      if (error) throw error;
      return data.message;
    },
  });

  return args;
};

export const useUserChallengeSummits = () => {
  const { isAuthenticated } = useAuth();
  const { challengeId } = useChallenge();

  const props = useQuery({
    queryKey: USER_SUMMITS_KEY(challengeId),
    enabled: () => isAuthenticated,
    queryFn: async () => {
      if (!isAuthenticated) return null;
      const { data, error } = await apiClient.GET(
        "/api/protected/user/summits",
        { params: { query: { challengeId } } },
      );
      if (error) throw error;
      return data.message;
    },
  });

  return props;
};

export const useUserSummits = () => {
  const { isAuthenticated } = useAuth();

  const props = useQuery({
    queryKey: USER_SUMMITS_KEY(),
    enabled: () => isAuthenticated,
    queryFn: async () => {
      if (!isAuthenticated) return null;
      const { data, error } = await apiClient.GET(
        "/api/protected/user/summits",
        { params: { query: {} } },
      );
      if (error) throw error;
      return data.message;
    },
  });

  return props;
};

export const useUserOneGet = ({ userId }: { userId: string }) => {
  const props = useQuery({
    queryKey: USER_ONE_GET_KEY(userId),
    queryFn: async () => {
      const { data, error } = await apiClient.GET("/api/public/user/one", {
        params: { query: { userId } },
      });
      if (error) throw error;
      return data.message;
    },
  });

  return props;
};

export const useAnyUserSummits = ({ userId }: { userId: string }) => {
  const props = useQuery({
    queryKey: USER_ANY_SUMMITS_KEY(userId),
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

export const USER_PROFILE_KEY = (userId: string) => ["user", "profile", userId];

export const useUserProfile = ({ userId }: { userId: string }) => {
  const props = useQuery({
    queryKey: USER_PROFILE_KEY(userId),
    queryFn: async () => {
      const { data, error } = await apiClient.GET(
        "/api/public/user/user-profile",
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
      visibleOnHiscores?: boolean;
      visibleOnPeopleSearch?: boolean;
    }) => {
      const { data, error } = await apiClient.POST("/api/protected/user/me", {
        body: input,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: USER_ME_QUERY_KEY });
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

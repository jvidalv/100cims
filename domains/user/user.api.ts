import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";

import { useAuth } from "@/components/providers/auth-provider";
import { useChallenge } from "@/components/providers/challenge-provider";
import { useApiWithAuth } from "@/hooks/use-api-with-auth";
import { api } from "@/lib";

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
  const api = useApiWithAuth();

  const props = useQuery({
    queryKey: USER_ME_QUERY_KEY,
    enabled: () => isAuthenticated,
    queryFn: () => api.protected.user.me.get(),
  });

  useEffect(() => {
    if (props.data?.error?.status === 401) {
      logout();
    }
  }, [logout, props]);

  return {
    ...props,
    data: props.data?.data?.message,
  };
};

export const useUsers = ({ query }: { query?: string }) => {
  const { isAuthenticated } = useAuth();
  const api = useApiWithAuth();

  const args = useQuery({
    queryKey: ["users", "all", query],
    enabled: () => isAuthenticated && !!query,
    queryFn: () =>
      query ? api.protected.user.all.get({ query: { q: query } }) : null,
  });

  return { ...args, data: args.data?.data?.message };
};

export const useUserChallengeSummits = () => {
  const { isAuthenticated } = useAuth();
  const { challengeId } = useChallenge();
  const api = useApiWithAuth();

  const props = useQuery({
    queryKey: USER_SUMMITS_KEY(challengeId),
    enabled: () => isAuthenticated,
    queryFn: () => api.protected.user.summits.get({ query: { challengeId } }),
  });

  return { ...props, data: props?.data?.data?.message };
};

export const useUserSummits = () => {
  const { isAuthenticated } = useAuth();
  const api = useApiWithAuth();

  const props = useQuery({
    queryKey: USER_SUMMITS_KEY(),
    enabled: () => isAuthenticated,
    queryFn: () => api.protected.user.summits.get({ query: {} }),
  });

  return { ...props, data: props?.data?.data?.message };
};

export const useUserOneGet = ({ userId }: { userId: string }) => {
  const props = useQuery({
    queryKey: USER_ONE_GET_KEY(userId),
    queryFn: () => api.public.user.one.get({ query: { userId } }),
  });

  return { ...props, data: props?.data?.data?.message };
};

export const useAnyUserSummits = ({ userId }: { userId: string }) => {
  const props = useQuery({
    queryKey: USER_ANY_SUMMITS_KEY(userId),
    queryFn: () => api.public.user.summits.get({ query: { userId } }),
  });

  return { ...props, data: props?.data?.data?.message };
};

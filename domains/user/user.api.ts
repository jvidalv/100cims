import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";

import { useAuth } from "@/components/providers/auth-provider";
import { useChallenge } from "@/components/providers/challenge-provider";
import { useApiWithAuth } from "@/hooks/use-api-with-auth";

export const USER_ME_QUERY_KEY = ["me"];
export const USER_SUMMITS_KEY = (challengeId: string) => [
  "user",
  "summits",
  "all",
  challengeId,
];

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

export const useUserSummits = () => {
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

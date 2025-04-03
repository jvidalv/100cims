import { useMutation, useQuery } from "@tanstack/react-query";

import { useAuth } from "@/components/providers/auth-provider";
import { queryClient } from "@/components/providers/query-client-provider";
import { useApiWithAuth } from "@/hooks/use-api-with-auth";

export const usePlanChatRead = () => {
  const apiWithAuth = useApiWithAuth();

  return useMutation({
    mutationKey: ["plan-chat", "read"],
    mutationFn: (planId: string) =>
      apiWithAuth.protected.plans.chat.read.post({ planId }),
    onSuccess: (_data, planId) => {
      void queryClient.invalidateQueries({
        queryKey: ["plan-chat", "unread"],
      });
      void queryClient.invalidateQueries({
        queryKey: ["plan-chat", "messages", planId],
      });
    },
  });
};

export const usePlanChatUnread = () => {
  const apiWithAuth = useApiWithAuth();
  const { isAuthenticated } = useAuth();

  return useQuery({
    queryKey: ["plan-chat", "unread"],
    enabled: () => isAuthenticated,
    queryFn: () =>
      isAuthenticated ? apiWithAuth.protected.plans.chat.unread.get() : null,
  });
};

export const usePlanChatMessages = (planId: string) => {
  const apiWithAuth = useApiWithAuth();
  const { isAuthenticated } = useAuth();

  return useQuery({
    queryKey: ["plan-chat", "messages", planId],
    enabled: () => isAuthenticated,
    queryFn: () =>
      isAuthenticated
        ? apiWithAuth.protected.plans.chat.all.get({ query: { planId } })
        : null,
    refetchInterval: 2500,
  });
};

export const usePlanChatSendMessage = () => {
  const apiWithAuth = useApiWithAuth();

  return useMutation({
    mutationKey: ["plan-chat", "send"],
    mutationFn: (input: { planId: string; message: string }) =>
      apiWithAuth.protected.plans.chat.send.post(input),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({
        queryKey: ["plan-chat", "messages", variables.planId],
      });
    },
  });
};

export const usePlanChatDeleteMessage = () => {
  const apiWithAuth = useApiWithAuth();

  return useMutation({
    mutationKey: ["plan-chat", "delete"],
    mutationFn: (messageId: string) =>
      apiWithAuth.protected.plans.chat.delete.delete({ messageId }),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ["plan-chat", "messages"],
      });
    },
  });
};

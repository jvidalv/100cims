import { useMutation, useQuery } from "@tanstack/react-query";

import { useAuth } from "@/components/providers/auth-provider";
import { queryClient } from "@/components/providers/query-client-provider";
import apiClient from "@/lib/api-client";

export const usePlanChatRead = () => {
  return useMutation({
    mutationKey: ["plan-chat", "read"],
    mutationFn: async (planId: string) => {
      const { data, error } = await apiClient.POST(
        "/api/protected/plans/chat/read",
        { body: { planId } },
      );
      if (error) throw error;
      return data;
    },
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
  const { isAuthenticated } = useAuth();

  return useQuery({
    queryKey: ["plan-chat", "unread"],
    enabled: () => isAuthenticated,
    queryFn: async () => {
      if (!isAuthenticated) return null;
      const { data, error } = await apiClient.GET(
        "/api/protected/plans/chat/unread",
      );
      if (error) throw error;
      return data.message;
    },
  });
};

export const usePlanChatMessages = (planId: string) => {
  const { isAuthenticated } = useAuth();

  return useQuery({
    queryKey: ["plan-chat", "messages", planId],
    enabled: () => isAuthenticated,
    queryFn: async () => {
      if (!isAuthenticated) return null;
      const { data, error } = await apiClient.GET(
        "/api/protected/plans/chat/all",
        { params: { query: { planId } } },
      );
      if (error) throw error;
      return data.message.map((msg) => ({
        ...msg,
        createdAt: new Date(msg.createdAt as string | number),
      }));
    },
    refetchInterval: 2500,
  });
};

export const usePlanChatSendMessage = () => {
  return useMutation({
    mutationKey: ["plan-chat", "send"],
    mutationFn: async (input: { planId: string; message: string }) => {
      const { data, error } = await apiClient.POST(
        "/api/protected/plans/chat/send",
        { body: input },
      );
      if (error) throw error;
      return data.message;
    },
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({
        queryKey: ["plan-chat", "messages", variables.planId],
      });
    },
  });
};

export const usePlanChatDeleteMessage = () => {
  return useMutation({
    mutationKey: ["plan-chat", "delete"],
    mutationFn: async (messageId: string) => {
      const { data, error } = await apiClient.DELETE(
        "/api/protected/plans/chat/delete",
        { body: { messageId } },
      );
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ["plan-chat", "messages"],
      });
    },
  });
};

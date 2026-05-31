import { useMutation, useQuery } from "@tanstack/react-query";

import { useAuth } from "@/components/providers/auth-provider";
import { queryClient } from "@/components/providers/query-client-provider";
import apiClient from "@/lib/api-client";

import type { paths } from "@/types/api";

type ChatSendBody =
  paths["/api/protected/plans/chat/send"]["post"]["requestBody"]["content"]["application/json"];

export const usePlanChatRead = () => {
  const { isAuthenticated } = useAuth();
  return useMutation({
    mutationKey: ["plan-chat", "read"],
    mutationFn: async (planId: string) => {
      // Endpoint is protected — skip the request for unauth users instead of
      // letting it round-trip to a 401. Callers (chat screen) fire this on
      // mount/unmount regardless of auth state.
      if (!isAuthenticated) return null;
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

export const usePlanChatMessages = (planId: string | undefined) => {
  const { isAuthenticated } = useAuth();

  return useQuery({
    queryKey: ["plan-chat", "messages", planId ?? ""],
    // NativeTabs eager-mounts sibling tabs before the route-param binding
    // resolves, so `planId` is briefly undefined even though the type from
    // useGlobalSearchParams promises a string. Gate on `planId` to avoid
    // the server's 422 spam during that window. See memory
    // `feedback_react_query_enabled_guards`.
    enabled: () => isAuthenticated && !!planId,
    queryFn: async () => {
      if (!isAuthenticated || !planId) return null;
      const { data, error } = await apiClient.GET(
        "/api/protected/plans/chat/all",
        { params: { query: { planId } } },
      );
      if (error) throw error;
      return data.message.map((msg) => ({
        ...msg,
        // OpenAPI schema includes a `Record<string, never>` variant from a
        // TypeBox quirk, but the server always returns a string or number.
        createdAt: new Date(
          typeof msg.createdAt === "string" || typeof msg.createdAt === "number"
            ? msg.createdAt
            : 0,
        ),
      }));
    },
    refetchInterval: 2500,
  });
};

export const usePlanChatSendMessage = () => {
  return useMutation({
    mutationKey: ["plan-chat", "send"],
    mutationFn: async (input: ChatSendBody) => {
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

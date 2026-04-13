import { useMutation } from "@tanstack/react-query";
import * as Notifications from "expo-notifications";
import { router } from "expo-router";
import { useEffect, useRef } from "react";

import { useAuth } from "@/components/providers/auth-provider";
import apiClient from "@/lib/api-client";
import { registerForPushNotificationsAsync } from "@/lib/push";

const isPlanPushType = (value: unknown) =>
  value === "plan-join" || value === "plan-leave" || value === "plan-chat";

const getStringField = (data: unknown, key: string): string | null => {
  if (!data || typeof data !== "object" || !(key in data)) return null;
  const value: unknown = Reflect.get(data, key);
  return typeof value === "string" ? value : null;
};

const routeFromNotificationData = (data: unknown) => {
  const type = getStringField(data, "type");

  if (type === "mountain-suggestion") {
    const slug = getStringField(data, "mountainSlug");
    if (slug) router.push(`/mountain/${slug}`);
    return;
  }

  if (isPlanPushType(type)) {
    const planId = getStringField(data, "planId");
    if (planId) router.push(`/plan/${planId}`);
  }
};

export const usePushTokenRegistration = () => {
  const { isAuthenticated } = useAuth();
  const lastRoutedIdRef = useRef<string | null>(null);
  const lastResponse = Notifications.useLastNotificationResponse();

  const { mutate } = useMutation({
    mutationKey: ["user", "push-token"],
    mutationFn: async (input: {
      expoPushToken: string | null;
      pushNotificationsEnabled?: boolean;
    }) => {
      const { data, error } = await apiClient.POST(
        "/api/protected/user/push-token",
        { body: input },
      );
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    if (!isAuthenticated) return;
    let cancelled = false;
    (async () => {
      const token = await registerForPushNotificationsAsync();
      if (cancelled) return;
      mutate({ expoPushToken: token });
    })();
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, mutate]);

  useEffect(() => {
    if (!lastResponse) return;
    const id = lastResponse.notification.request.identifier;
    if (lastRoutedIdRef.current === id) return;
    lastRoutedIdRef.current = id;
    routeFromNotificationData(lastResponse.notification.request.content.data);
  }, [lastResponse]);

  useEffect(() => {
    const sub = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        const id = response.notification.request.identifier;
        if (lastRoutedIdRef.current === id) return;
        lastRoutedIdRef.current = id;
        routeFromNotificationData(response.notification.request.content.data);
      },
    );
    return () => sub.remove();
  }, []);
};

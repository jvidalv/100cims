import { useMutation } from "@tanstack/react-query";
import * as Notifications from "expo-notifications";
import { router } from "expo-router";
import { useEffect, useRef } from "react";

import { useAuth } from "@/components/providers/auth-provider";
import apiClient from "@/lib/api-client";
import { getPushTokenIfGranted } from "@/lib/push";

type PushTokenInput = {
  expoPushToken: string | null;
  pushNotificationsEnabled?: boolean;
};

const postPushToken = async (input: PushTokenInput) => {
  const { data, error } = await apiClient.POST(
    "/api/protected/user/push-token",
    { body: input },
  );
  if (error) throw error;
  return data;
};

/**
 * Shared mutation spec reused by the auth-mount effect and the
 * post-grant re-registration flow in `useAskPushPermission`.
 */
export const usePushTokenMutation = () =>
  useMutation({
    mutationKey: ["user", "push-token"],
    mutationFn: postPushToken,
  });

const isPlanPushType = (value: unknown) =>
  value === "plan-join" ||
  value === "plan-join-other" ||
  value === "plan-leave" ||
  value === "plan-chat" ||
  value === "plan-reminder" ||
  value === "plan-saved-mountain" ||
  value === "friend-plan-created";

const isCommentPushType = (value: unknown) =>
  value === "comment-reply" ||
  value === "comment-thread-reply" ||
  value === "comment-upvote-milestone";

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

  if (type === "summit-tagged") {
    const summitId = getStringField(data, "summitId");
    if (summitId) router.push(`/user/summits/${summitId}`);
    return;
  }

  if (isCommentPushType(type)) {
    const slug = getStringField(data, "mountainSlug");
    if (slug) router.push(`/mountain/${slug}/comments`);
    return;
  }

  if (type === "plan-deleted") {
    router.push("/plans");
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

  const { mutate } = usePushTokenMutation();

  useEffect(() => {
    if (!isAuthenticated) return;
    let cancelled = false;
    (async () => {
      // No-op unless the user has already granted permission on a previous
      // install or explicitly enabled it via useAskPushPermission.
      const token = await getPushTokenIfGranted();
      if (cancelled || !token) return;
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

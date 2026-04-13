export const PUSH_TYPE = {
  PLAN_JOIN: "plan-join",
  PLAN_LEAVE: "plan-leave",
  PLAN_CHAT: "plan-chat",
  MOUNTAIN_SUGGESTION: "mountain-suggestion",
} as const;

export type PushType = (typeof PUSH_TYPE)[keyof typeof PUSH_TYPE];

export const getUserDisplayName = (user: {
  firstName: string | null;
  username: string | null;
}): string => user.firstName || user.username || "Someone";

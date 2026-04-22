export const PUSH_TYPE = {
  PLAN_JOIN: "plan-join",
  PLAN_LEAVE: "plan-leave",
  PLAN_CHAT: "plan-chat",
  PLAN_REMINDER: "plan-reminder",
  MOUNTAIN_SUGGESTION: "mountain-suggestion",
  SUMMIT_TAGGED: "summit-tagged",
  SHOP_REQUEST: "shop-request",
} as const;

export type PushType = (typeof PUSH_TYPE)[keyof typeof PUSH_TYPE];

export const getUserDisplayName = (user: {
  firstName: string | null;
  username: string | null;
}): string => user.firstName || user.username || "Someone";

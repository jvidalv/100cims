export const PUSH_TYPE = {
  PLAN_JOIN: "plan-join",
  PLAN_JOIN_OTHER: "plan-join-other",
  PLAN_LEAVE: "plan-leave",
  PLAN_DELETED: "plan-deleted",
  FRIEND_PLAN_CREATED: "friend-plan-created",
  PLAN_CHAT: "plan-chat",
  PLAN_REMINDER: "plan-reminder",
  PLAN_SAVED_MOUNTAIN: "plan-saved-mountain",
  MOUNTAIN_SUGGESTION: "mountain-suggestion",
  SUMMIT_TAGGED: "summit-tagged",
  SHOP_REQUEST: "shop-request",
  // Comments: your own comment got a direct reply.
  COMMENT_REPLY: "comment-reply",
  // Comments: a new reply landed in a thread you participated in (not yours).
  COMMENT_THREAD_REPLY: "comment-thread-reply",
  // Comments: your comment crossed an upvote milestone (5, 10, 15, 20).
  COMMENT_UPVOTE_MILESTONE: "comment-upvote-milestone",
} as const;

export type PushType = (typeof PUSH_TYPE)[keyof typeof PUSH_TYPE];

export const getUserDisplayName = (user: {
  firstName: string | null;
  username: string | null;
}): string => user.firstName || user.username || "Someone";

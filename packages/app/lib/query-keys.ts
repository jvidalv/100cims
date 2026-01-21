/**
 * Centralized query keys for React Query
 * Use these functions to ensure consistency across the app
 */

// User keys
export const userKeys = {
  all: ["user"] as const,
  me: () => ["user", "me"] as const,
  summits: () => ["user", "summits"] as const,
  summitsById: (userId: string) => ["user", "summits", userId] as const,
  one: (userId: string) => ["user", "one", userId] as const,
  profile: (userId: string) => ["user", "profile", userId] as const,
  challenges: (userId: string) => ["user", "challenges", userId] as const,
  search: (query: string) => ["user", "search", query] as const,
};

// Challenge keys
export const challengeKeys = {
  all: ["challenge"] as const,
  active: () => ["challenge", "active"] as const,
  list: () => ["challenge", "list"] as const,
  detail: (id: string) => ["challenge", "detail", id] as const,
};

// Community challenge keys
export const communityChallengeKeys = {
  all: ["community-challenge"] as const,
  list: (params?: { filter?: "mine" | "public" }) =>
    ["community-challenge", "list", params] as const,
  one: (id: string) => ["community-challenge", id] as const,
};

// Mountain keys
export const mountainKeys = {
  all: ["mountain"] as const,
  list: () => ["mountain", "list"] as const,
  myList: () => ["mountain", "my-list"] as const,
  one: (slug: string) => ["mountain", slug] as const,
  search: (query: string, challengeId?: string) =>
    ["mountain", "search", query, challengeId] as const,
};

// Summit keys
export const summitKeys = {
  all: ["summit"] as const,
  list: () => ["summit", "list"] as const,
  one: (id: string) => ["summit", id] as const,
};

// Plan keys
export const planKeys = {
  all: ["plan"] as const,
  list: (params?: object) => ["plan", "list", params] as const,
  one: (id: string) => ["plan", id] as const,
  countNew: (userId?: string) => ["plan", "count-new", userId] as const,
};

// Plan chat keys
export const planChatKeys = {
  all: ["plan-chat"] as const,
  unread: () => ["plan-chat", "unread"] as const,
  messages: (planId: string) => ["plan-chat", "messages", planId] as const,
};

// Hiscores keys
export const hiscoresKeys = {
  all: ["hiscores"] as const,
  list: () => ["hiscores", "list"] as const,
};

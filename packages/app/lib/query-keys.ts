/**
 * Centralized query keys for React Query
 * Use these functions to ensure consistency across the app
 */

// User keys
export const userKeys = {
  all: ["user"] as const,
  me: () => ["user", "me"] as const,
  summits: () => ["user", "summits"] as const,
  summitsAll: (query: string, sort: "recent" | "height") =>
    ["user", "summits", "all", query, sort] as const,
  summitsById: (userId: string) => ["user", "summits", userId] as const,
  one: (userId: string) => ["user", "one", userId] as const,
  profile: (userId: string) => ["user", "profile", userId] as const,
  challenges: (userId: string) => ["user", "challenges", userId] as const,
  search: (query: string) => ["user", "search", query] as const,
  people: () => ["user", "people"] as const,
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
  reactions: (summitId: string) => ["summit", "reactions", summitId] as const,
};

// Plan keys
export const planKeys = {
  all: ["plan"] as const,
  list: (params?: object) => ["plan", "list", params] as const,
  listInfinite: (params?: object) => ["plan", "list-infinite", params] as const,
  one: (id: string) => ["plan", id] as const,
  countNew: (userId?: string) => ["plan", "count-new", userId] as const,
};

// Hiscores keys
export const hiscoresKeys = {
  all: ["hiscores"] as const,
  list: () => ["hiscores", "list"] as const,
};

// Merch keys
export const merchKeys = {
  all: ["merch"] as const,
  list: () => ["merch", "list"] as const,
};

// Update keys
export const updateKeys = {
  all: ["updates"] as const,
  unseen: (updateIds: string[]) =>
    ["updates", "unseen", updateIds.join(",")] as const,
};

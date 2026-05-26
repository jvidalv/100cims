export const userKeys = {
  all: ["user"] as const,
  me: () => ["user", "me"] as const,
};

export const adminKeys = {
  crons: () => ["admin", "crons"] as const,
  usersList: () => ["admin", "users"] as const,
  users: (params: {
    page: number;
    q: string;
    country: string;
    platform: string;
    version: string;
    sort: string;
  }) => ["admin", "users", params] as const,
  userDetail: (id: string) => ["admin", "users", id] as const,
  userSummits: (id: string, page: number) =>
    ["admin", "users", id, "summits", page] as const,
  userPeople: (id: string) => ["admin", "users", id, "people"] as const,
  userSaved: (id: string) => ["admin", "users", id, "saved"] as const,
  mountainsList: () => ["admin", "mountains"] as const,
  mountains: (params: { page: number; q: string; sort: string }) =>
    ["admin", "mountains", params] as const,
  mountainDetail: (id: string) => ["admin", "mountains", id] as const,
  mountainChallenges: (id: string) =>
    ["admin", "mountains", id, "challenges"] as const,
  mountainRatings: (id: string) =>
    ["admin", "mountains", id, "ratings"] as const,
  mountainComments: (id: string) =>
    ["admin", "mountains", id, "comments"] as const,
  commentsList: () => ["admin", "comments"] as const,
  comments: (params: { page: number; q: string; sort: string }) =>
    ["admin", "comments", params] as const,
  commentDetail: (id: string) => ["admin", "comments", id] as const,
  summitsList: () => ["admin", "summits"] as const,
  summits: (params: { page: number; q: string; validated: string }) =>
    ["admin", "summits", params] as const,
  summitDetail: (id: string) => ["admin", "summits", id] as const,
  plansList: () => ["admin", "plans"] as const,
  plans: (params: { page: number; q: string; status: string; speed: string }) =>
    ["admin", "plans", params] as const,
  planDetail: (id: string) => ["admin", "plans", id] as const,
  statsTimeseries: (metric: string, range: string) =>
    ["admin", "stats", "timeseries", metric, range] as const,
  challengesList: () => ["admin", "challenges"] as const,
  challenges: (params: { page: number; q: string; kind: string }) =>
    ["admin", "challenges", params] as const,
  challengeDetail: (id: string) => ["admin", "challenges", id] as const,
  challengeMountains: (id: string) =>
    ["admin", "challenges", id, "mountains"] as const,
  merchList: () => ["admin", "merch"] as const,
  merchDetail: (id: string) => ["admin", "merch", id] as const,
  couponList: () => ["admin", "coupons"] as const,
  couponDetail: (id: string) => ["admin", "coupons", id] as const,
  shopRequestList: () => ["admin", "shop-requests"] as const,
  shopRequestDetail: (id: string) => ["admin", "shop-requests", id] as const,
  campaignStats: (slug: string) =>
    ["admin", "campaigns", slug, "stats"] as const,
};

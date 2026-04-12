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
  }) => ["admin", "users", params] as const,
  userDetail: (id: string) => ["admin", "users", id] as const,
  userSummits: (id: string, page: number) =>
    ["admin", "users", id, "summits", page] as const,
  mountainsList: () => ["admin", "mountains"] as const,
  mountains: (params: { page: number; q: string }) =>
    ["admin", "mountains", params] as const,
  mountainDetail: (id: string) => ["admin", "mountains", id] as const,
  mountainChallenges: (id: string) =>
    ["admin", "mountains", id, "challenges"] as const,
  summitsList: () => ["admin", "summits"] as const,
  summits: (params: {
    page: number;
    q: string;
    validated: string;
  }) => ["admin", "summits", params] as const,
  summitDetail: (id: string) => ["admin", "summits", id] as const,
  statsTimeseries: (metric: string, range: string) =>
    ["admin", "stats", "timeseries", metric, range] as const,
};

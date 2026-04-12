export const userKeys = {
  all: ["user"] as const,
  me: () => ["user", "me"] as const,
};

export const adminKeys = {
  crons: () => ["admin", "crons"] as const,
};

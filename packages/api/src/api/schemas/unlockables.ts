import { t } from "elysia";

export const UNLOCKABLES = ["merch", "share", "forcat", "picat"] as const;
export type Unlockable = (typeof UNLOCKABLES)[number];

export const UnlockableSchema = t.Union([
  t.Literal("merch"),
  t.Literal("share"),
  t.Literal("forcat"),
  t.Literal("picat"),
]);

export const UnlockablesArraySchema = t.Array(UnlockableSchema);

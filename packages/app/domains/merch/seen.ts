import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState } from "react";

import type { paths } from "@/types/api";

type MerchEntry =
  paths["/api/public/merch/"]["get"]["responses"][200]["content"]["application/json"]["message"][number];

const SEEN_KEY = "merch-seen";
const SEEN_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;

type SeenMap = Record<string, true>;

// Module-level authoritative map so concurrent `markSeen` calls can mutate
// against a synchronous snapshot instead of racing through the async
// `loadSeen → mutate → setItem` round-trip. Without this, opening product
// A then quickly B before A's write resolved would have B observe the
// pre-A map and overwrite A's slug. Initialized on first `loadSeen` call.
// Trade-off: `markSeen` updates the cache + emits to subscribers BEFORE
// the AsyncStorage write resolves (see below). If the write fails or the
// app is killed mid-flush, the in-memory state stays "seen" for the rest
// of the session but the next cold start re-flashes "New" because storage
// never persisted. Acceptable for a cosmetic 7-day badge.
let cache: SeenMap | null = null;

const subscribers = new Set<(seen: SeenMap) => void>();
const emit = (seen: SeenMap): void => {
  for (const listener of subscribers) listener(seen);
};

export const subscribeSeen = (listener: (seen: SeenMap) => void): (() => void) => {
  subscribers.add(listener);
  return () => {
    subscribers.delete(listener);
  };
};

const sanitize = (raw: unknown): SeenMap => {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
  const out: SeenMap = {};
  for (const [key, value] of Object.entries(raw)) {
    if (typeof key === "string" && value === true) out[key] = true;
  }
  return out;
};

export const loadSeen = async (): Promise<SeenMap> => {
  if (cache) return cache;
  const raw = await AsyncStorage.getItem(SEEN_KEY);
  if (!raw) {
    cache = {};
    return cache;
  }
  try {
    cache = sanitize(JSON.parse(raw));
  } catch {
    cache = {};
  }
  return cache;
};

export const markSeen = async (slug: string): Promise<void> => {
  const current = await loadSeen();
  if (current[slug]) return;
  const next: SeenMap = { ...current, [slug]: true };
  cache = next;
  emit(next);
  await AsyncStorage.setItem(SEEN_KEY, JSON.stringify(next));
};

// OpenAPI schema includes a `Record<string, never>` variant from a TypeBox
// quirk (the same one handled in plan-chat.api.ts). Real server values are
// strings (ISO) or numbers (epoch ms); fall back to 0 so a malformed payload
// is treated as "ancient" rather than crashing. Accepts `undefined` so
// callers can pass an in-flight product without an extra guard.
export const isWithinNewWindow = (
  createdAt: MerchEntry["createdAt"] | undefined,
): boolean => {
  const ts =
    typeof createdAt === "string" || typeof createdAt === "number"
      ? new Date(createdAt).getTime()
      : 0;
  if (!Number.isFinite(ts) || ts <= 0) return false;
  return Date.now() - ts < SEEN_WINDOW_MS;
};

type SeenState = { map: SeenMap; loaded: boolean };
const EMPTY_STATE: SeenState = { map: {}, loaded: false };

const useSeenState = (): SeenState => {
  const [state, setState] = useState<SeenState>(() =>
    cache ? { map: cache, loaded: true } : EMPTY_STATE,
  );
  useEffect(() => {
    let seenUpdate = false;
    const unsubscribe = subscribeSeen((next) => {
      seenUpdate = true;
      setState({ map: next, loaded: true });
    });
    void loadSeen().then((map) => {
      if (!seenUpdate) setState({ map, loaded: true });
    });
    return unsubscribe;
  }, []);
  return state;
};

export const useIsProductNew = (
  slug: string | undefined,
  createdAt: MerchEntry["createdAt"] | undefined,
): boolean => {
  const { map, loaded } = useSeenState();
  // Suppress the badge until seen-state has loaded — otherwise every
  // in-window product flashes "New" for one frame on cold start before
  // `loadSeen` resolves.
  if (!loaded || !slug) return false;
  return isWithinNewWindow(createdAt) && !map[slug];
};

export const useUnseenNewCount = (
  merch: MerchEntry[] | undefined,
): number => {
  const { map, loaded } = useSeenState();
  if (!loaded || !merch) return 0;
  let count = 0;
  for (const item of merch) {
    if (isWithinNewWindow(item.createdAt) && !map[item.slug]) count += 1;
  }
  return count;
};

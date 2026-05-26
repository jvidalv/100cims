/**
 * Small narrowing helpers for use with `unknown` values pulled out of
 * untrusted JSON, error objects, or API-shaped data where openapi-typescript
 * widens fields. Prefer these over `as` casts.
 */

export const stringOrUndefined = (v: unknown): string | undefined =>
  typeof v === "string" ? v : undefined;

export const numberOrUndefined = (v: unknown): number | undefined =>
  typeof v === "number" ? v : undefined;

/**
 * Build a `value is T[number]` guard for a `readonly` literal tuple.
 *
 *   const KEYS = ["a", "b", "c"] as const;
 *   const isKey = makeTupleGuard(KEYS);
 *
 * Saves the per-domain `(v: unknown): v is K => typeof v === "string" && ...`
 * boilerplate when checking that an unknown belongs to a closed set of
 * string literals.
 */
export const makeTupleGuard =
  <T extends readonly string[]>(values: T) =>
  (v: unknown): v is T[number] =>
    typeof v === "string" && (values as readonly string[]).includes(v);

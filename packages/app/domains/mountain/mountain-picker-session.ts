import type { MountainData } from "@/types/mountain";

export type MountainPickerMountain = {
  id: string;
  slug: string;
  name: string;
  location: string;
  height: string;
  essential: boolean;
  imageUrl: string | null;
};

export const toPickerMountain = (m: MountainData): MountainPickerMountain => ({
  id: m.id,
  slug: m.slug,
  name: m.name,
  location: m.location,
  height: m.height,
  essential: m.essential,
  imageUrl: m.imageUrl,
});

type Session = {
  id: number;
  initial: MountainPickerMountain[];
  title?: string;
  onResult: (mountains: MountainPickerMountain[]) => void;
};

let current: Session | null = null;
let nextSessionId = 1;

export const openMountainPickerSession = (
  session: Omit<Session, "id">,
): number => {
  const id = nextSessionId++;
  current = { ...session, id };
  return id;
};

export const readMountainPickerSession = (): Session | null => current;

/**
 * Notify the caller of the latest selection. Does NOT clear the session —
 * the picker commits on every toggle, so the session must stay alive until
 * the screen unmounts (which calls `clearMountainPickerSession`).
 */
export const commitMountainPickerSession = (
  result: MountainPickerMountain[],
) => {
  current?.onResult(result);
};

/**
 * Clear the session only if the passed id matches. Prevents a late cleanup
 * from wiping a freshly-opened session (e.g. picker A unmounts after picker B
 * is opened).
 */
export const clearMountainPickerSession = (id?: number) => {
  if (id === undefined || current?.id === id) {
    current = null;
  }
};

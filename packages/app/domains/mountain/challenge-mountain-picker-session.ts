import type { NewMountainData } from "@/types/mountain";

import type { MountainPickerMountain } from "./mountain-picker-session";

export type ChallengeMountainPickerResult = {
  selected: MountainPickerMountain[];
  newMountains: NewMountainData[];
};

type Session = {
  id: number;
  selected: MountainPickerMountain[];
  newMountains: NewMountainData[];
  title?: string;
  onResult: (result: ChallengeMountainPickerResult) => void;
};

let current: Session | null = null;
let nextSessionId = 1;

export const openChallengeMountainPickerSession = (
  session: Omit<Session, "id">,
): number => {
  const id = nextSessionId++;
  current = { ...session, id };
  return id;
};

export const readChallengeMountainPickerSession = (): Session | null => current;

export const commitChallengeMountainPickerSession = (
  result: ChallengeMountainPickerResult,
) => {
  if (!current) return;
  current.selected = result.selected;
  current.newMountains = result.newMountains;
  current.onResult(result);
};

export const appendNewMountainToSession = (mountain: NewMountainData) => {
  if (!current) return;
  const nextNew = [...current.newMountains, mountain];
  current.newMountains = nextNew;
  current.onResult({ selected: current.selected, newMountains: nextNew });
};

/**
 * Clear the session only if the passed id matches. Prevents a late cleanup
 * from wiping a freshly-opened session (e.g. picker A unmounts after picker B
 * is opened).
 */
export const clearChallengeMountainPickerSession = (id?: number) => {
  if (id === undefined || current?.id === id) {
    current = null;
  }
};

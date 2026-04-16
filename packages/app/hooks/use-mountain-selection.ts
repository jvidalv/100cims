import { useCallback, useState } from "react";

import { type MountainPickerMountain } from "@/domains/mountain/mountain-picker-session";
import type { NewMountainData } from "@/types/mountain";

type PickerResult = {
  selected: MountainPickerMountain[];
  newMountains: NewMountainData[];
};

type UseMountainSelectionOptions = {
  initialSelected?: MountainPickerMountain[];
};

/**
 * State for challenge create/edit mountain selection. Holds the catalog
 * mountains the user picked plus any locally-authored (unsaved) mountains.
 * The full-screen picker commits the pair via `handlePickerResult`.
 */
export function useMountainSelection(
  options: UseMountainSelectionOptions = {},
) {
  const [selected, setSelected] = useState<MountainPickerMountain[]>(
    options.initialSelected ?? [],
  );
  const [newMountains, setNewMountains] = useState<NewMountainData[]>([]);

  const handlePickerResult = useCallback((result: PickerResult) => {
    setSelected(result.selected);
    setNewMountains(result.newMountains);
  }, []);

  const initializeFromChallenge = useCallback(
    (mountains: MountainPickerMountain[]) => {
      setSelected(mountains);
      setNewMountains([]);
    },
    [],
  );

  const totalMountainCount = selected.length + newMountains.length;

  return {
    selected,
    newMountains,
    totalMountainCount,
    handlePickerResult,
    initializeFromChallenge,
  };
}

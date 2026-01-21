import { useState, useCallback, useMemo, Dispatch, SetStateAction } from "react";

import { MountainInfo, NewMountainData } from "@/types/mountain";

type MountainSource = {
  id: string;
  name: string;
  imageUrl: string | null;
};

type UseMountainSelectionOptions = {
  /** Initial selected mountain IDs */
  initialIds?: string[];
  /** Initial mountains for display (e.g., from challenge.mountains) */
  initialMountains?: MountainSource[];
  /** All available mountains from API for lookup */
  allMountains?: MountainSource[];
};

type UseMountainSelectionReturn = {
  /** Currently selected existing mountain IDs */
  selectedMountainIds: string[];
  /** New mountains created locally (not yet saved) */
  newMountains: NewMountainData[];
  /** Mountains for display (combined new + selected existing) */
  selectedMountainsForDisplay: MountainInfo[];
  /** Total count of selected + new mountains */
  totalMountainCount: number;
  /** Handler for selection changes from MountainSelectionDrawer */
  handleSelectionChange: Dispatch<SetStateAction<string[]>>;
  /** Add a new mountain locally */
  handleAddNewMountain: (mountain: NewMountainData) => void;
  /** Remove a local mountain by tempId */
  handleRemoveNewMountain: (tempId: string) => void;
  /** Reset state (for when initializing from challenge data) */
  initializeFromChallenge: (mountainIds: string[], mountains: MountainSource[]) => void;
};

/**
 * Hook for managing mountain selection state in challenge create/edit screens
 */
export function useMountainSelection(
  options: UseMountainSelectionOptions = {}
): UseMountainSelectionReturn {
  const { initialIds = [], initialMountains = [], allMountains = [] } = options;

  const [selectedMountainIds, setSelectedMountainIds] = useState<string[]>(initialIds);
  const [newMountains, setNewMountains] = useState<NewMountainData[]>([]);
  const [addedMountains, setAddedMountains] = useState<MountainInfo[]>([]);
  const [challengeMountains, setChallengeMountains] = useState<MountainSource[]>(initialMountains);

  // Combine challenge mountains with any newly added ones for display
  const selectedMountainsForDisplay = useMemo(() => {
    const allAvailable = [...challengeMountains, ...addedMountains];

    // New mountains (not yet saved)
    const newMountainsDisplay: MountainInfo[] = newMountains.map((m) => ({
      id: m.tempId,
      name: m.name,
      imageUrl: m.imageUri ?? null,
    }));

    // Existing selected mountains
    const existingDisplay = selectedMountainIds
      .map((id) => allAvailable.find((m) => m.id === id))
      .filter((m): m is MountainInfo => m !== undefined);

    return [...newMountainsDisplay, ...existingDisplay];
  }, [challengeMountains, addedMountains, selectedMountainIds, newMountains]);

  const totalMountainCount = selectedMountainIds.length + newMountains.length;

  // When selection changes, track any new mountains from allMountains
  const handleSelectionChange = useCallback(
    (newIds: string[] | ((prev: string[]) => string[])) => {
      setSelectedMountainIds((prev) => {
        const resolvedIds = typeof newIds === "function" ? newIds(prev) : newIds;

        // Find newly added IDs
        const newlyAdded = resolvedIds.filter((id) => !prev.includes(id));

        // Add mountain info for newly selected mountains from allMountains
        if (newlyAdded.length > 0 && allMountains.length > 0) {
          const newMountainInfos = newlyAdded
            .map((id) => allMountains.find((m) => m.id === id))
            .filter((m): m is NonNullable<typeof m> => m !== undefined)
            .map((m) => ({ id: m.id, name: m.name, imageUrl: m.imageUrl }));

          if (newMountainInfos.length > 0) {
            setAddedMountains((prev) => [...prev, ...newMountainInfos]);
          }
        }

        return resolvedIds;
      });
    },
    [allMountains]
  );

  const handleAddNewMountain = useCallback((mountain: NewMountainData) => {
    setNewMountains((prev) => [...prev, mountain]);
  }, []);

  const handleRemoveNewMountain = useCallback((tempId: string) => {
    setNewMountains((prev) => prev.filter((m) => m.tempId !== tempId));
  }, []);

  const initializeFromChallenge = useCallback((mountainIds: string[], mountains: MountainSource[]) => {
    setSelectedMountainIds(mountainIds);
    setChallengeMountains(mountains);
    setNewMountains([]);
    setAddedMountains([]);
  }, []);

  return {
    selectedMountainIds,
    newMountains,
    selectedMountainsForDisplay,
    totalMountainCount,
    handleSelectionChange,
    handleAddNewMountain,
    handleRemoveNewMountain,
    initializeFromChallenge,
  };
}

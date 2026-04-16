export type PeoplePickerUser = {
  id: string;
  fullName: string;
  imageUrl?: string | null;
};

type Session = {
  id: number;
  initial: PeoplePickerUser[];
  firstSelectedRemovable: boolean;
  maxSelected?: number;
  title?: string;
  /**
   * Participants who aren't in the caller's people. Rendered read-only
   * below the toggleable list, each with an X to remove. Committed together
   * with the toggleable selection via `onResult`. Summit flows omit this.
   */
  extras?: PeoplePickerUser[];
  onResult: (users: PeoplePickerUser[]) => void;
};

let current: Session | null = null;
let nextSessionId = 1;

export const openPeoplePickerSession = (
  session: Omit<Session, "id">,
): number => {
  const id = nextSessionId++;
  current = { ...session, id };
  return id;
};

export const readPeoplePickerSession = (): Session | null => current;

/**
 * Notify the caller of the latest selection. Does NOT clear the session —
 * the picker commits on every toggle, so the session must stay alive until
 * the screen unmounts (which calls `clearPeoplePickerSession`).
 */
export const commitPeoplePickerSession = (result: PeoplePickerUser[]) => {
  current?.onResult(result);
};

/**
 * Clear the session only if the passed id matches. Prevents a late cleanup
 * from wiping a freshly-opened session (e.g. picker A unmounts after picker B
 * is opened).
 */
export const clearPeoplePickerSession = (id?: number) => {
  if (id === undefined || current?.id === id) {
    current = null;
  }
};

export type User = {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  imageUrl: string | null;
  visibleOnHiscores: boolean;
  visibleOnPeopleSearch: boolean;
};

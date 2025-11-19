export type User = {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  imageUrl: string | null;
  town: string | null;
  visibleOnHiscores: boolean;
  visibleOnPeopleSearch: boolean;
  username: string | null;
  locale: string | null;
  createdAt: Date;
};

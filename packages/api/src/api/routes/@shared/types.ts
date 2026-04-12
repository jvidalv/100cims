export type User = {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  imageUrl: string | null;
  town: string | null;
  visibleOnHiscores: boolean;
  visibleOnPeopleSearch: boolean;
  admin: boolean;
  country: string | null;
  platform: string | null;
  appVersion: string | null;
  username: string | null;
  locale: string | null;
  activeChallengeId: string | null;
  createdAt: Date;
};

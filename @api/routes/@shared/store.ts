import { User } from "@/@api/routes/@shared/types";

export const getStoreUser = (store: object) => {
  return (store as { user: User }).user;
};
